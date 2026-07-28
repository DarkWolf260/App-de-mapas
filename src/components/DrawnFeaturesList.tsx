import React from "react";
import { ChevronDown, ChevronRight, Calendar, FolderOpen } from "lucide-react";
import type { DrawnFeature } from "../types";
import { FeatureCard } from "./FeatureCard";

import { Crosshair, Plus } from "lucide-react";

interface DrawnFeaturesListProps {
  drawnFeatures: DrawnFeature[];
  hiddenFeatures: Record<string, boolean>;
  rootPoints: DrawnFeature[];
  rootLines: DrawnFeature[];
  rootPolygons: DrawnFeature[];
  pointsByParent: Map<number, DrawnFeature[]>;
  childrenMap: Map<number, DrawnFeature[]>;
  polygonAreas: Map<number, number>;
  collapsedGroups: Record<string, boolean>;
  collapsedChildren: Record<number, boolean>;
  onToggleGroupCollapse: (type: string) => void;
  onToggleChildrenCollapse: (polyId: number) => void;
  onToggleFeatureVisibility: (id: number) => void;
  onToggleFeaturesVisibility: (ids: number[], visible: boolean) => void;
  onRenameFeature: (id: number, newTitle: string) => void;
  onDeleteFeature: (id: number) => void;
  onZoomToFeature: (feat: DrawnFeature) => void;
  onReorderFeature: (id: number, direction: "up" | "down") => void;
  onUpdateFeatureDescription: (id: number, newDesc: string) => void;
  onToggleFeatureLock: (id: number, locked: boolean) => void;
  onOpenRangeReport?: (feat: DrawnFeature | "all") => void;
  searchQuery?: string;
  onGoToCoords?: (lat: number, lon: number) => void;
  onCreatePointAtCoords?: (lat: number, lon: number) => void;
}

function parseCoords(input: string): { lat: number; lon: number } | null {
  const cleaned = input.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/[;,]/).map((s) => s.trim());
  let nums: number[];

  if (parts.length === 2) {
    nums = parts.map(Number);
    if (nums.some(isNaN)) return null;
  } else {
    const spaceParts = cleaned.split(" ");
    if (spaceParts.length >= 2) {
      nums = spaceParts.map(Number).filter((n) => !isNaN(n));
      if (nums.length < 2) return null;
    } else {
      return null;
    }
  }

  const [a, b] = nums;

  if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
    return { lat: a, lon: b };
  }
  if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
    return { lat: b, lon: a };
  }

  return null;
}

