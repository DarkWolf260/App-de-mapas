import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { buildParentsMap } from "./spatialUtils";
import { FeatureLogBook } from "./featureLogBook";
import type { DrawnFeature, LayerVisibility, DepartmentView, CustomActivity, HtmlLabel } from "../types";

export interface DeconflictRefs {
  drawnFeaturesRef: React.MutableRefObject<DrawnFeature[]>;
  hiddenFeaturesRef: React.MutableRefObject<Record<string, boolean>>;
  layerVisibilityRef: React.MutableRefObject<LayerVisibility>;
  selectedDateRef: React.MutableRefObject<string>;
  activeDepartmentRef?: React.MutableRefObject<DepartmentView>;
  showAccumulatedRef?: React.MutableRefObject<boolean>;
}

export interface ScreenLabelItem {
  graphic: Graphic;
  x: number | null;
  y: number | null;
  visible: boolean;
  priority: number;
  hasPersonnel?: boolean;
}

export interface BoxRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Determines whether a feature/label qualifies for display at current zoom level.
 */
export function getRequiredZoom(isPolygonLabel: boolean, isSubpolygon: boolean, hasPersonnel: boolean): number {
  if (hasPersonnel) return 10;
  if (isPolygonLabel && !isSubpolygon) return 12;
  return 12;
}

/**
 * Filter candidates from GraphicsLayer.
 */
export function filterCandidateLabels(
  labels: Graphic[],
  sketchLayer: GraphicsLayer,
  view: MapView,
  refs: DeconflictRefs,
): Graphic[] {
  const currentZoom = view.zoom ?? 16;
  const { parentsMap } = buildParentsMap(refs.drawnFeaturesRef.current || []);
  const dateStr = refs.selectedDateRef.current;
  const activeDept = refs.activeDepartmentRef?.current;
  const accMode = refs.showAccumulatedRef?.current === true;

  return labels.filter((lbl) => {
    const pid = lbl.attributes?.parentId;
    const isPolygonLabel = !!lbl.attributes?.isPolygonLabel;
    const parentGraphic = sketchLayer.graphics.find(
      (x) => !x.attributes?.isLabel && (String((x as any).uid) === String(pid) || String(x.attributes?.id) === String(pid))
    );
    if (!parentGraphic || !parentGraphic.visible || !parentGraphic.geometry) return false;
    if (refs.hiddenFeaturesRef.current[String(pid)]) return false;

    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    const isSubpolygon = isPolygonLabel && !!feat && parentsMap[feat.id] !== undefined;

    const hasPersonnel = !!feat && (feat.dailyLogs?.some((l) =>
      (accMode || !dateStr || l.date === dateStr) &&
      (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) &&
      FeatureLogBook.hasAnyData(l)
    ) || false);

    const requiredZoom = getRequiredZoom(isPolygonLabel, isSubpolygon, hasPersonnel);
    if (currentZoom === undefined || isNaN(currentZoom) || currentZoom < requiredZoom) return false;

    if (isPolygonLabel && !refs.layerVisibilityRef.current.polygonLabels) return false;
    if (!isPolygonLabel && !refs.layerVisibilityRef.current.pointLabels) return false;

    return true;
  });
}

/**
 * Projects candidate graphics to screen space and assigns deconfliction priority.
 */
export function computeScreenLabels(
  candidateLabels: Graphic[],
  view: MapView,
  drawnFeaturesRef: DeconflictRefs["drawnFeaturesRef"],
  dateStr: string,
  activeDepartment?: DepartmentView,
  showAccumulatedRef?: React.MutableRefObject<boolean | undefined>,
): ScreenLabelItem[] {
  const activeDept = activeDepartment;
  const accMode = showAccumulatedRef?.current === true;

  const screenLabels = candidateLabels.map((lbl) => {
    const screenPt = lbl.geometry ? view.toScreen(lbl.geometry as any) : null;
    const pid = lbl.attributes?.parentId;
    let priority = 2;
    let hasPersonnel = false;

    const feat = (drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    if (feat) {
      if (accMode) {
        hasPersonnel = feat.dailyLogs?.some((l) =>
          (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) &&
          FeatureLogBook.hasAnyData(l)
        ) || false;
      } else {
        const todayLogs = feat.dailyLogs?.filter((l) =>
          l.date === dateStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department)
        ) || [];
        if (todayLogs.length > 0) {
          hasPersonnel = todayLogs.some((l) =>
            (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) &&
            FeatureLogBook.hasAnyData(l)
          );
        }
      }
      if (hasPersonnel) priority = 1;
    }
    return {
      graphic: lbl,
      x: screenPt?.x ?? null,
      y: screenPt?.y ?? null,
      visible: screenPt !== null,
      priority,
      hasPersonnel,
    };
  });

  screenLabels.sort((a, b) => a.priority - b.priority);
  return screenLabels;
}

