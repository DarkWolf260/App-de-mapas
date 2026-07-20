import React from "react";
import type { DrawnFeature, LayerVisibility } from "../App";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { execute as containsExecute } from "@arcgis/core/geometry/operators/containsOperator";
import { Lock, Unlock } from "lucide-react";

interface CustomMapPopupProps {
  customPopup: { mapPoint: any; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  showHistoryInPopup: boolean;
  setShowHistoryInPopup: (show: boolean) => void;
  onSaveDailyLog?: (
    featureId: number,
    log: {
      date: string;
      groupName: string;
      managerName: string;
      managerPhone: string;
      unitOut: string;
      departureTime?: string;
      arrivalTime?: string;
      officersCount?: string;
      rescuedCount?: string;
      recoveredCount?: string;
      hasArrivedG1?: boolean;
      hasArrivedG2?: boolean;
    }
  ) => Promise<void>;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  sketchLayer: any;
  onClose: () => void;
}

export const CustomMapPopup: React.FC<CustomMapPopupProps> = ({
  customPopup,
  popupScreenPos,
  drawnFeatures,
  layerVisibility,
  popupEditDate,
  setPopupEditDate,
  showHistoryInPopup,
  setShowHistoryInPopup,
  onSaveDailyLog,
  onToggleFeatureLock,
  sketchLayer,
  onClose,
}) => {
  if (!customPopup || !popupScreenPos) return null;

  const activeFeat = drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat;
  const [forceEditMode, setForceEditMode] = React.useState(false);

  React.useEffect(() => {
    setForceEditMode(false);
  }, [activeFeat.id, popupEditDate]);

  return (
    <div
      className="custom-map-popup glass-panel"
      style={{
        position: "absolute",
        left: `${popupScreenPos.x}px`,
        top: `${popupScreenPos.y - 12}px`,
        transform: "translate(-50%, -100%)",
        zIndex: 999,
        padding: "12px 14px",
        borderRadius: "12px",
        width: "320px",
        maxHeight: "80vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(14px)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.75)",
        color: "var(--text-main)",
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--color-info)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {activeFeat.type === "polygon" ? "Polígono" : activeFeat.type === "polyline" ? "Línea" : "Punto"}
          </span>
          <button
            onClick={() => onToggleFeatureLock && onToggleFeatureLock(activeFeat.id, !activeFeat.locked)}
            style={{
              background: "transparent",
              border: "none",
              color: activeFeat.locked ? "var(--color-high)" : "var(--text-muted)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            title={activeFeat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
          >
            {activeFeat.locked ? <Lock size={12} /> : <Unlock size={12} style={{ opacity: 0.4 }} />}
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.8rem",
            padding: "2px",
            lineHeight: 1
          }}
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
        {customPopup.feat.title}
      </div>

      {/* Description */}
      {customPopup.feat.description && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.4,
            maxHeight: "90px",
            overflowY: "auto",
            paddingRight: "2px",
            whiteSpace: "pre-wrap"
          }}
        >
          {customPopup.feat.description}
        </div>
      )}

