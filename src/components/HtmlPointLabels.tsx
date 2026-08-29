import React, { useState, memo } from "react";
import type { HtmlLabel } from "../types";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  borderRight: string;
  borderBottom: string;
  borderTop: string;
  borderLeft: string;
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
      arrowStyle: {
        top: "0",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(45deg)",
        borderTop: borderStyle,
        borderLeft: borderStyle,
        borderRight: "none",
        borderBottom: "none",
      },
    };
  }
  if (lbl.placement === "right") {
    return {
      top: `${lbl.y}px`,
      left: `${lbl.x + 12}px`,
      transform: "translate(0, -50%)",
      arrowStyle: {
        top: "50%",
        left: "0",
        transform: "translate(-50%, -50%) rotate(45deg)",
        borderTop: "none",
        borderLeft: borderStyle,
        borderRight: "none",
        borderBottom: borderStyle,
      },
    };
  }
  if (lbl.placement === "left") {
    return {
      top: `${lbl.y}px`,
      left: `${lbl.x - 12}px`,
      transform: "translate(-100%, -50%)",
      arrowStyle: {
        top: "50%",
        right: "0",
        transform: "translate(50%, -50%) rotate(45deg)",
        borderTop: borderStyle,
        borderLeft: "none",
        borderRight: borderStyle,
        borderBottom: "none",
      },
    };
  }
  return {
    top: `${lbl.y - 12}px`,
    left: `${lbl.x}px`,
    transform: "translate(-50%, -100%)",
    arrowStyle: {
      bottom: "0",
      left: "50%",
      transform: "translate(-50%, 50%) rotate(45deg)",
      borderTop: "none",
      borderLeft: "none",
      borderRight: borderStyle,
      borderBottom: borderStyle,
    },
  };
}

interface HtmlPointLabelItemProps {
  lbl: HtmlLabel;
  isAuthenticated?: boolean;
  onSelectLabel?: (id: number | string) => void;
  expandedNotes: Record<string, boolean>;
  toggleExpanded: (key: string, e: React.MouseEvent) => void;
}

