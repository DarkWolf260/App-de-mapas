import React, { useState, useEffect } from "react";
import { X, Save, Users } from "lucide-react";
import { WorkTeam } from "./types";
import { Time24Input } from "../Time24Input";
import { formatPhone } from "../../utils/phoneFormatter";
import { fetchFeatures } from "../../services/featureService";
import { DrawnFeature } from "../../types";
import { LocationPicker } from "./LocationPicker";
import { DepartmentSelect } from "./DepartmentSelect";
import { WorkTeamStatsFields } from "./WorkTeamStatsFields";

interface CreateWorkTeamModalProps {
  onClose: () => void;
  onSave: (newTeam: Omit<WorkTeam, "id" | "groupIndex">) => Promise<void>;
}

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
  fontFamily: "'Outfit', sans-serif",
};

export const CreateWorkTeamModal: React.FC<CreateWorkTeamModalProps> = ({
  onClose,
  onSave,
}) => {
  const [features, setFeatures] = useState<DrawnFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | string | "">("");
  const [department, setDepartment] = useState<"pc" | "bomberos">("pc");
  const [groupName, setGroupName] = useState("");
  const [unitOut, setUnitOut] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [officersCount, setOfficersCount] = useState("0");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [hasArrived, setHasArrived] = useState(false);

  const [rescuedCount, setRescuedCount] = useState("");
  const [recoveredCount, setRecoveredCount] = useState("");
  const [rescuedPetsCount, setRescuedPetsCount] = useState("");
  const [prehospitalCareCount, setPrehospitalCareCount] = useState("");
  const [transfersCount, setTransfersCount] = useState("");

  const [saving, setSaving] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    fetchFeatures().then((feats) => {
      setFeatures(feats);
    });
  }, []);

  const handleSelectFeature = (id: number | string, title: string) => {
    setSelectedFeatureId(id);
    setLocationSearch(title);
  };

  const isPC = department === "pc";
  const accentColor = isPC ? "var(--accent-orange)" : "#ef4444";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeatureId === "" || selectedFeatureId === undefined || selectedFeatureId === null) {
      alert("Por favor selecciona una ubicación/punto.");
      return;
    }
    setSaving(true);
    try {
      const feat = features.find((f) => String(f.id) === String(selectedFeatureId));
      const pointTitle = feat ? feat.title : "Ubicación seleccionada";
      await onSave({
        featureId: selectedFeatureId,
        groupName: groupName.trim(),
        pointTitle,
        unitOut,
        managerName,
        managerPhone,
        officersCount: parseInt(officersCount, 10) || 0,
        departureTime,
        arrivalTime,
        hasArrived,
        department: department === "bomberos" ? "Bomberos" : "Protección Civil",
        rescuedCount,
        recoveredCount,
        rescuedPetsCount,
        prehospitalCareCount,
        transfersCount,
      });
      onClose();
    } catch (err) {
      console.error("Error creating work team:", err);
    } finally {
      setSaving(false);
    }
  };

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={16} style={{ color: accentColor }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Agregar Nuevo Equipo
            </h3>
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

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", alignItems: "start" }}>
          <LocationPicker
            features={features}
            selectedFeatureId={selectedFeatureId}
            search={locationSearch}
            onSearchChange={setLocationSearch}
            onSelect={handleSelectFeature}
            onClear={() => {
              setLocationSearch("");
              setSelectedFeatureId("");
            }}
          />
          <DepartmentSelect value={department} onChange={setDepartment} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
            <div>
              <span style={labelStyle}>Nombre del Grupo</span>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={inputStyle}
                placeholder="Ej: Grupo 3-A"
              />
            </div>
            <div>
              <span style={labelStyle}>Unidad / Vehículo</span>
              <input
                type="text"
                value={unitOut}
                onChange={(e) => setUnitOut(e.target.value)}
                style={inputStyle}
                placeholder="Ej: Lara (1548)"
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
                placeholder="Ej: Diego Perez"
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
                  // Al registrar hora de llegada, marcar automáticamente como llegado
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

        <div style={{ height: "1px", background: "var(--border-color)" }} />

        <WorkTeamStatsFields
          rescuedCount={rescuedCount}
          setRescuedCount={setRescuedCount}
          recoveredCount={recoveredCount}
          setRecoveredCount={setRecoveredCount}
          rescuedPetsCount={rescuedPetsCount}
          setRescuedPetsCount={setRescuedPetsCount}
          prehospitalCareCount={prehospitalCareCount}
          setPrehospitalCareCount={setPrehospitalCareCount}
          transfersCount={transfersCount}
          setTransfersCount={setTransfersCount}
        />

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
              fontFamily: "'Outfit', sans-serif",
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
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <Save size={13} />
            {saving ? "Guardando..." : "Agregar Equipo"}
          </button>
        </div>
      </form>
    </div>
  );
};
