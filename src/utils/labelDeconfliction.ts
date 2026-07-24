import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { buildParentsMap } from "./spatialUtils";
import type { DrawnFeature, LayerVisibility, DepartmentView } from "../types";
import type { HtmlLabel } from "../types";

interface DeconflictRefs {
  drawnFeaturesRef: React.MutableRefObject<DrawnFeature[]>;
  hiddenFeaturesRef: React.MutableRefObject<Record<number, boolean>>;
  layerVisibilityRef: React.MutableRefObject<LayerVisibility>;
  selectedDateRef: React.MutableRefObject<string>;
  activeDepartmentRef?: React.MutableRefObject<DepartmentView>;
}

interface ScreenLabel {
  graphic: Graphic;
  x: number | null;
  y: number | null;
  visible: boolean;
  priority: number;
  hasPersonnel?: boolean;
}

function logHasData(l: any): boolean {
  if (!l) return false;
  const hasGroup = !!(
    l.groupName?.trim() || l.groupName2?.trim() || l.groupName3?.trim() || l.groupName4?.trim() ||
    l.unitOut?.trim() || l.unitOut2?.trim() || l.unitOut3?.trim() || l.unitOut4?.trim()
  );
  const officers = (parseInt(l.officersCount || "0", 10) || 0) + (parseInt(l.officersCount2 || "0", 10) || 0) + (parseInt(l.officersCount3 || "0", 10) || 0) + (parseInt(l.officersCount4 || "0", 10) || 0);
  const rescued = (parseInt(l.rescuedCount || "0", 10) || 0) + (parseInt(l.rescuedCount2 || "0", 10) || 0) + (parseInt(l.rescuedCount3 || "0", 10) || 0) + (parseInt(l.rescuedCount4 || "0", 10) || 0);
  const recovered = (parseInt(l.recoveredCount || "0", 10) || 0) + (parseInt(l.recoveredCount2 || "0", 10) || 0) + (parseInt(l.recoveredCount3 || "0", 10) || 0) + (parseInt(l.recoveredCount4 || "0", 10) || 0);
  const prehospital = (parseInt(l.prehospitalCareCount || "0", 10) || 0) + (parseInt(l.prehospitalCareCount2 || "0", 10) || 0) + (parseInt(l.prehospitalCareCount3 || "0", 10) || 0) + (parseInt(l.prehospitalCareCount4 || "0", 10) || 0);
  const transfers = (parseInt(l.transfersCount || "0", 10) || 0) + (parseInt(l.transfersCount2 || "0", 10) || 0) + (parseInt(l.transfersCount3 || "0", 10) || 0) + (parseInt(l.transfersCount4 || "0", 10) || 0);
  const pets = (parseInt(l.rescuedPetsCount || "0", 10) || 0);
  return hasGroup || officers > 0 || rescued > 0 || recovered > 0 || prehospital > 0 || transfers > 0 || pets > 0;
}

function filterCandidateLabels(
  labels: Graphic[],
  sketchLayer: GraphicsLayer,
  view: MapView,
  refs: DeconflictRefs
): Graphic[] {
  const currentZoom = view.zoom ?? 16;
  const { parentsMap } = buildParentsMap(refs.drawnFeaturesRef.current || []);
  const dateStr = refs.selectedDateRef.current;
  const activeDept = refs.activeDepartmentRef?.current;

  return labels.filter((lbl) => {
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    const parentGraphic = sketchLayer.graphics.find(
      (x) => !x.attributes?.isLabel && (String((x as any).uid) === String(pid) || String(x.attributes?.id) === String(pid))
    );
    if (!parentGraphic || !parentGraphic.visible || !parentGraphic.geometry) return false;
    if (refs.hiddenFeaturesRef.current[pid]) return false;

    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    const isSubpolygon = isPolygonLabel && feat && parentsMap[feat.id] !== undefined;

    const hasPersonnel = feat && (feat.dailyLogs?.some((l) =>
      l.date === dateStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) && logHasData(l)
    ) || false);

    let requiredZoom = 16;
    if (hasPersonnel) {
      requiredZoom = 13;
    } else if (isPolygonLabel && !isSubpolygon) {
      requiredZoom = 14;
    }

    if (currentZoom === undefined || isNaN(currentZoom) || currentZoom < requiredZoom) return false;

    if (isPolygonLabel && !refs.layerVisibilityRef.current.polygonLabels) return false;
    if (!isPolygonLabel && !refs.layerVisibilityRef.current.pointLabels) return false;

    return true;
  });
}

