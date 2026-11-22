import { supabase } from "../lib/supabaseClient";
import type { InspeccionRecord } from "../types";

// En desarrollo usamos el proxy /kobo-api para evadir bloqueos de CORS del navegador.
const KOBO_PROXIED_URL = "/kobo-api/api/v2/assets/a4AhiiXAhSZTwutXt2jTY3/data.json";
const KOBO_VERCEL_URL = "/api/kobo";

function getKoboEndpoint(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return KOBO_PROXIED_URL;
    }
  }
  return KOBO_VERCEL_URL;
}

const KOBO_PAGE_SIZE = 1000;
const KOBO_LA_GUAIRA_QUERY = encodeURIComponent(JSON.stringify({ "modulo1/Estado": "La_Guaira" }));
const KOBO_FIELDS_PARAM = encodeURIComponent(
  JSON.stringify([
    "_id",
    "_geolocation",
    "_submission_time",
    "modulo1/Estado",
    "modulo1/Municipio",
    "modulo1/Parroquia",
    "modulo1/Fecha",
    "group_zw4ob28/_3_1_Nombre_de_la_edificaci_n",
    "group_pa3ko43/_2_1_Nombre_de_la_Ins_n_o_Consejo_Comunal",
    "group_jc0wd35/_4_1_Indique_el_uso_de_la_edifi",
    "group_hr7mg21/_5_1_Indique_el_tipo_de_estructura",
    "group_zo0ds00/_11_1_Identificar_el_sgo_mas_desfavorable",
    "group_zo0ds00/_11_2_OBSERVACIONES",
    "modulo6/Etiqueta_o_Riesgo",
    "group_vy1eb97/Riesgo_de_edificios_aleda_os",
    "modulo6/_6_1_Riesgo_o_dictamen",
  ])
);
const CACHE_KEY = "coe_inspecciones_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let cachedInspeccionesPromise: Promise<InspeccionRecord[]> | null = null;
let backgroundRefreshStarted = false;
const updateListeners = new Set<(records: InspeccionRecord[]) => void>();

export function subscribeInspeccionesUpdates(cb: (records: InspeccionRecord[]) => void): () => void {
  updateListeners.add(cb);
  return () => {
    updateListeners.delete(cb);
  };
}

function readSessionCache(): InspeccionRecord[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: InspeccionRecord[] };
    if (!parsed || !Array.isArray(parsed.data) || parsed.data.length === 0) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(records: InspeccionRecord[]): void {
  if (typeof sessionStorage === "undefined" || records.length === 0) return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: records }));
  } catch {
    // Ignorar quota exceeded en sessionStorage
  }
}

function notifyListeners(records: InspeccionRecord[]): void {
  updateListeners.forEach((cb) => cb(records));
}

function cleanText(val?: string): string {
  if (!val) return "No especificado";
  const str = String(val).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!str) return "No especificado";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseRiesgoEtiqueta(rawTag?: string, rawRiesgo?: string): string | null {
  const tag = String(rawTag || "").toLowerCase().trim();
  const r = String(rawRiesgo || "").toLowerCase().trim();
  const combined = `${tag} ${r}`;

  if (combined.includes("roja") || combined.includes("rojo") || combined.includes("alto") || combined.includes("insegur") || combined.includes("elevado")) {
    return "Alto Riesgo / Inseguro (Rojo)";
  }
  if (combined.includes("amarilla") || combined.includes("amarillo") || combined.includes("medio") || combined.includes("precau") || combined.includes("moderado")) {
    return "Riesgo Medio / Precaución (Amarillo)";
  }
  if (combined.includes("verde") || combined.includes("bajo") || combined.includes("segur") || combined.includes("habitable")) {
    return "Bajo Riesgo / Seguro (Verde)";
  }

  return null;
}

