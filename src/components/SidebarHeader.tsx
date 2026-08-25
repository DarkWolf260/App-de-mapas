import React from "react";
import { Activity } from "lucide-react";
import { RealtimeStatusBadge } from "./RealtimeStatusBadge";
import type { RealtimeChannelStatus } from "../repositories/interfaces";

interface SidebarHeaderProps {
  status?: RealtimeChannelStatus;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ status }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingBottom: "2px", width: "100%" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
    {status && <RealtimeStatusBadge status={status} />}
  </div>
);