function computeScreenLabels(
  candidateLabels: Graphic[],
  view: MapView,
  drawnFeaturesRef: DeconflictRefs["drawnFeaturesRef"],
  dateStr: string,
  activeDepartment?: DepartmentView,
): ScreenLabel[] {
  const activeDept = activeDepartment;
  const screenLabels = candidateLabels.map((lbl) => {
    const screenPt = lbl.geometry ? view.toScreen(lbl.geometry as any) : null;
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    let priority = 2;
    let hasPersonnel = false;

    if (isPolygonLabel) {
      priority = 3;
    } else {
      const feat = (drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
      if (feat) {
        const todayLogs = feat.dailyLogs?.filter((l) =>
          l.date === dateStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department)
        ) || [];
        if (todayLogs.length > 0) {
          hasPersonnel = feat.dailyLogs?.some((l) =>
            l.date === dateStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) && logHasData(l)
          ) || false;
          if (hasPersonnel) priority = 1;
        }
      }
    }
    return { graphic: lbl, x: screenPt?.x ?? null, y: screenPt?.y ?? null, visible: screenPt !== null, priority, hasPersonnel };
  });
  screenLabels.sort((a, b) => a.priority - b.priority);
  return screenLabels;
}

/**
 * Descarte de solapamiento para ETIQUETAS SIN PERSONAL (puntos sin actividad y polígonos).
 * SIEMPRE se descolisionan (se comportan siempre como si la opción de solapamiento estuviera desactivada).
 */
function deconflictNativeNoPersonnelLabels(screenLabels: ScreenLabel[]): void {
  const minLabelDistance = 50;
  const noPersonnelLabels = screenLabels.filter((item) => !item.hasPersonnel);

  for (let i = 0; i < noPersonnelLabels.length; i++) {
    const l1 = noPersonnelLabels[i];
    if (!l1.visible || l1.x === null || l1.y === null) continue;
    for (let j = i + 1; j < noPersonnelLabels.length; j++) {
      const l2 = noPersonnelLabels[j];
      if (!l2.visible || l2.x === null || l2.y === null) continue;
      const dx = l1.x - l2.x;
      const dy = l1.y - l2.y;
      if (Math.sqrt(dx * dx + dy * dy) < minLabelDistance) {
        l2.visible = false;
      }
    }
  }
}

/**
 * Descarte de solapamiento para TARJETAS NEGRAS (puntos con personal).
 * Solo se descolisionan cuando la opción "Permitir Solapamiento de Etiquetas" está DESACTIVADA.
 */
function deconflictPersonnelHtmlLabels(screenLabels: ScreenLabel[]): void {
  const minLabelDistance = 55;
  const personnelLabels = screenLabels.filter((item) => item.hasPersonnel);

  for (let i = 0; i < personnelLabels.length; i++) {
    const l1 = personnelLabels[i];
    if (!l1.visible || l1.x === null || l1.y === null) continue;
    for (let j = i + 1; j < personnelLabels.length; j++) {
      const l2 = personnelLabels[j];
      if (!l2.visible || l2.x === null || l2.y === null) continue;
      const dx = l1.x - l2.x;
      const dy = l1.y - l2.y;
      if (Math.sqrt(dx * dx + dy * dy) < minLabelDistance) {
        l2.visible = false;
      }
    }
  }
}

