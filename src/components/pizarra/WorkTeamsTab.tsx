import React, { useState, useRef, useEffect } from "react";
import { Search, Truck, Clock, Phone, MapPin, Shield, Flame, Users, Pencil, LayoutGrid, Table, Filter, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { WorkTeam } from "./types";

type SortField = "groupName" | "pointTitle" | "unitOut" | "departureTime" | "arrivalTime" | "managerName" | "officersCount" | "hasArrived";

const getSortLabel = (field: SortField, direction: "asc" | "desc"): string => {
  const fieldLabels: Record<SortField, string> = {
    groupName: "Equipo",
    pointTitle: "Ubicación",
    unitOut: "Unidad",
    departureTime: "Hora Salida",
    arrivalTime: "Hora Llegada",
    managerName: "Encargado",
    officersCount: "Efectivos",
    hasArrived: "Estado",
  };
  const dirLabel = direction === "asc" ? "Asc" : "Desc";
  return `${fieldLabels[field]} (${dirLabel})`;
};

export interface WorkTeamsTabProps {
  workTeams: WorkTeam[];
  deptFilter: "all" | "pc" | "bomberos";
  setDeptFilter: (filter: "all" | "pc" | "bomberos") => void;
  onEditTeam?: (team: WorkTeam) => void;
  onDeleteTeam?: (team: WorkTeam) => void;
}

export const WorkTeamsTab: React.FC<WorkTeamsTabProps> = ({
  workTeams,
  deptFilter,
  setDeptFilter,
  onEditTeam,
  onDeleteTeam,
}) => {
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("groupName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSortOptionChange = (value: string) => {
    const [field, direction] = value.split("-") as [SortField, "asc" | "desc"];
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredTeams = workTeams.filter((t) => {
    const matchesSearch =
      t.groupName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      t.pointTitle.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      (t.unitOut || "").toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      (t.managerName || "").toLowerCase().includes(teamSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (deptFilter === "pc") {
      return (
        !t.department ||
        t.department === "pc" ||
        t.department.toLowerCase().includes("protección civil") ||
        t.department.toLowerCase().includes("proteccion civil")
      );
    }
    if (deptFilter === "bomberos") {
      return (
        t.department &&
        (t.department === "bomberos" ||
          t.department.toLowerCase().includes("bombero"))
      );
    }

    return true;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal === undefined || aVal === null) aVal = "";
    if (bVal === undefined || bVal === null) bVal = "";

    if (typeof aVal === "boolean") {
      return sortDirection === "asc"
        ? (aVal === bVal ? 0 : aVal ? -1 : 1)
        : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <main style={{ padding: "16px 24px 80px 24px", flex: 1, minHeight: 0, width: "100%", maxWidth: "1600px", margin: "0 auto", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", gap: "16px" }}>
      <style>{`
        .team-card-container {
          position: relative;
        }
        .team-card-edit-btn {
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.18s ease-in-out;
        }
        .team-card-container:hover .team-card-edit-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .team-table-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .team-table-row .table-edit-btn {
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.15s ease-in-out;
        }
        .team-table-row:hover .table-edit-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
      `}</style>

      {/* BARRA DE BÚSQUEDA Y METRICAS */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", width: "100%", minHeight: "44px" }}>

        {/* Controles de Búsqueda y Ordenamiento (Izquierda) */}
        <div style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "520px", minWidth: "280px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Buscador */}
          <div style={{ position: "relative", flex: 1.5, minWidth: "180px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar equipo, punto..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
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

          {/* Ordenador y Sentido (Tolva) con Menú Premium Customizado (Solo Icono) - Oculto en Modo Tabla */}
          {viewMode === "cards" && (
            <div ref={sortRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
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
                {/* 1. Direcciones */}
                <button
                  type="button"
                  onClick={() => {
                    setSortDirection("asc");
                    setIsSortOpen(false);
                  }}
                  style={{
                    width: "100%",
                    background: sortDirection === "asc" ? "rgba(249, 115, 22, 0.15)" : "transparent",
                    border: "none",
                    borderRadius: "5px",
                    color: sortDirection === "asc" ? "var(--accent-orange)" : "#f1f5f9",
                    fontSize: "0.7rem",
                    fontWeight: sortDirection === "asc" ? 700 : 500,
                    padding: "6px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "var(--sans-font)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (sortDirection !== "asc") {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortDirection !== "asc") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                >
                  <span>Orden: Ascendente</span>
                  {sortDirection === "asc" && <span style={{ fontSize: "0.6rem" }}>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortDirection("desc");
                    setIsSortOpen(false);
                  }}
                  style={{
                    width: "100%",
                    background: sortDirection === "desc" ? "rgba(249, 115, 22, 0.15)" : "transparent",
                    border: "none",
                    borderRadius: "5px",
                    color: sortDirection === "desc" ? "var(--accent-orange)" : "#f1f5f9",
                    fontSize: "0.7rem",
                    fontWeight: sortDirection === "desc" ? 700 : 500,
                    padding: "6px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "var(--sans-font)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (sortDirection !== "desc") {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortDirection !== "desc") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                >
                  <span>Orden: Descendente</span>
                  {sortDirection === "desc" && <span style={{ fontSize: "0.6rem" }}>✓</span>}
                </button>

                {/* Separador */}
                <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

                {/* 2. Campos de Ordenamiento */}
                {[
                  { field: "groupName", label: "Equipo" },
                  { field: "pointTitle", label: "Ubicación" },
                  { field: "unitOut", label: "Unidad" },
                  { field: "departureTime", label: "Hora Salida" },
                  { field: "arrivalTime", label: "Hora Llegada" },
                  { field: "managerName", label: "Encargado" },
                  { field: "officersCount", label: "Efectivos" },
                  { field: "hasArrived", label: "Estado" },
                ].map((opt) => {
                  const isSelected = sortField === opt.field;
                  return (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => {
                        setSortField(opt.field as SortField);
                        setIsSortOpen(false);
                      }}
                      style={{
                        width: "100%",
                        background: isSelected ? "rgba(249, 115, 22, 0.15)" : "transparent",
                        border: "none",
                        borderRadius: "5px",
                        color: isSelected ? "var(--accent-orange)" : "#f1f5f9",
                        fontSize: "0.7rem",
                        fontWeight: isSelected ? 700 : 500,
                        padding: "6px 10px",
                        textAlign: "left",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "var(--sans-font)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.color = "#fff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#f1f5f9";
                        }
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span style={{ fontSize: "0.6rem" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Filtro de Departamentos Centrado Absolutamente */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "center", zIndex: 10 }}>
          <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              type="button"
              onClick={() => setDeptFilter("pc")}
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
              onClick={() => setDeptFilter("bomberos")}
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
              onClick={() => setDeptFilter("all")}
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

        {/* Métricas y Alternador de Vista */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Equipos Registrados</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#c084fc", fontFamily: "var(--sans-font)" }}>{filteredTeams.length}</span>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Efectivos Totales</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
              {filteredTeams.reduce((sum, t) => sum + t.officersCount, 0)}
            </span>
          </div>

          {/* Alternador de Vista (Tarjetas / Tabla) */}
          <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "2px", borderRadius: "6px", border: "1px solid var(--border-color)", height: "30px", boxSizing: "border-box" }}>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
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
              onClick={() => setViewMode("table")}
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

      {viewMode === "cards" ? (
        /* VISTA EN TARJETAS */
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: "4px" }}>
          {sortedTeams.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
                width: "100%",
              }}
            >
              {sortedTeams.map((team) => {
                const isPC = !team.department || team.department === "pc" || team.department.toLowerCase().includes("protección") || team.department.toLowerCase().includes("proteccion");
                const isBomberos = team.department && (team.department === "bomberos" || team.department.toLowerCase().includes("bombero"));

                return (
                  <div
                    key={team.id}
                    className="team-card-container"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = isPC ? "rgba(249, 115, 22, 0.4)" : isBomberos ? "rgba(239, 68, 68, 0.4)" : "rgba(168, 85, 247, 0.4)";
                      e.currentTarget.style.boxShadow = isPC ? "0 4px 15px rgba(249, 115, 22, 0.15)" : isBomberos ? "0 4px 15px rgba(239, 68, 68, 0.15)" : "0 4px 15px rgba(168, 85, 247, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
                    }}
                  >
                    {/* Encabezado: Nombre del Grupo y Organismo */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>
                          {team.groupName}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "var(--text-muted)",
                            alignSelf: "flex-start",
                            letterSpacing: "0.05em",
                            marginTop: "2px"
                          }}
                        >
                          {isBomberos ? "Bomberos" : "Protección Civil"}
                        </span>
                      </div>
                      {onEditTeam && (
                        <div className="team-card-edit-btn" style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                          <button
                            type="button"
                            onClick={() => onEditTeam(team)}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "6px",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "5px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = isPC ? "rgba(249, 115, 22, 0.2)" : "rgba(239, 68, 68, 0.2)";
                              e.currentTarget.style.borderColor = isPC ? "rgba(249, 115, 22, 0.4)" : "rgba(239, 68, 68, 0.4)";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.currentTarget.style.color = "var(--text-muted)";
                            }}
                            title="Editar equipo y estadísticas"
                          >
                            <Pencil size={11} />
                          </button>
                          {onDeleteTeam && (
                            <button
                              type="button"
                              onClick={() => onDeleteTeam(team)}
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "5px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                                e.currentTarget.style.color = "#ef4444";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.color = "var(--text-muted)";
                              }}
                              title="Eliminar equipo"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ubicación */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", marginBottom: "4px" }}>
                      <MapPin size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                        {team.pointTitle}
                      </span>
                    </div>

                    {/* Detalles Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", marginTop: "4px" }}>
                      {/* Encargado */}
                      {team.managerName && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0 }}>Encargado:</span>
                          <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {team.managerName}
                            {team.managerPhone && (
                              <>
                                {" "}
                                <span style={{ fontSize: "0.78rem", color: "#cbd5e1", marginLeft: "4px" }}>
                                  ({team.managerPhone})
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Unidad */}
                      {team.unitOut && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0 }}>Unidad:</span>
                          <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Truck size={12} style={{ color: "#38bdf8", marginRight: "6px" }} />
                            {team.unitOut}
                          </span>
                        </div>
                      )}

                      {/* Horarios */}
                      {(team.departureTime || team.arrivalTime) && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0, marginTop: "2px" }}>Horarios:</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {team.departureTime && (
                              <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <Clock size={11} style={{ color: "var(--accent-orange)" }} />
                                {team.departureTime} <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(Salida)</span>
                              </span>
                            )}
                            {team.arrivalTime && (
                              <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <Clock size={11} style={{ color: "#4ade80" }} />
                                {team.arrivalTime} <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(Llegada)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Separador */}
                    <div style={{ height: "1px", background: "var(--border-color)", margin: "8px 0", marginTop: "auto" }} />

                    {/* Footer: Estado y Efectivos */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {/* Estado de Llegada */}
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: team.hasArrived ? "#4ade80" : "#f97316",
                          background: team.hasArrived ? "rgba(74, 222, 128, 0.15)" : "rgba(249, 115, 22, 0.15)",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          display: "inline-block",
                        }}
                      >
                        {team.hasArrived ? "En base" : "Desplegado"}
                      </span>

                      {/* Efectivos */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>EFECTIVOS:</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                          {team.officersCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA EN TABLA TRADICIONAL */
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "auto", flex: 1, minHeight: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
            <thead>
              <tr style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                <th 
                  onClick={() => handleSort("groupName")}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Equipo de Trabajo</span>
                    {sortField === "groupName" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("pointTitle")}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Ubicación / Punto</span>
                    {sortField === "pointTitle" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("unitOut")}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Unidad / Vehículo</span>
                    {sortField === "unitOut" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("departureTime")}
                  style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%" }}>
                    <span>Hora Salida</span>
                    {sortField === "departureTime" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("arrivalTime")}
                  style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%" }}>
                    <span>Hora Llegada</span>
                    {sortField === "arrivalTime" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("managerName")}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Encargado</span>
                    {sortField === "managerName" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("officersCount")}
                  style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%" }}>
                    <span>Efectivos</span>
                    {sortField === "officersCount" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("hasArrived")}
                  style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%" }}>
                    <span>Estado</span>
                    {sortField === "hasArrived" && (
                      sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />
                    )}
                  </div>
                </th>
                {onEditTeam && <th style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, userSelect: "none" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.length === 0 ? (
                <tr>
                  <td colSpan={onEditTeam ? 9 : 8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                    {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
                  </td>
                </tr>
              ) : (
                sortedTeams.map((team) => {
                  const isPC = !team.department || team.department === "pc" || team.department.toLowerCase().includes("protección") || team.department.toLowerCase().includes("proteccion");
                  const isBomberos = team.department && (team.department === "bomberos" || team.department.toLowerCase().includes("bombero"));

                  return (
                    <tr key={team.id} className="team-table-row" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "0.5rem",
                              fontWeight: 850,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              textTransform: "uppercase",
                              background: isBomberos ? "rgba(239, 68, 68, 0.15)" : "rgba(249, 115, 22, 0.15)",
                              color: isBomberos ? "#ef4444" : "var(--accent-orange)",
                            }}
                          >
                            {isBomberos ? "Bomberos" : "PC"}
                          </span>
                          <span>{team.groupName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <span>{team.pointTitle}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                        {team.unitOut ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Truck size={13} style={{ color: "#38bdf8" }} />
                            <span>{team.unitOut}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-main)", fontFamily: "var(--sans-font)", fontWeight: 600 }}>
                        {team.departureTime ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <Clock size={12} style={{ color: "var(--accent-orange)" }} />
                            <span>{team.departureTime}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-main)", fontFamily: "var(--sans-font)", fontWeight: 600 }}>
                        {team.arrivalTime ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <Clock size={12} style={{ color: "#4ade80" }} />
                            <span>{team.arrivalTime}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                        {team.managerName ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#f8fafc" }}>{team.managerName}</div>
                            {team.managerPhone && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><Phone size={10} /> {team.managerPhone}</div>}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                        {team.officersCount}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: team.hasArrived ? "#4ade80" : "#f97316",
                            background: team.hasArrived ? "rgba(74, 222, 128, 0.15)" : "rgba(249, 115, 22, 0.15)",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            display: "inline-block",
                          }}
                        >
                          {team.hasArrived ? "En base" : "Desplegado"}
                        </span>
                      </td>
                      {onEditTeam && (
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => onEditTeam(team)}
                              className="table-edit-btn"
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "5px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isPC ? "rgba(249, 115, 22, 0.2)" : "rgba(239, 68, 68, 0.2)";
                                e.currentTarget.style.borderColor = isPC ? "rgba(249, 115, 22, 0.4)" : "rgba(239, 68, 68, 0.4)";
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.color = "var(--text-muted)";
                              }}
                              title="Editar equipo"
                            >
                              <Pencil size={11} />
                            </button>
                            {onDeleteTeam && (
                              <button
                                type="button"
                                onClick={() => onDeleteTeam(team)}
                                className="table-edit-btn"
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "6px",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: "5px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                                  e.currentTarget.style.color = "#ef4444";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                                  e.currentTarget.style.color = "var(--text-muted)";
                                }}
                                title="Eliminar equipo"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};
