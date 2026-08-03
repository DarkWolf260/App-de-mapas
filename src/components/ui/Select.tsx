import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
  group?: string;
  groupColor?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: CSSProperties;
  menuMaxHeight?: number;
}

export default function Select({
  options,
  value,
  onChange,
  icon,
  placeholder,
  disabled,
  compact,
  style,
  menuMaxHeight = 260,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div style={{ position: "relative", ...style }} ref={ref}>
      <button
        type="button"
        disabled={disabled}
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
          fontSize: compact ? "0.68rem" : "0.76rem",
          padding: compact ? "3px 8px" : "7px 10px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          boxSizing: "border-box",
          fontFamily: "'Outfit', sans-serif",
          outline: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
          {icon}
          {selected?.icon}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: selected?.color || "#f1f5f9",
              fontWeight: selected?.color ? 600 : 400,
            }}
          >
            {selected ? selected.label : placeholder || "Seleccionar…"}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
            flexShrink: 0,
          }}
        />
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
            zIndex: 60,
            overflow: "auto",
            maxHeight: menuMaxHeight,
            boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
          }}
        >
          {options.map((opt, idx) => {
            const isGroupHeader = opt.group && (idx === 0 || opt.group !== options[idx - 1].group);
            return (
              <div key={opt.value}>
                {isGroupHeader && (
                  <div
                    style={{
                      padding: "7px 10px 3px",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: opt.groupColor || "var(--text-muted)",
                    }}
                  >
                    {opt.group}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    background: opt.value === value ? "rgba(249, 115, 22, 0.14)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    color: opt.color || "#f8fafc",
                    fontSize: compact ? "0.66rem" : "0.74rem",
                    fontFamily: "'Outfit', sans-serif",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={(e) => {
                    if (opt.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = opt.value === value ? "rgba(249, 115, 22, 0.14)" : "transparent";
                  }}
                >
                  {opt.icon}
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {opt.value === value && <Check size={13} style={{ flexShrink: 0 }} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
