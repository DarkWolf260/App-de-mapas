import type { DrawnFeature, CustomActivity, DepartmentView } from "../types";
import { FeatureLogBook } from "./featureLogBook";
import { isStandardSector } from "./searchUtils";

export interface CustomLabelData {
  id: string | number;
  title: string;
  info?: string;
  color: string;
  statusColor: string;
  isActiveArea: boolean;
  teamNames: string[];
  rescuedCount?: number;
  recoveredCount?: number;
  rescuedPetsCount?: number;
  prehospitalCount?: number;
  transfersCount?: number;
  customActivities?: CustomActivity[];
  activityNotes?: string[];
  metricsBadges?: string[];
  lng: number;
  lat: number;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFeatureCoordinates(feat: DrawnFeature): [number, number] | null {
  const geom = feat.geojsonGeometry;
  if (!geom) return null;

  if (geom.type === "Point") {
    const [lng, lat] = geom.coordinates as number[];
    return [lng, lat];
  }

  if (geom.type === "Polygon") {
    const coords = (geom.coordinates as number[][][])[0];
    if (coords && coords.length > 0) {
      let sumX = 0;
      let sumY = 0;
      coords.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
      });
      return [sumX / coords.length, sumY / coords.length];
    }
  }

  if (geom.type === "LineString") {
    const coords = geom.coordinates as number[][];
    if (coords && coords.length > 0) {
      const mid = coords[Math.floor(coords.length / 2)];
      return [mid[0], mid[1]];
    }
  }

  return null;
}

/**
 * Comprueba si un feature (Sitio, Área o Sector) tiene información operativa registrada directamente
 */
export function isWorkFeatureActive(
  feat: DrawnFeature,
  _parentsMap?: Record<string | number, string | number>,
  dateStr?: string,
  _allFeatures?: DrawnFeature[],
  activeDepartment?: DepartmentView,
): boolean {
  const rawLogs = feat.dailyLogs || [];
  const deptFilter = (l: any) => {
    if (!activeDepartment || activeDepartment === "mixto") return true;
    const d = l.department || "pc";
    return d === activeDepartment;
  };

  if (dateStr) {
    return rawLogs.some((l) => l.date === dateStr && deptFilter(l) && FeatureLogBook.hasAnyData(l));
  }
  return rawLogs.some((l) => deptFilter(l) && FeatureLogBook.hasAnyData(l));
}

export const isAreaActive = isWorkFeatureActive;

/**
 * Convierte un DrawnFeature a datos de tarjeta personalizada usando exclusivamente su información directa
 */
