import { supabase } from "../lib/supabaseClient";
import type { InspeccionRecord } from "../types";

// En desarrollo usamos el proxy /kobo-api para evadir bloqueos de CORS del navegador.
const KOBO_PROXIED_URL = "/kobo-api/api/v2/assets/a4AhiiXAhSZTwutXt2jTY3/data.json";
const KOBO_DIRECT_URL = "https://kobo.unocha.org/api/v2/assets/a4AhiiXAhSZTwutXt2jTY3/data.json";

function cleanText(val?: string): string {
  if (!val) return "No especificado";
  const str = String(val).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!str) return "No especificado";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseRiesgoEtiqueta(rawTag?: string, rawRiesgo?: string): string {
  const tag = String(rawTag || "").toLowerCase().trim();

  if (tag.includes("roja") || tag.includes("rojo")) {
    return "Alto Riesgo / Inseguro (Rojo)";
  }
  if (tag.includes("amarilla") || tag.includes("amarillo")) {
    return "Riesgo Medio / Precaución (Amarillo)";
  }
  if (tag.includes("verde")) {
    return "Bajo Riesgo / Seguro (Verde)";
  }

  const r = String(rawRiesgo || "").toLowerCase();
  if (r.includes("rojo") || r.includes("alto") || r.includes("insegur")) {
    return "Alto Riesgo / Inseguro (Rojo)";
  }
  if (r.includes("amarillo") || r.includes("medio") || r.includes("precau")) {
    return "Riesgo Medio / Precaución (Amarillo)";
  }
  if (r.includes("verde") || r.includes("bajo") || r.includes("segur")) {
    return "Bajo Riesgo / Seguro (Verde)";
  }

  return cleanText(rawTag || rawRiesgo || "Sin clasificar");
}

/** Carga ultrarrápida desde Supabase con paginación completa para superar el límite de 1000 registros */
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

    return allData.map((r) => ({
      ...r,
      estado: cleanText(r.estado),
      municipio: cleanText(r.municipio),
      parroquia: cleanText(r.parroquia),
      nombre_edificacion: cleanText(r.nombre_edificacion),
      uso: cleanText(r.uso),
      tipo_estructura: cleanText(r.tipo_estructura),
      riesgo_color: parseRiesgoEtiqueta(r.riesgo_color, r.riesgo_color),
      evaluacion_riesgo: cleanText(r.evaluacion_riesgo),
    })) as InspeccionRecord[];
  } catch (err) {
    console.error("[inspeccionService] Error al consultar Supabase:", err);
    return [];
  }
}

/** Carga directa desde KoboToolbox en PARALELO */
async function fetchFromKoboParallel(): Promise<InspeccionRecord[]> {
  const initialUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? KOBO_PROXIED_URL
    : KOBO_DIRECT_URL;

  // 1. Obtener primera página para conocer el total de registros (count)
  const firstRes = await fetch(`${initialUrl}?limit=100&start=0`);
  if (!firstRes.ok) throw new Error(`Kobo status: ${firstRes.status}`);

  const firstData = await firstRes.json();
  let allResults: any[] = firstData.results || [];
  const totalCount = firstData.count || 0;

  // 2. Disparar todas las demás páginas en PARALELO
  if (totalCount > 100) {
    const pagePromises: Promise<any>[] = [];
    for (let start = 100; start < totalCount; start += 100) {
      pagePromises.push(
        fetch(`${initialUrl}?limit=100&start=${start}`)
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
    const riesgoFormatted = parseRiesgoEtiqueta(tagPunto11, riesgoRaw);

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
  // 1. Carga desde Supabase (Paginada de 1000 en 1000 para traer todos los registros completos sin límite)
  const supabaseData = await fetchFromSupabase();
  if (supabaseData.length > 0) {
    return supabaseData;
  }

  // 2. Respaldo: Cargar desde Kobo si Supabase estuiviese vacío o fallara
  try {
    const koboData = await fetchFromKoboParallel();
    if (koboData.length > 0) {
      return koboData;
    }
  } catch (err) {
    console.warn("[inspeccionService] Falló la consulta a Kobo:", err);
  }

  return [];
}
