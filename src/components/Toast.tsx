import { useState, useEffect } from "react";
import { setToastListener } from "../utils/toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setToastListener((message, type) => {
      setToast({ message, type });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    });
  }, []);

  if (!toast) return null;

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
        background: toast.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 197, 94, 0.95)",
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
      {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
      {toast.message}
    </div>
  );
}
