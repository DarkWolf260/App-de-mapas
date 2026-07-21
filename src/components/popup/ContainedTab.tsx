import React from "react";

interface ContainedItem {
  title: string;
  type: string;
}

interface ContainedTabProps {
  items: ContainedItem[];
}

export const ContainedTab: React.FC<ContainedTabProps> = ({ items }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "3px" }}>
      Elementos Contenidos ({items.length})
    </div>

    {items.length > 0 ? (
      <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.7rem", maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              color:
                item.type === "polygon"
                  ? "var(--color-info)"
                  : item.type === "polyline"
                    ? "var(--color-purple)"
                    : "var(--color-green)",
            }}
          >
            {item.title}
          </li>
        ))}
      </ul>
    ) : (
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
        No se detectaron puntos o líneas dentro de este área.
      </div>
    )}
  </div>
);