/**
 * Collision resolution for labels without personnel.
 */
export function deconflictNativeNoPersonnelLabels(screenLabels: ScreenLabelItem[], minDistance = 50): void {
  const noPersonnelLabels = screenLabels.filter((item) => !item.hasPersonnel);
  for (let i = 0; i < noPersonnelLabels.length; i++) {
    const l1 = noPersonnelLabels[i];
    if (!l1.visible || l1.x === null || l1.y === null) continue;
    for (let j = i + 1; j < noPersonnelLabels.length; j++) {
      const l2 = noPersonnelLabels[j];
      if (!l2.visible || l2.x === null || l2.y === null) continue;
      const dx = l1.x - l2.x;
      const dy = l1.y - l2.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        l2.visible = false;
      }
    }
  }
}

/**
 * Collision resolution for HTML badges/personnel cards when overlap is disabled.
 */
export function deconflictPersonnelHtmlLabels(screenLabels: ScreenLabelItem[], minDistance = 55): void {
  const personnelLabels = screenLabels.filter((item) => item.hasPersonnel);
  for (let i = 0; i < personnelLabels.length; i++) {
    const l1 = personnelLabels[i];
    if (!l1.visible || l1.x === null || l1.y === null) continue;
    for (let j = i + 1; j < personnelLabels.length; j++) {
      const l2 = personnelLabels[j];
      if (!l2.visible || l2.x === null || l2.y === null) continue;
      const dx = l1.x - l2.x;
      const dy = l1.y - l2.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        l2.visible = false;
      }
    }
  }
}

/**
 * Selects optimal placement direction (top, bottom, right, left) for a label card avoiding box collisions.
 */
export function choosePlacement(
  x: number,
  y: number,
  w: number,
  h: number,
  allowOverlap: boolean,
  placedBoxes: BoxRect[],
): { placement: "top" | "bottom" | "right" | "left"; box: BoxRect } {
  const offset = 12;
  const dirs: Array<"top" | "bottom" | "right" | "left"> = ["top", "bottom", "right", "left"];
  const defaultBox: BoxRect = { x1: x - w / 2, y1: y - offset - h, x2: x + w / 2, y2: y - offset };

  if (allowOverlap) return { placement: "top", box: defaultBox };

  for (const dir of dirs) {
    let box: BoxRect;
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

/**
 * Extracts and compiles an HtmlLabel definition for a visible screen item using FeatureLogBook domain helpers.
 */
export function buildHtmlLabels(
  screenLabels: ScreenLabelItem[],
  refs: DeconflictRefs,
  allowOverlap: boolean,
  dateStr: string,
): HtmlLabel[] {
  const activeHtmlLabels: HtmlLabel[] = [];
  const placedBoxes: BoxRect[] = [];
  const activeDept = refs.activeDepartmentRef?.current;
  const accMode = refs.showAccumulatedRef?.current === true;

  screenLabels.forEach((item) => {
    const lbl = item.graphic;
    const pid = lbl.attributes?.parentId;
    const feat = (refs.drawnFeaturesRef.current || []).find((f) => String(f.id) === String(pid));
    const title = feat ? feat.title : (lbl.symbol as TextSymbol)?.text || "";
    const info = "";

    const hasPersonnel = accMode
      ? (!!feat && (feat.dailyLogs?.some((l) =>
        (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) &&
        FeatureLogBook.hasAnyData(l)
      ) || false))
      : (!!feat && (feat.dailyLogs?.some((l) =>
        l.date === dateStr &&
        (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department) &&
        FeatureLogBook.hasAnyData(l)
      ) || false));

    if (hasPersonnel) {
      lbl.visible = false;

      if (item.visible && item.x !== null && item.y !== null) {
        const statLogs = accMode
          ? (feat?.dailyLogs?.filter((l) =>
            activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department
          ) || [])
          : (feat?.dailyLogs?.filter((l) =>
            l.date === dateStr && (activeDept === "mixto" || !activeDept || l.department === activeDept || !l.department)
          ) || []);

        let prehospitalCount = 0;
        let transfersCount = 0;
        let rescuedCount = 0;
        let recoveredCount = 0;
        let rescuedPetsCount = 0;
        let customActivitiesList: CustomActivity[] = [];

        statLogs.forEach((l) => {
          if (l.customActivities) {
            customActivitiesList = FeatureLogBook.mergeCustomActivities(customActivitiesList, l.customActivities);
          }
          const groups = FeatureLogBook.normalizeGroups(l);
          for (const g of groups) {
            if (g.customActivities) {
              customActivitiesList = FeatureLogBook.mergeCustomActivities(customActivitiesList, g.customActivities);
            }
          }
          rescuedCount += parseInt(l.rescuedCount || "0", 10) || 0;
          recoveredCount += parseInt(l.recoveredCount || "0", 10) || 0;
          rescuedPetsCount += parseInt(l.rescuedPetsCount || "0", 10) || 0;
          prehospitalCount += parseInt(l.prehospitalCareCount || "0", 10) || 0;
          transfersCount += parseInt(l.transfersCount || "0", 10) || 0;
        });

        const hasBadges = prehospitalCount > 0 || transfersCount > 0 || rescuedCount > 0 || recoveredCount > 0 || rescuedPetsCount > 0 || customActivitiesList.length > 0;
        const activeGroupsList = statLogs.flatMap((l) => FeatureLogBook.normalizeGroups(l));
        const hasActiveGroups = activeGroupsList.length > 0;
        const hasArrived = hasActiveGroups ? activeGroupsList.every((g) => !!g.hasArrived) : true;

        const teamNames: string[] = [];
        const seenTeams = new Set<string>();
        for (const g of activeGroupsList) {
          const name = g.groupName?.trim();
          const unit = g.unitOut?.trim();
          const entry: string[] = [];
          if (name) entry.push(name);
          if (unit) entry.push(unit);
          const label = entry.length > 0 ? entry.join(" - ") : "";
          if (label && !seenTeams.has(label)) {
            seenTeams.add(label);
            teamNames.push(label);
          }
        }

        const charWidth = 6;
        const padding = 20;
        const textLength = Math.max(title.length, info.length);
        const w = Math.min(220, Math.max(100, textLength * charWidth + padding));
        const h = (info || hasBadges || feat?.isCollapsed || teamNames.length > 0) ? 42 : 28;
        const x = item.x!;
        const y = item.y!;

        const { placement, box } = choosePlacement(x, y, w, h, allowOverlap, placedBoxes);
        placedBoxes.push(box);

        const notesSet = new Set<string>();
        statLogs.forEach((l) => {
          if (l.observations?.trim()) {
            notesSet.add(l.observations.trim());
          }
        });
        for (const ca of customActivitiesList) {
          if (ca.description?.trim()) {
            notesSet.add(ca.description.trim());
          }
        }
        const activityNotes = Array.from(notesSet);

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
          rescuedPetsCount: rescuedPetsCount || undefined,
          isCollapsed: feat?.isCollapsed,
          collapsedCount: feat?.collapsedCount,
          teamNames: teamNames.length > 0 ? teamNames : undefined,
          customActivities: customActivitiesList.length > 0 ? customActivitiesList : undefined,
          activityNotes: activityNotes.length > 0 ? activityNotes : undefined,
        });
      }
    } else {
      lbl.visible = item.visible;
      if (lbl.symbol) lbl.symbol = lbl.symbol.clone();
    }
  });

  return activeHtmlLabels;
}

