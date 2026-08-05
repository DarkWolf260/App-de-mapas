import React, { useState, useRef, useEffect } from "react";
import { Shield, Flame, ChevronDown, Check } from "lucide-react";

const labelStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  marginBottom: "4px",
  display: "block",
};

interface DepartmentSelectProps {
  value: "pc" | "bomberos";
  onChange: (value: "pc" | "bomberos") => void;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isPC = value === "pc";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div>
      <span style={labelStyle}>Organismo / Departamento</span>
      <div style={{ position: "relative" }} ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            background: "rgba(10, 15, 29, 0.95)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "0.76rem",
            padding: "6px 10px",
            cursor: "pointer",
            boxSizing: "border-box",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isPC ? <Shield size={14} style={{ color: "var(--accent-orange)" }} /> : <Flame size={14} style={{ color: "#ef4444" }} />}
            {isPC ? "Protección Civil" : "Bomberos"}
          </span>
          <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }} />
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "rgba(10, 15, 29, 0.98)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              zIndex: 30,
              overflow: "hidden",
              boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange("pc");
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "left",
                padding: "9px 10px",
                background: isPC ? "rgba(249, 115, 22, 0.14)" : "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                color: isPC ? "var(--accent-orange)" : "#f8fafc",
                fontSize: "0.74rem",
                fontFamily: "'Outfit', sans-serif",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isPC) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isPC ? "rgba(249, 115, 22, 0.14)" : "transparent";
              }}
            >
              <Shield size={14} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Protección Civil (PC)</span>
              {isPC && <Check size={13} />}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("bomberos");
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "left",
                padding: "9px 10px",
                background: !isPC ? "rgba(239, 68, 68, 0.14)" : "transparent",
                border: "none",
                cursor: "pointer",
                color: !isPC ? "#ef4444" : "#f8fafc",
                fontSize: "0.74rem",
                fontFamily: "'Outfit', sans-serif",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (isPC) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !isPC ? "rgba(239, 68, 68, 0.14)" : "transparent";
              }}
            >
              <Flame size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Bomberos</span>
              {!isPC && <Check size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
