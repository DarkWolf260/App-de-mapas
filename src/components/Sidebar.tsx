import React, { ChangeEvent, useState } from "react";
import { Activity, Compass, Download, Upload, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import type { DrawnFeature, LayerVisibility } from "../App";
import { FeatureCard } from "./FeatureCard";

interface SidebarProps {
  activeCity: string;
  layerVisibility: LayerVisibility;
  onToggleLayer: (layerName: keyof LayerVisibility) => void;
  drawnFeatures: DrawnFeature[];
  onRenameFeature: (id: number, newTitle: string) => void;
  onDeleteFeature: (id: number) => void;
  onZoomToFeature: (feat: DrawnFeature) => void;
  onExportGeoJSON: () => void;
  onImportGeoJSON: (text: string) => void;
  hiddenFeatures: Record<number, boolean>;
  onToggleFeatureVisibility: (id: number) => void;
  onToggleFeaturesVisibility: (ids: number[], visible: boolean) => void;
  onReorderFeature: (id: number, direction: "up" | "down") => void;
  onUpdateFeatureDescription: (id: number, newDesc: string) => void;
  onToggleFeatureLock: (id: number, locked: boolean) => void;
  onSaveDailyLog?: (
    featureId: number,
    log: { date: string; groupName: string; managerName: string; managerPhone: string; unitOut: string; departureTime?: string; arrivalTime?: string; officersCount?: string }
  ) => Promise<void>;
  onOpenRangeReport?: (feat: DrawnFeature | "all") => void;
  className?: string;
}

// WorkSiteLogForm y FeatureCard han sido movidos a archivos independientes para cumplir con SOLID.

// ── Spatial Containment Helpers ──────────────────────────────────────────────────

function isPointInPolygon(point: [number, number], vs: number[][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  if (!vs || vs.length === 0) return false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInGeoJSONPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0 || !polygon[0] || polygon[0].length === 0) return false;
  return isPointInPolygon(point, polygon[0]);
}

function isLineInPolygon(lineCoords: number[][], polygon: number[][][]): boolean {
  if (!lineCoords || lineCoords.length === 0 || !polygon || polygon.length === 0 || !polygon[0]) return false;
  const outerRing = polygon[0];
  return lineCoords.every(pt => isPointInPolygon([pt[0], pt[1]], outerRing));
}

function isPolygonInPolygon(innerPolygon: number[][][], outerPolygon: number[][][]): boolean {
  if (!innerPolygon || innerPolygon.length === 0 || !innerPolygon[0] || !outerPolygon || outerPolygon.length === 0 || !outerPolygon[0]) return false;
  const outerRing = outerPolygon[0];
  const innerRing = innerPolygon[0];
  return innerRing.every(pt => isPointInPolygon([pt[0], pt[1]], outerRing));
}

function getPolygonArea(polygonCoords: number[][]): number {
  let area = 0;
  const n = polygonCoords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygonCoords[i][0] * polygonCoords[j][1];
    area -= polygonCoords[j][0] * polygonCoords[i][1];
  }
  return Math.abs(area) / 2;
}

