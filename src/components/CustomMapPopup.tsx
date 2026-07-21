import React, { useState, useEffect } from "react";
import type { DrawnFeature, LayerVisibility } from "../types";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { execute as containsExecute } from "@arcgis/core/geometry/operators/containsOperator";
import { Lock, Unlock, Save, Plus, Trash2, Calendar, FileText, Settings, History, Layers } from "lucide-react";

interface CustomMapPopupProps {
  customPopup: { mapPoint: any; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  onSaveDailyLog?: (
    featureId: number,
    log: any
  ) => Promise<void>;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  sketchLayer: any;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ec4899", // Pink
];

export const CustomMapPopup: React.FC<CustomMapPopupProps> = ({
  customPopup,
  popupScreenPos,
  drawnFeatures,
  layerVisibility,
  popupEditDate,
  setPopupEditDate,
  onSaveDailyLog,
  onToggleFeatureLock,
  onRenameFeature,
  onUpdateFeatureDescription,
  onUpdateFeatureColor,
  sketchLayer,
  onClose,
}) => {
  const activeFeat = customPopup
    ? drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat
    : null;

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"general" | "operation" | "history" | "contained">("general");

  // Local Form states
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localColor, setLocalColor] = useState("#3b82f6");
  const [showSecondGroup, setShowSecondGroup] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
  const [logSaveSuccess, setLogSaveSuccess] = useState(false);

  const [localLog, setLocalLog] = useState<any>({
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
    rescuedPetsCount: "",
    groupName2: "",
    managerName2: "",
    managerPhone2: "",
    unitOut2: "",
    departureTime2: "",
    arrivalTime2: "",
    officersCount2: "",
    rescuedCount2: "",
    recoveredCount2: "",
    hasArrivedG1: false,
    hasArrivedG2: false,
    observations: "",
  });

  // Sync state when selected feature or edit date changes
  useEffect(() => {
    if (!activeFeat) return;
    setLocalTitle(activeFeat.title);
    setLocalDescription(activeFeat.description || "");
    setLocalColor(activeFeat.color || "#3b82f6");
    setGeneralSaveSuccess(false);
    setLogSaveSuccess(false);

    const todayLog = activeFeat.dailyLogs?.find((l: any) => l.date === popupEditDate);
    setLocalLog(
      todayLog
        ? { ...todayLog }
        : {
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
            rescuedPetsCount: "",
            groupName2: "",
            managerName2: "",
            managerPhone2: "",
            unitOut2: "",
            departureTime2: "",
            arrivalTime2: "",
            officersCount2: "",
            rescuedCount2: "",
            recoveredCount2: "",
            hasArrivedG1: false,
            hasArrivedG2: false,
            observations: "",
          }
    );
    setShowSecondGroup(todayLog ? !!todayLog.groupName2 || !!todayLog.unitOut2 : false);
  }, [activeFeat?.id, popupEditDate]);

  // Reset tab based on drawing tools state and feature type
  useEffect(() => {
    if (!activeFeat || !layerVisibility.sketch) {
      if (activeFeat?.type === "point") {
        setActiveTab("operation");
      } else if (activeFeat?.type === "polygon") {
        setActiveTab("contained");
      } else {
        setActiveTab("general");
      }
    } else {
      setActiveTab("general");
    }
  }, [activeFeat?.id, activeFeat?.type, layerVisibility.sketch]);

  if (!customPopup || !popupScreenPos || !activeFeat) return null;

  const handleGeneralSave = async () => {
    try {
      if (onRenameFeature) await onRenameFeature(activeFeat.id, localTitle);
      if (onUpdateFeatureDescription) await onUpdateFeatureDescription(activeFeat.id, localDescription);
      if (onUpdateFeatureColor) await onUpdateFeatureColor(activeFeat.id, localColor);
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving general features:", err);
    }
  };

  const handleLogSave = async () => {
    if (onSaveDailyLog) {
      try {
        await onSaveDailyLog(activeFeat.id, localLog);
        setLogSaveSuccess(true);
        setTimeout(() => setLogSaveSuccess(false), 2000);
      } catch (err) {
        console.error("Error saving daily logs:", err);
      }
    }
  };

  const handleLocalLogChange = (field: string, val: any) => {
    setLocalLog((prev: any) => ({
      ...prev,
      [field]: val,
    }));
  };

