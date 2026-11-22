import React from "react";
import { RefreshCw } from "lucide-react";
import type { RealtimeChannelStatus } from "../repositories/interfaces";

interface RealtimeStatusBadgeProps {
  status: RealtimeChannelStatus;
  className?: string;
  onRetry?: () => void;
}

export const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({
  status,
  className = "",
  onRetry,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "SUBSCRIBED":
        return {
          label: "En línea",
          dotColor: "#22c55e",
          textColor: "#86efac",
          bg: "rgba(20, 83, 45, 0.55)",
          border: "1px solid rgba(74, 222, 128, 0.4)",
          pulse: true,
          disconnected: false,
        };
      case "CONNECTING":
        return {
          label: "Conectando",
          dotColor: "#f59e0b",
          textColor: "#fde68a",
          bg: "rgba(120, 53, 15, 0.5)",
          border: "1px solid rgba(251, 191, 36, 0.45)",
          pulse: true,
          disconnected: false,
        };
      case "TIMED_OUT":
      case "CLOSED":
      case "CHANNEL_ERROR":
      default:
        return {
          label: onRetry ? "Sin enlace · Reintentar" : "Sin enlace",
          dotColor: "#ef4444",
          textColor: "#fca5a5",
          bg: "rgba(127, 29, 29, 0.7)",
          border: "1px solid rgba(248, 113, 113, 0.55)",
          pulse: false,
          disconnected: true,
        };
    }
  };

  const cfg = getStatusConfig();

  const sharedStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    background: cfg.bg,
    border: cfg.border,
    color: cfg.textColor,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    fontFamily: "var(--font-sans)",
  };

  const dot = (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "flex",
        width: "7px",
        height: "7px",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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
        }}
      />
    </span>
  );

  if (cfg.disconnected && onRetry) {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={className}
        role="status"
        aria-live="polite"
        style={{ ...sharedStyle, cursor: "pointer" }}
        title={`Sin conexión en tiempo real (${status}). Clic para recargar datos.`}
      >
        {dot}
        <span>{cfg.label}</span>
        <RefreshCw size={11} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      style={sharedStyle}
      title={`Estado de sincronización en tiempo real: ${status}`}
    >
      {dot}
      <span>{cfg.label}</span>
    </div>
  );
};