export function featureToLabelData(
  feat: DrawnFeature,
  parentsMap?: Record<string | number, string | number>,
  dateStr?: string,
  allFeatures?: DrawnFeature[],
  activeDepartment?: DepartmentView,
): CustomLabelData | null {
  const active = isWorkFeatureActive(feat, parentsMap, dateStr, allFeatures, activeDepartment);
  if (!active) return null;

  const coords = getFeatureCoordinates(feat);
  if (!coords) return null;

  const color = (feat.color || "#38bdf8").trim();

  // Usar exclusivamente las bitácoras del departamento activo
  const rawLogs = feat.dailyLogs || [];
  const logs = rawLogs.filter((l) => {
    if (dateStr && l.date !== dateStr) return false;
    if (activeDepartment && activeDepartment !== "mixto") {
      const d = l.department || "pc";
      return d === activeDepartment;
    }
    return true;
  });

  const teamNames: string[] = [];
  const seenTeams = new Set<string>();
  let hasGroups = false;
  let allArrived = true;

  let prehospitalCount = 0;
  let transfersCount = 0;
  let rescuedCount = 0;
  let recoveredCount = 0;
  let rescuedPetsCount = 0;
  let customActivitiesList: CustomActivity[] = [];
  const activityNotes: string[] = [];

  logs.forEach((l) => {
    const logActivities = FeatureLogBook.getLogCustomActivities(l);
    customActivitiesList = FeatureLogBook.mergeCustomActivities(customActivitiesList, logActivities);

    const groups = FeatureLogBook.normalizeGroups(l);
    if (groups.length > 0) hasGroups = true;

    const commRescued = new Map<string, number>();
    const commRecovered = new Map<string, number>();
    const commPrehospital = new Map<string, number>();
    const commTransfers = new Map<string, number>();
    const commPets = new Map<string, number>();

    for (const g of groups) {
      if (!g.hasArrived) allArrived = false;
      const name = g.groupName?.trim();
      const unit = g.unitOut?.trim();
      const parts: string[] = [];
      if (name) parts.push(name);
      if (unit) parts.push(unit);
      const label = parts.join(" - ");
      if (label && !seenTeams.has(label)) {
        seenTeams.add(label);
        teamNames.push(label);
      }

      const r = parseInt(g.rescuedCount || "0", 10) || 0;
      const rc = parseInt(g.recoveredCount || "0", 10) || 0;
      const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
      const tr = parseInt(g.transfersCount || "0", 10) || 0;
      const pets = parseInt(g.rescuedPetsCount || "0", 10) || 0;

      const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
      commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
      commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
      commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
      commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
      commPets.set(commKey, Math.max(commPets.get(commKey) || 0, pets));
    }

    commRescued.forEach((val) => { rescuedCount += val; });
    commRecovered.forEach((val) => { recoveredCount += val; });
    commPrehospital.forEach((val) => { prehospitalCount += val; });
    commTransfers.forEach((val) => { transfersCount += val; });
    commPets.forEach((val) => { rescuedPetsCount += val; });

    rescuedCount += parseInt(l.rescuedCount || "0", 10) || 0;
    recoveredCount += parseInt(l.recoveredCount || "0", 10) || 0;
    rescuedPetsCount += parseInt(l.rescuedPetsCount || "0", 10) || 0;
    prehospitalCount += parseInt(l.prehospitalCareCount || "0", 10) || 0;
    transfersCount += parseInt(l.transfersCount || "0", 10) || 0;

    if (l.observations?.trim()) {
      activityNotes.push(l.observations.trim());
    }
  });

  const statusColor = (hasGroups && !allArrived) ? "#f97316" : "#22c55e";

  return {
    id: feat.id,
    title: feat.title || "Sitio Operativo",
    color,
    statusColor,
    isActiveArea: true,
    teamNames,
    rescuedCount,
    recoveredCount,
    rescuedPetsCount,
    prehospitalCount,
    transfersCount,
    customActivities: customActivitiesList,
    activityNotes,
    lng: coords[0],
    lat: coords[1],
  };
}

/**
 * Genera el HTML string con la tarjeta idéntica a HtmlPointLabels del mapa principal
 */
