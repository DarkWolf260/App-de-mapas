import React from "react";
import type { DrawnFeature } from "../types";
import { Activity, Square, MapPin, Maximize2, Trash2, Lock, Unlock, ChevronUp, ChevronDown, ChevronRight, Calendar } from "lucide-react";

interface FeatureCardProps {
  feat: DrawnFeature;
  hiddenFeatures: Record<number, boolean>;
  onToggleFeatureVisibility: (id: number) => void;
  onRenameFeature: (id: number, newTitle: string) => void;
  onUpdateFeatureDescription: (id: number, newDesc: string) => void;
  onReorderFeature: (id: number, direction: "up" | "down") => void;
  onZoomToFeature: (feat: DrawnFeature) => void;
  onDeleteFeature: (id: number) => void;
  onToggleFeatureLock: (id: number, locked: boolean) => void;
  onOpenRangeReport?: (feat: DrawnFeature) => void;
  hasChildren?: boolean;
  isChildrenCollapsed?: boolean;
  onToggleChildren?: () => void;
  childrenCount?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  feat,
  hiddenFeatures,
  onToggleFeatureVisibility,
  onRenameFeature,
  onUpdateFeatureDescription,
  onReorderFeature,
  onZoomToFeature,
  onDeleteFeature,
  onToggleFeatureLock,
  onOpenRangeReport,
  hasChildren,
  isChildrenCollapsed,
  onToggleChildren,
  childrenCount,
}) => {
  const isHidden = hiddenFeatures[feat.id];

  return (
    <div
      className="incident-card"
      style={{
        borderLeftColor:
          feat.type === "polygon"
            ? "var(--color-info)"
            : feat.type === "polyline"
            ? "var(--color-purple)"
            : "var(--color-green)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <input
          type="checkbox"
          checked={!isHidden}
          onChange={() => onToggleFeatureVisibility(feat.id)}
          style={{ cursor: "pointer", width: "12px", height: "12px", margin: 0 }}
          title="Mostrar/Ocultar elemento"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFeatureLock(feat.id, !feat.locked);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: feat.locked ? "var(--color-high)" : "var(--text-muted)",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
          title={feat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
        >
          {feat.locked ? <Lock size={12} /> : <Unlock size={12} style={{ opacity: 0.4 }} />}
        </button>
        {feat.type === "polygon" ? (
          <Square size={13} style={{ color: "var(--color-info)" }} />
        ) : feat.type === "polyline" ? (
          <Activity size={13} style={{ color: "var(--color-purple)" }} />
        ) : (
          <MapPin size={13} style={{ color: "var(--color-green)" }} />
        )}
        <input
          type="text"
          value={feat.title}
          onChange={(e) => onRenameFeature(feat.id, e.target.value)}
          className="form-input"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px dashed var(--border-subtle)",
            padding: "1px 2px",
            color: "var(--text-main)",
            fontWeight: 600,
            fontSize: "0.78rem",
            width: "100%",
            opacity: isHidden ? 0.5 : 1,
            cursor: "text",
          }}
          title="Haz clic para renombrar"
        />
      </div>
      
      {feat.type === "point" && feat.geojsonGeometry?.coordinates && (
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "19px", marginTop: "-3px" }}>
          Lat: {(feat.geojsonGeometry.coordinates as number[])[1]?.toFixed(5)}, Lon: {(feat.geojsonGeometry.coordinates as number[])[0]?.toFixed(5)}
        </div>
      )}
      
      {feat.type !== "point" && (
        <textarea
          placeholder="Notas o información del elemento..."
          value={feat.description || ""}
          onChange={(e) => onUpdateFeatureDescription(feat.id, e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "6px",
            padding: "4px 6px",
            color: "var(--text-muted)",
            fontSize: "0.68rem",
            width: "100%",
            resize: "none",
            height: "36px",
            marginTop: "2px",
            fontFamily: "inherit",
            opacity: isHidden ? 0.4 : 0.8,
            cursor: "text",
          }}
        />
      )}

      
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "2px" }}>
        <button
          onClick={() => onReorderFeature(feat.id, "up")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.65rem",
            display: "flex",
            alignItems: "center",
            gap: "1px",
          }}
          title="Subir orden (traer al frente)"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "1px" }}><ChevronUp size={11} /> Subir</span>
        </button>
        <button
          onClick={() => onReorderFeature(feat.id, "down")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.65rem",
            display: "flex",
            alignItems: "center",
            gap: "1px",
          }}
          title="Bajar orden (llevar al fondo)"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "1px" }}><ChevronDown size={11} /> Bajar</span>
        </button>
        {onOpenRangeReport && (
          <button
            onClick={() => onOpenRangeReport(feat)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-green)",
              cursor: "pointer",
              fontSize: "0.68rem",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontWeight: 600
            }}
            title="Ver bitácora del 24 a hoy"
          >
            <Calendar size={11} /> Rango (24-Hoy)
          </button>
        )}
        {feat.type === "polygon" && hasChildren && onToggleChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleChildren();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-info)",
              cursor: "pointer",
              fontSize: "0.68rem",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontWeight: 600,
            }}
            title={isChildrenCollapsed ? "Mostrar elementos contenidos" : "Ocultar elementos contenidos"}
          >
            {isChildrenCollapsed ? <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><ChevronRight size={11} /> Contenidos ({childrenCount})</span> : <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><ChevronDown size={11} /> Contenidos ({childrenCount})</span>}
          </button>
        )}
        <button
          onClick={() => onZoomToFeature(feat)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-info)",
            cursor: "pointer",
            fontSize: "0.68rem",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Maximize2 size={11} /> Enfocar
        </button>
        <button
          onClick={() => onDeleteFeature(feat.id)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-high)",
            cursor: "pointer",
            fontSize: "0.68rem",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Trash2 size={11} /> Eliminar
        </button>
      </div>
    </div>
  );
};