  // Build contained items for polygons
  const containedItems: Array<{ title: string; type: string }> = [];
  if (activeFeat.type === "polygon" && sketchLayer) {
    const polyGraphic = sketchLayer.graphics.find((x: any) => {
      if (x.attributes?.isLabel) return false;
      const xId = x.attributes?.id || (x as any).uid;
      return String(xId) === String(activeFeat.id);
    });

    if (polyGraphic && polyGraphic.geometry) {
      const polyGeom = polyGraphic.geometry.spatialReference?.isWebMercator
        ? webMercatorUtils.webMercatorToGeographic(polyGraphic.geometry)
        : polyGraphic.geometry;

      if (polyGeom) {
        const otherGraphics = sketchLayer.graphics
          .filter((x: any) => {
            if (x.attributes?.isLabel) return false;
            const xId = x.attributes?.id || (x as any).uid;
            return String(xId) !== String(activeFeat.id);
          })
          .toArray();

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
                  title:
                    otherFeat.title ||
                    `${
                      otherFeat.type === "polygon"
                        ? "Área"
                        : otherFeat.type === "polyline"
                        ? "Línea"
                        : "Punto"
                    } ${otherId}`,
                  type: otherFeat.type,
                });
              }
            }
          }
        });
      }
    }
  }

  // Render Form Styles Helper
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    padding: "5px 8px",
    color: "var(--text-main)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.72rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.62rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    marginBottom: "2px",
  };

  const saveBtnStyle = (success: boolean): React.CSSProperties => ({
    width: "100%",
    background: success ? "#22c55e" : "var(--color-info)",
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
    boxShadow: success ? "0 0 10px rgba(34, 197, 94, 0.3)" : "0 0 10px rgba(56, 189, 248, 0.2)",
    marginTop: "8px",
  });

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
        width: "330px",
        maxHeight: "82vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
        color: "var(--text-main)",
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.72rem",
              color: localColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {activeFeat.type === "polygon" ? "🗺️ Polígono" : activeFeat.type === "polyline" ? "📏 Línea" : "📍 Punto"}
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
            fontSize: "0.85rem",
            padding: "2px",
            lineHeight: 1,
          }}
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Tabs Selector */}
      {activeFeat.type === "point" && (
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            padding: "2px",
            borderRadius: "6px",
            gap: "2px",
          }}
        >
          {layerVisibility.sketch && (
            <button
              onClick={() => setActiveTab("general")}
              style={{
                flex: 1,
                background: activeTab === "general" ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                color: activeTab === "general" ? "var(--color-info)" : "var(--text-muted)",
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "4px 6px",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <Settings size={10} /> General
            </button>
          )}
          <button
            onClick={() => setActiveTab("operation")}
            style={{
              flex: 1,
              background: activeTab === "operation" ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: activeTab === "operation" ? "var(--color-info)" : "var(--text-muted)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "4px 6px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <FileText size={10} /> Operación
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              flex: 1,
              background: activeTab === "history" ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: activeTab === "history" ? "var(--color-info)" : "var(--text-muted)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "4px 6px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <History size={10} /> Historial
          </button>
        </div>
      )}

      {activeFeat.type === "polygon" && layerVisibility.sketch && (
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            padding: "2px",
            borderRadius: "6px",
            gap: "2px",
          }}
        >
          <button
            onClick={() => setActiveTab("general")}
            style={{
              flex: 1,
              background: activeTab === "general" ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: activeTab === "general" ? "var(--color-info)" : "var(--text-muted)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "4px 6px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Settings size={10} /> General
          </button>
          <button
            onClick={() => setActiveTab("contained")}
            style={{
              flex: 1,
              background: activeTab === "contained" ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              color: activeTab === "contained" ? "var(--color-info)" : "var(--text-muted)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "4px 6px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Layers size={10} /> Elementos
          </button>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Title Input */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Nombre del elemento</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              style={inputStyle}
              placeholder="Ej. Punto de Control A"
            />
          </div>

          {/* Description Input */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Descripción o notas</label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              placeholder="Detalles sobre el punto, sector o incidente..."
            />
          </div>

          {/* Color Picker */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Color en el mapa</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setLocalColor(c)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: c,
                    border: localColor === c ? "2px solid #fff" : "1px solid rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    boxShadow: localColor === c ? `0 0 8px ${c}` : "none",
                    transform: localColor === c ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Lock Warn */}
          {activeFeat.locked && (
            <div
              style={{
                fontSize: "0.62rem",
                color: "var(--color-high)",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "4px",
                padding: "4px 6px",
                marginTop: "2px",
              }}
            >
              🔒 Ubicación bloqueada. Para mover este punto, haz clic en el candado arriba.
            </div>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleGeneralSave}
            style={saveBtnStyle(generalSaveSuccess)}
          >
            <Save size={12} /> {generalSaveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
          </button>
        </div>
      )}

      {activeTab === "operation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Header & Date Selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={12} /> Registro Diario
            </span>
            <input
              type="date"
              value={popupEditDate}
              onChange={(e) => setPopupEditDate(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "4px",
                color: "var(--text-main)",
                fontSize: "0.62rem",
                padding: "2px 4px",
                cursor: "pointer",
                outline: "none",
              }}
            />
          </div>

          {/* Group 1 details */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
              Grupo Primario
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <input
                type="text"
                placeholder="Nombre Grupo"
                value={localLog.groupName}
                onChange={(e) => handleLocalLogChange("groupName", e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Unidad (Vehículo)"
                value={localLog.unitOut}
                onChange={(e) => handleLocalLogChange("unitOut", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4px" }}>
              <input
                type="text"
                placeholder="Encargado"
                value={localLog.managerName}
                onChange={(e) => handleLocalLogChange("managerName", e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Cant. Funcs."
                value={localLog.officersCount || ""}
                onChange={(e) => handleLocalLogChange("officersCount", e.target.value)}
                style={inputStyle}
              />
            </div>
            <input
              type="text"
              placeholder="Teléfono Encargado"
              value={localLog.managerPhone}
              onChange={(e) => handleLocalLogChange("managerPhone", e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Salida</span>
                <input
                  type="time"
                  value={localLog.departureTime || ""}
                  onChange={(e) => handleLocalLogChange("departureTime", e.target.value)}
                  style={{ ...inputStyle, padding: "2px 4px" }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Llegada</span>
                <input
                  type="time"
                  value={localLog.arrivalTime || ""}
                  onChange={(e) => handleLocalLogChange("arrivalTime", e.target.value)}
                  style={{ ...inputStyle, padding: "2px 4px" }}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer", marginTop: "4px" }}>
              <input
                type="checkbox"
                checked={!!localLog.hasArrivedG1}
                onChange={(e) => handleLocalLogChange("hasArrivedG1", e.target.checked)}
                style={{ margin: 0, cursor: "pointer" }}
              />
              <span>¿Ya llegó el Grupo Primario?</span>
            </label>
          </div>

          {/* Group 2 details (collapsible) */}
          {!showSecondGroup ? (
            <button
              type="button"
              onClick={() => setShowSecondGroup(true)}
              style={{
                background: "transparent",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: "6px",
                color: "var(--text-muted)",
                fontSize: "0.62rem",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s ease",
              }}
            >
              <Plus size={10} /> Añadir Segundo Grupo
            </button>
          ) : (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                borderRadius: "8px",
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-purple)" }}>Grupo Secundario</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondGroup(false);
                    handleLocalLogChange("groupName2", "");
                    handleLocalLogChange("unitOut2", "");
                    handleLocalLogChange("managerName2", "");
                    handleLocalLogChange("managerPhone2", "");
                    handleLocalLogChange("officersCount2", "");
                    handleLocalLogChange("departureTime2", "");
                    handleLocalLogChange("arrivalTime2", "");
                    handleLocalLogChange("hasArrivedG2", false);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-high)",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Quitar segundo grupo"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                <input
                  type="text"
                  placeholder="Nombre Grupo 2"
                  value={localLog.groupName2 || ""}
                  onChange={(e) => handleLocalLogChange("groupName2", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Unidad 2 (Vehículo)"
                  value={localLog.unitOut2 || ""}
                  onChange={(e) => handleLocalLogChange("unitOut2", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4px" }}>
                <input
                  type="text"
                  placeholder="Encargado 2"
                  value={localLog.managerName2 || ""}
                  onChange={(e) => handleLocalLogChange("managerName2", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Cant. Funcs."
                  value={localLog.officersCount2 || ""}
                  onChange={(e) => handleLocalLogChange("officersCount2", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <input
                type="text"
                placeholder="Teléfono Encargado 2"
                value={localLog.managerPhone2 || ""}
                onChange={(e) => handleLocalLogChange("managerPhone2", e.target.value)}
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Salida 2</span>
                  <input
                    type="time"
                    value={localLog.departureTime2 || ""}
                    onChange={(e) => handleLocalLogChange("departureTime2", e.target.value)}
                    style={{ ...inputStyle, padding: "2px 4px" }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Llegada 2</span>
                  <input
                    type="time"
                    value={localLog.arrivalTime2 || ""}
                    onChange={(e) => handleLocalLogChange("arrivalTime2", e.target.value)}
                    style={{ ...inputStyle, padding: "2px 4px" }}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  checked={!!localLog.hasArrivedG2}
                  onChange={(e) => handleLocalLogChange("hasArrivedG2", e.target.checked)}
                  style={{ margin: 0, cursor: "pointer" }}
                />
                <span>¿Ya llegó el Grupo Secundario?</span>
              </label>
            </div>
          )}

          {/* Counts (Rescues, recovered, pets) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
              Reportes de Hoy
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Rescatados</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localLog.rescuedCount || ""}
                  onChange={(e) => handleLocalLogChange("rescuedCount", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Recuperados</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localLog.recoveredCount || ""}
                  onChange={(e) => handleLocalLogChange("recoveredCount", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Mascotas</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localLog.rescuedPetsCount || ""}
                  onChange={(e) => handleLocalLogChange("rescuedPetsCount", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Observación del Día</span>
              <textarea
                value={localLog.observations || ""}
                onChange={(e) => handleLocalLogChange("observations", e.target.value)}
                style={{ ...inputStyle, resize: "none", height: "36px" }}
                placeholder="Notas u observaciones de hoy..."
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleLogSave}
            style={saveBtnStyle(logSaveSuccess)}
          >
            <Save size={12} /> {logSaveSuccess ? "¡Registro Guardado!" : "Guardar Registro"}
          </button>
        </div>
      )}

      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "3px" }}>
            Historial de Registros ({activeFeat.dailyLogs?.length || 0})
          </div>

          {activeFeat.dailyLogs && activeFeat.dailyLogs.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "260px",
                overflowY: "auto",
                paddingRight: "2px",
              }}
            >
              {activeFeat.dailyLogs?.map((log: any, idx: number) => {
                const hasG2 = !!log.groupName2 || !!log.unitOut2;
                return (
                  <div
                    key={idx}
                    style={{
                      fontSize: "0.65rem",
                      borderBottom: idx !== (activeFeat.dailyLogs?.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      paddingBottom: "6px",
                      marginBottom: "2px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "var(--text-main)", display: "flex", justifyContent: "space-between" }}>
                      <span>📅 {log.date}</span>
                      <span style={{ color: "var(--color-green)" }}>🛟 {log.rescuedCount || "0"} | 🩹 {log.recoveredCount || "0"} | 🐾 {log.rescuedPetsCount || "0"}</span>
                    </div>

                    {/* Group 1 details */}
                    <div style={{ color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--color-info)" }}>G1: </strong> {log.groupName || "-"} 
                      {log.unitOut ? ` (${log.unitOut})` : ""}
                      {log.managerName ? ` - Enc: ${log.managerName}` : ""}
                      {log.officersCount ? ` [👮 ${log.officersCount}]` : ""}
                    </div>

                    {/* Group 2 details */}
                    {hasG2 && (
                      <div style={{ color: "var(--text-muted)" }}>
                        <strong style={{ color: "var(--color-purple)" }}>G2: </strong> {log.groupName2 || "-"} 
                        {log.unitOut2 ? ` (${log.unitOut2})` : ""}
                        {log.managerName2 ? ` - Enc: ${log.managerName2}` : ""}
                        {log.officersCount2 ? ` [👮 ${log.officersCount2}]` : ""}
                      </div>
                    )}

                    {(log.departureTime || log.arrivalTime) && (
                      <div style={{ fontSize: "0.58rem", color: "var(--color-info)", display: "flex", gap: "6px", marginTop: "1px" }}>
                        ⏱️ Horario: {log.departureTime || "--:--"} - {log.arrivalTime || "--:--"}
                      </div>
                    )}
                    {log.observations && (
                      <div style={{ fontSize: "0.58rem", color: "var(--color-info)", marginTop: "1px", background: "rgba(56, 189, 248, 0.04)", borderLeft: "2px solid var(--color-info)", padding: "2px 4px", borderRadius: "0 3px 3px 0" }}>
                        <strong>📝 Obs:</strong> {log.observations}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
              No hay registros anteriores guardados en este punto.
            </div>
          )}
        </div>
      )}

      {activeTab === "contained" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "3px" }}>
            Elementos Contenidos ({containedItems.length})
          </div>

          {containedItems.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.7rem", maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {containedItems.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    color:
                      item.type === "polygon"
                        ? "var(--color-info)"
                        : item.type === "polyline"
                        ? "var(--color-purple)"
                        : "var(--color-green)",
                  }}
                >
                  {item.title}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
              No se detectaron puntos o líneas dentro de este área.
            </div>
          )}
        </div>
      )}

      {/* Bubble Tail Pointer Arrow */}
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: "12px",
          height: "12px",
          background: "rgba(15, 23, 42, 0.94)",
          borderRight: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          zIndex: -1,
        }}
      />
    </div>
  );
};