export const DrawnFeaturesList: React.FC<DrawnFeaturesListProps> = ({
  drawnFeatures,
  hiddenFeatures,
  rootPoints,
  rootLines,
  rootPolygons,
  pointsByParent,
  childrenMap,
  polygonAreas,
  collapsedGroups,
  collapsedChildren,
  onToggleGroupCollapse,
  onToggleChildrenCollapse,
  onToggleFeatureVisibility,
  onToggleFeaturesVisibility,
  onRenameFeature,
  onDeleteFeature,
  onZoomToFeature,
  onReorderFeature,
  onUpdateFeatureDescription,
  onToggleFeatureLock,
  onOpenRangeReport,
  searchQuery,
  onGoToCoords,
  onCreatePointAtCoords,
}) => {
  const [groupByType, setGroupByType] = React.useState(true);

  const isGroupAllVisible = (groupFeatures: DrawnFeature[]) => {
    if (groupFeatures.length === 0) return false;
    return groupFeatures.every((f) => !hiddenFeatures[String(f.id)]);
  };

  const handleGroupVisibilityClick = (groupFeatures: DrawnFeature[], e: React.SyntheticEvent) => {
    e.stopPropagation();
    const allVisible = isGroupAllVisible(groupFeatures);
    const ids = groupFeatures.map((f) => f.id);
    onToggleFeaturesVisibility(ids, !allVisible);
  };

  const renderFeatureCard = (
    feat: DrawnFeature,
    hasChildren = false,
    isCollapsed = false,
    onToggleChildren?: () => void,
    childrenCount = 0,
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
          hasChildren ? () => onToggleChildrenCollapse(feat.id) : undefined,
          polygonChildren.length,
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

  if (searchQuery && searchQuery.trim().length > 0) {
    const coords = parseCoords(searchQuery);
    const qLower = searchQuery.toLowerCase().trim();
    const matchedFeatures = drawnFeatures.filter(
      (f) => f.title?.toLowerCase().includes(qLower) || f.description?.toLowerCase().includes(qLower)
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", marginTop: "4px", minHeight: 0 }}>
        <div className="list-section-title" style={{ fontSize: "0.78rem", marginBottom: "8px" }}>
          Resultados de Búsqueda ({matchedFeatures.length})
        </div>
        <div className="scrollable-thin" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "4px" }}>
          {coords && (
            <div className="sidebar-coord-card">
              <div className="sidebar-coord-header">
                <Crosshair size={14} style={{ color: "rgba(56, 189, 248, 0.9)" }} />
                <span>Coordenadas: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</span>
              </div>
              <div className="sidebar-coord-actions">
                <button className="sidebar-coord-btn" onClick={() => onGoToCoords?.(coords.lat, coords.lon)}>
                  <Crosshair size={12} /> Ir al punto
                </button>
                <button className="sidebar-coord-btn accent" onClick={() => onCreatePointAtCoords?.(coords.lat, coords.lon)}>
                  <Plus size={12} /> Crear punto
                </button>
              </div>
            </div>
          )}

          {matchedFeatures.map((feat) => renderFeatureCard(feat))}

          {!coords && matchedFeatures.length === 0 && (
            <div className="sidebar-search-empty">
              No se encontraron elementos que coincidan con "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    );
  }

  const polygons = drawnFeatures.filter((f) => f.type === "polygon");
  const points = drawnFeatures.filter((f) => f.type === "point");
  const lines = drawnFeatures.filter((f) => f.type === "polyline");

  return (
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
              <GroupSection
                title="POLÍGONOS"
                count={polygons.length}
                color="var(--color-info)"
                collapsed={collapsedGroups.polygon}
                onToggle={() => onToggleGroupCollapse("polygon")}
                allVisible={isGroupAllVisible(polygons)}
                onToggleVisibility={(e) => handleGroupVisibilityClick(polygons, e)}
                visibilityTitle="Mostrar/Ocultar todos los polígonos"
              >
                {rootPolygons.map(renderFeatureNode)}
              </GroupSection>
            )}
            {lines.length > 0 && (
              <GroupSection
                title="LÍNEAS"
                count={lines.length}
                color="var(--color-purple)"
                collapsed={collapsedGroups.polyline}
                onToggle={() => onToggleGroupCollapse("polyline")}
                allVisible={isGroupAllVisible(lines)}
                onToggleVisibility={(e) => handleGroupVisibilityClick(lines, e)}
                visibilityTitle="Mostrar/Ocultar todas las líneas"
              >
                {rootLines.map(renderFeatureNode)}
              </GroupSection>
            )}
            {points.length > 0 && (
              <GroupSection
                title="SITIOS DE TRABAJO"
                count={points.length}
                color="var(--color-green)"
                collapsed={collapsedGroups.point}
                onToggle={() => onToggleGroupCollapse("point")}
                allVisible={isGroupAllVisible(points)}
                onToggleVisibility={(e) => handleGroupVisibilityClick(points, e)}
                visibilityTitle="Mostrar/Ocultar todos los Sitios de Trabajo"
                extra={
                  onOpenRangeReport && (
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
                      <Calendar size={11} /> Ver Bitácoras
                    </button>
                  )
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {Array.from(pointsByParent.entries())
                    .sort(([polyIdA], [polyIdB]) => {
                      const areaA = polygonAreas.get(polyIdA) ?? 0;
                      const areaB = polygonAreas.get(polyIdB) ?? 0;
                      return areaA - areaB;
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
                            <FolderOpen size={10} style={{ flexShrink: 0 }} /> Sector: {parentPoly?.title || "Sector"}
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
                  {rootPoints.map((pt) => renderFeatureCard(pt))}
                </div>
              </GroupSection>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {drawnFeatures.map((f) => renderFeatureCard(f))}
          </div>
        )}
      </div>
    </div>
  );
};

interface GroupSectionProps {
  title: string;
  count: number;
  color: string;
  collapsed: boolean;
  onToggle: () => void;
  allVisible: boolean;
  onToggleVisibility: (e: React.SyntheticEvent) => void;
  visibilityTitle: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  title,
  count,
  color,
  collapsed,
  onToggle,
  allVisible,
  onToggleVisibility,
  visibilityTitle,
  extra,
  children,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <div
      onClick={onToggle}
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color,
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: 0.85,
        cursor: "pointer",
        userSelect: "none",
        padding: "4px 0",
      }}
    >
      {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
      <input
        type="checkbox"
        checked={allVisible}
        onChange={onToggleVisibility}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: "pointer", width: "12px", height: "12px", margin: 0 }}
        title={visibilityTitle}
      />
      <span>{title} ({count})</span>
      {extra}
    </div>
    {!collapsed && (
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {children}
      </div>
    )}
  </div>
);
