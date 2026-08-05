import React, { useState } from "react";
import { X, Save, Shield, Flame, Users, Activity } from "lucide-react";
import { WorkTeam } from "./types";
import { Time24Input } from "../Time24Input";
import { formatPhone } from "../../utils/phoneFormatter";

interface EditWorkTeamModalProps {
  team: WorkTeam;
  onClose: () => void;
  onSave: (updatedTeam: WorkTeam) => Promise<void>;
}

export const EditWorkTeamModal: React.FC<EditWorkTeamModalProps> = ({
  team,
  onClose,
  onSave,
}) => {
  const [groupName, setGroupName] = useState(team.groupName || "");
  const [unitOut, setUnitOut] = useState(team.unitOut || "");
  const [managerName, setManagerName] = useState(team.managerName || "");
  const [managerPhone, setManagerPhone] = useState(team.managerPhone || "");
  const [officersCount, setOfficersCount] = useState(String(team.officersCount || 0));
  const [departureTime, setDepartureTime] = useState(team.departureTime || "");
  const [arrivalTime, setArrivalTime] = useState(team.arrivalTime || "");
  const [hasArrived, setHasArrived] = useState(!!team.hasArrived);

  // Statistics
  const [rescuedCount, setRescuedCount] = useState(team.rescuedCount || "");
  const [recoveredCount, setRecoveredCount] = useState(team.recoveredCount || "");
  const [rescuedPetsCount, setRescuedPetsCount] = useState(team.rescuedPetsCount || "");
  const [prehospitalCareCount, setPrehospitalCareCount] = useState(team.prehospitalCareCount || "");
  const [transfersCount, setTransfersCount] = useState(team.transfersCount || "");

  const [saving, setSaving] = useState(false);

  const isPC = !team.department || team.department === "pc" || team.department.toLowerCase().includes("protección") || team.department.toLowerCase().includes("proteccion");
  const accentColor = isPC ? "var(--accent-orange)" : "#ef4444";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...team,
        groupName,
        unitOut,
        managerName,
        managerPhone,
        officersCount: parseInt(officersCount, 10) || 0,
        departureTime,
        arrivalTime,
        hasArrived,
        rescuedCount,
        recoveredCount,
        rescuedPetsCount,
        prehospitalCareCount,
        transfersCount,
      });
      onClose();
    } catch (err) {
      console.error("Error saving team edits:", err);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: "4px",
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0, 0, 0, 0.35)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "0.76rem",
    padding: "6px 10px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const statFieldStyle = (color: string): React.CSSProperties => ({
    textAlign: "center",
    padding: "6px 4px",
    fontSize: "0.8rem",
    fontWeight: 700,
    color,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid rgba(255,255,255,0.12)`,
    borderRadius: "6px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(10, 15, 26, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-secondary)",
          border: `1px solid ${accentColor}40`,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "20px",
          boxShadow: `0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px ${accentColor}10`,
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isPC ? <Shield size={16} style={{ color: "var(--accent-orange)" }} /> : <Flame size={16} style={{ color: "#ef4444" }} />}
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Editar Equipo
            </h3>
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                padding: "2px 5px",
                borderRadius: "3px",
                textTransform: "uppercase",
                background: isPC ? "rgba(249, 115, 22, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: isPC ? "var(--accent-orange)" : "#ef4444",
                border: `1px solid ${isPC ? "rgba(249, 115, 22, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              }}
            >
              {isPC ? "PC" : "Bomberos"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Section 1: Datos del Equipo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "4px" }}>
            <Users size={12} style={{ color: accentColor }} /> Datos Generales
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
            <div>
              <span style={labelStyle}>Nombre del Grupo</span>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Unidad / Vehículo</span>
              <input
                type="text"
                value={unitOut}
                onChange={(e) => setUnitOut(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
            <div>
              <span style={labelStyle}>Encargado / Responsable</span>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Teléfono</span>
              <input
                type="text"
                maxLength={12}
                value={managerPhone}
                onChange={(e) => setManagerPhone(formatPhone(e.target.value))}
                style={inputStyle}
                placeholder="Ej: 0414-1234567"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px", alignItems: "end" }}>
            <div>
              <span style={labelStyle}>Hora Salida (24h)</span>
              <Time24Input
                value={departureTime}
                onChange={setDepartureTime}
                placeholder="08:00"
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Hora Llegada (24h)</span>
              <Time24Input
                value={arrivalTime}
                onChange={(val) => {
                  setArrivalTime(val);
                  if (val && val.trim()) setHasArrived(true);
                }}
                placeholder="17:00"
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Funcionarios</span>
              <input
                type="number"
                min="0"
                value={officersCount}
                onChange={(e) => setOfficersCount(e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "4px" }}>
            <label
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: hasArrived ? "var(--color-green)" : "var(--accent-orange)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: hasArrived ? "not-allowed" : "pointer",
                userSelect: "none",
              }}
              title={hasArrived ? "Ya llegó del sitio — no se puede desmarcar" : ""}
            >
              <input
                type="checkbox"
                checked={hasArrived}
                disabled={hasArrived}
                onChange={(e) => { if (!hasArrived) setHasArrived(e.target.checked); }}
                style={{ cursor: hasArrived ? "not-allowed" : "pointer", width: "13px", height: "13px" }}
              />
              <span>{hasArrived ? "El equipo ya regresó a la base" : "El equipo sigue desplegado"}</span>
            </label>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: "1px", background: "var(--border-color)" }} />

        {/* Section 2: Estadísticas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={12} style={{ color: "var(--color-green)" }} /> Estadísticas del Despliegue
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--color-info)", display: "block", marginBottom: "3px" }}>Rescat.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={rescuedCount}
                onChange={(e) => setRescuedCount(e.target.value)}
                style={statFieldStyle("var(--color-info)")}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "#ef4444", display: "block", marginBottom: "3px" }}>Recup.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={recoveredCount}
                onChange={(e) => setRecoveredCount(e.target.value)}
                style={statFieldStyle("#ef4444")}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--color-green)", display: "block", marginBottom: "3px" }}>Masc.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={rescuedPetsCount}
                onChange={(e) => setRescuedPetsCount(e.target.value)}
                style={statFieldStyle("var(--color-green)")}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "#0ea5e9", display: "block", marginBottom: "3px" }}>Atenc.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={prehospitalCareCount}
                onChange={(e) => setPrehospitalCareCount(e.target.value)}
                style={statFieldStyle("#0ea5e9")}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--color-purple)", display: "block", marginBottom: "3px" }}>Trasl.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={transfersCount}
                onChange={(e) => setTransfersCount(e.target.value)}
                style={statFieldStyle("var(--color-purple)")}
              />
            </div>
          </div>
        </div>

         {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? "rgba(34, 197, 94, 0.2)" : accentColor,
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "6px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Save size={13} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};
