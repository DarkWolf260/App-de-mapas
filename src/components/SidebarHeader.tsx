import React from "react";
import { Activity } from "lucide-react";

export const SidebarHeader: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "2px" }}>
    <Activity size={18} style={{ color: "var(--color-info)", flexShrink: 0 }} />
    <div>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#f8fafc", letterSpacing: "0.01em" }}>
        Centro de Mando
      </h2>
      <p style={{ fontSize: "0.68rem", margin: "1px 0 0 0", color: "var(--text-muted)", fontWeight: 500 }}>
        C.O.E - La Guaira
      </p>
    </div>
  </div>
);
