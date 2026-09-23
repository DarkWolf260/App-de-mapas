import { useState, useEffect } from "react";
import { setToastListener, type ToastType } from "../utils/toast";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setToastListener((message, type) => {
      setToast({ message, type });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    });
  }, []);

  if (!toast) return null;

  const getBackground = () => {
    switch (toast.type) {
      case "error":
        return "rgba(239, 68, 68, 0.95)";
      case "success":
        return "rgba(34, 197, 94, 0.95)";
      case "info":
      default:
        return "rgba(30, 41, 59, 0.96)";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return <AlertTriangle size={16} />;
      case "success":
        return <CheckCircle size={16} />;
      case "info":
      default:
        return <Info size={16} style={{ color: "#38bdf8" }} />;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-20px"})`,
        zIndex: 9999,
        padding: "10px 22px",
        borderRadius: "10px",
        background: getBackground(),
        border: toast.type === "info" ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.78rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      {getIcon()}
      {toast.message}
    </div>
  );
}
