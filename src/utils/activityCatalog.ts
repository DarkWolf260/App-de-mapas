import type { CustomActivity, DrawnFeature, LayerVisibility } from "../types";

export const FORMACION_POINT_COLOR = "#8b5cf6";
export const DEMOLISHED_POINT_COLOR = "#111827";

export interface ActivityCatalogGroup {
  label: string;
  options: readonly string[];
}

export const ACTIVITY_CATALOG_GROUPS: readonly ActivityCatalogGroup[] = [
  {
    label: "Operaciones y Áreas de Trabajo",
    options: [
      "Cierre de marcaje",
      "Demolición controlada",
      "Base de operaciones",
      "Equipo de trabajo",
      "Punto de trabajo",
      "Recuperación",
      "Búsqueda y rescate",
      "Remoción de escombros",
      "Mitigación / Tala de árbol",
      "Inspección técnica / EDAN",
      "Vuelo de dron",
    ],
  },
  {
    label: "Prevención y Seguridad Operativa",
    options: [
      "Guardia preventiva",
      "Puesto preventivo",
      "Recorrido preventivo",
    ],
  },
  {
    label: "Formación y Prevención Comunitaria",
    options: [
      "Actividad educativa",
      "Capacitación",
      "Simulacro",
      "Curso / Taller",
      "Conversatorio / Inducción",
      "Difusión / Colocación de QR",
    ],
  },
  {
    label: "Emergencias y Atención Prehospitalaria",
    options: [
      "Traslado de emergencia",
      "Traslado interhospitalario",
      "Traslado programado",
      "Atención prehospitalaria (APH)",
      "Colisión vehicular",
      "Emergencia / Incendio",
    ],
  },
  {
    label: "Otros",
    options: [
      "Reunión operativa",
      "Apoyo humanitario / Logística",
      "Misceláneo",
    ],
  },
] as const;

export const ALL_CATALOG_ACTIVITIES: readonly string[] = ACTIVITY_CATALOG_GROUPS.flatMap(
  (group) => group.options
);

export const FORMACION_ACTIVITY_NAMES = new Set<string>([
  "Actividad educativa",
  "Capacitación",
  "Simulacro",
  "Curso / Taller",
  "Conversatorio / Inducción",
  "Difusión / Colocación de QR",
]);

function normalizeColor(color?: string): string {
  return (color || "").trim().toLowerCase();
}

function getAllFeatureActivities(feat: DrawnFeature): CustomActivity[] {
  const result: CustomActivity[] = [];
  if (!Array.isArray(feat.dailyLogs)) return result;
  for (const log of feat.dailyLogs) {
    if (Array.isArray(log.customActivities)) {
      result.push(...log.customActivities);
    }
    if (Array.isArray(log.groups)) {
      for (const g of log.groups) {
        if (Array.isArray(g.customActivities)) {
          result.push(...g.customActivities);
        }
      }
    }
  }
  return result;
}

export function isPointFeature(feat: DrawnFeature): boolean {
  return feat.type === "point" || feat.geojsonGeometry?.type === "Point";
}

export function isDemolishedColor(color?: string): boolean {
  const c = normalizeColor(color);
  return c === "#111827" || c === "#000000" || c === "#0f172a";
}

export function isFormacionColor(color?: string): boolean {
  const c = normalizeColor(color);
  return c === "#8b5cf6" || c === "#a855f7";
}

/**
 * Determina si un punto corresponde a un edificio con demolición controlada ejecutada.
 */
export function isDemolishedFeature(feat: DrawnFeature): boolean {
  if (!isPointFeature(feat)) return false;
  if (isDemolishedColor(feat.color)) return true;

  const activities = getAllFeatureActivities(feat);
  return activities.some((act) => {
    const name = (act.name || "").trim().toLowerCase();
    if (!name.includes("demolic")) return false;
    const desc = (act.description || "").trim().toLowerCase();
    return desc.includes("finaliz") || desc.includes("culmin") || desc.includes("finaliaza");
  });
}

/**
 * Determina si un punto corresponde a Formación, Educación o Prevención Comunitaria
 * (no perteneciente a áreas de trabajo operativas).
 */
