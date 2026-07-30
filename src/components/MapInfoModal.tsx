import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";
import { isSectorFeature } from "../utils/searchUtils";
import {
  FileSpreadsheet,
  X,
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  Shield,
  Flame,
} from "lucide-react";

interface MapInfoModalProps {
  drawnFeatures: DrawnFeature[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onClose: () => void;
  activeDepartment: DepartmentView;
  canEdit?: boolean;
}

export const MapInfoModal: React.FC<MapInfoModalProps> = ({
  drawnFeatures,
  selectedDate,
  onSelectedDateChange,
  onClose,
  activeDepartment,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<DepartmentView>(activeDepartment || "mixto");
  const [statusFilter, setStatusFilter] = useState<"all" | "arrived" | "pending">("all");

  // Flatten all work team records for the selected date across features
  const teamRecords = useMemo(() => {
    const records: Array<{
      id: string;
      featureId: number;
      locationTitle: string;
      isSector: boolean;
      department: string;
      isVolunteer?: boolean;
      groupName: string;
      unitOut: string;
      departureTime: string;
      arrivalTime: string;
      managerName: string;
      managerPhone: string;
      officersCount: string;
      hasArrived: boolean;
    }> = [];

    for (const feat of drawnFeatures) {
      if (!feat.dailyLogs) continue;
      const dayLogs = feat.dailyLogs.filter((l) => l.date === selectedDate);

      for (const log of dayLogs) {
        const logDept = log.department || "pc";
        if (deptFilter !== "mixto" && logDept !== deptFilter) continue;

        if (log.groups && log.groups.length > 0) {
          for (let i = 0; i < log.groups.length; i++) {
            const g = log.groups[i];
            const name = g.groupName?.trim();
            // Skip empty group slots
            if (!name && !g.managerName && !g.unitOut && !g.managerPhone) continue;

            records.push({
              id: `${feat.id}-${logDept}-${g.id || i}`,
              featureId: feat.id,
              locationTitle: feat.title || `Sitio ${feat.id}`,
              isSector: isSectorFeature(feat),
              department: logDept,
              isVolunteer: !!g.isVolunteer,
              groupName: name || `Grupo ${i + 1}`,
              unitOut: g.unitOut || "-",
              departureTime: g.departureTime || "-",
              arrivalTime: g.arrivalTime || "-",
              managerName: g.managerName || "-",
              managerPhone: g.managerPhone || "-",
              officersCount: g.officersCount || "0",
              hasArrived: !!g.hasArrived,
            });
          }
        }
      }
    }

    return records;
  }, [drawnFeatures, selectedDate, deptFilter]);

  // Filtered records according to search query and status filter
  const filteredRecords = useMemo(() => {
    return teamRecords.filter((r) => {
      // Status filter
      if (statusFilter === "arrived" && !r.hasArrived) return false;
      if (statusFilter === "pending" && r.hasArrived) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.groupName.toLowerCase().includes(q) ||
        r.locationTitle.toLowerCase().includes(q) ||
        r.managerName.toLowerCase().includes(q) ||
        r.managerPhone.toLowerCase().includes(q) ||
        r.unitOut.toLowerCase().includes(q)
      );
    });
  }, [teamRecords, statusFilter, searchQuery]);

  // Key KPI stats
  const stats = useMemo(() => {
    const totalTeams = teamRecords.length;
    const arrivedTeams = teamRecords.filter((r) => r.hasArrived).length;
    const pendingTeams = totalTeams - arrivedTeams;
    const totalOfficers = teamRecords.reduce(
      (acc, r) => acc + (parseInt(r.officersCount, 10) || 0),
      0
    );
    const uniqueLocations = new Set(teamRecords.map((r) => r.locationTitle)).size;

    return { totalTeams, arrivedTeams, pendingTeams, totalOfficers, uniqueLocations };
  }, [teamRecords]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const exportRows: WorkTeamExportRow[] = filteredRecords.map((r) => ({
      date: selectedDate,
      department: r.isVolunteer
        ? "Voluntarios"
        : r.department === "bomberos"
        ? "Bomberos"
        : "Protección Civil",
      locationTitle: r.locationTitle,
      groupName: r.groupName,
      unitOut: r.unitOut,
      departureTime: r.departureTime,
      arrivalTime: r.arrivalTime,
      managerName: r.managerName,
      managerPhone: r.managerPhone,
      officersCount: r.officersCount,
      hasArrived: r.hasArrived ? "Regresó" : "Pendiente",
    }));

    exportWorkTeamsToExcel(exportRows, selectedDate);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10, 15, 29, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        color: "var(--text-main)",
        fontFamily: "var(--font-sans)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(16, 24, 40, 0.8)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 14px rgba(56, 189, 248, 0.3)",
              color: "#fff",
            }}
          >
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
              Información del Mapa y Equipos de Trabajo
            </h2>
            <p style={{ fontSize: "0.72rem", margin: "1px 0 0", color: "var(--text-muted)" }}>
              Consulta operativa de ubicaciones, encargados, horarios y exportación a Tabla Excel
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "7px",
              border: "1px solid #16a34a",
              background: "linear-gradient(135deg, #15803d, #166534)",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              transition: "all 0.2s ease",
            }}
            title="Exportar archivo de Tabla Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "7px",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            title="Cerrar subpágina"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Filter Controls Row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "8px 14px",
          }}
        >
          {/* Date Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} style={{ color: "var(--color-info)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Fecha:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectedDateChange(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                color: "#f8fafc",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.76rem",
                fontFamily: "var(--mono-font)",
                colorScheme: "dark",
                cursor: "pointer",
                outline: "none",
              }}
            />
          </div>

          {/* Department Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Depto:
            </span>
            <button
              onClick={() => setDeptFilter("mixto")}
              className={`rr-filter-btn ${deptFilter === "mixto" ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.72rem" }}
            >
              Todos
            </button>
            <button
              onClick={() => setDeptFilter("pc")}
              className={`rr-filter-btn ${deptFilter === "pc" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", fontSize: "0.72rem" }}
            >
              <Shield size={10} /> PC
            </button>
            <button
              onClick={() => setDeptFilter("bomberos")}
              className={`rr-filter-btn ${deptFilter === "bomberos" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", fontSize: "0.72rem" }}
            >
              <Flame size={10} /> Bomberos
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Filter size={13} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Estado:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rr-filter-btn ${statusFilter === "all" ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.72rem" }}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("arrived")}
              className={`rr-filter-btn ${statusFilter === "arrived" ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.72rem" }}
            >
              Regresaron
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rr-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
              style={{ padding: "3px 8px", fontSize: "0.72rem" }}
            >
              Pendientes
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "7px",
              padding: "4px 10px",
              minWidth: "220px",
            }}
          >
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar equipo, ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.74rem",
                width: "100%",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          <div className="rr-scard" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-info)" }}>
              <Users size={14} />
              <span className="rr-scard-label" style={{ fontSize: "0.68rem" }}>Equipos Registrados</span>
            </div>
            <span className="rr-scard-val" style={{ fontSize: "1.1rem" }}>{stats.totalTeams}</span>
          </div>

          <div className="rr-scard" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-green)" }}>
              <CheckCircle2 size={14} />
              <span className="rr-scard-label" style={{ fontSize: "0.68rem" }}>Equipos que Regresaron</span>
            </div>
            <span className="rr-scard-val" style={{ color: "var(--color-green)", fontSize: "1.1rem" }}>
              {stats.arrivedTeams}
            </span>
          </div>

          <div className="rr-scard" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#eab308" }}>
              <AlertCircle size={14} />
              <span className="rr-scard-label" style={{ fontSize: "0.68rem" }}>Equipos Pendientes</span>
            </div>
            <span className="rr-scard-val" style={{ color: "#eab308", fontSize: "1.1rem" }}>
              {stats.pendingTeams}
            </span>
          </div>

          <div className="rr-scard" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#a855f7" }}>
              <UserCheck size={14} />
              <span className="rr-scard-label" style={{ fontSize: "0.68rem" }}>Funcionarios Totales</span>
            </div>
            <span className="rr-scard-val" style={{ color: "#a855f7", fontSize: "1.1rem" }}>
              {stats.totalOfficers}
            </span>
          </div>

          <div className="rr-scard" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-orange)" }}>
              <MapPin size={14} />
              <span className="rr-scard-label" style={{ fontSize: "0.68rem" }}>Ubicaciones Activas</span>
            </div>
            <span className="rr-scard-val" style={{ color: "var(--accent-orange)", fontSize: "1.1rem" }}>
              {stats.uniqueLocations}
            </span>
          </div>
        </div>

        {/* Data Table Container */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={15} style={{ color: "var(--color-info)" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc" }}>
                Equipos y Puntos de Trabajo
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                {filteredRecords.length} {filteredRecords.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <Calendar size={13} style={{ opacity: 0.8 }} />
              <span>{selectedDate}</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="rr-stats-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
              <thead>
                <tr style={{ background: "rgba(56, 189, 248, 0.08)", borderBottom: "1px solid rgba(56, 189, 248, 0.2)" }}>
                  <th style={{ textAlign: "left", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Equipo de Trabajo</th>
                  <th style={{ textAlign: "left", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Ubicación de Trabajo</th>
                  <th style={{ textAlign: "center", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Hora Salida</th>
                  <th style={{ textAlign: "center", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Hora Llegada</th>
                  <th style={{ textAlign: "left", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Encargado del Punto</th>
                  <th style={{ textAlign: "left", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Teléfono de Contacto</th>
                  <th style={{ textAlign: "center", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Unidad</th>
                  <th style={{ textAlign: "center", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Funcs.</th>
                  <th style={{ textAlign: "center", fontWeight: 800, color: "var(--color-info)", fontSize: "0.68rem", padding: "6px 10px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontWeight: 400, fontSize: "0.72rem" }}>
                      No hay equipos registrados que coincidan con los filtros seleccionados para esta fecha.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                      <td style={{ padding: "5px 10px", fontWeight: 400, fontSize: "0.7rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span
                            style={{
                              fontSize: "0.55rem",
                              fontWeight: 800,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              background: r.isVolunteer
                                ? "rgba(168, 85, 247, 0.15)"
                                : r.department === "bomberos"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(56, 189, 248, 0.15)",
                              color: r.isVolunteer
                                ? "#c084fc"
                                : r.department === "bomberos"
                                ? "#ef4444"
                                : "#38bdf8",
                              border: `1px solid ${
                                r.isVolunteer
                                  ? "rgba(168, 85, 247, 0.35)"
                                  : r.department === "bomberos"
                                  ? "rgba(239, 68, 68, 0.3)"
                                  : "rgba(56, 189, 248, 0.3)"
                              }`,
                            }}
                          >
                            {r.isVolunteer ? "VOL" : r.department === "bomberos" ? "BOM" : "PC"}
                          </span>
                          <span style={{ fontWeight: 400 }}>{r.groupName}</span>
                        </div>
                      </td>

                      <td style={{ padding: "5px 10px", fontWeight: 400, fontSize: "0.7rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <MapPin size={11} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                          <span style={{ fontWeight: 400 }}>{r.locationTitle}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", fontFamily: "var(--mono-font)", fontWeight: 400, fontSize: "0.7rem", padding: "5px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: r.departureTime !== "-" ? "var(--text-main)" : "var(--text-muted)" }}>
                          <Clock size={10} style={{ opacity: 0.7 }} />
                          <span style={{ fontWeight: 400 }}>{r.departureTime}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", fontFamily: "var(--mono-font)", fontWeight: 400, fontSize: "0.7rem", padding: "5px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: r.arrivalTime !== "-" ? "var(--color-green)" : "var(--text-muted)" }}>
                          <Clock size={10} style={{ opacity: 0.7 }} />
                          <span style={{ fontWeight: 400 }}>{r.arrivalTime}</span>
                        </div>
                      </td>

                      <td style={{ padding: "5px 10px", fontWeight: 400, fontSize: "0.7rem" }}>
                        <span style={{ fontWeight: 400, color: r.managerName !== "-" ? "#f8fafc" : "var(--text-muted)" }}>
                          {r.managerName}
                        </span>
                      </td>

                      <td style={{ padding: "5px 10px", fontWeight: 400, fontSize: "0.7rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {r.managerPhone !== "-" && <Phone size={10} style={{ color: "var(--color-info)" }} />}
                          <span style={{ fontFamily: "var(--mono-font)", fontWeight: 400, color: r.managerPhone !== "-" ? "#38bdf8" : "var(--text-muted)" }}>
                            {r.managerPhone}
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 400, padding: "5px 10px" }}>
                        {r.unitOut}
                      </td>

                      <td style={{ textAlign: "center", fontWeight: 400, fontSize: "0.7rem", padding: "5px 10px" }}>
                        {r.officersCount}
                      </td>

                      <td style={{ textAlign: "center", padding: "5px 10px" }}>
                        <span
                          className={`rr-status-pill ${r.hasArrived ? "arrived" : "pending"}`}
                          style={{ fontSize: "0.58rem", padding: "1px 6px" }}
                        >
                          {r.hasArrived ? "Regresó" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
