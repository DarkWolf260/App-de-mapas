import { useState, useEffect, useRef } from "react";
import { setToastListener, type ToastType } from "../utils/toast";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToastListener((message, type) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      setToast({ message, type });
      setVisible(true);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 4500);
    });

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  if (!toast) return null;

  const dismiss = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(false);
  };

  const palette =
    toast.type === "error"
      ? { bg: "rgba(127, 29, 29, 0.96)", border: "1px solid rgba(248, 113, 113, 0.6)", iconColor: "#fca5a5" }
      : toast.type === "success"
        ? { bg: "rgba(20, 83, 45, 0.96)", border: "1px solid rgba(74, 222, 128, 0.55)", iconColor: "#86efac" }
        : { bg: "rgba(15, 23, 42, 0.96)", border: "1px solid rgba(249, 115, 22, 0.45)", iconColor: "#fb923c" };

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return <AlertTriangle size={16} style={{ color: palette.iconColor, flexShrink: 0 }} />;
      case "success":
        return <CheckCircle size={16} style={{ color: palette.iconColor, flexShrink: 0 }} />;
      case "info":
      default:
        return <Info size={16} style={{ color: palette.iconColor, flexShrink: 0 }} />;
    }
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      style={{
        position: "fixed",
        top: "84px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-12px"})`,
        zIndex: 9999,
        maxWidth: "min(92vw, 480px)",
        padding: "10px 14px 10px 16px",
        borderRadius: "10px",
        background: palette.bg,
        border: palette.border,
        color: "#f8fafc",
        fontWeight: 600,
        fontSize: "0.8rem",
        lineHeight: 1.35,
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {getIcon()}
      <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{toast.message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar notificación"
        title="Cerrar notificación"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "none",
          borderRadius: "6px",
          color: "#f8fafc",
          width: "24px",
          height: "24px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