/** Carga ultrarrápida desde Supabase en paralelo (paginación con count exacto) */
async function fetchFromSupabase(): Promise<InspeccionRecord[]> {
  try {
    const pageSize = 1000;
    const first = await supabase
      .from("inspecciones_edificaciones")
      .select("*", { count: "exact" })
      .range(0, pageSize - 1);

    if (first.error || !first.data || first.data.length === 0) {
      return [];
    }

    let allData: any[] = [...first.data];
    const totalCount = first.count ?? allData.length;

    if (totalCount > pageSize) {
      const pagePromises: PromiseLike<any[]>[] = [];
      for (let from = pageSize; from < totalCount; from += pageSize) {
        pagePromises.push(
          supabase
            .from("inspecciones_edificaciones")
            .select("*")
            .range(from, from + pageSize - 1)
            .then((res) => (!res.error && res.data ? res.data : []))
        );
      }
      const restPages = await Promise.all(pagePromises);
      restPages.forEach((pageRows) => {
        allData = allData.concat(pageRows);
      });
    }

    const seenKeys = new Set<string>();
    const laGuairaRecords: InspeccionRecord[] = [];

    for (const r of allData) {
      if (!r.latitude || !r.longitude) continue;

      const estadoVal = String(r.estado || "").toLowerCase();
      if (estadoVal && !estadoVal.includes("guaira") && !estadoVal.includes("vargas")) {
        continue;
      }

      const riesgoFormatted =
        parseRiesgoEtiqueta(r.riesgo_color) ||
        parseRiesgoEtiqueta(undefined, r.evaluacion_riesgo) ||
        "Bajo Riesgo / Seguro (Verde)";

      const key = String(r.id);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      laGuairaRecords.push({
        id: String(r.id),
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        estado: cleanText(r.estado || "La Guaira"),
        municipio: cleanText(r.municipio),
        parroquia: cleanText(r.parroquia),
        fecha: (r.fecha || "").substring(0, 10),
        nombre_edificacion: cleanText(r.nombre_edificacion),
        uso: cleanText(r.uso),
        tipo_estructura: cleanText(r.tipo_estructura),
        riesgo_color: riesgoFormatted,
        evaluacion_riesgo: cleanText(r.evaluacion_riesgo),
      });
    }

    return laGuairaRecords;
  } catch (err) {
    console.error("[inspeccionService] Error al consultar Supabase:", err);
    return [];
  }
}

