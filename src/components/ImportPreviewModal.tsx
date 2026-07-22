import React, { useState } from "react";
import { X, MapPin, Activity, Square, AlertTriangle, Check, Upload } from "lucide-react";
import type { ParsedFeature } from "../hooks/useGeoJSONIO";

interface ImportPreviewModalProps {
  features: ParsedFeature[];
  onImport: (features: ParsedFeature[]) => void;
  onClose: () => void;
}

const getTypeIcon = (type: ParsedFeature["type"], color: string) => {
  const style = { color: color || "var(--color-info)", flexShrink: 0 };
  switch (type) {
    case "point": return <MapPin size={13} style={style} />;
    case "polyline": return <Activity size={13} style={style} />;
    case "polygon": return <Square size={13} style={style} />;
  }
};

const getTypeText = (type: ParsedFeature["type"]) => {
  switch (type) {
    case "point": return "Punto";
    case "polyline": return "Línea";
    case "polygon": return "Polígono";
  }
};

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  features,
  onImport,
  onClose,
}) => {
  const [items, setItems] = useState(features);

  const duplicates = items.filter((f) => f.isDuplicate).length;
  const selected = items.filter((f) => f.selected && !f.isDuplicate).length;

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((f) => (f.index === index && !f.isDuplicate ? { ...f, selected: !f.selected } : f))
    );
  };

  const toggleAll = () => {
    const nonDupes = items.filter((f) => !f.isDuplicate);
    const allSelected = nonDupes.every((f) => f.selected);
    setItems((prev) => prev.map((f) => (f.isDuplicate ? f : { ...f, selected: !allSelected })));
  };

  const handleImport = () => {
    onImport(items);
  };

  const allNonDupeSelected = items.filter((f) => !f.isDuplicate).every((f) => f.selected);

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal ip-modal">
        <div className="rr-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload size={16} style={{ color: "var(--color-info)" }} />
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Previsualizar importación</span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "4px 0 0 24px" }}>
              {items.length} elemento(s) encontrado(s)
              {duplicates > 0 && <> · <span style={{ color: "#f87171" }}>{duplicates} duplicado(s)</span></>}
            </p>
          </div>
          <button className="rr-close-btn" onClick={onClose} title="Cerrar">
            <X size={15} />
          </button>
        </div>

        <div className="ip-select-bar">
          <label className="ip-select-all">
            <input
              type="checkbox"
              checked={allNonDupeSelected}
              onChange={toggleAll}
            />
            <span>Seleccionar todos</span>
          </label>
        </div>

        <div className="ip-list scrollable-thin">
          {items.map((feat) => (
            <div
              key={feat.index}
              className={`ip-item ${feat.isDuplicate ? "duplicate" : ""}`}
            >
              <div className="ip-item-left">
                <input
                  type="checkbox"
                  checked={feat.selected}
                  disabled={feat.isDuplicate}
                  onChange={() => toggleItem(feat.index)}
                />
                {getTypeIcon(feat.type, feat.color)}
                <span className="ip-item-title">{feat.title}</span>
              </div>
              <div className="ip-item-right">
                <span className="ip-item-type">{getTypeText(feat.type)}</span>
                {feat.isDuplicate ? (
                  <span className="ip-badge dup">
                    <AlertTriangle size={10} />
                    Duplicado
                  </span>
                ) : (
                  <span className="ip-badge ok">
                    <Check size={10} />
                    Nuevo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rr-footer">
          <button className="sim-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="sim-btn ip-import-btn"
            onClick={handleImport}
            disabled={selected === 0}
          >
            <Upload size={12} />
            Importar {selected > 0 ? `(${selected})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};