const Sidebar: React.FC<SidebarProps> = ({
  layerVisibility,
  onToggleLayer,
  drawnFeatures,
  onRenameFeature,
  onDeleteFeature,
  onZoomToFeature,
  onExportGeoJSON,
  onImportGeoJSON,
  hiddenFeatures,
  onToggleFeatureVisibility,
  onToggleFeaturesVisibility,
  onReorderFeature,
  onUpdateFeatureDescription,
  onToggleFeatureLock,
  onSaveDailyLog,
  onOpenRangeReport,
  className,
}) => {
  const [groupByType, setGroupByType] = useState(true);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    polygon: false,
    polyline: false,
    point: false,
  });

  const toggleGroupCollapse = (type: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const isGroupAllVisible = (groupFeatures: DrawnFeature[]) => {
    if (groupFeatures.length === 0) return false;
    return groupFeatures.every((f) => !hiddenFeatures[f.id]);
  };

  const handleGroupVisibilityClick = (groupFeatures: DrawnFeature[], e: React.MouseEvent) => {
    e.stopPropagation();
    const allVisible = isGroupAllVisible(groupFeatures);
    const ids = groupFeatures.map((f) => f.id);
    onToggleFeaturesVisibility(ids, !allVisible);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) onImportGeoJSON(event.target.result as string);
    };
    reader.readAsText(file);
  };

  const [collapsedChildren, setCollapsedChildren] = useState<Record<number, boolean>>({});

  const toggleChildrenCollapse = (polyId: number) => {
    setCollapsedChildren((prev) => ({ ...prev, [polyId]: !prev[polyId] }));
  };

  // 1. Calculate parent-child relationships for spatial containment grouping
  const polygons = drawnFeatures.filter((f) => f.type === "polygon");
  const points = drawnFeatures.filter((f) => f.type === "point");
  const lines = drawnFeatures.filter((f) => f.type === "polyline");

  const polygonAreas = new Map<number, number>();
  polygons.forEach((f) => {
    const coords = f.geojsonGeometry?.coordinates as number[][][];
    if (coords && coords[0]) {
      polygonAreas.set(f.id, getPolygonArea(coords[0]));
    } else {
      polygonAreas.set(f.id, 0);
    }
  });

  const parentsMap = new Map<number, number>();
  const childrenMap = new Map<number, DrawnFeature[]>();

  drawnFeatures.forEach((feat) => {
    let bestParentId: number | null = null;
    let minArea = Infinity;
    const innerArea = feat.type === "polygon" ? (polygonAreas.get(feat.id) ?? 0) : 0;

    polygons.forEach((poly) => {
      if (poly.id === feat.id) return;
      if (feat.type === "polygon" && (polygonAreas.get(poly.id) ?? 0) <= innerArea) return; // parent must be strictly larger

      let isContained = false;
      const polyCoords = poly.geojsonGeometry?.coordinates as number[][][];
      if (!polyCoords || polyCoords.length === 0) return;

      if (feat.type === "point" && feat.geojsonGeometry?.type === "Point") {
        const ptCoords = feat.geojsonGeometry.coordinates as number[];
        if (ptCoords) {
          isContained = isPointInGeoJSONPolygon([ptCoords[0], ptCoords[1]], polyCoords);
        }
      } else if (feat.type === "polyline" && feat.geojsonGeometry?.type === "LineString") {
        const lineCoords = feat.geojsonGeometry.coordinates as number[][];
        if (lineCoords) {
          isContained = isLineInPolygon(lineCoords, polyCoords);
        }
      } else if (feat.type === "polygon" && feat.geojsonGeometry?.type === "Polygon") {
        const innerPolyCoords = feat.geojsonGeometry.coordinates as number[][][];
        if (innerPolyCoords) {
          isContained = isPolygonInPolygon(innerPolyCoords, polyCoords);
        }
      }

      if (isContained) {
        const area = polygonAreas.get(poly.id) ?? Infinity;
        if (area < minArea) {
          minArea = area;
          bestParentId = poly.id;
        }
      }
    });

    if (bestParentId !== null) {
      parentsMap.set(feat.id, bestParentId);
      if (!childrenMap.has(bestParentId)) {
        childrenMap.set(bestParentId, []);
      }
      childrenMap.get(bestParentId)!.push(feat);
    }
  });

  const rootPoints = points.filter((pt) => !parentsMap.has(pt.id));
  const rootLines = lines.filter((l) => !parentsMap.has(l.id));
  const rootPolygons = polygons.filter((p) => !parentsMap.has(p.id));

  // Group points by parent polygon ID for containment grouping inside the point list
  const pointsByParent = new Map<number, DrawnFeature[]>();
  points.forEach((pt) => {
    const parentId = parentsMap.get(pt.id);
    if (parentId !== undefined) {
      if (!pointsByParent.has(parentId)) {
        pointsByParent.set(parentId, []);
      }
      pointsByParent.get(parentId)!.push(pt);
    }
  });

  const renderFeatureCard = (
    feat: DrawnFeature,
    hasChildren = false,
    isCollapsed = false,
    onToggleChildren?: () => void,
    childrenCount = 0
  ) => (
    <FeatureCard
      key={feat.id}
      feat={feat}
      hiddenFeatures={hiddenFeatures}
      onToggleFeatureVisibility={onToggleFeatureVisibility}
      onRenameFeature={onRenameFeature}
      onUpdateFeatureDescription={onUpdateFeatureDescription}
      onReorderFeature={onReorderFeature}
      onZoomToFeature={onZoomToFeature}
      onDeleteFeature={onDeleteFeature}
      onToggleFeatureLock={onToggleFeatureLock}
      onSaveDailyLog={onSaveDailyLog}
      onOpenRangeReport={onOpenRangeReport}
      hasChildren={hasChildren}
      isChildrenCollapsed={isCollapsed}
      onToggleChildren={onToggleChildren}
      childrenCount={childrenCount}
    />
  );

  const renderFeatureNode = (feat: DrawnFeature) => {
    const children = childrenMap.get(feat.id) || [];
    const polygonChildren = children.filter((c) => c.type === "polygon");
    const hasChildren = polygonChildren.length > 0;
    const isCollapsed = collapsedChildren[feat.id] ?? false;

    return (
      <div key={feat.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {renderFeatureCard(
          feat,
          hasChildren,
          isCollapsed,
          hasChildren ? () => toggleChildrenCollapse(feat.id) : undefined,
          polygonChildren.length
        )}
        {feat.type === "polygon" && hasChildren && !isCollapsed && (
          <div
            style={{
              marginLeft: "12px",
              paddingLeft: "10px",
              borderLeft: "1px dashed rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              marginTop: "2px",
              marginBottom: "4px",
            }}
          >
            {polygonChildren.map(renderFeatureNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar glass-panel ${className ?? ""}`}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h2 className="panel-title" style={{ fontSize: "1.1rem", marginBottom: "2px" }}>
          <Activity size={20} style={{ color: "var(--color-high)" }} />
          Centro de Mando
        </h2>
        <p className="panel-subtitle" style={{ fontSize: "0.8rem", marginBottom: "4px" }}>
          Protección Civil - Dibujos y Polígonos
        </p>
      </div>

      {/* Collapsible Map Settings */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
        <button
          onClick={() => setShowMapSettings(!showMapSettings)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-info)",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 0",
            width: "100%",
            textAlign: "left",
            outline: "none"
          }}
        >
          {showMapSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          ⚙️ Ajustes del Mapa y Visibilidad
        </button>

        {showMapSettings && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", paddingLeft: "8px" }}>
            <div className="toggle-item">
              <span className="toggle-label" style={{ fontSize: "0.72rem" }}>
                Herramientas de Dibujo
              </span>
              <label className="toggle-switch">
                <input type="checkbox" checked={layerVisibility.sketch} onChange={() => onToggleLayer("sketch")} />
                <span className="slider" />
              </label>
            </div>
            <div className="toggle-item">
              <span className="toggle-label" style={{ fontSize: "0.72rem" }}>
                Nombres de Polígonos
              </span>
              <label className="toggle-switch">
                <input type="checkbox" checked={layerVisibility.polygonLabels} onChange={() => onToggleLayer("polygonLabels")} />
                <span className="slider" />
              </label>
            </div>
            <div className="toggle-item">
              <span className="toggle-label" style={{ fontSize: "0.72rem" }}>
                Nombres de Sitios de Trabajo
              </span>
              <label className="toggle-switch">
                <input type="checkbox" checked={layerVisibility.pointLabels} onChange={() => onToggleLayer("pointLabels")} />
                <span className="slider" />
              </label>
            </div>
            <div className="toggle-item">
              <span className="toggle-label" style={{ fontSize: "0.72rem" }}>
                Ocultar Áreas Anidadas
              </span>
              <label className="toggle-switch">
                <input type="checkbox" checked={layerVisibility.hideNestedAreas} onChange={() => onToggleLayer("hideNestedAreas")} />
                <span className="slider" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Elementos Dibujados */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", marginTop: "4px", minHeight: 0 }}>
        <div
          className="list-section-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            fontSize: "0.78rem",
          }}
        >
          <span>Elementos Dibujados ({drawnFeatures.length})</span>
          <button
            onClick={() => setGroupByType((v) => !v)}
            style={{
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--color-info)",
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "2px 6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={groupByType ? "Mostrar todos mezclados" : "Agrupar dibujos por tipo"}
          >
            {groupByType ? "Desagrupar" : "Agrupar"}
          </button>
        </div>

        <div
          className="incident-list"
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "8px",
          }}
        >
          {drawnFeatures.length === 0 ? (
            <div className="empty-state" style={{ fontSize: "0.72rem", padding: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "16px" }}>
              Usa la herramienta de dibujo para crear polígonos, líneas y puntos.
            </div>
          ) : groupByType ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {polygons.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div
                    onClick={() => toggleGroupCollapse("polygon")}
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--color-info)",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: 0.85,
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "4px 0"
                    }}
                  >
                    {collapsedGroups.polygon ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    <input
                      type="checkbox"
                      checked={isGroupAllVisible(polygons)}
                      onChange={(e) => handleGroupVisibilityClick(polygons, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", width: "12px", height: "12px", margin: 0 }}
                      title="Mostrar/Ocultar todos los polígonos"
                    />
                    <span>POLÍGONOS ({polygons.length})</span>
                  </div>
                  {!collapsedGroups.polygon && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {rootPolygons.map(renderFeatureNode)}
                    </div>
                  )}
                </div>
              )}
              {lines.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div
                    onClick={() => toggleGroupCollapse("polyline")}
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--color-purple)",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: 0.85,
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "4px 0"
                    }}
                  >
                    {collapsedGroups.polyline ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    <input
                      type="checkbox"
                      checked={isGroupAllVisible(lines)}
                      onChange={(e) => handleGroupVisibilityClick(lines, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", width: "12px", height: "12px", margin: 0 }}
                      title="Mostrar/Ocultar todas las líneas"
                    />
                    <span>LÍNEAS ({lines.length})</span>
                  </div>
                  {!collapsedGroups.polyline && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {rootLines.map(renderFeatureNode)}
                    </div>
                  )}
                </div>
              )}
              {points.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div
                    onClick={() => toggleGroupCollapse("point")}
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--color-green)",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: 0.85,
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "4px 0"
                    }}
                  >
                    {collapsedGroups.point ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    <input
                      type="checkbox"
                      checked={isGroupAllVisible(points)}
                      onChange={(e) => handleGroupVisibilityClick(points, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", width: "12px", height: "12px", margin: 0 }}
                      title="Mostrar/Ocultar todos los Sitios de Trabajo"
                    />
                    <span>SITIOS DE TRABAJO ({points.length})</span>
                    {onOpenRangeReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRangeReport("all");
                        }}
                        style={{
                          background: "rgba(34, 197, 94, 0.08)",
                          border: "1px solid rgba(34, 197, 94, 0.2)",
                          borderRadius: "4px",
                          color: "var(--color-green)",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          padding: "2px 6px",
                          cursor: "pointer",
                          marginLeft: "auto",
                          transition: "all 0.2s ease",
                        }}
                        title="Ver bitácoras de todos los Sitios de Trabajo a la vez"
                      >
                        📅 Ver Bitácoras
                      </button>
                    )}
                  </div>
                  {!collapsedGroups.point && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {/* Contained groups */}
                      {Array.from(pointsByParent.entries())
                        .sort(([polyIdA], [polyIdB]) => {
                          const areaA = polygonAreas.get(polyIdA) ?? 0;
                          const areaB = polygonAreas.get(polyIdB) ?? 0;
                          return areaA - areaB; // Ascending: smallest parent area first
                        })
                        .map(([polyId, containedPoints]) => {
                          const parentPoly = polygons.find((p) => p.id === polyId);
                          return (
                            <div
                              key={polyId}
                              style={{
                                padding: "6px 8px",
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                borderRadius: "6px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  color: "var(--color-info)",
                                  opacity: 0.85,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                📁 Sector: {parentPoly?.title || "Sector"}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "5px",
                                  marginLeft: "6px",
                                  borderLeft: "1px dashed rgba(255, 255, 255, 0.1)",
                                  paddingLeft: "6px",
                                }}
                              >
                                {containedPoints.map((pt) => renderFeatureCard(pt))}
                              </div>
                            </div>
                          );
                        })}
                      {/* Root points */}
                      {rootPoints.map((pt) => renderFeatureCard(pt))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {drawnFeatures.map((f) => renderFeatureCard(f))}
            </div>
          )}
        </div>
      </div>

      {/* Herramientas de Datos */}
      <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "6px" }}>
        {onOpenRangeReport && (
          <button
            className="sim-btn"
            onClick={() => onOpenRangeReport("all")}
            style={{
              justifyContent: "center",
              gap: "6px",
              padding: "8px",
              fontSize: "0.75rem",
              width: "100%",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              color: "var(--color-green)",
              fontWeight: 600,
            }}
            title="Abrir bitácora general de todos los puntos"
          >
            <Calendar size={14} style={{ color: "var(--color-green)" }} />
            Abrir Bitácora General
          </button>
        )}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="sim-btn"
            onClick={onExportGeoJSON}
            style={{ flex: 1, justifyContent: "center", gap: "4px", padding: "6px", fontSize: "0.7rem" }}
          >
            <Download size={12} style={{ color: "var(--color-green)" }} />
            Exportar
          </button>
          <label
            className="sim-btn"
            style={{ flex: 1, justifyContent: "center", gap: "4px", padding: "6px", fontSize: "0.7rem", cursor: "pointer" }}
          >
            <Upload size={12} style={{ color: "var(--color-info)" }} />
            Importar
            <input type="file" accept=".geojson,.json" style={{ display: "none" }} onChange={handleFileChange} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
