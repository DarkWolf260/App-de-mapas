import React from "react";
import { Users, Server, CheckCircle, WifiOff, FileText, UserCheck } from "lucide-react";

interface MetricCardsProps {
  usersCount: number;
  logsCount: number;
  supabaseOk: boolean;
  latencyMs?: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconBg, iconColor, label, value }) => (
  <div className="admin-metric-card">
    <div className="admin-metric-icon" style={{ background: iconBg, border: `1px solid ${iconColor}`, color: iconColor }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-val">{value}</div>
    </div>
  </div>
);

export const MetricCards: React.FC<MetricCardsProps> = ({ usersCount, logsCount, supabaseOk, latencyMs }) => (
  <div className="admin-metric-cards-grid">
    <MetricCard
      icon={<Users size={20} />}
      iconBg="rgba(168, 85, 247, 0.15)"
      iconColor="#c084fc"
      label="Total Usuarios"
      value={<span style={{ color: "#c084fc" }}>{usersCount} Registrados</span>}
    />
    <MetricCard
      icon={<UserCheck size={20} />}
      iconBg="rgba(34, 197, 94, 0.15)"
      iconColor="#4ade80"
      label="Rol Actual"
      value={<span style={{ color: "#4ade80" }}>Administrador</span>}
    />
    <MetricCard
      icon={<FileText size={20} />}
      iconBg="rgba(56, 189, 248, 0.15)"
      iconColor="#38bdf8"
      label="Registros Diarios"
      value={<span style={{ color: "#f8fafc" }}>{logsCount} Sincronizados</span>}
    />
    <MetricCard
      icon={<Server size={20} />}
      iconBg={supabaseOk ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)"}
      iconColor={supabaseOk ? "#4ade80" : "#ef4444"}
      label="Base de Datos Supabase"
      value={
        supabaseOk ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 10px",
              borderRadius: "20px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              color: "#4ade80",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={13} /> En línea {latencyMs !== undefined ? `(${latencyMs}ms)` : ""}
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 10px",
              borderRadius: "20px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            <WifiOff size={13} /> Sin conexión
          </span>
        )
      }
    />
  </div>
);
