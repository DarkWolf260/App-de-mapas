import React, { useState, useEffect, useRef } from "react";
import type { Color } from "../utils/colorUtils";
import { PALETTE, hexToRgb } from "../utils/colorUtils";

export type { Color };
export { PALETTE, hexToRgb };

interface ColorPickerProps {
  activeColor: Color;
  onColorChange: (color: Color) => void;
  direction?: "top" | "bottom";
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ activeColor, onColorChange, direction = "top" }) => {
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
        <div className={"color-picker-popover" + (direction === "bottom" ? " opens-down" : "")}>
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