export function buildHtmlLabelString(data: CustomLabelData): string {
  const {
    id,
    title,
    info,
    color,
    statusColor = "#22c55e",
    isActiveArea,
    teamNames = [],
    rescuedCount = 0,
    recoveredCount = 0,
    rescuedPetsCount = 0,
    prehospitalCount = 0,
    transfersCount = 0,
    customActivities = [],
  } = data;

  if (isActiveArea) {
    const teamsHtml = teamNames.length > 0
      ? `<div style="display: flex; gap: 3px; align-items: center; justify-content: center; margin-top: 3px; flex-wrap: nowrap;">
          ${teamNames.slice(0, 3).map((t) => `<span style="color: #94a3b8; background: rgba(148,163,184,0.15); border: 1px solid rgba(148,163,184,0.3); padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">${escapeHtml(t)}</span>`).join("")}
          ${teamNames.length > 3 ? `<span style="color: #cbd5e1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">... ${teamNames.length - 3} más</span>` : ""}
        </div>`
      : "";

    const hasStatBadges =
      rescuedCount > 0 ||
      recoveredCount > 0 ||
      rescuedPetsCount > 0 ||
      prehospitalCount > 0 ||
      transfersCount > 0 ||
      customActivities.length > 0;

    let badgesHtml = "";
    if (hasStatBadges) {
      const statBadgesList: string[] = [];

      if (rescuedCount > 0) {
        statBadgesList.push(
          `<span style="color: #4ade80; background: rgba(34,197,94,0.18); border: 1px solid rgba(34,197,94,0.35); padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">Resc. ${rescuedCount}</span>`
        );
      }
      if (recoveredCount > 0) {
        statBadgesList.push(
          `<span style="color: #f87171; background: rgba(239,68,68,0.18); border: 1px solid rgba(239,68,68,0.35); padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">Recup. ${recoveredCount}</span>`
        );
      }
      if (rescuedPetsCount > 0) {
        statBadgesList.push(
          `<span style="color: #f97316; background: rgba(249,115,22,0.18); border: 1px solid rgba(249,115,22,0.35); padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">Masc. ${rescuedPetsCount}</span>`
        );
      }
      if (prehospitalCount > 0) {
        statBadgesList.push(
          `<span style="color: #38bdf8; background: rgba(56,189,248,0.18); border: 1px solid rgba(56,189,248,0.35); padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">Atenc. ${prehospitalCount}</span>`
        );
      }
      if (transfersCount > 0) {
        statBadgesList.push(
          `<span style="color: #c084fc; background: rgba(168,85,247,0.18); border: 1px solid rgba(168,85,247,0.35); padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">Trasl. ${transfersCount}</span>`
        );
      }

      const customBadgesList = customActivities.map((act, idx) => {
        const hasDesc = !!act.description?.trim();
        const actKey = `act_${id}_${act.id || idx}`;
        return `
          <span class="custom-activity-badge" data-act-target="${actKey}" style="
            color: #c084fc;
            background: rgba(168,85,247,0.18);
            border: 1px solid rgba(168,85,247,0.35);
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            cursor: ${hasDesc ? "pointer" : "default"};
            white-space: nowrap;
            flex-shrink: 0;
          " title="${hasDesc ? "Ver detalle" : ""}">
            <span style="white-space: nowrap;">${escapeHtml(act.name)}: ${escapeHtml(String(act.value))}</span>
            ${hasDesc ? `<svg style="width: 10px; height: 10px; opacity: 0.85;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>` : ""}
          </span>
        `;
      });

      const customDescriptions = customActivities
        .filter((act) => !!act.description?.trim())
        .map((act, idx) => {
          const actKey = `act_${id}_${act.id || idx}`;
          return `
            <div id="${actKey}" class="custom-activity-desc" style="
              display: none;
              font-weight: 600;
              font-size: 9px;
              color: #f3e8ff;
              background: rgba(15, 23, 42, 0.95);
              border: 1px solid rgba(168, 85, 247, 0.45);
              padding: 4px 8px;
              border-radius: 6px;
              margin-top: 3px;
              max-width: 220px;
              white-space: normal;
              line-height: 1.3;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            ">
              ${escapeHtml(act.description!)}
            </div>
          `;
        })
        .join("");

      badgesHtml = `
        <div class="custom-label-badges-container" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          white-space: nowrap;
        ">
          <div style="
            display: flex;
            gap: 4px;
            font-size: 8.5px;
            font-weight: 700;
            flex-wrap: nowrap;
            justify-content: center;
            white-space: nowrap;
          ">
            ${statBadgesList.join("")}
            ${customBadgesList.join("")}
          </div>
          ${customDescriptions}
        </div>
      `;
    }

    const infoHtml = info
      ? `<div style="font-size: 9px; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px; margin-top: 3px; border: 1px solid rgba(255,255,255,0.08);">${escapeHtml(info)}</div>`
      : "";

    return `
      <div class="custom-html-label-card-wrapper" style="position: relative; width: max-content; min-width: max-content; max-width: max-content; padding-bottom: 4px; pointer-events: auto; user-select: none; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;">
        <div class="custom-html-label-card" style="
          background: rgba(10, 15, 29, 0.94);
          border: 1px solid ${color}99;
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 8px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          white-space: nowrap;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
          cursor: pointer;
          width: max-content;
          min-width: max-content;
          box-sizing: border-box;
        ">
          <div style="display: flex; align-items: center; gap: 5px; font-weight: 800; font-size: 11.5px; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); white-space: nowrap;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 8px ${statusColor}; flex-shrink: 0; display: inline-block;"></span>
            <span>${escapeHtml(title)}</span>
          </div>
          ${infoHtml}
          ${teamsHtml}
          ${badgesHtml}
        </div>
        <div style="
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: rgba(10, 15, 29, 0.94);
          border-right: 1px solid ${color}99;
          border-bottom: 1px solid ${color}99;
          z-index: 1;
        "></div>
      </div>
    `;
  }

  return `
    <div style="position: relative; width: max-content; min-width: max-content; pointer-events: none; user-select: none; display: inline-flex; align-items: center; justify-content: center;">
      <span style="
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 700;
        font-size: 11px;
        color: #ffffff;
        text-shadow: -1.5px -1.5px 0 #000, 1.5px 1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 4px rgba(0,0,0,0.9);
        white-space: nowrap;
        text-align: center;
        display: inline-block;
      ">${escapeHtml(title)}</span>
    </div>
  `;
}

/**
 * Obtiene un tono más oscuro del color dado para el borde del pin.
 */
export function getDarkerTone(color: string, factor = 0.6): string {
  if (!color || typeof color !== "string") return "#0f172a";
  const hex = color.trim().replace("#", "");
  if (hex.length === 3) {
    const r = Math.max(0, Math.floor(parseInt(hex[0] + hex[0], 16) * factor));
    const g = Math.max(0, Math.floor(parseInt(hex[1] + hex[1], 16) * factor));
    const b = Math.max(0, Math.floor(parseInt(hex[2] + hex[2], 16) * factor));
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (hex.length === 6) {
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 255) * factor));
    const g = Math.max(0, Math.floor(((num >> 8) & 255) * factor));
    const b = Math.max(0, Math.floor((num & 255) * factor));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "#0f172a";
}

/**
 * Nivel de zoom donde se muestran las tarjetas completas (zoom >= 16).
 * En zoom < 16 se muestra el pin compacto con borde más oscuro.
 */
export const LABEL_ZOOM_THRESHOLD = 16;

/**
 * Genera el HTML string de un Pin compacto estilizado con borde delgado más oscuro
 */
export function buildCompactPinString(data: CustomLabelData): string {
  const { title, color = "#f97316", statusColor = "#22c55e" } = data;
  const isOrange = String(statusColor).toLowerCase().includes("f97316") || String(statusColor).toLowerCase().includes("orange");
  const glowColor = isOrange ? "rgba(249, 115, 22, 0.45)" : "rgba(34, 197, 94, 0.45)";
  const darkerBorder = getDarkerTone(statusColor || color, 0.58);

  return `
    <div class="custom-compact-pin-wrapper" title="${escapeHtml(title)}" style="
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      background: transparent;
      border: none;
      outline: none;
    ">
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${statusColor};
        border: 1.5px solid ${darkerBorder};
        box-shadow: 0 4px 12px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
            display: inline-block;
          "></span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Genera el HTML de la etiqueta adaptándose al nivel de zoom:
 * - Zoom >= 16: Tarjeta completa con insignias de equipos, estadísticas y actividades
 * - Zoom < 16: Pin compacto con borde delgado de tono más oscuro
 */
export function buildAdaptiveLabelString(data: CustomLabelData, zoom: number): string {
  if (zoom >= LABEL_ZOOM_THRESHOLD) {
    return buildHtmlLabelString(data);
  }
  return buildCompactPinString(data);
}

export function updateHtmlLabelElementContent(container: HTMLElement, data: CustomLabelData, zoom: number = 16): void {
  const html = buildAdaptiveLabelString(data, zoom).trim();
  if (container.dataset.renderedHtml === html) {
    return;
  }
  container.dataset.renderedHtml = html;
  container.innerHTML = html;

  // Activar interactividad para las descripciones de actividades personalizadas
  const activityBadges = container.querySelectorAll<HTMLElement>(".custom-activity-badge[data-act-target]");
  activityBadges.forEach((badge) => {
    const targetId = badge.getAttribute("data-act-target");
    if (!targetId) return;
    const descEl = container.querySelector<HTMLElement>(`#${targetId}`);
    if (descEl) {
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const isHidden = descEl.style.display === "none" || !descEl.style.display;
        descEl.style.display = isHidden ? "block" : "none";
      });
    }
  });
}

/**
 * Crea el elemento DOM real (para OpenLayers, MapLibre, etc.)
 */
export function buildHtmlLabelElement(data: CustomLabelData, onClick?: () => void, zoom: number = 16): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "custom-html-label-overlay-item";
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.pointerEvents = "auto";
  container.style.cursor = "pointer";

  updateHtmlLabelElementContent(container, data, zoom);

  const stopProp = (e: Event) => {
    e.stopPropagation();
  };
  container.addEventListener("pointerdown", stopProp);
  container.addEventListener("mousedown", stopProp);
  container.addEventListener("touchstart", stopProp, { passive: true });
  container.addEventListener("dblclick", stopProp);

  if (onClick) {
    container.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    });
  }
  return container;
}