      {/* Work Site Logs for Point Features */}
      {customPopup.feat.type === "point" && (() => {
        const activeFeat = drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat;

        const isEditing = layerVisibility.sketch || forceEditMode;

        if (isEditing) {
          // EDIT MODE
          const currentLog = activeFeat.dailyLogs?.find((l) => l.date === popupEditDate) || {
            date: popupEditDate,
            groupName: "",
            managerName: "",
            managerPhone: "",
            unitOut: "",
            departureTime: "",
            arrivalTime: "",
            officersCount: "",
            rescuedCount: "",
            recoveredCount: "",
          };

          const handlePopupInputChange = (field: string, val: any) => {
            if (onSaveDailyLog) {
              onSaveDailyLog(activeFeat.id, {
                ...currentLog,
                [field]: val
              });
            }
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  ✍️ Editar Registro Diario
                </div>
                {!layerVisibility.sketch && (
                  <button
                    type="button"
                    onClick={() => setForceEditMode(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-info)",
                      cursor: "pointer",
                      fontSize: "0.62rem",
                      padding: 0
                    }}
                  >
                    Volver a vista
                  </button>
                )}
              </div>

              {activeFeat.locked && (
                <div style={{ fontSize: "0.62rem", color: "var(--color-high)", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "4px", padding: "4px 6px", display: "flex", gap: "4px" }}>
                  <span>🔒 Ubicación del elemento bloqueada (no se puede mover).</span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Fecha:</span>
                <input
                  type="date"
                  value={popupEditDate}
                  onChange={(e) => setPopupEditDate(e.target.value)}
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    color: "var(--text-main)",
                    fontSize: "0.62rem",
                    padding: "1px 3px",
                    cursor: "text"
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Grupo Desplegado"
                value={currentLog.groupName}
                onChange={(e) => handlePopupInputChange("groupName", e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "text"
                }}
              />
              <input
                type="text"
                placeholder="Encargado"
                value={currentLog.managerName}
                onChange={(e) => handlePopupInputChange("managerName", e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "text"
                }}
              />
              <input
                type="text"
                placeholder="Teléfono Encargado"
                value={currentLog.managerPhone}
                onChange={(e) => handlePopupInputChange("managerPhone", e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "text"
                }}
              />
              <input
                type="text"
                placeholder="Unidad (Vehículo/Equipo)"
                value={currentLog.unitOut}
                onChange={(e) => handlePopupInputChange("unitOut", e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "text"
                }}
              />
              <input
                type="number"
                min="0"
                placeholder="Cantidad de Funcionarios"
                value={currentLog.officersCount || ""}
                onChange={(e) => handlePopupInputChange("officersCount", e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "text"
                }}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  min="0"
                  placeholder="Rescatados"
                  value={currentLog.rescuedCount || ""}
                  onChange={(e) => handlePopupInputChange("rescuedCount", e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    color: "var(--text-main)",
                    fontSize: "0.68rem",
                    padding: "3px 6px",
                    cursor: "text"
                  }}
                  title="Personas Rescatadas"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Recuperados"
                  value={currentLog.recoveredCount || ""}
                  onChange={(e) => handlePopupInputChange("recoveredCount", e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    color: "var(--text-main)",
                    fontSize: "0.68rem",
                    padding: "3px 6px",
                    cursor: "text"
                  }}
                  title="Cadáveres Recuperados"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Mascotas"
                  value={currentLog.rescuedPetsCount || ""}
                  onChange={(e) => handlePopupInputChange("rescuedPetsCount", e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    color: "var(--text-main)",
                    fontSize: "0.68rem",
                    padding: "3px 6px",
                    cursor: "text"
                  }}
                  title="Mascotas Rescatadas"
                />
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "2px" }}>H. Salida:</span>
                  <input
                    type="time"
                    value={currentLog.departureTime || ""}
                    onChange={(e) => handlePopupInputChange("departureTime", e.target.value)}
                    style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "4px",
                      color: "var(--text-main)",
                      fontSize: "0.65rem",
                      padding: "2px 4px",
                      outline: "none",
                      cursor: "text"
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "2px" }}>H. Llegada:</span>
                  <input
                    type="time"
                    value={currentLog.arrivalTime || ""}
                    onChange={(e) => handlePopupInputChange("arrivalTime", e.target.value)}
                    style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "4px",
                      color: "var(--text-main)",
                      fontSize: "0.65rem",
                      padding: "2px 4px",
                      outline: "none",
                      cursor: "text"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!currentLog.hasArrivedG1}
                    onChange={(e) => handlePopupInputChange("hasArrivedG1", e.target.checked)}
                    style={{ margin: 0, cursor: "pointer" }}
                  />
                  <span>¿Ya llegó la unidad?</span>
                </label>
              </div>
            </div>
          );
        } else {
          // VIEW MODE
          const todayStr = new Date().toLocaleDateString('en-CA');
          const todayLog = activeFeat.dailyLogs?.find((l) => l.date === todayStr);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                📅 Registro de Hoy ({todayStr})
              </div>

              {todayLog ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.7rem", color: "var(--text-main)" }}>
                  <div><strong>👥 Grupo:</strong> {todayLog.groupName || "-"}</div>
                  <div><strong>👤 Encargado:</strong> {todayLog.managerName || "-"}</div>
                  <div><strong>📞 Teléfono:</strong> {todayLog.managerPhone || "-"}</div>
                  <div><strong>🚒 Unidad:</strong> {todayLog.unitOut || "-"}</div>
                  {(todayLog.officersCount || todayLog.rescuedCount || todayLog.recoveredCount || todayLog.rescuedPetsCount) && (
                    <div>
                      <strong>👮 Personal:</strong> {todayLog.officersCount || "0"} funcionarios
                      {" | "}<strong>🛟 Resc.:</strong> {todayLog.rescuedCount || "0"}
                      {" | "}<strong>🩹 Recup.:</strong> {todayLog.recoveredCount || "0"}
                      {todayLog.rescuedPetsCount ? ` | 🐾 Masc.: ${todayLog.rescuedPetsCount}` : ""}
                    </div>
                  )}
                  {(todayLog.departureTime || todayLog.arrivalTime) && (
                    <div><strong>⏱️ Horario:</strong> {todayLog.departureTime || "--:--"} - {todayLog.arrivalTime || "--:--"}</div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No hay información registrada para el día de hoy.
                </div>
              )}

              {/* Botón Añadir / Editar Registro */}
              <div style={{ marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setForceEditMode(true)}
                  style={{
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "4px",
                    color: "var(--color-info)",
                    cursor: "pointer",
                    fontSize: "0.68rem",
                    padding: "4px 8px",
                    width: "100%",
                    textAlign: "center",
                    fontWeight: 700,
                    transition: "all 0.2s ease"
                  }}
                  title="Añadir o editar el registro de hoy"
                >
                  {todayLog ? "✍️ Editar Registro" : "➕ Añadir Registro"}
                </button>
              </div>

              {activeFeat.dailyLogs && activeFeat.dailyLogs.length > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setShowHistoryInPopup(!showHistoryInPopup)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-info)",
                      cursor: "pointer",
                      fontSize: "0.65rem",
                      padding: 0,
                      fontWeight: 700
                    }}
                  >
                    {showHistoryInPopup ? "▲ Ocultar Historial" : `▼ Ver más (${activeFeat.dailyLogs.length} reg.)`}
                  </button>

                  {showHistoryInPopup && (
                    <div style={{
                      marginTop: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "6px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "6px"
                    }}>
                      {activeFeat.dailyLogs.map((log, idx) => (
                        <div key={idx} style={{ fontSize: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "3px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", justifyContent: "space-between" }}>
                            <span>📅 {log.date}</span>
                            <span style={{ color: "var(--color-green)" }}>{log.unitOut || "-"}</span>
                          </div>
                          <div>Grupo: {log.groupName || "-"} | Enc: {log.managerName || "-"}</div>
                          <div>
                            Tel: {log.managerPhone || "-"} | 👮 Pers: {log.officersCount || "0"}{" "}
                            (🛟 {log.rescuedCount || "0"} | 🩹 {log.recoveredCount || "0"}{log.rescuedPetsCount ? ` | 🐾 ${log.rescuedPetsCount}` : ""})
                          </div>
                          {(log.departureTime || log.arrivalTime) && (
                            <div style={{ fontSize: "0.58rem", color: "var(--color-info)", marginTop: "1px" }}>
                              ⏱️ {log.departureTime || "--:--"} - {log.arrivalTime || "--:--"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }
      })()}

      {/* Elements list inside Area if Polygon */}
      {customPopup.feat.type === "polygon" && (() => {
        const containedItems: Array<{ title: string; type: string }> = [];
        if (sketchLayer) {
          const polyGraphic = sketchLayer.graphics.find((x: any) => {
            if (x.attributes?.isLabel) return false;
            const xId = x.attributes?.id || (x as any).uid;
            return String(xId) === String(customPopup.feat.id);
          });

          if (polyGraphic && polyGraphic.geometry) {
            const polyGeom = polyGraphic.geometry.spatialReference?.isWebMercator
              ? webMercatorUtils.webMercatorToGeographic(polyGraphic.geometry)
              : polyGraphic.geometry;

            if (polyGeom) {
              const otherGraphics = sketchLayer.graphics.filter((x: any) => {
                if (x.attributes?.isLabel) return false;
                const xId = x.attributes?.id || (x as any).uid;
                return String(xId) !== String(customPopup.feat.id);
              }).toArray();

              otherGraphics.forEach((otherG: any) => {
                if (otherG.geometry) {
                  const otherGeom = otherG.geometry.spatialReference?.isWebMercator
                    ? webMercatorUtils.webMercatorToGeographic(otherG.geometry)
                    : otherG.geometry;

                  if (otherGeom && containsExecute(polyGeom, otherGeom)) {
                    const otherId = otherG.attributes?.id || (otherG as any).uid;
                    const otherFeat = drawnFeatures.find((f) => String(f.id) === String(otherId));
                    if (otherFeat) {
                      containedItems.push({
                        title: otherFeat.title || `${otherFeat.type === "polygon" ? "Área" : otherFeat.type === "polyline" ? "Línea" : "Punto"} ${otherId}`,
                        type: otherFeat.type
                      });
                    }
                  }
                }
              });
            }
          }
        }

        if (containedItems.length > 0) {
          return (
            <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "3px" }}>
                Elementos Contenidos ({containedItems.length}):
              </div>
              <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.7rem", maxHeight: "80px", overflowY: "auto" }}>
                {containedItems.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: "2px",
                      color: item.type === "polygon"
                        ? "var(--color-info)"
                        : item.type === "polyline"
                        ? "var(--color-purple)"
                        : "var(--color-green)"
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        } else {
          return (
            <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No contiene elementos.
            </div>
          );
        }
      })()}

      {/* Arrow */}
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: "12px",
          height: "12px",
          background: "rgba(15, 23, 42, 0.88)",
          borderRight: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          zIndex: -1
        }}
      />
    </div>
  );
};
