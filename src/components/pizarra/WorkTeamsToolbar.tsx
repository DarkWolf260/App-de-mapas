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
    className="pizarra-sort-dropdown"
    style={{
      position: "absolute",
      top: "34px",
      right: 0,
      left: "auto",
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
    <div className="pizarra-toolbar">
      {/* Search + Sort */}
      <div className="pizarra-toolbar-search">
        <div style={{ position: "relative", flex: 1, minWidth: "140px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar equipo, punto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pizarra-search-input"
          />
        </div>

        {viewMode === "cards" && (
          <div ref={sortRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={onToggleSort}
              className={`pizarra-icon-btn ${isSortOpen ? "active" : ""}`}
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

      {/* Dept Switcher */}
      <div className="pizarra-toolbar-dept">
        <div className="pizarra-dept-switch">
          <button
            type="button"
            onClick={() => onDeptFilterChange("pc")}
            className={`pizarra-dept-btn ${deptFilter === "pc" ? "active-pc" : ""}`}
          >
            <Shield size={13} /> <span>Protección Civil</span>
          </button>
          <button
            type="button"
            onClick={() => onDeptFilterChange("bomberos")}
            className={`pizarra-dept-btn ${deptFilter === "bomberos" ? "active-bomberos" : ""}`}
          >
            <Flame size={13} /> <span>Bomberos</span>
          </button>
          <button
            type="button"
            onClick={() => onDeptFilterChange("all")}
            className={`pizarra-dept-btn ${deptFilter === "all" ? "active-all" : ""}`}
          >
            <Users size={13} /> <span>Ambos</span>
          </button>
        </div>
      </div>

      {/* Stats and View Toggle */}
      <div className="pizarra-toolbar-stats">
        <div className="pizarra-stat-pill">
          <span className="pizarra-stat-label">Equipos</span>
          <span className="pizarra-stat-val" style={{ color: "#c084fc" }}>{totalTeams}</span>
        </div>

        <div className="pizarra-stat-pill">
          <span className="pizarra-stat-label">Efectivos</span>
          <span className="pizarra-stat-val" style={{ color: "var(--accent-orange)" }}>{totalOfficers}</span>
        </div>

        <div className="pizarra-view-switch">
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`pizarra-view-btn ${viewMode === "cards" ? "active" : ""}`}
            title="Vista de Tarjetas"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`pizarra-view-btn ${viewMode === "table" ? "active" : ""}`}
            title="Vista de Tabla"
          >
            <Table size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
