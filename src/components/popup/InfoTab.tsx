import React, { useState, useMemo } from "react";
import { Copy, Check, Edit3, Users, Activity, Dog, AlertTriangle } from "lucide-react";
import type { DrawnFeature, DailyLog } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { getNormalizedGroupList } from "../../utils/logUtils";
import { labelStyle } from "./popupStyles";

interface InfoTabProps {
  activeFeat: DrawnFeature;
  dailyLog: Partial<DailyLog> | undefined;
  onEdit: () => void;
  drawnFeatures: DrawnFeature[];
  popupEditDate: string;
  isAdmin?: boolean;
  canToggleArrival?: boolean;
  onToggleArrivalGroup?: (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => Promise<void>;
}

const readRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "2px 0",
};

const readLabelStyle: React.CSSProperties = {
  fontSize: "0.6rem",
  color: "var(--text-muted)",
};

const readValueStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  color: "var(--text-main)",
  fontWeight: 600,
  textAlign: "right",
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.04)",
  borderRadius: "8px",
  padding: "6px 8px",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

function ReadRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={readRowStyle}>
      <span style={readLabelStyle}>{label}</span>
      <span style={readValueStyle}>{value || "—"}</span>
    </div>
  );
}

function formatCoordinates(feat: DrawnFeature): string {
  const geom = feat.geojsonGeometry;
  if (!geom) return "Sin coordenadas";

  if (feat.type === "point" && Array.isArray(geom.coordinates)) {
    const [lon, lat] = geom.coordinates as number[];
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  if (feat.type === "polyline" && Array.isArray(geom.coordinates)) {
    const coords = geom.coordinates as number[][];
    if (coords.length > 0) {
      const [lon, lat] = coords[0];
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  if (feat.type === "polygon" && Array.isArray(geom.coordinates)) {
    const rings = geom.coordinates as number[][][];
    if (rings.length > 0 && rings[0].length > 0) {
      const [lon, lat] = rings[0][0];
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  return "Sin coordenadas";
}

function getCoordLabel(feat: DrawnFeature): string {
  if (feat.type === "point") return "Ubicación";
  if (feat.type === "polyline") return "Punto inicial";
  if (feat.type === "polygon") return "Primer vértice";
  return "Coordenadas";
}

export const InfoTab: React.FC<InfoTabProps> = ({
  activeFeat, dailyLog, onEdit, drawnFeatures, popupEditDate, isAdmin = false, canToggleArrival = false, onToggleArrivalGroup,
}) => {
  const showArrivalCheckbox = isAdmin || canToggleArrival;
  const [copied, setCopied] = useState(false);
  const coords = formatCoordinates(activeFeat);
  const isPolygon = activeFeat.type === "polygon";

  const containedPoints = useMemo(() => {
    if (!isPolygon) return [];
    const polyCoords = activeFeat.geojsonGeometry?.coordinates as number[][][];
    if (!polyCoords || !polyCoords[0]) return [];
    const vs = polyCoords[0];

    return drawnFeatures.filter((f) => {
      if (f.type !== "point") return false;
      const ptCoords = f.geojsonGeometry?.coordinates as number[];
      if (!ptCoords) return false;
      return isPointInPolygon(ptCoords[0], ptCoords[1], vs);
    });
  }, [isPolygon, activeFeat, drawnFeatures]);

  const containedWithLogs = useMemo(() => {
    return containedPoints.map((pt) => {
      const log = pt.dailyLogs?.find((l) => l.date === popupEditDate) || {} as Partial<DailyLog>;
      return { point: pt, log };
    });
  }, [containedPoints, popupEditDate]);

  const polygonOwnLog: Partial<DailyLog> = useMemo(() => {
    if (!isPolygon) return {};
    return dailyLog || {};
  }, [isPolygon, dailyLog]);

  const polygonGroups = useMemo(() => {
    if (!isPolygon) return [];
    return getNormalizedGroupList(polygonOwnLog);
  }, [isPolygon, polygonOwnLog]);

  const aggregatedLog = useMemo(() => {
    if (!isPolygon) return dailyLog || {};

    let rescuedCount = 0;
    let recoveredCount = 0;
    let rescuedPetsCount = 0;
    let prehospitalCareCount = 0;
    let transfersCount = 0;

    const addLogMetrics = (l: Partial<DailyLog>) => {
      const gList = getNormalizedGroupList(l);
      const seenComms = new Set<string>();

      for (const g of gList) {
        const cid = g.commissionId || "independiente";
        if (cid !== "independiente") {
          if (seenComms.has(cid)) continue;
          seenComms.add(cid);
        }
        rescuedCount += parseInt(g.rescuedCount || "0", 10) || 0;
        recoveredCount += parseInt(g.recoveredCount || "0", 10) || 0;
        rescuedPetsCount += parseInt(g.rescuedPetsCount || "0", 10) || 0;
        prehospitalCareCount += parseInt(g.prehospitalCareCount || "0", 10) || 0;
        transfersCount += parseInt(g.transfersCount || "0", 10) || 0;
      }

      if (gList.length === 0) {
        rescuedCount += parseInt(l.rescuedCount || "0", 10) || 0;
        recoveredCount += parseInt(l.recoveredCount || "0", 10) || 0;
        rescuedPetsCount += parseInt(l.rescuedPetsCount || "0", 10) || 0;
        prehospitalCareCount += parseInt(l.prehospitalCareCount || "0", 10) || 0;
        transfersCount += parseInt(l.transfersCount || "0", 10) || 0;
      }
    };

    // 1. Sumar métricas de todos los grupos y campos del polígono directamente
    addLogMetrics(polygonOwnLog);

    // 2. Sumar métricas de puntos contenidos dentro del polígono
    let observations = polygonOwnLog.observations ? `Polígono: ${polygonOwnLog.observations}` : "";

    for (const { point, log } of containedWithLogs) {
      addLogMetrics(log);

      if (log.observations) {
        observations += (observations ? "\n" : "") + `${point.title}: ${log.observations}`;
      }
    }

    const hasAnyLog = rescuedCount > 0 || recoveredCount > 0 || rescuedPetsCount > 0 || prehospitalCareCount > 0 || transfersCount > 0;

    return {
      ...polygonOwnLog,
      rescuedCount: rescuedCount > 0 ? String(rescuedCount) : undefined,
      recoveredCount: recoveredCount > 0 ? String(recoveredCount) : undefined,
      rescuedPetsCount: rescuedPetsCount > 0 ? String(rescuedPetsCount) : undefined,
      prehospitalCareCount: prehospitalCareCount > 0 ? String(prehospitalCareCount) : undefined,
      transfersCount: transfersCount > 0 ? String(transfersCount) : undefined,
      observations: observations || undefined,
      _hasData: hasAnyLog || containedWithLogs.length > 0 || polygonGroups.length > 0,
    } as Partial<DailyLog> & { _hasData?: boolean };
  }, [isPolygon, dailyLog, containedWithLogs, polygonOwnLog, polygonGroups]);

  const log = isPolygon ? aggregatedLog : (dailyLog || {});

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = coords;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasPolygonManualLog = isPolygon && (
    Number(polygonOwnLog.rescuedCount || 0) > 0 ||
    Number(polygonOwnLog.recoveredCount || 0) > 0 ||
    Number(polygonOwnLog.prehospitalCareCount || 0) > 0 ||
    Number(polygonOwnLog.transfersCount || 0) > 0 ||
    Number(polygonOwnLog.rescuedPetsCount || 0) > 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Badge de Edificio Colapsado — solo para puntos */}
      {!isPolygon && activeFeat.isCollapsed && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.14)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "6px",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#f87171",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          <span>Estructura Colapsada</span>
          <span
            style={{
              background: "#ef4444",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "0.68rem",
              fontWeight: 800,
            }}
          >
            Cantidad: {activeFeat.collapsedCount || "1"}
          </span>
        </div>
      )}

      {/* Coordenadas — solo para puntos */}
      {!isPolygon && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>{getCoordLabel(activeFeat)}</label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontSize: "0.72rem",
              color: "var(--color-info)",
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
              flex: 1,
            }}>
              {coords}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "#22c55e" : "rgba(255, 255, 255, 0.08)",
                border: "1px solid " + (copied ? "#22c55e" : "var(--border-subtle)"),
                borderRadius: "4px",
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                transition: "all 0.2s ease",
              }}
              title={copied ? "¡Copiado!" : "Copiar coordenadas"}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {/* Polígono: puntos contenidos con estadísticas */}
      {isPolygon && (
        <>
          {containedWithLogs.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span>Puntos con reporte ({containedWithLogs.filter(({ log }) => {
                  const rc = String(log.rescuedCount || "").trim();
                  const rr = String(log.recoveredCount || "").trim();
                  const ph = String(log.prehospitalCareCount || "").trim();
                  const tr = String(log.transfersCount || "").trim();
                  const rp = String(log.rescuedPetsCount || "").trim();
                  return (rc && rc !== "0") || (rr && rr !== "0") || (ph && ph !== "0") || (tr && tr !== "0") || (rp && rp !== "0");
                }).length})</span>
                <span style={{ fontWeight: 400, fontSize: "0.5rem", color: "var(--text-muted)", textAlign: "right" }}>
                  <span style={{ color: "var(--color-green)" }}>Resc</span> | <span style={{ color: "var(--color-info)" }}>Recup</span> | <span style={{ color: "#38bdf8" }}>Atenc</span> | <span style={{ color: "var(--color-purple)" }}>Trasl</span> | <span style={{ color: "#a855f7" }}>Masc</span>
                </span>
              </div>
              {containedWithLogs.map(({ point, log }) => {
                const rc = String(log.rescuedCount || "0").trim();
                const rr = String(log.recoveredCount || "0").trim();
                const ph = String(log.prehospitalCareCount || "0").trim();
                const tr = String(log.transfersCount || "0").trim();
                const rp = String(log.rescuedPetsCount || "0").trim();
                const hasData = (rc && rc !== "0") || (rr && rr !== "0") || (ph && ph !== "0") || (tr && tr !== "0") || (rp && rp !== "0");
                if (!hasData) return null;
                return (
                  <div key={point.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-main)" }}>{point.title}</span>
                    <div style={{ display: "flex", gap: "4px", fontSize: "0.6rem", alignItems: "center" }}>
                      {rc !== "0" && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{rc}R</span>}
                      {rr !== "0" && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{rr}Rec</span>}
                      {ph !== "0" && <span style={{ color: "#38bdf8", fontWeight: 700 }}>{ph}A</span>}
                      {tr !== "0" && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>{tr}T</span>}
                      {rp !== "0" && <span style={{ color: "#a855f7", fontWeight: 700 }}>{rp}M</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Muestra estadística por grupo en el polígono si existe */}
          {polygonGroups.some((g) => g.rescuedCount || g.recoveredCount || g.prehospitalCareCount || g.transfersCount || g.rescuedPetsCount) && (
            <div style={{ ...sectionStyle, background: "rgba(56, 189, 248, 0.04)", borderColor: "rgba(56, 189, 248, 0.2)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px" }}>
                Estadísticas de Grupos del Polígono:
              </span>
              {polygonGroups.map((g, gIdx) => {
                const hasGMetrics = g.rescuedCount || g.recoveredCount || g.prehospitalCareCount || g.transfersCount || g.rescuedPetsCount;
                if (!hasGMetrics) return null;
                return (
                  <div key={g.id || gIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-main)" }}>{g.groupName || `Grupo #${gIdx + 1}`}</span>
                    <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem", flexWrap: "wrap" }}>
                      {g.rescuedCount && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{g.rescuedCount} Rescat.</span>}
                      {g.recoveredCount && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{g.recoveredCount} Recup.</span>}
                      {g.prehospitalCareCount && <span style={{ color: "#38bdf8", fontWeight: 700 }}>{g.prehospitalCareCount} Atenc.</span>}
                      {g.transfersCount && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>{g.transfersCount} Trasl.</span>}
                      {g.rescuedPetsCount && <span style={{ color: "#a855f7", fontWeight: 700 }}>{g.rescuedPetsCount} Masc.</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Muestra estadística manual general si existe */}
          {hasPolygonManualLog && (
            <div style={{ ...sectionStyle, background: "rgba(56, 189, 248, 0.04)", borderColor: "rgba(56, 189, 248, 0.2)" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--color-info)" }}>
                Estadística manual general del polígono:
              </span>
              <div style={{ display: "flex", gap: "8px", fontSize: "0.6rem", flexWrap: "wrap", marginTop: "2px" }}>
                {polygonOwnLog.rescuedCount && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{polygonOwnLog.rescuedCount} Rescat.</span>}
                {polygonOwnLog.recoveredCount && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{polygonOwnLog.recoveredCount} Recup.</span>}
                {polygonOwnLog.prehospitalCareCount && <span style={{ color: "#38bdf8", fontWeight: 700 }}>{polygonOwnLog.prehospitalCareCount} Atenc.</span>}
                {polygonOwnLog.transfersCount && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>{polygonOwnLog.transfersCount} Trasl.</span>}
                {polygonOwnLog.rescuedPetsCount && <span style={{ color: "#a855f7", fontWeight: 700 }}>{polygonOwnLog.rescuedPetsCount} Masc.</span>}
              </div>
            </div>
          )}

          {/* Total de la zona */}
          <div style={sectionStyle}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={10} /> Total Zona (Polígono + Puntos)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Rescat.</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-green)" }}>{aggregatedLog.rescuedCount || "0"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Recuper.</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-info)" }}>{aggregatedLog.recoveredCount || "0"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Atenc.</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#38bdf8" }}>{aggregatedLog.prehospitalCareCount || "0"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Trasl.</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-purple)" }}>{aggregatedLog.transfersCount || "0"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Mascotas</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#a855f7" }}>{aggregatedLog.rescuedPetsCount || "0"}</span>
              </div>
            </div>
            {aggregatedLog.observations && (
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><AlertTriangle size={9} /> Observaciones</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-main)", lineHeight: 1.3, whiteSpace: "pre-line" }}>{aggregatedLog.observations}</span>
              </div>
            )}
          </div>
        </>
      )}

      {isPolygon && containedWithLogs.length === 0 && !hasPolygonManualLog && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
          No hay puntos ni datos cargados en esta zona
        </div>
      )}

      {/* Punto: sin datos */}
      {!isPolygon && !(log.groupName || log.unitOut || log.managerName || log.officersCount) && !(log.rescuedCount || log.recoveredCount || log.rescuedPetsCount || log.prehospitalCareCount || log.transfersCount || log.observations) && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
          Sin datos registrados para hoy
        </div>
      )}

      {/* Grupos en disposición vertical (uno abajo del otro) */}
      {getNormalizedGroupList(log).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {getNormalizedGroupList(log).map((gItem, gIdx) => (
            <div key={gItem.id || gIdx} style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: gIdx === 0 ? "var(--color-info)" : gIdx === 1 ? "var(--color-purple)" : gIdx === 2 ? "#c084fc" : "#fb923c", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={10} /> {gItem.groupName || `Grupo ${gIdx + 1}`}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {gItem.isVolunteer && (
                    <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.52rem", fontWeight: 800, textTransform: "uppercase" }}>
                      VOLUNTARIO
                    </span>
                  )}
                  {gItem.commissionId && gItem.commissionId !== "independiente" && (
                    <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.52rem", fontWeight: 700 }}>
                      Comisión Conjunta
                    </span>
                  )}
                </div>
              </div>
              <ReadRow label="Unidad" value={gItem.unitOut} />
              <ReadRow label="Encargado" value={gItem.managerName} />
              <ReadRow label="Funcionarios" value={gItem.officersCount} />
              <ReadRow label="Teléfono" value={gItem.managerPhone} />
              {(!!gItem.rescuedCount || !!gItem.recoveredCount || !!gItem.prehospitalCareCount || !!gItem.transfersCount || !!gItem.rescuedPetsCount) && (
                <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem", flexWrap: "wrap", marginTop: "4px", padding: "3px 6px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  {gItem.rescuedCount && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{gItem.rescuedCount} Rescat.</span>}
                  {gItem.recoveredCount && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{gItem.recoveredCount} Recup.</span>}
                  {gItem.prehospitalCareCount && <span style={{ color: "#38bdf8", fontWeight: 700 }}>{gItem.prehospitalCareCount} Atenc.</span>}
                  {gItem.transfersCount && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>{gItem.transfersCount} Trasl.</span>}
                  {gItem.rescuedPetsCount && <span style={{ color: "#a855f7", fontWeight: 700 }}>{gItem.rescuedPetsCount} Masc.</span>}
                </div>
              )}
              {showArrivalCheckbox ? (
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: gItem.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", cursor: "pointer", background: gItem.hasArrived ? "rgba(34, 197, 94, 0.1)" : "rgba(249, 115, 22, 0.1)", padding: "3px 6px", borderRadius: "4px", border: `1px solid ${gItem.hasArrived ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)"}` }}>
                  <input type="checkbox" checked={!!gItem.hasArrived} onChange={(e) => onToggleArrivalGroup?.((gIdx + 1) as 1 | 2 | 3 | 4, e.target.checked)} style={{ cursor: "pointer", width: "13px", height: "13px" }} />
                  <span>{gItem.hasArrived ? "Llegó del sitio" : "¿Ya llegó del sitio?"}</span>
                </label>
              ) : (
                gItem.hasArrived && (
                  <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Llegó del sitio</span>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reportes de Hoy — solo para puntos con datos */}
      {!isPolygon && (log.rescuedCount || log.recoveredCount || log.rescuedPetsCount || log.prehospitalCareCount || log.transfersCount || log.observations) && (
        <div style={sectionStyle}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={10} /> Reportes de Hoy
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Rescat.</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-green)" }}>{log.rescuedCount || "0"}</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Recuper.</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-info)" }}>{log.recoveredCount || "0"}</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Atenc.</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#38bdf8" }}>{log.prehospitalCareCount || "0"}</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Trasl.</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-purple)" }}>{log.transfersCount || "0"}</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>Mascotas</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#a855f7" }}>{log.rescuedPetsCount || "0"}</span>
            </div>
          </div>
          {log.observations && (
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><AlertTriangle size={9} /> Observación</span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-main)", lineHeight: 1.3, whiteSpace: "pre-line" }}>{log.observations}</span>
            </div>
          )}
        </div>
      )}

      {/* Botón Editar — solo para administradores */}
      {isAdmin && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            width: "100%",
            background: "var(--color-info)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s ease",
            boxShadow: "0 0 10px rgba(56, 189, 248, 0.2)",
            marginTop: "4px",
          }}
        >
          <Edit3 size={12} /> {isPolygon ? "Añadir Estadísticas Directas al Polígono" : "Editar Registro"}
        </button>
      )}
    </div>
  );
};