/** Carga directa desde KoboToolbox en PARALELO (filtrada por estado y solo campos requeridos) */
async function fetchFromKoboParallel(): Promise<InspeccionRecord[]> {
  const initialUrl = getKoboEndpoint();
  const isDevProxy = initialUrl === KOBO_PROXIED_URL;
  const buildPageUrl = (start: number) =>
    isDevProxy
      ? `${initialUrl}?limit=${KOBO_PAGE_SIZE}&start=${start}&query=${KOBO_LA_GUAIRA_QUERY}&fields=${KOBO_FIELDS_PARAM}`
      : `${initialUrl}?limit=${KOBO_PAGE_SIZE}&start=${start}`;

  // 1. Obtener primera página para conocer el total de registros de La Guaira (count)
  const firstRes = await fetch(buildPageUrl(0));
  if (!firstRes.ok) throw new Error(`Kobo status: ${firstRes.status}`);

  const firstData = await firstRes.json();
  let allResults: any[] = firstData.results || [];
  const totalCount = firstData.count || 0;

  // 2. Disparar todas las demás páginas en PARALELO
  if (totalCount > KOBO_PAGE_SIZE) {
    const pagePromises: Promise<any>[] = [];
    for (let start = KOBO_PAGE_SIZE; start < totalCount; start += KOBO_PAGE_SIZE) {
      pagePromises.push(
        fetch(buildPageUrl(start))
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .then((d) => d.results || [])
          .catch(() => [])
      );
    }

    const otherPages = await Promise.all(pagePromises);
    otherPages.forEach((pageResults) => {
      allResults = allResults.concat(pageResults);
    });
  }

  const laGuairaRecords: InspeccionRecord[] = [];

  for (const r of allResults) {
    const estadoVal = String(r["modulo1/Estado"] || r["BUBBLE_inspeccion"] || "").toLowerCase();
    const isLaGuaira = estadoVal.includes("guaira") || estadoVal.includes("vargas");

    if (!isLaGuaira) continue;

    let lat: number | null = null;
    let lng: number | null = null;

    if (r["_geolocation"] && Array.isArray(r["_geolocation"]) && r["_geolocation"].length >= 2) {
      lat = parseFloat(r["_geolocation"][0]);
      lng = parseFloat(r["_geolocation"][1]);
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;

    const nombre = r["group_zw4ob28/_3_1_Nombre_de_la_edificaci_n"] ||
                   r["group_pa3ko43/_2_1_Nombre_de_la_Ins_n_o_Consejo_Comunal"] ||
                   "Inspección de Edificación";

    const uso = r["group_jc0wd35/_4_1_Indique_el_uso_de_la_edifi"] || "No especificado";
    const tipo = r["group_hr7mg21/_5_1_Indique_el_tipo_de_estructura"] || "No especificado";

    const tagPunto11 = r["group_zo0ds00/_11_1_Identificar_el_sgo_mas_desfavorable"];
    const riesgoRaw = r["modulo6/Etiqueta_o_Riesgo"] || r["group_vy1eb97/Riesgo_de_edificios_aleda_os"] || r["modulo6/_6_1_Riesgo_o_dictamen"];
    const riesgoFormatted = parseRiesgoEtiqueta(tagPunto11, riesgoRaw) || "Bajo Riesgo / Seguro (Verde)";

    const obsPunto11 = r["group_zo0ds00/_11_2_OBSERVACIONES"];
    const evaluacion = obsPunto11 || r["modulo6/_6_1_Riesgo_o_dictamen"] || r["group_vy1eb97/Riesgo_de_edificios_aleda_os"] || "Inspección registrada";

    const fecha = (r["modulo1/Fecha"] || r["_submission_time"] || "").substring(0, 10);

    laGuairaRecords.push({
      id: String(r["_id"]),
      latitude: lat,
      longitude: lng,
      estado: cleanText(r["modulo1/Estado"] || "La Guaira"),
      municipio: cleanText(r["modulo1/Municipio"] || ""),
      parroquia: cleanText(r["modulo1/Parroquia"] || ""),
      fecha,
      nombre_edificacion: cleanText(nombre),
      uso: cleanText(uso),
      tipo_estructura: cleanText(tipo),
      riesgo_color: riesgoFormatted,
      evaluacion_riesgo: cleanText(evaluacion),
    });
  }

  return laGuairaRecords;
}

function triggerBackgroundKoboRefresh(): void {
  if (backgroundRefreshStarted) return;
  backgroundRefreshStarted = true;
  fetchFromKoboParallel()
    .then((freshKobo) => {
      if (freshKobo.length > 0) {
        writeSessionCache(freshKobo);
        cachedInspeccionesPromise = Promise.resolve(freshKobo);
        notifyListeners(freshKobo);
      }
    })
    .catch((err) => {
      console.warn("[inspeccionService] Refresco en segundo plano desde Kobo omitido:", err);
    });
}

export function fetchInspecciones(forceRefresh = false): Promise<InspeccionRecord[]> {
  if (!forceRefresh && cachedInspeccionesPromise) {
    return cachedInspeccionesPromise;
  }

  // 0. Caché instantánea de sesión (0 ms) + refresco silencioso de Kobo en segundo plano
  if (!forceRefresh) {
    const cached = readSessionCache();
    if (cached && cached.length > 0) {
      cachedInspeccionesPromise = Promise.resolve(cached);
      triggerBackgroundKoboRefresh();
      return cachedInspeccionesPromise;
    }
  } else {
    backgroundRefreshStarted = false;
  }

  const request = (async () => {
    // 1. Carga rápida desde Supabase en paralelo (~700 ms) + actualización en segundo plano desde Kobo
    const supabaseData = await fetchFromSupabase();
    if (supabaseData.length > 0) {
      writeSessionCache(supabaseData);
      triggerBackgroundKoboRefresh();
      return supabaseData;
    }

    // 2. Respaldo directo desde Kobo filtrado por La Guaira + solo 16 campos
    try {
      const koboData = await fetchFromKoboParallel();
      if (koboData.length > 0) {
        writeSessionCache(koboData);
        return koboData;
      }
    } catch (err) {
      console.warn("[inspeccionService] Falló la consulta directa a Kobo:", err);
    }

    return [];
  })();

  cachedInspeccionesPromise = request.then((records) => {
    if (records.length === 0) {
      cachedInspeccionesPromise = null;
    }
    return records;
  });

  return cachedInspeccionesPromise;
}