function choosePlacement(
  x: number,
  y: number,
  w: number,
  h: number,
  allowOverlap: boolean,
  placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }>
): { placement: "top" | "bottom" | "right" | "left"; box: { x1: number; y1: number; x2: number; y2: number } } {
  const offset = 12;
  const dirs: Array<"top" | "bottom" | "right" | "left"> = ["top", "bottom", "right", "left"];
  const defaultBox = { x1: x - w / 2, y1: y - offset - h, x2: x + w / 2, y2: y - offset };

  if (allowOverlap) return { placement: "top", box: defaultBox };

  for (const dir of dirs) {
    let box: { x1: number; y1: number; x2: number; y2: number };
    if (dir === "top") box = { x1: x - w / 2, y1: y - offset - h, x2: x + w / 2, y2: y - offset };
    else if (dir === "bottom") box = { x1: x - w / 2, y1: y + offset, x2: x + w / 2, y2: y + offset + h };
    else if (dir === "right") box = { x1: x + offset, y1: y - h / 2, x2: x + offset + w, y2: y + h / 2 };
    else box = { x1: x - offset - w, y1: y - h / 2, x2: x - offset, y2: y + h / 2 };

    if (!placedBoxes.some((b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1)) {
      return { placement: dir, box };
    }
  }
  return { placement: "top", box: defaultBox };
}

function buildHtmlLabels(
  screenLabels: ScreenLabel[],
  refs: DeconflictRefs,
  allowOverlap: boolean,
  dateStr: string,
): HtmlLabel[] {
  const activeHtmlLabels: HtmlLabel[] = [];
  const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const activeDept = refs.activeDepartmentRef?.current;

  screenLabels.forEach((item) => {
    const lbl = item.graphic;
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    const todayStr = dateStr;
    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    let title = feat ? feat.title : (lbl.symbol as TextSymbol)?.text || "";
    let info = "";

    if (feat && feat.type === "point") {
      const todayLogs = feat.dailyLogs?.filter((l) =>
        l.date === todayStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department)
      ) || [];

      const groupItems: Array<{ name?: string; unit?: string }> = [];
      for (const todayLog of todayLogs) {
        if (todayLog.groupName?.trim() || todayLog.unitOut?.trim()) {
          groupItems.push({ name: todayLog.groupName?.trim(), unit: todayLog.unitOut?.trim() });
        }
        if (todayLog.groupName2?.trim() || todayLog.unitOut2?.trim()) {
          groupItems.push({ name: todayLog.groupName2?.trim(), unit: todayLog.unitOut2?.trim() });
        }
        if (todayLog.groupName3?.trim() || todayLog.unitOut3?.trim()) {
          groupItems.push({ name: todayLog.groupName3?.trim(), unit: todayLog.unitOut3?.trim() });
        }
        if (todayLog.groupName4?.trim() || todayLog.unitOut4?.trim()) {
          groupItems.push({ name: todayLog.groupName4?.trim(), unit: todayLog.unitOut4?.trim() });
        }
      }

      if (groupItems.length > 0) {
        const onlyNames = groupItems.length > 2;
        const parts = groupItems
          .map((item) => {
            if (onlyNames) {
              return item.name || item.unit || "";
            }
            if (item.name && item.unit) return `${item.name}, ${item.unit}`;
            return item.name || item.unit || "";
          })
          .filter(Boolean);
        info = parts.join(" | ");
      }
    }

    const hasPersonnel = feat?.type === "point" && (!!feat.isCollapsed || (feat.dailyLogs?.some((l) =>
      l.date === todayStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) && logHasData(l)
    ) || false));

    if (hasPersonnel && !isPolygonLabel) {
      // La etiqueta gráfica nativa de ESRI siempre se oculta para puntos con personal o estadísticas
      lbl.visible = false;

      if (item.visible && item.x !== null && item.y !== null) {
        const todayLogs = feat?.dailyLogs?.filter((l) =>
          l.date === todayStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department)
        ) || [];
        const todayLog = todayLogs[0];

        let prehospitalCount = 0;
        let transfersCount = 0;
        let rescuedCount = 0;
        let recoveredCount = 0;

        todayLogs.forEach((l) => {
          prehospitalCount += (parseInt(l.prehospitalCareCount || "0", 10) || 0) + (parseInt(l.prehospitalCareCount2 || "0", 10) || 0) + (parseInt(l.prehospitalCareCount3 || "0", 10) || 0) + (parseInt(l.prehospitalCareCount4 || "0", 10) || 0);
          transfersCount += (parseInt(l.transfersCount || "0", 10) || 0) + (parseInt(l.transfersCount2 || "0", 10) || 0) + (parseInt(l.transfersCount3 || "0", 10) || 0) + (parseInt(l.transfersCount4 || "0", 10) || 0);
          rescuedCount += (parseInt(l.rescuedCount || "0", 10) || 0) + (parseInt(l.rescuedCount2 || "0", 10) || 0) + (parseInt(l.rescuedCount3 || "0", 10) || 0) + (parseInt(l.rescuedCount4 || "0", 10) || 0);
          recoveredCount += (parseInt(l.recoveredCount || "0", 10) || 0) + (parseInt(l.recoveredCount2 || "0", 10) || 0) + (parseInt(l.recoveredCount3 || "0", 10) || 0) + (parseInt(l.recoveredCount4 || "0", 10) || 0);
        });

        const hasBadges = prehospitalCount > 0 || transfersCount > 0 || rescuedCount > 0 || recoveredCount > 0;
        const hasGroups = todayLogs.some((l) => l.groupName?.trim() || l.groupName2?.trim() || l.groupName3?.trim() || l.groupName4?.trim());
        const g1Arrived = todayLog ? (!!todayLog.hasArrivedG1 || (!!todayLog.arrivalTime && todayLog.arrivalTime.trim() !== "")) : false;
        const g2Arrived = todayLog ? (!!todayLog.hasArrivedG2 || (!!todayLog.arrivalTime2 && todayLog.arrivalTime2.trim() !== "")) : false;
        const g3Arrived = todayLog ? (!!todayLog.hasArrivedG3 || (!!todayLog.arrivalTime3 && todayLog.arrivalTime3.trim() !== "")) : false;
        const g4Arrived = todayLog ? (!!todayLog.hasArrivedG4 || (!!todayLog.arrivalTime4 && todayLog.arrivalTime4.trim() !== "")) : false;
        const hasArrived = hasGroups ? (g1Arrived || g2Arrived || g3Arrived || g4Arrived) : true;

        const charWidth = 6;
        const padding = 20;
        const textLength = Math.max(title.length, info.length);
        const w = Math.min(220, Math.max(100, textLength * charWidth + padding));
        const h = (info || hasBadges || feat?.isCollapsed) ? 42 : 28;
        const x = item.x!;
        const y = item.y!;

        const { placement, box } = choosePlacement(x, y, w, h, allowOverlap, placedBoxes);

        activeHtmlLabels.push({
          id: pid,
          title,
          info,
          x,
          y,
          themeColor: feat?.color,
          placement,
          hasArrived,
          prehospitalCount: prehospitalCount || undefined,
          transfersCount: transfersCount || undefined,
          rescuedCount: rescuedCount || undefined,
          recoveredCount: recoveredCount || undefined,
          isCollapsed: feat?.isCollapsed,
          collapsedCount: feat?.collapsedCount,
        });
        placedBoxes.push(box);
      }
    } else {
      // Para puntos sin actividad y etiquetas de polígonos/líneas (etiquetas nativas):
      // Obedecen item.visible para que se descarten si están solapadas
      lbl.visible = item.visible;
      if (lbl.symbol) lbl.symbol = lbl.symbol.clone();
    }
  });

  return activeHtmlLabels;
}

