import React from "react";
import type { RealtimeChannelStatus } from "../repositories/interfaces";

interface RealtimeStatusBadgeProps {
  status: RealtimeChannelStatus;
  className?: string;
}

export const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({ status, className = "" }) => {
  const getStatusInfo = () => {
    switch (status) {
      case "SUBSCRIBED":
        return {
          label: "En vivo",
          color: "bg-emerald-500",
          textColor: "text-emerald-700 dark:text-emerald-300",
          bgContainer: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
          pulse: true,
        };
      case "CONNECTING":
        return {
          label: "Conectando...",
          color: "bg-amber-500",
          textColor: "text-amber-700 dark:text-amber-300",
          bgContainer: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
          pulse: true,
        };
      case "TIMED_OUT":
      case "CLOSED":
      case "CHANNEL_ERROR":
      default:
        return {
          label: "Sin conexión",
          color: "bg-rose-500",
          textColor: "text-rose-700 dark:text-rose-300",
          bgContainer: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50",
          pulse: false,
        };
    }
  };

  const info = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors duration-200 ${info.bgContainer} ${info.textColor} ${className}`}
      title={`Estatus de sincronización en tiempo real: ${status}`}
    >
      <span className="relative flex h-2 w-2">
        {info.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${info.color} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${info.color}`} />
      </span>
      <span>{info.label}</span>
    </div>
  );
};
