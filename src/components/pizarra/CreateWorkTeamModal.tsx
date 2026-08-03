import React, { useState, useEffect, useRef } from "react";
import { X, Save, Clock, Truck, Shield, Flame, Users, Activity, Search, MapPin, ChevronDown, Check } from "lucide-react";
import { WorkTeam } from "./types";
import { Time24Input } from "../Time24Input";
import { formatPhone } from "../../utils/phoneFormatter";
import { fetchFeatures } from "../../services/featureService";
import { DrawnFeature } from "../../types";

interface CreateWorkTeamModalProps {
  onClose: () => void;
  onSave: (newTeam: Omit<WorkTeam, "id" | "groupIndex">) => Promise<void>;
}

export const CreateWorkTeamModal: React.FC<CreateWorkTeamModalProps> = ({
  onClose,
  onSave,
}) => {
  const [features, setFeatures] = useState<DrawnFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | "">("");
  const [department, setDepartment] = useState<"pc" | "bomberos">("pc");
  const [groupName, setGroupName] = useState("");
  const [unitOut, setUnitOut] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [officersCount, setOfficersCount] = useState("0");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [hasArrived, setHasArrived] = useState(false);

  // Statistics
  const [rescuedCount, setRescuedCount] = useState("");
  const [recoveredCount, setRecoveredCount] = useState("");
  const [rescuedPetsCount, setRescuedPetsCount] = useState("");
  const [prehospitalCareCount, setPrehospitalCareCount] = useState("");
  const [transfersCount, setTransfersCount] = useState("");

  const [saving, setSaving] = useState(false);

  // Location search dropdown
  const [locationSearch, setLocationSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  // Department dropdown
  const [deptOpen, setDeptOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeatures().then((feats) => {
      setFeatures(feats);
    });
  }, []);

  const filteredFeatures = features.filter((f) =>
    f.title.toLowerCase().includes(locationSearch.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectFeature = (id: number, title: string) => {
    setSelectedFeatureId(id);
    setLocationSearch(title);
    setLocationOpen(false);
  };

  const isPC = department === "pc";
  const accentColor = isPC ? "var(--accent-orange)" : "#ef4444";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeatureId === "") {
      alert("Por favor selecciona una ubicación/punto.");
      return;
    }
    setSaving(true);
    try {
      const feat = features.find((f) => f.id === selectedFeatureId);
      const pointTitle = feat ? feat.title : "Ubicación seleccionada";
      await onSave({
        featureId: Number(selectedFeatureId),
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    background: "rgba(10, 15, 29, 0.95)",
    color: "#fff",
    cursor: "pointer",
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
    fontFamily: "'Outfit', sans-serif",
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

        {/* Section 1: Datos de Ubicación y Organismo */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", alignItems: "start" }}>
          <div>
            <span style={labelStyle}>Ubicación / Punto de Control</span>
            <div style={{ position: "relative" }} ref={locationRef}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setLocationOpen(true);
                  }}
                  onFocus={() => setLocationOpen(true)}
                  placeholder="Buscar ubicación..."
                  style={{ ...inputStyle, paddingLeft: "30px", paddingRight: "28px" }}
                />
                {locationSearch !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationSearch("");
                      setSelectedFeatureId("");
                    }}
                    title="Limpiar búsqueda"
                    style={{
                      position: "absolute",
                      right: 7,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {locationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    maxHeight: "220px",
                    overflowY: "auto",
                    background: "rgba(10, 15, 29, 0.98)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    zIndex: 30,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
                  }}
                >
                  {filteredFeatures.length === 0 ? (
                    <div style={{ padding: "14px", color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "center" }}>
                      No se encontraron ubicaciones
                    </div>
                  ) : (
                    filteredFeatures.map((f) => {
                      const selected = f.id === selectedFeatureId;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleSelectFeature(f.id, f.title)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            background: selected ? "rgba(249, 115, 22, 0.14)" : "transparent",
                            border: "none",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            color: selected ? "var(--accent-orange)" : "#f8fafc",
                            fontSize: "0.74rem",
                            fontFamily: "'Outfit', sans-serif",
                            boxSizing: "border-box",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = selected ? "rgba(249, 115, 22, 0.14)" : "transparent";
                          }}
                        >
                          <MapPin size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span>
                          {selected && <Check size={13} />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <span style={labelStyle}>Organismo / Departamento</span>
            <div style={{ position: "relative" }} ref={deptRef}>
              <button
                type="button"
                onClick={() => setDeptOpen((o) => !o)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  background: "rgba(10, 15, 29, 0.95)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.76rem",
                  padding: "6px 10px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isPC ? <Shield size={14} style={{ color: "var(--accent-orange)" }} /> : <Flame size={14} style={{ color: "#ef4444" }} />}
                  {isPC ? "Protección Civil" : "Bomberos"}
                </span>
                <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: deptOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }} />
              </button>

              {deptOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "rgba(10, 15, 29, 0.98)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    zIndex: 30,
                    overflow: "hidden",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment("pc");
                      setDeptOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 10px",
                      background: isPC ? "rgba(249, 115, 22, 0.14)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      color: isPC ? "var(--accent-orange)" : "#f8fafc",
                      fontSize: "0.74rem",
                      fontFamily: "'Outfit', sans-serif",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (!isPC) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isPC ? "rgba(249, 115, 22, 0.14)" : "transparent";
                    }}
                  >
                    <Shield size={14} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Protección Civil (PC)</span>
                    {isPC && <Check size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment("bomberos");
                      setDeptOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 10px",
                      background: !isPC ? "rgba(239, 68, 68, 0.14)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: !isPC ? "#ef4444" : "#f8fafc",
                      fontSize: "0.74rem",
                      fontFamily: "'Outfit', sans-serif",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (isPC) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !isPC ? "rgba(239, 68, 68, 0.14)" : "transparent";
                    }}
                  >
                    <Flame size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Bomberos</span>
                    {!isPC && <Check size={13} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Datos del Equipo */}
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
                onChange={setArrivalTime}
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
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: hasArrived ? "var(--color-green)" : "var(--accent-orange)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={hasArrived}
                onChange={(e) => setHasArrived(e.target.checked)}
                style={{ cursor: "pointer", width: "13px", height: "13px" }}
              />
              <span>{hasArrived ? "El equipo ya regresó a la base" : "El equipo sigue desplegado"}</span>
            </label>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: "1px", background: "var(--border-color)" }} />

        {/* Section 4: Estadísticas */}
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
