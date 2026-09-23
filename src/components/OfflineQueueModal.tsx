import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  FileText,
  Bell,
  Calendar,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import {
  getQueueItems,
  subscribeToQueue,
  syncAllPending,
  syncSingleItem,
  removeQueueItem,
  clearCompletedItems,
  clearAllQueue,
  type SyncQueueItem,
  type EntityType,
} from "../services/syncQueueService";
import { showToast } from "../utils/toast";

export interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  canEdit = true,
}) => {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    const unsub = subscribeToQueue((newItems) => {
      setItems(newItems);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const pendingItems = items.filter(
    (item) => item.status === "pending" || item.status === "failed" || item.status === "syncing"
  );
  const historyItems = items.filter((item) => item.status === "synced");

  const displayedItems = activeTab === "pending" ? pendingItems : historyItems;

  const handleSyncAll = async () => {
    if (isSyncing || pendingItems.length === 0) return;
    setIsSyncing(true);
    setSyncProgress("Iniciando sincronización...");
    try {
      const res = await syncAllPending();
      if (res.failed === 0 && res.succeeded > 0) {
        showToast(`¡${res.succeeded} registro(s) sincronizados con éxito!`, "success");
      } else if (res.failed > 0) {
        showToast(
          `Sincronizados ${res.succeeded} de ${res.total}. Hubo ${res.failed} error(es).`,
          "error"
        );
      } else {
        showToast("Todo está al día con el servidor.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al sincronizar con el servidor.", "error");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleSyncSingle = async (item: SyncQueueItem) => {
    setIsSyncing(true);
    try {
      const ok = await syncSingleItem(item);
      if (ok) {
        showToast(`"${item.title}" sincronizado.`, "success");
      } else {
        showToast(`Error al sincronizar "${item.title}".`, "error");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    removeQueueItem(id);
    showToast("Registro eliminado de la cola local.", "info");
  };

  const handleClearHistory = () => {
    clearCompletedItems();
    showToast("Historial sincronizado limpiado.", "info");
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return iso;
    }
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case "feature":
        return <MapPin size={15} style={{ color: "#38bdf8" }} />;
      case "log":
        return <FileText size={15} style={{ color: "#a855f7" }} />;
      case "novedad":
        return <Bell size={15} style={{ color: "#f97316" }} />;
      case "daily_activity":
        return <Calendar size={15} style={{ color: "#10b981" }} />;
    }
  };

  const getEntityBadge = (type: EntityType) => {
    switch (type) {
      case "feature":
        return { label: "Punto / Área", bg: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "rgba(56, 189, 248, 0.3)" };
      case "log":
        return { label: "Bitácora", bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "rgba(168, 85, 247, 0.3)" };
      case "novedad":
        return { label: "Novedad", bg: "rgba(249, 115, 22, 0.15)", color: "#fb923c", border: "rgba(249, 115, 22, 0.3)" };
      case "daily_activity":
        return { label: "Actividad", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
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
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          maxHeight: "85vh",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 29, 0.98))",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "18px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#f8fafc",
          fontFamily: "var(--font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.1))",
                border: "1px solid rgba(249,115,22,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f97316",
              }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Cola Local de Envíos
              </h3>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Formularios y cambios almacenados localmente en el dispositivo
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs & Stats */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: activeTab === "pending" ? "1px solid rgba(249, 115, 22, 0.5)" : "1px solid transparent",
                background: activeTab === "pending" ? "rgba(249, 115, 22, 0.15)" : "transparent",
                color: activeTab === "pending" ? "#f97316" : "var(--text-muted)",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Listos para subir</span>
              <span
                style={{
                  background: pendingItems.length > 0 ? "rgba(249, 115, 22, 0.3)" : "rgba(255, 255, 255, 0.1)",
                  color: pendingItems.length > 0 ? "#fb923c" : "#94a3b8",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                }}
              >
                {pendingItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: activeTab === "history" ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid transparent",
                background: activeTab === "history" ? "rgba(34, 197, 94, 0.15)" : "transparent",
                color: activeTab === "history" ? "#4ade80" : "var(--text-muted)",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Sincronizados</span>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                }}
              >
                {historyItems.length}
              </span>
            </button>
          </div>

          {canEdit && activeTab === "pending" && pendingItems.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: isSyncing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isSyncing ? 0.7 : 1,
                boxShadow: "0 2px 10px rgba(249, 115, 22, 0.35)",
              }}
            >
              <RefreshCw size={13} className={isSyncing ? "spin-icon" : ""} />
              <span>{isSyncing ? "Sincronizando..." : "Sincronizar todo"}</span>
            </button>
          )}

          {activeTab === "history" && historyItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Trash2 size={12} />
              <span>Limpiar historial</span>
            </button>
          )}
        </div>

        {/* List Content */}
        <div
          style={{
            padding: "16px 20px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {displayedItems.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "var(--text-muted)",
                gap: "12px",
              }}
            >
              {activeTab === "pending" ? (
                <>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4ade80",
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#f8fafc", fontSize: "0.95rem" }}>
                      ¡Todo está al día!
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.78rem" }}>
                      No tienes registros locales pendientes de subir al servidor.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <CloudOff size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#f8fafc", fontSize: "0.95rem" }}>
                      Sin historial reciente
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.78rem" }}>
                      Los registros que sincronices aparecerán listados aquí.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            displayedItems.map((item) => {
              const badge = getEntityBadge(item.entityType);
              const isPending = item.status === "pending";
              const isFailed = item.status === "failed";
              const isSyncingItem = item.status === "syncing";
              const isSynced = item.status === "synced";

              return (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: isFailed
                      ? "1px solid rgba(239, 68, 68, 0.35)"
                      : isPending
                      ? "1px solid rgba(249, 115, 22, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, minWidth: 0 }}>
                    <div style={{ marginTop: "2px" }}>{getEntityIcon(item.entityType)}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            textTransform: "uppercase",
                          }}
                        >
                          {badge.label}
                        </span>

                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#ffffff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </span>
                      </div>

                      {item.details && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#94a3b8",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.details}
                        </span>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.68rem" }}>
                        <span style={{ color: "#64748b" }}>{formatTimestamp(item.createdAt)}</span>

                        {isPending && (
                          <span style={{ color: "#fb923c", fontWeight: 700 }}>
                            • Pendiente en cola
                          </span>
                        )}

                        {isSyncingItem && (
                          <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                            • Subiendo...
                          </span>
                        )}

                        {isFailed && (
                          <span style={{ color: "#f87171", fontWeight: 700 }} title={item.errorMessage}>
                            • Error: {item.errorMessage || "Fallo de conexión"}
                          </span>
                        )}

                        {isSynced && (
                          <span style={{ color: "#4ade80", fontWeight: 700 }}>
                            • Sincronizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {canEdit && (isPending || isFailed) && (
                      <button
                        onClick={() => handleSyncSingle(item)}
                        disabled={isSyncing}
                        title="Subir este registro ahora"
                        style={{
                          background: "rgba(249, 115, 22, 0.15)",
                          border: "1px solid rgba(249, 115, 22, 0.35)",
                          borderRadius: "8px",
                          color: "#f97316",
                          width: "30px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isSyncing ? "not-allowed" : "pointer",
                        }}
                      >
                        <Send size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Descartar de la cola local"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#94a3b8",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "10px 20px",
            background: "rgba(0, 0, 0, 0.3)",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Sparkles size={12} style={{ color: "#f97316" }} />
            Los datos se almacenan de forma segura en tu navegador.
          </span>
          {pendingItems.length > 0 && (
            <span style={{ color: "#fb923c", fontWeight: 700 }}>
              {pendingItems.length} registro(s) por sincronizar
            </span>
          )}
        </div>
      </div>
      <style>{`
        .spin-icon {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
