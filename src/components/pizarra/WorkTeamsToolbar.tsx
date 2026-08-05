import React from "react";
import { Search, Filter, Shield, Flame, Users, LayoutGrid, Table } from "lucide-react";
import { SORT_FIELDS, SortField, SortDirection } from "./workTeamsSort";

export type DeptFilter = "all" | "pc" | "bomberos";
export type ViewMode = "cards" | "table";

interface WorkTeamsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  deptFilter: DeptFilter;
  onDeptFilterChange: (filter: DeptFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortField: (field: SortField) => void;
  onSortDirection: (direction: SortDirection) => void;
  isSortOpen: boolean;
  onToggleSort: () => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  totalTeams: number;
  totalOfficers: number;
}

interface SortDropdownProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortField: (field: SortField) => void;
  onSortDirection: (direction: SortDirection) => void;
  onClose: () => void;
}

const sortOptionStyle = (selected: boolean): React.CSSProperties => ({
  width: "100%",
  background: selected ? "rgba(249, 115, 22, 0.15)" : "transparent",
  border: "none",
  borderRadius: "5px",
  color: selected ? "var(--accent-orange)" : "#f1f5f9",
  fontSize: "0.7rem",
  fontWeight: selected ? 700 : 500,
  padding: "6px 10px",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  fontFamily: "var(--sans-font)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const SortDropdown: React.FC<SortDropdownProps> = ({ sortField, sortDirection, onSortField, onSortDirection, onClose }) => (
  <div
    style={{
      position: "absolute",
      top: "34px",
      left: 0,
      width: "200px",
      background: "rgba(13, 17, 24, 0.98)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      borderRadius: "8px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      zIndex: 999,
      padding: "4px",
    }}
  >
    <button
      type="button"
      onClick={() => { onSortDirection("asc"); onClose(); }}
      style={sortOptionStyle(sortDirection === "asc")}
    >
      <span>Orden: Ascendente</span>
      {sortDirection === "asc" && <span style={{ fontSize: "0.6rem" }}>✓</span>}
    </button>
    <button
      type="button"
      onClick={() => { onSortDirection("desc"); onClose(); }}
      style={sortOptionStyle(sortDirection === "desc")}
    >
      <span>Orden: Descendente</span>
      {sortDirection === "desc" && <span style={{ fontSize: "0.6rem" }}>✓</span>}
    </button>

    <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

    {SORT_FIELDS.map((opt) => {
      const isSelected = sortField === opt.field;
      return (
        <button
          key={opt.field}
          type="button"
          onClick={() => { onSortField(opt.field); onClose(); }}
          style={sortOptionStyle(isSelected)}
        >
          <span>{opt.label}</span>
          {isSelected && <span style={{ fontSize: "0.6rem" }}>✓</span>}
        </button>
      );
    })}
  </div>
);

export const WorkTeamsToolbar: React.FC<WorkTeamsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  viewMode,
  onViewModeChange,
  sortField,
  sortDirection,
  onSortField,
  onSortDirection,
  isSortOpen,
  onToggleSort,
  sortRef,
  totalTeams,
  totalOfficers,
}) => {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", width: "100%", minHeight: "44px" }}>
      <div style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "520px", minWidth: "280px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1.5, minWidth: "180px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar equipo, punto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.76rem",
              padding: "6px 10px 6px 32px",
              outline: "none",
              fontFamily: "var(--sans-font)",
            }}
          />
        </div>

        {viewMode === "cards" && (
          <div ref={sortRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={onToggleSort}
              style={{
                width: "30px",
                height: "30px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: isSortOpen ? "var(--accent-orange)" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                if (!isSortOpen) e.currentTarget.style.color = "var(--accent-orange)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                if (!isSortOpen) e.currentTarget.style.color = "#fff";
              }}
              title="Filtros y Ordenación"
            >
              <Filter size={14} />
            </button>

            {isSortOpen && (
              <SortDropdown
                sortField={sortField}
                sortDirection={sortDirection}
                onSortField={onSortField}
                onSortDirection={onSortDirection}
                onClose={onToggleSort}
              />
            )}
          </div>
        )}
      </div>

      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "center", zIndex: 10 }}>
        <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button
            type="button"
            onClick={() => onDeptFilterChange("pc")}
            style={{
              background: deptFilter === "pc" ? "var(--accent-orange)" : "transparent",
              color: deptFilter === "pc" ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Shield size={13} /> Protección Civil
          </button>
          <button
            type="button"
            onClick={() => onDeptFilterChange("bomberos")}
            style={{
              background: deptFilter === "bomberos" ? "#ef4444" : "transparent",
              color: deptFilter === "bomberos" ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Flame size={13} /> Bomberos
          </button>
          <button
            type="button"
            onClick={() => onDeptFilterChange("all")}
            style={{
              background: deptFilter === "all" ? "#a855f7" : "transparent",
              color: deptFilter === "all" ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Users size={13} /> Ambos
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto" }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Equipos Registrados</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#c084fc", fontFamily: "var(--sans-font)" }}>{totalTeams}</span>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Efectivos Totales</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
            {totalOfficers}
          </span>
        </div>

        <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "2px", borderRadius: "6px", border: "1px solid var(--border-color)", height: "30px", boxSizing: "border-box" }}>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            style={{
              background: viewMode === "cards" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: "none",
              borderRadius: "4px",
              color: viewMode === "cards" ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Vista de Tarjetas"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            style={{
              background: viewMode === "table" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: "none",
              borderRadius: "4px",
              color: viewMode === "table" ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Vista de Tabla"
          >
            <Table size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
