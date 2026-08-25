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

const KOBO_TOKEN = import.meta.env.VITE_KOBOTOOLBOX_KEY || "";

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

/** Carga ultrarrápida desde Supabase con paginación completa, filtrado de riesgo y deduplicación */
async function fetchFromSupabase(): Promise<InspeccionRecord[]> {
  try {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("inspecciones_edificaciones")
        .select("*")
        .range(from, to);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    const seenKeys = new Set<string>();
    const laGuairaRecords: InspeccionRecord[] = [];

    for (const r of allData) {
      if (!r.latitude || !r.longitude) continue;

      const riesgoFormatted = parseRiesgoEtiqueta(r.riesgo_color, r.evaluacion_riesgo) || "Bajo Riesgo / Seguro (Verde)";

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

/** Carga directa desde KoboToolbox en PARALELO */
async function fetchFromKoboParallel(): Promise<InspeccionRecord[]> {
  const initialUrl = getKoboEndpoint();
  const headers: Record<string, string> = KOBO_TOKEN ? { Authorization: `Token ${KOBO_TOKEN}` } : {};

  // 1. Obtener primera página para conocer el total de registros (count)
  const firstRes = await fetch(`${initialUrl}?limit=100&start=0`, { headers });
  if (!firstRes.ok) throw new Error(`Kobo status: ${firstRes.status}`);

  const firstData = await firstRes.json();
  let allResults: any[] = firstData.results || [];
  const totalCount = firstData.count || 0;

  // 2. Disparar todas las demás páginas en PARALELO
  if (totalCount > 100) {
    const pagePromises: Promise<any>[] = [];
    for (let start = 100; start < totalCount; start += 100) {
      pagePromises.push(
        fetch(`${initialUrl}?limit=100&start=${start}`, { headers })
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
    const fullStr = JSON.stringify(r).toLowerCase();
    const isLaGuaira = estadoVal.includes("guaira") || estadoVal.includes("vargas") ||
                       fullStr.includes("la guaira") || fullStr.includes("la_guaira") || fullStr.includes("vargas");

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

export async function fetchInspecciones(): Promise<InspeccionRecord[]> {
  // 1. Cargar directamente desde Kobo (vía proxy Vite en dev o Vercel Edge Function en prod)
  try {
    const koboData = await fetchFromKoboParallel();
    if (koboData.length > 0) {
      return koboData;
    }
  } catch (err) {
    console.warn("[inspeccionService] Falló la consulta a Kobo, recurriendo a Supabase:", err);
  }

  // 2. Respaldo: Supabase deduplicado
  return await fetchFromSupabase();
}
