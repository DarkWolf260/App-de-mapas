import React from "react";
import type { HtmlLabel } from "../types";

interface HtmlPointLabelsProps {
  labels: HtmlLabel[];
  isAuthenticated?: boolean;
  onSelectLabel?: (id: number | string) => void;
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

export const HtmlPointLabels: React.FC<HtmlPointLabelsProps> = ({ labels, isAuthenticated, onSelectLabel }) => (
  <>
    {[...labels].sort((a, b) => b.y - a.y).map((lbl) => {
      const borderStyle = `1px solid ${lbl.themeColor ? `${lbl.themeColor}90` : "rgba(56, 189, 248, 0.5)"}`;
      const { top, left, transform, arrowStyle } = computePlacement(lbl, borderStyle);
      const statusColor = lbl.hasArrived ? "#22c55e" : "#f97316";

      return (
        <div
          key={lbl.id}
          className="html-point-label"
          onClick={(e) => {
            e.stopPropagation();
            onSelectLabel?.(lbl.id);
          }}
          style={{
            position: "absolute",
            left,
            top,
            transform,
            background: "rgba(10, 15, 29, 0.90)",
            border: borderStyle,
            color: "#f8fafc",
            padding: "6px 11px",
            borderRadius: "8px",
            fontFamily: "var(--font-sans)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            pointerEvents: "auto",
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
            zIndex: 2,
            whiteSpace: "nowrap",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 8px ${statusColor}`,
                  flexShrink: 0,
                }}
              />
              {lbl.title}
            </div>

            {!!lbl.info && (
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "9px",
                  color: "#cbd5e1",
                  background: "rgba(255, 255, 255, 0.06)",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  marginTop: "3px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {lbl.info}
              </div>
            )}

            {/* Insignias de equipos desplegados — solo visible para personal autenticado */}
            {isAuthenticated && lbl.teamNames && lbl.teamNames.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "4px", fontSize: "8px", fontWeight: 700 }}>
                {lbl.teamNames.slice(0, 3).map((name, i) => (
                  <span
                    key={i}
                    style={{
                      color: "#94a3b8",
                      background: "rgba(148,163,184,0.15)",
                      border: "1px solid rgba(148,163,184,0.30)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    {name}
                  </span>
                ))}
                {lbl.teamNames.length > 3 && (
                  <span
                    style={{
                      color: "#cbd5e1",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    ... {lbl.teamNames.length - 3} más
                  </span>
                )}
              </div>
            )}

            {/* Badges para Atenciones y Traslados / Rescates */}
            {(!!lbl.prehospitalCount || !!lbl.transfersCount || !!lbl.rescuedCount || !!lbl.recoveredCount || !!lbl.rescuedPetsCount) && (
              <div style={{ display: "flex", gap: "4px", marginTop: "4px", fontSize: "8.5px", fontWeight: 700 }}>
                {!!lbl.rescuedCount && (
                  <span style={{ color: "#4ade80", background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)", padding: "1px 5px", borderRadius: "4px" }}>
                    Resc. {lbl.rescuedCount}
                  </span>
                )}
                {!!lbl.recoveredCount && (
                  <span style={{ color: "#38bdf8", background: "rgba(56,189,248,0.18)", border: "1px solid rgba(56,189,248,0.35)", padding: "1px 5px", borderRadius: "4px" }}>
                    Recup. {lbl.recoveredCount}
                  </span>
                )}
                {!!lbl.rescuedPetsCount && (
                  <span style={{ color: "#f97316", background: "rgba(249,115,22,0.18)", border: "1px solid rgba(249,115,22,0.35)", padding: "1px 5px", borderRadius: "4px" }}>
                    Masc. {lbl.rescuedPetsCount}
                  </span>
                )}
                {!!lbl.prehospitalCount && (
                  <span style={{ color: "#38bdf8", background: "rgba(56,189,248,0.18)", border: "1px solid rgba(56,189,248,0.35)", padding: "1px 5px", borderRadius: "4px" }}>
                    Atenc. {lbl.prehospitalCount}
                  </span>
                )}
                {!!lbl.transfersCount && (
                  <span style={{ color: "#c084fc", background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", padding: "1px 5px", borderRadius: "4px" }}>
                    Trasl. {lbl.transfersCount}
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ position: "absolute", width: "8px", height: "8px", background: "rgba(10, 15, 29, 0.90)", ...arrowStyle }} />
        </div>
      );
    })}
  </>
);