const HtmlPointLabelItem = memo<HtmlPointLabelItemProps>(
  ({ lbl, isAuthenticated, onSelectLabel, expandedNotes, toggleExpanded }) => {
    const borderStyle = `1px solid ${lbl.themeColor ? `${lbl.themeColor}90` : "rgba(56, 189, 248, 0.5)"}`;
    const { top, left, transform, arrowStyle } = computePlacement(lbl, borderStyle);
    const statusColor = lbl.hasArrived ? "#22c55e" : "#f97316";

    const titleKey = `title_${lbl.id}`;
    const isTitleExpanded = !!expandedNotes[titleKey];

    return (
      <div
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
          willChange: "transform, left, top",
          background: "rgba(10, 15, 29, 0.92)",
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
          <div
            style={{
              fontWeight: 800,
              fontSize: "11.5px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: "#ffffff",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 8px ${statusColor}`,
                  flexShrink: 0,
                  marginRight: "5px",
                  verticalAlign: "middle",
                }}
              />
              {lbl.title}
            </span>

            {/* Solo la flecha al lado del título si hay notas generales */}
            {lbl.activityNotes && lbl.activityNotes.length > 0 && !lbl.customActivities?.some((a) => !!a.description) && (
              <span
                onClick={(e) => toggleExpanded(titleKey, e)}
                style={{ cursor: "pointer", display: "inline-flex", color: "#c084fc", marginLeft: "2px" }}
                title={isTitleExpanded ? "Ocultar detalle" : "Ver detalle"}
              >
                {isTitleExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            )}
          </div>

          {/* Contenido Desplegable de Nota General */}
          {lbl.activityNotes &&
            lbl.activityNotes.length > 0 &&
            !lbl.customActivities?.some((a) => !!a.description) &&
            isTitleExpanded && (
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "9px",
                  color: "#f3e8ff",
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(168, 85, 247, 0.45)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  marginTop: "4px",
                  maxWidth: "220px",
                  whiteSpace: "normal",
                  lineHeight: "1.3",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                {lbl.activityNotes.join(" • ")}
              </div>
            )}

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

          {/* Insignias de equipos desplegados */}
          {isAuthenticated && lbl.teamNames && lbl.teamNames.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "3px",
                marginTop: "4px",
                fontSize: "8px",
                fontWeight: 700,
              }}
            >
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

          {/* Badges para Atenciones, Traslados y Actividades Personalizadas */}
          {(!!lbl.prehospitalCount ||
            !!lbl.transfersCount ||
            !!lbl.rescuedCount ||
            !!lbl.recoveredCount ||
            !!lbl.rescuedPetsCount ||
            (lbl.customActivities && lbl.customActivities.length > 0)) && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {!!lbl.rescuedCount && (
                  <span
                    style={{
                      color: "#4ade80",
                      background: "rgba(34,197,94,0.18)",
                      border: "1px solid rgba(34,197,94,0.35)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Resc. {lbl.rescuedCount}
                  </span>
                )}
                {!!lbl.recoveredCount && (
                  <span
                    style={{
                      color: "#38bdf8",
                      background: "rgba(56,189,248,0.18)",
                      border: "1px solid rgba(56,189,248,0.35)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Recup. {lbl.recoveredCount}
                  </span>
                )}
                {!!lbl.rescuedPetsCount && (
                  <span
                    style={{
                      color: "#f97316",
                      background: "rgba(249,115,22,0.18)",
                      border: "1px solid rgba(249,115,22,0.35)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Masc. {lbl.rescuedPetsCount}
                  </span>
                )}
                {!!lbl.prehospitalCount && (
                  <span
                    style={{
                      color: "#38bdf8",
                      background: "rgba(56,189,248,0.18)",
                      border: "1px solid rgba(56,189,248,0.35)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Atenc. {lbl.prehospitalCount}
                  </span>
                )}
                {!!lbl.transfersCount && (
                  <span
                    style={{
                      color: "#c084fc",
                      background: "rgba(168,85,247,0.18)",
                      border: "1px solid rgba(168,85,247,0.35)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Trasl. {lbl.transfersCount}
                  </span>
                )}
                {lbl.customActivities?.map((act) => {
                  const hasDesc = !!act.description?.trim();
                  const actKey = `act_${lbl.id}_${act.id || act.name}`;
                  const isActExpanded = !!expandedNotes[actKey];

                  return (
                    <span
                      key={act.id || act.name}
                      onClick={hasDesc ? (e) => toggleExpanded(actKey, e) : undefined}
                      style={{
                        color: "#c084fc",
                        background: "rgba(168,85,247,0.18)",
                        border: "1px solid rgba(168,85,247,0.35)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        cursor: hasDesc ? "pointer" : "default",
                      }}
                      title={hasDesc ? (isActExpanded ? "Ocultar detalle" : "Ver detalle") : undefined}
                    >
                      <span>
                        {act.name}: {act.value}
                      </span>

                      {hasDesc && (
                        <span style={{ display: "inline-flex", opacity: 0.85, marginLeft: "1px" }}>
                          {isActExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Contenido desplegable para actividades personalizadas */}
              {lbl.customActivities?.map((act) => {
                const hasDesc = !!act.description?.trim();
                const actKey = `act_${lbl.id}_${act.id || act.name}`;
                const isActExpanded = !!expandedNotes[actKey];

                if (!hasDesc || !isActExpanded) return null;

                return (
                  <div
                    key={`desc_${act.id || act.name}`}
                    style={{
                      fontWeight: 600,
                      fontSize: "9px",
                      color: "#f3e8ff",
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(168, 85, 247, 0.45)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      marginTop: "2px",
                      maxWidth: "220px",
                      whiteSpace: "normal",
                      lineHeight: "1.3",
                      textAlign: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                  >
                    {act.description}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            width: "8px",
            height: "8px",
            background: "rgba(10, 15, 29, 0.90)",
            ...arrowStyle,
          }}
        />
      </div>
    );
  }
);

HtmlPointLabelItem.displayName = "HtmlPointLabelItem";

export const HtmlPointLabels: React.FC<HtmlPointLabelsProps> = ({ labels, isAuthenticated, onSelectLabel }) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {[...labels]
        .sort((a, b) => b.y - a.y)
        .map((lbl) => (
          <HtmlPointLabelItem
            key={lbl.id}
            lbl={lbl}
            isAuthenticated={isAuthenticated}
            onSelectLabel={onSelectLabel}
            expandedNotes={expandedNotes}
            toggleExpanded={toggleExpanded}
          />
        ))}
    </>
  );
};
