import React from "react";
import { Activity } from "lucide-react";

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

interface StatsFieldProps {
  label: string;
  color: string;
  value: string;
  onChange: (value: string) => void;
}

const StatsField: React.FC<StatsFieldProps> = ({ label, color, value, onChange }) => (
  <div style={{ textAlign: "center" }}>
    <span style={{ fontSize: "0.55rem", fontWeight: 800, color, display: "block", marginBottom: "3px" }}>{label}</span>
    <input
      type="number"
      min="0"
      placeholder="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={statFieldStyle(color)}
    />
  </div>
);

interface WorkTeamStatsFieldsProps {
  rescuedCount: string;
  setRescuedCount: (value: string) => void;
  recoveredCount: string;
  setRecoveredCount: (value: string) => void;
  rescuedPetsCount: string;
  setRescuedPetsCount: (value: string) => void;
  prehospitalCareCount: string;
  setPrehospitalCareCount: (value: string) => void;
  transfersCount: string;
  setTransfersCount: (value: string) => void;
}

export const WorkTeamStatsFields: React.FC<WorkTeamStatsFieldsProps> = ({
  rescuedCount, setRescuedCount,
  recoveredCount, setRecoveredCount,
  rescuedPetsCount, setRescuedPetsCount,
  prehospitalCareCount, setPrehospitalCareCount,
  transfersCount, setTransfersCount,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "4px" }}>
      <Activity size={12} style={{ color: "var(--color-green)" }} /> Estadísticas del Despliegue
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
      <StatsField label="Rescat." color="var(--color-info)" value={rescuedCount} onChange={setRescuedCount} />
      <StatsField label="Recup." color="#ef4444" value={recoveredCount} onChange={setRecoveredCount} />
      <StatsField label="Masc." color="var(--color-green)" value={rescuedPetsCount} onChange={setRescuedPetsCount} />
      <StatsField label="Atenc." color="#0ea5e9" value={prehospitalCareCount} onChange={setPrehospitalCareCount} />
      <StatsField label="Trasl." color="var(--color-purple)" value={transfersCount} onChange={setTransfersCount} />
    </div>
  </div>
);
