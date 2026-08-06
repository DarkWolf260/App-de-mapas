import React from "react";
import { UserCheck, Users, Database, Server, CheckCircle, WifiOff } from "lucide-react";

interface MetricCardsProps {
  pendingCount: number;
  campsCount: number;
  supabaseOk: boolean;
}

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconBg, iconColor, label, value }) => (
  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
    <div style={{ background: iconBg, border: `1px solid ${iconColor}`, color: iconColor, padding: "10px", borderRadius: "8px" }}>{icon}</div>
    <div>
      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 800 }}>{value}</div>
    </div>
  </div>
);

export const MetricCards: React.FC<MetricCardsProps> = ({ pendingCount, campsCount, supabaseOk }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
    <MetricCard
      icon={<UserCheck size={20} />}
      iconBg="rgba(249, 115, 22, 0.15)"
      iconColor="var(--accent-orange)"
      label="Usuarios Pendientes / Inactivos"
      value={<span style={{ color: pendingCount > 0 ? "var(--accent-orange)" : "#4ade80" }}>{pendingCount} Por Activar</span>}
    />
    <MetricCard
      icon={<Users size={20} />}
      iconBg="rgba(34, 197, 94, 0.15)"
      iconColor="#4ade80"
      label="Rol Actual"
      value={<span style={{ color: "#4ade80" }}>Administrador</span>}
    />
    <MetricCard
      icon={<Database size={20} />}
      iconBg="rgba(56, 189, 248, 0.15)"
      iconColor="#38bdf8"
      label="Bases Operacionales"
      value={<span style={{ color: "#f8fafc" }}>{campsCount} Registradas</span>}
    />
    <MetricCard
      icon={<Server size={20} />}
      iconBg={supabaseOk ? "rgba(168, 85, 247, 0.15)" : "rgba(239, 68, 68, 0.15)"}
      iconColor={supabaseOk ? "#c084fc" : "#ef4444"}
      label="Base de Datos Supabase"
      value={
        supabaseOk
          ? <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Conectado</span>
          : <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}><WifiOff size={14} /> Sin conexión</span>
      }
    />
  </div>
);