/**
 * Main coordinator function for deconflicting map graphics and emitting HTML labels.
 */
export function deconflictGraphics(
  sketchLayer: GraphicsLayer,
  view: MapView,
  refs: DeconflictRefs,
  setHtmlLabels: (labels: HtmlLabel[]) => void,
): void {
  try {
    if (!sketchLayer || !view) return;

    const points = sketchLayer.graphics.filter((x) => x.geometry?.type === "point" && !x.attributes?.isLabel).toArray();
    const labels = sketchLayer.graphics.filter((x) => !!x.attributes?.isLabel).toArray();

    points.forEach((g) => {
      const pid = g.attributes?.id || (g as any).uid;
      g.visible = !refs.hiddenFeaturesRef.current[String(pid)];
    });

    const candidateLabels = filterCandidateLabels(labels, sketchLayer, view, refs);
    labels.forEach((lbl) => {
      if (!candidateLabels.includes(lbl)) lbl.visible = false;
    });

    const dateStr = refs.selectedDateRef.current;
    const screenLabels = computeScreenLabels(candidateLabels, view, refs.drawnFeaturesRef, dateStr, refs.activeDepartmentRef?.current, refs.showAccumulatedRef);
    const allowOverlapSetting = refs.layerVisibilityRef.current.allowLabelOverlap;

    deconflictNativeNoPersonnelLabels(screenLabels);

    if (!allowOverlapSetting) {
      deconflictPersonnelHtmlLabels(screenLabels);
    }

    const activeHtmlLabels = buildHtmlLabels(screenLabels, refs, allowOverlapSetting, dateStr);
    setHtmlLabels(activeHtmlLabels);
  } catch (err) {
    console.error("[MapAnnotationEngine] Error in deconflictGraphics:", err);
  }
}

/**
 * Deep Module Namespace
 */
export const MapAnnotationEngine = {
  getRequiredZoom,
  filterCandidateLabels,
  computeScreenLabels,
  deconflictNativeNoPersonnelLabels,
  deconflictPersonnelHtmlLabels,
  choosePlacement,
  buildHtmlLabels,
  deconflictGraphics,
};