export function deconflictGraphics(
  sketchLayer: GraphicsLayer,
  view: MapView,
  refs: DeconflictRefs,
  setHtmlLabels: (labels: HtmlLabel[]) => void
): void {
  try {
    if (!sketchLayer || !view) return;

    const points = sketchLayer.graphics.filter((x) => x.geometry?.type === "point" && !x.attributes?.isLabel).toArray();
    const labels = sketchLayer.graphics.filter((x) => !!x.attributes?.isLabel).toArray();

    points.forEach((g) => {
      const pid = g.attributes?.id || (g as any).uid;
      g.visible = !refs.hiddenFeaturesRef.current[pid];
    });

    const candidateLabels = filterCandidateLabels(labels, sketchLayer, view, refs);
    labels.forEach((lbl) => {
      if (!candidateLabels.includes(lbl)) lbl.visible = false;
    });

    const dateStr = refs.selectedDateRef.current;
    const screenLabels = computeScreenLabels(candidateLabels, view, refs.drawnFeaturesRef, dateStr, refs.activeDepartmentRef?.current);
    const allowOverlapSetting = refs.layerVisibilityRef.current.allowLabelOverlap;

    // 1. Las etiquetas sin personal (y polígonos) SIEMPRE se descolisionan (se comportan siempre como si la opción estuviera desactivada)
    deconflictNativeNoPersonnelLabels(screenLabels);

    // 2. Las etiquetas con personal (tarjetas negras) SOLO se descolisionan si allowLabelOverlap está DESACTIVADO (false)
    if (!allowOverlapSetting) {
      deconflictPersonnelHtmlLabels(screenLabels);
    }

    const activeHtmlLabels = buildHtmlLabels(screenLabels, refs, allowOverlapSetting, dateStr);
    setHtmlLabels(activeHtmlLabels);
  } catch (err) {
    console.error("Error in deconflictGraphics:", err);
  }
}
