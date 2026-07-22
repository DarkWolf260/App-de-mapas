import React from "react";
import { Activity } from "lucide-react";

export const SidebarHeader: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <h2 className="panel-title" style={{ fontSize: "1.1rem", marginBottom: "2px" }}>
      <Activity size={20} style={{ color: "var(--color-high)" }} />
      Centro de Mando
    </h2>
    <p className="panel-subtitle" style={{ fontSize: "0.8rem", marginBottom: "4px" }}>
      C.O.E - La Guaira
    </p>
  </div>
);
