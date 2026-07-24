import React, { useState, useMemo } from "react";
import { Copy, Check, Edit3, Users, Activity, Dog, AlertTriangle } from "lucide-react";
import type { DrawnFeature, DailyLog } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { labelStyle } from "./popupStyles";

interface InfoTabProps {
  activeFeat: DrawnFeature;
  dailyLog: Partial<DailyLog> | undefined;
  onEdit: () => void;
  drawnFeatures: DrawnFeature[];
  popupEditDate: string;
  isAdmin?: boolean;
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
  activeFeat, dailyLog, onEdit, drawnFeatures, popupEditDate, isAdmin = false,
}) => {
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
    return (activeFeat.dailyLogs?.find((l) => l.date === popupEditDate) || {}) as Partial<DailyLog>;
  }, [isPolygon, activeFeat, popupEditDate]);

  const aggregatedLog = useMemo(() => {
    if (!isPolygon) return dailyLog || {};
    const sum = {
      rescuedCount: Number(polygonOwnLog.rescuedCount || 0) + Number(polygonOwnLog.rescuedCount2 || 0),
      recoveredCount: Number(polygonOwnLog.recoveredCount || 0) + Number(polygonOwnLog.recoveredCount2 || 0),
      rescuedPetsCount: Number(polygonOwnLog.rescuedPetsCount || 0),
      prehospitalCareCount: Number(polygonOwnLog.prehospitalCareCount || 0) + Number(polygonOwnLog.prehospitalCareCount2 || 0),
      transfersCount: Number(polygonOwnLog.transfersCount || 0) + Number(polygonOwnLog.transfersCount2 || 0),
    };
    let hasAnyLog = Object.values(sum).some((v) => v > 0);
    let observations = polygonOwnLog.observations ? `Polígono: ${polygonOwnLog.observations}` : "";

    for (const { point, log } of containedWithLogs) {
      if (log.rescuedCount) { sum.rescuedCount += Number(log.rescuedCount); hasAnyLog = true; }
      if (log.rescuedCount2) { sum.rescuedCount += Number(log.rescuedCount2); hasAnyLog = true; }
      if (log.recoveredCount) { sum.recoveredCount += Number(log.recoveredCount); hasAnyLog = true; }
      if (log.recoveredCount2) { sum.recoveredCount += Number(log.recoveredCount2); hasAnyLog = true; }
      if (log.rescuedPetsCount) { sum.rescuedPetsCount += Number(log.rescuedPetsCount); hasAnyLog = true; }
      if (log.prehospitalCareCount) { sum.prehospitalCareCount += Number(log.prehospitalCareCount); hasAnyLog = true; }
      if (log.prehospitalCareCount2) { sum.prehospitalCareCount += Number(log.prehospitalCareCount2); hasAnyLog = true; }
      if (log.transfersCount) { sum.transfersCount += Number(log.transfersCount); hasAnyLog = true; }
      if (log.transfersCount2) { sum.transfersCount += Number(log.transfersCount2); hasAnyLog = true; }
      if (log.observations) {
        observations += (observations ? "\n" : "") + `${point.title}: ${log.observations}`;
      }
    }

    return {
      rescuedCount: sum.rescuedCount > 0 ? String(sum.rescuedCount) : undefined,
      recoveredCount: sum.recoveredCount > 0 ? String(sum.recoveredCount) : undefined,
      rescuedPetsCount: sum.rescuedPetsCount > 0 ? String(sum.rescuedPetsCount) : undefined,
      prehospitalCareCount: sum.prehospitalCareCount > 0 ? String(sum.prehospitalCareCount) : undefined,
      transfersCount: sum.transfersCount > 0 ? String(sum.transfersCount) : undefined,
      observations: observations || undefined,
      _hasData: hasAnyLog || containedWithLogs.length > 0,
    } as Partial<DailyLog> & { _hasData?: boolean };
  }, [isPolygon, dailyLog, containedWithLogs, polygonOwnLog]);

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

          {/* Muestra estadística manual ingresada directamente al polígono si existe */}
          {hasPolygonManualLog && (
            <div style={{ ...sectionStyle, background: "rgba(56, 189, 248, 0.04)", borderColor: "rgba(56, 189, 248, 0.2)" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--color-info)" }}>
                Estadística manual directa del polígono:
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
              <Activity size={10} /> Total Zona (Puntos + Manual Polígono)
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

      {/* Punto: Grupos en disposición vertical (uno abajo del otro) */}
      {!isPolygon && ((log.groupName || log.unitOut || log.managerName || log.officersCount) || log.groupName2 || log.groupName3 || log.groupName4) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Grupo Primario */}
          {(log.groupName || log.unitOut || log.managerName || log.officersCount) && (
            <div style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Users size={10} /> Grupo Primario
              </div>
              <ReadRow label="Grupo" value={log.groupName} />
              <ReadRow label="Unidad" value={log.unitOut} />
              <ReadRow label="Encargado" value={log.managerName} />
              <ReadRow label="Funcionarios" value={log.officersCount} />
              <ReadRow label="Teléfono" value={log.managerPhone} />
              <ReadRow label="H. Salida" value={log.departureTime} />
              <ReadRow label="H. Llegada" value={log.arrivalTime} />
              {log.hasArrivedG1 && (
                <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Llegó</span>
              )}
            </div>
          )}

          {/* Grupo Secundario */}
          {log.groupName2 && (
            <div style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-purple)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                Grupo Secundario
              </div>
              <ReadRow label="Grupo" value={log.groupName2} />
              <ReadRow label="Unidad" value={log.unitOut2} />
              <ReadRow label="Encargado" value={log.managerName2} />
              <ReadRow label="Funcionarios" value={log.officersCount2} />
              <ReadRow label="Teléfono" value={log.managerPhone2} />
              <ReadRow label="H. Salida" value={log.departureTime2} />
              <ReadRow label="H. Llegada" value={log.arrivalTime2} />
              {log.hasArrivedG2 && (
                <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Llegó</span>
              )}
            </div>
          )}

          {/* Grupo 3 */}
          {log.groupName3 && (
            <div style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#c084fc", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                Tercer Grupo
              </div>
              <ReadRow label="Grupo" value={log.groupName3} />
              <ReadRow label="Unidad" value={log.unitOut3} />
              <ReadRow label="Encargado" value={log.managerName3} />
              <ReadRow label="Funcionarios" value={log.officersCount3} />
              <ReadRow label="Teléfono" value={log.managerPhone3} />
              <ReadRow label="H. Salida" value={log.departureTime3} />
              <ReadRow label="H. Llegada" value={log.arrivalTime3} />
              {log.hasArrivedG3 && (
                <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Llegó</span>
              )}
            </div>
          )}

          {/* Grupo 4 */}
          {log.groupName4 && (
            <div style={sectionStyle}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fb923c", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                Cuarto Grupo
              </div>
              <ReadRow label="Grupo" value={log.groupName4} />
              <ReadRow label="Unidad" value={log.unitOut4} />
              <ReadRow label="Encargado" value={log.managerName4} />
              <ReadRow label="Funcionarios" value={log.officersCount4} />
              <ReadRow label="Teléfono" value={log.managerPhone4} />
              <ReadRow label="H. Salida" value={log.departureTime4} />
              <ReadRow label="H. Llegada" value={log.arrivalTime4} />
              {log.hasArrivedG4 && (
                <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Llegó</span>
              )}
            </div>
          )}
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