export function isFormacionFeature(feat: DrawnFeature): boolean {
  if (!isPointFeature(feat)) return false;
  if (isDemolishedFeature(feat)) return false;
  if (isFormacionColor(feat.color)) return true;

  const activities = getAllFeatureActivities(feat);
  if (activities.length === 0) return false;
  return activities.every((act) => FORMACION_ACTIVITY_NAMES.has((act.name || "").trim()));
}

export interface ActivityHistoryEntry {
  date: string;
  department: "pc" | "bomberos";
  activities: CustomActivity[];
  observations?: string;
}

export interface DemolitionEvent {
  date: string;
  label?: string;
}

export interface DemolitionInfo {
  demolishedDate: string | null;
  events: DemolitionEvent[];
  statusLabel: string;
  description?: string;
}

/**
 * Identifica el polígono del Urbanismo Hugo Chávez para mostrarlo siempre en la capa de Demolidos
 * aunque "Ocultar áreas anidadas" esté activo.
 */
export function isDemolidosFeaturedPolygon(feat: DrawnFeature): boolean {
  const isPolygon = feat.type === "polygon" || feat.geojsonGeometry?.type === "Polygon";
  if (!isPolygon) return false;
  if (String(feat.id) === "draw-imp-1784845030059-16") return true;
  const norm = (feat.title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return norm.includes("urbanismo hugo chavez");
}

/**
 * Extrae el historial cronológico (más reciente primero) de actividades personalizadas
 * registradas en un punto/feature.
 */
export function getFeatureActivityHistory(feat: DrawnFeature): ActivityHistoryEntry[] {
  if (!Array.isArray(feat.dailyLogs) || feat.dailyLogs.length === 0) return [];

  const byKey = new Map<string, ActivityHistoryEntry>();

  for (const log of feat.dailyLogs) {
    const acts: CustomActivity[] = [];
    if (Array.isArray(log.customActivities)) {
      acts.push(...log.customActivities);
    }
    if (Array.isArray(log.groups)) {
      for (const g of log.groups) {
        if (Array.isArray(g.customActivities)) {
          acts.push(...g.customActivities);
        }
      }
    }
    if (acts.length === 0) continue;

    const dept: "pc" | "bomberos" = log.department === "bomberos" ? "bomberos" : "pc";
    const key = `${log.date}::${dept}`;
    const existing = byKey.get(key);
    if (existing) {
      for (const a of acts) {
        if (!existing.activities.some((e) => e.name === a.name && e.value === a.value && (e.description || "") === (a.description || ""))) {
          existing.activities.push(a);
        }
      }
      if (!existing.observations && log.observations?.trim()) {
        existing.observations = log.observations.trim();
      }
    } else {
      byKey.set(key, {
        date: log.date,
        department: dept,
        activities: [...acts],
        observations: log.observations?.trim() || undefined,
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function parseIsoDays(iso: string): number | null {
  const parts = iso.split("-");
  if (parts.length !== 3) return null;
  const t = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(t) ? null : Math.floor(t / 86_400_000);
}

function extractPhaseLabel(desc: string): string | undefined {
  const clean = desc.trim();
  if (!clean) return undefined;
  const lower = clean.toLowerCase();
  if (
    lower === "finalizada" ||
    lower === "finalizado" ||
    lower === "culminada" ||
    lower === "finaliaza" ||
    lower === "demolicion finalizada" ||
    lower === "demolicioin finalizada" ||
    lower === "1 demolicion finalizada"
  ) {
    return undefined;
  }
  // Quitar sufijo "— Finalizada" / "- Finalizada" si viene acompañado de una torre/fase
  const stripped = clean.replace(/\s*[—-]\s*finalizad[ao]\s*$/i, "").trim();
  return stripped || undefined;
}

/**
 * Obtiene la(s) fecha(s) en la(s) que fue demolido un edificio a partir de sus registros históricos:
 * - Agrupa repeticiones diarias consecutivas (< 10 días con descripción genérica) en la primera fecha de finalización.
 * - Conserva múltiples fechas cuando existen distintas fases/torres o demoliciones separadas (>= 10 días).
 */
export function getDemolitionInfo(feat: DrawnFeature): DemolitionInfo {
  const logs = Array.isArray(feat.dailyLogs) ? [...feat.dailyLogs] : [];
  logs.sort((a, b) => a.date.localeCompare(b.date));

  const demolitionRecords: Array<{ date: string; desc: string }> = [];

  for (const log of logs) {
    const acts: CustomActivity[] = [
      ...(Array.isArray(log.customActivities) ? log.customActivities : []),
      ...(Array.isArray(log.groups) ? log.groups.flatMap((g) => g.customActivities || []) : []),
    ];
    for (const act of acts) {
      const name = (act.name || "").trim().toLowerCase();
      if (name.includes("demolic")) {
        demolitionRecords.push({
          date: log.date,
          desc: (act.description || "").trim(),
        });
      }
    }
  }

  if (demolitionRecords.length === 0) {
    return {
      demolishedDate: null,
      events: [],
      statusLabel: "Demolición registrada",
      description: feat.description?.trim() || undefined,
    };
  }

  // 1. Filtrar registros marcados como finalizados/culminados
  const finalized = demolitionRecords.filter((r) => {
    const d = r.desc.toLowerCase();
    return d.includes("finaliz") || d.includes("culmin") || d.includes("finaliaza");
  });

  if (finalized.length > 0) {
    const events: DemolitionEvent[] = [];
    let lastDayNum: number | null = null;

    for (const rec of finalized) {
      const dayNum = parseIsoDays(rec.date);
      const phaseLabel = extractPhaseLabel(rec.desc);
      const isSameDate = events.some((e) => e.date === rec.date);
      if (isSameDate) continue;

      const isConsecutiveRepeat =
        events.length > 0 &&
        !phaseLabel &&
        dayNum !== null &&
        lastDayNum !== null &&
        dayNum - lastDayNum < 10;

      if (!isConsecutiveRepeat) {
        events.push({ date: rec.date, label: phaseLabel });
      }
      if (dayNum !== null) lastDayNum = dayNum;
    }

    return {
      demolishedDate: events[0]?.date ?? finalized[0].date,
      events,
      statusLabel:
        events.length > 1
          ? `${events.length} demoliciones controladas finalizadas`
          : "Demolición controlada finalizada",
      description: feat.description?.trim() || undefined,
    };
  }

  // 2. Última fecha de demolición que no sea solo programación/pendiente
  const executed = demolitionRecords.filter((r) => {
    const d = r.desc.toLowerCase();
    return !d.includes("programada") && !d.includes("sin programacion") && !d.includes("pendiente") && !d.includes("en proceso");
  });
  if (executed.length > 0) {
    const lastExecuted = executed[executed.length - 1];
    return {
      demolishedDate: lastExecuted.date,
      events: [{ date: lastExecuted.date, label: extractPhaseLabel(lastExecuted.desc) }],
      statusLabel: "Demolición controlada ejecutada",
      description: feat.description?.trim() || lastExecuted.desc || undefined,
    };
  }

  // 3. Respaldo
  const lastAny = demolitionRecords[demolitionRecords.length - 1];
  return {
    demolishedDate: lastAny.date,
    events: [{ date: lastAny.date, label: extractPhaseLabel(lastAny.desc) }],
    statusLabel: "Demolición controlada",
    description: feat.description?.trim() || lastAny.desc || undefined,
  };
}

/**
 * Filtra una feature según la capa temática activa en LayerVisibility.
 * En modos exclusivos (Inspecciones, Formación, Demolidos), se mantienen los polígonos
 * de sector como referencia geográfica y se muestran únicamente los puntos de esa capa.
 */
export function shouldShowFeatureForLayerMode(
  feat: DrawnFeature,
  layerVisibility: LayerVisibility
): boolean {
  const isPolygon = feat.type === "polygon" || feat.geojsonGeometry?.type === "Polygon";

  if (layerVisibility.inspecciones) {
    return isPolygon;
  }
  if (layerVisibility.formacion) {
    return isPolygon || isFormacionFeature(feat);
  }
  if (layerVisibility.demolidos) {
    return isPolygon || isDemolishedFeature(feat);
  }
  return true;
}
