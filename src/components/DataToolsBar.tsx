import React, { ChangeEvent } from "react";
import { Download, Upload, Calendar } from "lucide-react";

interface DataToolsBarProps {
  onExportGeoJSON: () => void;
  onImportGeoJSON: (text: string) => void;
  onOpenRangeReport?: () => void;
}

export const DataToolsBar: React.FC<DataToolsBarProps> = ({
  onExportGeoJSON,
  onImportGeoJSON,
  onOpenRangeReport,
}) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) onImportGeoJSON(event.target.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "6px" }}>
      {onOpenRangeReport && (
        <button
          className="sim-btn"
          onClick={onOpenRangeReport}
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
  );
};
