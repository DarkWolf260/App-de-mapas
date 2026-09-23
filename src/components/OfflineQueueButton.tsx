import React, { useState, useEffect } from "react";
import { Cloud, CloudUpload, CheckCircle } from "lucide-react";
import { subscribeToQueue, type SyncQueueItem } from "../services/syncQueueService";
import { OfflineQueueModal } from "./OfflineQueueModal";

export interface OfflineQueueButtonProps {
  canEdit?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const OfflineQueueButton: React.FC<OfflineQueueButtonProps> = ({
  canEdit = true,
  className = "",
  style = {},
}) => {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToQueue((newItems) => {
      setItems(newItems);
    });
    return unsub;
  }, []);

  const pendingCount = items.filter(
    (item) => item.status === "pending" || item.status === "failed" || item.status === "syncing"
  ).length;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
        title={
          pendingCount > 0
            ? `Cola local: ${pendingCount} registro(s) pendiente(s) de subir al servidor`
            : "Cola local: Todos los cambios están sincronizados"
        }
        style={{
          height: "34px",
          padding: pendingCount > 0 ? "0 12px" : "0 10px",
          borderRadius: "10px",
          border:
            pendingCount > 0
              ? "1px solid rgba(249, 115, 22, 0.45)"
              : "1px solid rgba(255, 255, 255, 0.14)",
          background:
            pendingCount > 0
              ? "linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(234, 88, 12, 0.1))"
              : "rgba(10, 15, 28, 0.9)",
          color: pendingCount > 0 ? "#fb923c" : "#94a3b8",
          fontSize: "0.74rem",
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            pendingCount > 0
              ? "0 0 14px rgba(249, 115, 22, 0.25)"
              : "0 4px 12px rgba(0, 0, 0, 0.3)",
          fontFamily: "var(--font-sans)",
          transition: "all 0.2s ease",
          ...style,
        }}
      >
        {pendingCount > 0 ? (
          <>
            <span
              style={{
                position: "relative",
                display: "flex",
                width: "8px",
                height: "8px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#f97316",
                  opacity: 0.75,
                  animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
              <span
                style={{
                  position: "relative",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#f97316",
                  boxShadow: "0 0 6px #f97316",
                }}
              />
            </span>
            <CloudUpload size={14} style={{ color: "#f97316" }} />
            <span>
              {pendingCount} {pendingCount === 1 ? "local" : "locales"}
            </span>
          </>
        ) : (
          <>
            <Cloud size={14} style={{ color: "#64748b" }} />
            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Cola</span>
          </>
        )}
      </button>

      <OfflineQueueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canEdit={canEdit}
      />
    </>
  );
};
