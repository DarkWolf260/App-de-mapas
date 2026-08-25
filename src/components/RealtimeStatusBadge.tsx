import React from "react";
import type { RealtimeChannelStatus } from "../repositories/interfaces";

interface RealtimeStatusBadgeProps {
  status: RealtimeChannelStatus;
  className?: string;
}

export const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({ status, className = "" }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "SUBSCRIBED":
        return {
          label: "En línea",
          dotColor: "#22c55e",
          textColor: "#4ade80",
          bg: "rgba(34, 197, 94, 0.12)",
          border: "1px solid rgba(34, 197, 94, 0.35)",
          pulse: true,
        };
      case "CONNECTING":
        return {
          label: "Conectando...",
          dotColor: "#f59e0b",
          textColor: "#fbbf24",
          bg: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          pulse: true,
        };
      case "TIMED_OUT":
      case "CLOSED":
      case "CHANNEL_ERROR":
      default:
        return {
          label: "Sin conexión",
          dotColor: "#ef4444",
          textColor: "#f87171",
          bg: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          pulse: false,
        };
    }
  };

  const cfg = getStatusConfig();

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "20px",
        background: cfg.bg,
        border: cfg.border,
        color: cfg.textColor,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      title={`Estatus de conexión en tiempo real: ${status}`}
    >
      <span
        style={{
          position: "relative",
          display: "flex",
          width: "7px",
          height: "7px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cfg.pulse && (
          <span
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: cfg.dotColor,
              opacity: 0.6,
              animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        )}
        <span
          style={{
            position: "relative",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: cfg.dotColor,
            boxShadow: `0 0 6px ${cfg.dotColor}`,
          }}
        />
      </span>
      <span>{cfg.label}</span>
    </div>
  );
};
