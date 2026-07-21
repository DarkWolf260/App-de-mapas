import React from "react";
import type { HtmlLabel } from "../types";

interface HtmlPointLabelsProps {
  labels: HtmlLabel[];
}

interface ArrowStyle {
  bottom?: string;
  top?: string;
  left?: string;
  right?: string;
  transform: string;
  borderRight?: string;
  borderBottom?: string;
  borderTop?: string;
  borderLeft?: string;
}

interface Placement {
  top: string;
  left: string;
  transform: string;
  arrowStyle: ArrowStyle;
}

function computePlacement(lbl: HtmlLabel, borderStyle: string): Placement {
  if (lbl.placement === "bottom") {
    return {
      top: `${lbl.y + 12}px`,
      left: `${lbl.x}px`,
      transform: "translate(-50%, 0)",
      arrowStyle: { top: "0", left: "50%", transform: "translate(-50%, -50%) rotate(45deg)", borderTop: borderStyle, borderLeft: borderStyle },
    };
  }
  if (lbl.placement === "right") {
    return {
      top: `${lbl.y}px`,
      left: `${lbl.x + 12}px`,
      transform: "translate(0, -50%)",
      arrowStyle: { top: "50%", left: "0", transform: "translate(-50%, -50%) rotate(45deg)", borderBottom: borderStyle, borderLeft: borderStyle },
    };
  }
  if (lbl.placement === "left") {
    return {
      top: `${lbl.y}px`,
      left: `${lbl.x - 12}px`,
      transform: "translate(-100%, -50%)",
      arrowStyle: { top: "50%", right: "0", transform: "translate(50%, -50%) rotate(45deg)", borderTop: borderStyle, borderRight: borderStyle },
    };
  }
  return {
    top: `${lbl.y - 12}px`,
    left: `${lbl.x}px`,
    transform: "translate(-50%, -100%)",
    arrowStyle: { bottom: "0", left: "50%", transform: "translate(-50%, 50%) rotate(45deg)", borderRight: borderStyle, borderBottom: borderStyle },
  };
}

export const HtmlPointLabels: React.FC<HtmlPointLabelsProps> = ({ labels }) => (
  <>
    {labels.map((lbl) => {
      const borderStyle = `1px solid ${lbl.themeColor ? `${lbl.themeColor}80` : "rgba(56, 189, 248, 0.5)"}`;
      const { top, left, transform, arrowStyle } = computePlacement(lbl, borderStyle);

      return (
        <div
          key={lbl.id}
          style={{
            position: "absolute",
            left,
            top,
            transform,
            background: "rgba(10, 15, 29, 0.95)",
            border: borderStyle,
            color: "#f8fafc",
            padding: "5px 10px",
            borderRadius: "6px",
            fontFamily: "var(--font-sans)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            zIndex: 2,
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "11px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: lbl.hasArrived ? "#22c55e" : "#f97316",
                  boxShadow: lbl.hasArrived ? "0 0 6px #22c55e" : "0 0 6px #f97316",
                }}
              />
              {lbl.title}
            </div>
            <div style={{ fontWeight: 500, fontSize: "9px", opacity: 0.85 }}>{lbl.info}</div>
          </div>
          <div style={{ position: "absolute", width: "8px", height: "8px", background: "rgba(10, 15, 29, 0.95)", ...arrowStyle }} />
        </div>
      );
    })}
  </>
);
