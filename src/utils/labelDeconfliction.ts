import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { buildParentsMap } from "./spatialUtils";
import type { DrawnFeature, LayerVisibility } from "../types";
import type { HtmlLabel } from "../types";

interface DeconflictRefs {
  drawnFeaturesRef: React.MutableRefObject<DrawnFeature[]>;
  hiddenFeaturesRef: React.MutableRefObject<Record<number, boolean>>;
  layerVisibilityRef: React.MutableRefObject<LayerVisibility>;
}

interface ScreenLabel {
  graphic: __esri.Graphic;
  x: number | null;
  y: number | null;
  visible: boolean;
  priority: number;
}

function filterCandidateLabels(
  labels: __esri.Graphic[],
  sketchLayer: GraphicsLayer,
  view: MapView,
  refs: DeconflictRefs
): __esri.Graphic[] {
  const currentZoom = view.zoom ?? 16;
  const { parentsMap } = buildParentsMap(refs.drawnFeaturesRef.current || []);

  return labels.filter((lbl) => {
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    const parentGraphic = sketchLayer.graphics.find(
      (x) => !x.attributes?.isLabel && (String(x.uid) === String(pid) || String(x.attributes?.id) === String(pid))
    );
    if (!parentGraphic || !parentGraphic.visible || !parentGraphic.geometry) return false;
    if (refs.hiddenFeaturesRef.current[pid]) return false;

    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    const isSubpolygon = isPolygonLabel && feat && parentsMap[feat.id] !== undefined;
    const requiredZoom = isPolygonLabel && !isSubpolygon ? 14 : 16;
    if (currentZoom === undefined || isNaN(currentZoom) || currentZoom < requiredZoom) return false;

    if (isPolygonLabel && !refs.layerVisibilityRef.current.polygonLabels) return false;
    if (!isPolygonLabel && !refs.layerVisibilityRef.current.pointLabels) return false;

    return true;
  });
}

function computeScreenLabels(
  candidateLabels: __esri.Graphic[],
  view: MapView,
  drawnFeaturesRef: DeconflictRefs["drawnFeaturesRef"]
): ScreenLabel[] {
  const screenLabels = candidateLabels.map((lbl) => {
    const screenPt = lbl.geometry ? view.toScreen(lbl.geometry) : null;
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    let priority = 2;
    if (isPolygonLabel) {
      priority = 3;
    } else {
      const feat = (drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
      if (feat?.type === "point") {
        const todayStr = new Date().toLocaleDateString("en-CA");
        const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
        if (todayLog !== undefined) priority = 1;
      }
    }
    return { graphic: lbl, x: screenPt?.x ?? null, y: screenPt?.y ?? null, visible: screenPt !== null, priority };
  });
  screenLabels.sort((a, b) => a.priority - b.priority);
  return screenLabels;
}

function deconflictOverlappingLabels(screenLabels: ScreenLabel[]): void {
  const minLabelDistance = 55;
  for (let i = 0; i < screenLabels.length; i++) {
    const l1 = screenLabels[i];
    if (!l1.visible || l1.x === null || l1.y === null) continue;
    for (let j = i + 1; j < screenLabels.length; j++) {
      const l2 = screenLabels[j];
      if (!l2.visible || l2.x === null || l2.y === null) continue;
      const dx = l1.x - l2.x;
      const dy = l1.y - l2.y;
      if (Math.sqrt(dx * dx + dy * dy) < minLabelDistance) {
        l2.visible = false;
        l2.graphic.visible = false;
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
  allowOverlap: boolean
): HtmlLabel[] {
  const activeHtmlLabels: HtmlLabel[] = [];
  const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  screenLabels.forEach((item) => {
    const lbl = item.graphic;
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = lbl.attributes?.isPolygonLabel;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    let title = feat ? feat.title : (lbl.symbol as TextSymbol)?.text || "";
    let info = "";

    if (feat && feat.type === "point") {
      const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
      if (todayLog) {
        const g1 = todayLog.groupName?.trim();
        const g2 = todayLog.groupName2?.trim();
        if (g1 || g2) {
          const parts: string[] = [];
          const u1 = todayLog.unitOut?.trim();
          if (g1 && u1) parts.push(`${g1}, ${u1}`);
          else if (g1) parts.push(g1);
          else if (u1) parts.push(u1);
          const u2 = todayLog.unitOut2?.trim();
          if (g2 && u2) parts.push(`${g2}, ${u2}`);
          else if (g2) parts.push(g2);
          else if (u2) parts.push(u2);
          info = parts.join(" | ");
        }
      }
    }

    const hasPersonnel = feat?.type === "point" && feat.dailyLogs?.some((l) => l.date === todayStr && (l.groupName || l.groupName2));

    if (item.visible && !isPolygonLabel && hasPersonnel) {
      const charWidth = 6;
      const padding = 20;
      const textLength = Math.max(title.length, info.length);
      const w = Math.min(220, Math.max(100, textLength * charWidth + padding));
      const h = info ? 42 : 28;
      const x = item.x!;
      const y = item.y!;

      const { placement, box } = choosePlacement(x, y, w, h, allowOverlap, placedBoxes);

      const todayLog = feat?.dailyLogs?.find((l) => l.date === todayStr);
      const g1Arrived = todayLog ? (!!todayLog.hasArrivedG1 || (!!todayLog.arrivalTime && todayLog.arrivalTime.trim() !== "")) : false;
      const g2Arrived = todayLog ? (!!todayLog.hasArrivedG2 || (!!todayLog.arrivalTime2 && todayLog.arrivalTime2.trim() !== "")) : false;

      activeHtmlLabels.push({
        id: pid,
        title,
        info,
        x,
        y,
        themeColor: feat?.color,
        placement,
        hasArrived: g1Arrived || g2Arrived,
      });
      placedBoxes.push(box);
      lbl.visible = false;
    } else {
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
      const pid = g.attributes?.id || g.uid;
      g.visible = !refs.hiddenFeaturesRef.current[pid];
    });

    const candidateLabels = filterCandidateLabels(labels, sketchLayer, view, refs);
    labels.forEach((lbl) => {
      if (!candidateLabels.includes(lbl)) lbl.visible = false;
    });

    const screenLabels = computeScreenLabels(candidateLabels, view, refs.drawnFeaturesRef);
    if (!refs.layerVisibilityRef.current.allowLabelOverlap) {
      deconflictOverlappingLabels(screenLabels);
    }

    const activeHtmlLabels = buildHtmlLabels(screenLabels, refs, refs.layerVisibilityRef.current.allowLabelOverlap);
    setHtmlLabels(activeHtmlLabels);
  } catch (err) {
    console.error("Error in deconflictGraphics:", err);
  }
}
