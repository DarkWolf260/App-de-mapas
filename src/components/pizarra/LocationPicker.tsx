import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Check, X } from "lucide-react";
import type { DrawnFeature } from "../../types";

const labelStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  marginBottom: "4px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0, 0, 0, 0.35)",
  border: "1px solid var(--border-color)",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "0.76rem",
  padding: "6px 10px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Outfit', sans-serif",
};

interface LocationPickerProps {
  features: DrawnFeature[];
  selectedFeatureId: number | string | "";
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: number | string, title: string) => void;
  onClear: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  features,
  selectedFeatureId,
  search,
  onSearchChange,
  onSelect,
  onClear,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredFeatures = features.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <span style={labelStyle}>Ubicación / Punto de Control</span>
      <div style={{ position: "relative" }} ref={ref}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar ubicación..."
            style={{ ...inputStyle, paddingLeft: "30px", paddingRight: "28px" }}
          />
          {search !== "" && (
            <button
              type="button"
              onClick={onClear}
              title="Limpiar búsqueda"
              style={{
                position: "absolute",
                right: 7,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              maxHeight: "220px",
              overflowY: "auto",
              background: "rgba(10, 15, 29, 0.98)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              zIndex: 30,
              boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
            }}
          >
            {filteredFeatures.length === 0 ? (
              <div style={{ padding: "14px", color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "center" }}>
                No se encontraron ubicaciones
              </div>
            ) : (
              filteredFeatures.map((f) => {
                const selected = f.id === selectedFeatureId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onSelect(f.id, f.title);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      background: selected ? "rgba(249, 115, 22, 0.14)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      color: selected ? "var(--accent-orange)" : "#f8fafc",
                      fontSize: "0.74rem",
                      fontFamily: "'Outfit', sans-serif",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected ? "rgba(249, 115, 22, 0.14)" : "transparent";
                    }}
                  >
                    <MapPin size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span>
                    {selected && <Check size={13} />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
