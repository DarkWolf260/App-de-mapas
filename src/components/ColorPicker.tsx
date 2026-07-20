import React, { useState, useEffect, useRef } from "react";

export interface Color {
  name?: string;
  hex: string;
  rgb: [number, number, number];
}

export const PALETTE: Color[] = [
  // Reds
  { name: "Rojo oscuro", hex: "#991b1b", rgb: [153, 27, 27] },
  { name: "Rojo", hex: "#ef4444", rgb: [239, 68, 68] },
  { name: "Rojo claro", hex: "#fca5a5", rgb: [252, 165, 165] },
  // Naranjas
  { name: "Marron", hex: "#92400e", rgb: [146, 64, 14] },
  { name: "Naranja", hex: "#fb923c", rgb: [251, 146, 60] },
  { name: "Melocoton", hex: "#fed7aa", rgb: [254, 215, 170] },
  // Amarillos
  { name: "Ocre", hex: "#854d0e", rgb: [133, 77, 14] },
  { name: "Amarillo", hex: "#facc15", rgb: [250, 204, 21] },
  { name: "Crema", hex: "#fef9c3", rgb: [254, 249, 195] },
  // Verdes
  { name: "Verde oscuro", hex: "#14532d", rgb: [20, 83, 45] },
  { name: "Verde", hex: "#22c55e", rgb: [34, 197, 94] },
  { name: "Menta", hex: "#86efac", rgb: [134, 239, 172] },
  // Cyan / Teal
  { name: "Teal oscuro", hex: "#134e4a", rgb: [19, 78, 74] },
  { name: "Teal", hex: "#14b8a6", rgb: [20, 184, 166] },
  { name: "Aguamarina", hex: "#99f6e4", rgb: [153, 246, 228] },
  // Azules
  { name: "Azul marino", hex: "#1e3a5f", rgb: [30, 58, 95] },
  { name: "Azul", hex: "#3b82f6", rgb: [59, 130, 246] },
  { name: "Cian claro", hex: "#7dd3fc", rgb: [125, 211, 252] },
  { name: "Cian", hex: "#38bdf8", rgb: [56, 189, 248] },
  { name: "Azul cielo", hex: "#bae6fd", rgb: [186, 230, 253] },
  // Violetas
  { name: "Indigo", hex: "#312e81", rgb: [49, 46, 129] },
  { name: "Violeta", hex: "#8b5cf6", rgb: [139, 92, 246] },
  { name: "Lavanda", hex: "#c4b5fd", rgb: [196, 181, 253] },
  // Rosas / Magentas
  { name: "Magenta", hex: "#86198f", rgb: [134, 25, 143] },
  { name: "Rosa", hex: "#ec4899", rgb: [236, 72, 153] },
  { name: "Rosa claro", hex: "#f9a8d4", rgb: [249, 168, 212] },
  // Neutros
  { name: "Negro", hex: "#111827", rgb: [17, 24, 39] },
  { name: "Gris oscuro", hex: "#374151", rgb: [55, 65, 81] },
  { name: "Gris", hex: "#6b7280", rgb: [107, 114, 128] },
  { name: "Gris claro", hex: "#9ca3af", rgb: [156, 163, 175] },
  { name: "Plata", hex: "#d1d5db", rgb: [209, 213, 219] },
  { name: "Blanco", hex: "#f9fafb", rgb: [249, 250, 251] },
  // Especiales
  { name: "Dorado", hex: "#d97706", rgb: [217, 119, 6] },
  { name: "Bronce", hex: "#b45309", rgb: [180, 83, 9] },
  { name: "Salmon", hex: "#f87171", rgb: [248, 113, 113] },
];

export const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

interface ColorPickerProps {
  activeColor: Color;
  onColorChange: (color: Color) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ activeColor, onColorChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (hex: string) => {
    onColorChange({ hex, rgb: hexToRgb(hex) });
  };

  const pickCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorChange({ hex: e.target.value, rgb: hexToRgb(e.target.value) });
  };

  return (
    <div className="color-picker-wrapper" ref={wrapperRef}>
      <button
        className="draw-tool-btn color-trigger"
        title="Color"
        onClick={() => setOpen((v) => !v)}
        style={{ borderColor: activeColor.hex }}
      >
        <span className="color-trigger-swatch" style={{ background: activeColor.hex }} />
        <span className="draw-tool-label">Color</span>
      </button>

      {open && (
        <div className="color-picker-popover">
          <div className="color-grid">
            <label
              className="color-grid-cell custom-color-cell"
              title="Color personalizado"
              style={{
                background: "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
                display: "block",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <input
                type="color"
                value={activeColor.hex}
                onChange={pickCustom}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </label>

            {PALETTE.map((c) => (
              <button
                key={c.hex}
                className={"color-grid-cell" + (activeColor.hex === c.hex ? " selected" : "")}
                style={{ background: c.hex }}
                title={c.name}
                onClick={() => pick(c.hex)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
