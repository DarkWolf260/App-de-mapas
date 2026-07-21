import React, { useState } from "react";
import type { DrawnFeature } from "../types";

interface WorkSiteLogFormProps {
  feat: DrawnFeature;
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
}

export const WorkSiteLogForm: React.FC<WorkSiteLogFormProps> = ({ feat, onSaveDailyLog }) => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showHistory, setShowHistory] = useState(false);

  const currentLog = feat.dailyLogs?.find((l) => l.date === selectedDate) || {
    date: selectedDate,
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    departureTime: "",
    arrivalTime: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    hasArrivedG1: false,
    hasArrivedG2: false
  };

  const handleInputChange = (field: string, value: any) => {
    if (!onSaveDailyLog) return;
    const updatedLog = {
      ...currentLog,
      [field]: value
    };
    onSaveDailyLog(feat.id, updatedLog);
  };

  return (
    <div style={{
      marginTop: "8px",
      padding: "8px",
      background: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
        📋 Registro Sitio de Trabajo
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Fecha de Tarea:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.65rem",
            padding: "2px 4px",
            outline: "none"
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <input
          type="text"
          placeholder="Grupo Desplegado"
          value={currentLog.groupName}
          onChange={(e) => handleInputChange("groupName", e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.68rem",
            padding: "3px 6px"
          }}
        />
        <input
          type="text"
          placeholder="Encargado"
          value={currentLog.managerName}
          onChange={(e) => handleInputChange("managerName", e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.68rem",
            padding: "3px 6px"
          }}
        />
        <input
          type="text"
          placeholder="Teléfono Encargado"
          value={currentLog.managerPhone}
          onChange={(e) => handleInputChange("managerPhone", e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.68rem",
            padding: "3px 6px"
          }}
        />
        <input
          type="text"
          placeholder="Unidad (Vehículo/Equipo)"
          value={currentLog.unitOut}
          onChange={(e) => handleInputChange("unitOut", e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.68rem",
            padding: "3px 6px"
          }}
        />
        <input
          type="number"
          min="0"
          placeholder="Cantidad de Funcionarios"
          value={currentLog.officersCount || ""}
          onChange={(e) => handleInputChange("officersCount", e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.68rem",
            padding: "3px 6px"
          }}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            type="number"
            min="0"
            placeholder="Rescatados"
            value={currentLog.rescuedCount || ""}
            onChange={(e) => handleInputChange("rescuedCount", e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-main)",
              fontSize: "0.68rem",
              padding: "3px 6px"
            }}
          />
          <input
            type="number"
            min="0"
            placeholder="Recuperados"
            value={currentLog.recoveredCount || ""}
            onChange={(e) => handleInputChange("recoveredCount", e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-main)",
              fontSize: "0.68rem",
              padding: "3px 6px"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "2px" }}>H. Salida:</span>
            <input
              type="time"
              value={currentLog.departureTime || ""}
              onChange={(e) => handleInputChange("departureTime", e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "4px",
                color: "var(--text-main)",
                fontSize: "0.65rem",
                padding: "2px 4px",
                outline: "none"
              }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "2px" }}>H. Llegada:</span>
            <input
              type="time"
              value={currentLog.arrivalTime || ""}
              onChange={(e) => handleInputChange("arrivalTime", e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "4px",
                color: "var(--text-main)",
                fontSize: "0.65rem",
                padding: "2px 4px",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!currentLog.hasArrivedG1}
              onChange={(e) => handleInputChange("hasArrivedG1", e.target.checked)}
              style={{ margin: 0, cursor: "pointer" }}
            />
            <span>¿Ya llegó la unidad?</span>
          </label>
        </div>
      </div>

      {feat.dailyLogs && feat.dailyLogs.length > 0 && (
        <div style={{ marginTop: "2px" }}>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-info)",
              cursor: "pointer",
              fontSize: "0.65rem",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "2px"
            }}
          >
            {showHistory ? "▲ Ocultar Historial" : `▼ Ver Historial (${feat.dailyLogs.length} reg.)`}
          </button>

          {showHistory && (
            <div style={{
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxHeight: "100px",
              overflowY: "auto",
              padding: "4px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "4px"
            }}>
              {feat.dailyLogs.map((log, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(log.date)}
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--text-muted)",
                    padding: "3px 4px",
                    background: selectedDate === log.date ? "rgba(56, 189, 248, 0.15)" : "transparent",
                    borderRadius: "2px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.03)"
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", justifyContent: "space-between" }}>
                    <span>📅 {log.date}</span>
                    <span style={{ color: "var(--color-green)" }}>{log.unitOut}</span>
                  </div>
                  <div>Grupo: {log.groupName || "-"} | Enc: {log.managerName || "-"}</div>
                  <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "1px" }}>
                    👮 {log.officersCount || "0"} | 🛟 {log.rescuedCount || "0"} | 🩹 {log.recoveredCount || "0"}
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
};
