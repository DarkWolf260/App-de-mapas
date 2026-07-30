import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { exportWorkTeamsToCSV, type WorkTeamExportRow } from "../utils/excelExporter";
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
      department: r.department === "bomberos" ? "Bomberos" : "Protección Civil",
      locationTitle: r.locationTitle,
      groupName: r.groupName,
      unitOut: r.unitOut,
      departureTime: r.departureTime,
      arrivalTime: r.arrivalTime,
      managerName: r.managerName,
      managerPhone: r.managerPhone,
      officersCount: r.officersCount,
      hasArrived: r.hasArrived ? "Llegó a sitio" : "Pendiente",
    }));

    exportWorkTeamsToCSV(exportRows, selectedDate);
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
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(16, 24, 40, 0.8)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(56, 189, 248, 0.3)",
              color: "#fff",
            }}
          >
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
              Información del Mapa y Equipos de Trabajo
            </h2>
            <p style={{ fontSize: "0.75rem", margin: "2px 0 0", color: "var(--text-muted)" }}>
              Consulta operativa de ubicaciones, encargados, horarios y exportación a Excel
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #16a34a",
              background: "linear-gradient(135deg, #15803d, #166534)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
              transition: "all 0.2s ease",
            }}
            title="Exportar archivo Excel (.csv con BOM UTF-8)"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            title="Cerrar subpágina"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Filter Controls Row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 16px",
          }}
        >
          {/* Date Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} style={{ color: "var(--color-info)" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Fecha:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectedDateChange(e.target.value)}
              className="rr-editor-input"
              style={{ width: "auto", padding: "4px 10px", fontSize: "0.78rem" }}
            />
          </div>

          {/* Department Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Depto:
            </span>
            <button
              onClick={() => setDeptFilter("mixto")}
              className={`rr-filter-btn ${deptFilter === "mixto" ? "active" : ""}`}
            >
              Todos
            </button>
            <button
              onClick={() => setDeptFilter("pc")}
              className={`rr-filter-btn ${deptFilter === "pc" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Shield size={11} /> PC
            </button>
            <button
              onClick={() => setDeptFilter("bomberos")}
              className={`rr-filter-btn ${deptFilter === "bomberos" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Flame size={11} /> Bomberos
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Estado:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rr-filter-btn ${statusFilter === "all" ? "active" : ""}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("arrived")}
              className={`rr-filter-btn ${statusFilter === "arrived" ? "active" : ""}`}
            >
              Llegaron
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rr-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            >
              Pendientes
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "6px 12px",
              minWidth: "240px",
            }}
          >
            <Search size={15} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar equipo, ubicación, encargado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.78rem",
                width: "100%",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div className="rr-scard">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-info)" }}>
              <Users size={16} />
              <span className="rr-scard-label">Equipos Registrados</span>
            </div>
            <span className="rr-scard-val">{stats.totalTeams}</span>
          </div>

          <div className="rr-scard">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-green)" }}>
              <CheckCircle2 size={16} />
              <span className="rr-scard-label">Equipos en Sitio</span>
            </div>
            <span className="rr-scard-val" style={{ color: "var(--color-green)" }}>
              {stats.arrivedTeams}
            </span>
          </div>

          <div className="rr-scard">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#eab308" }}>
              <AlertCircle size={16} />
              <span className="rr-scard-label">Equipos Pendientes</span>
            </div>
            <span className="rr-scard-val" style={{ color: "#eab308" }}>
              {stats.pendingTeams}
            </span>
          </div>

          <div className="rr-scard">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#a855f7" }}>
              <UserCheck size={16} />
              <span className="rr-scard-label">Funcionarios Totales</span>
            </div>
            <span className="rr-scard-val" style={{ color: "#a855f7" }}>
              {stats.totalOfficers}
            </span>
          </div>

          <div className="rr-scard">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-orange)" }}>
              <MapPin size={16} />
              <span className="rr-scard-label">Ubicaciones Activas</span>
            </div>
            <span className="rr-scard-val" style={{ color: "var(--accent-orange)" }}>
              {stats.uniqueLocations}
            </span>
          </div>
        </div>

        {/* Data Table Container */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f8fafc" }}>
              Listado de Equipos y Puntos de Trabajo ({filteredRecords.length})
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Mostrando registros del {selectedDate}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="rr-stats-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Equipo de Trabajo</th>
                  <th style={{ textAlign: "left" }}>Ubicación de Trabajo</th>
                  <th style={{ textAlign: "center" }}>Hora Salida</th>
                  <th style={{ textAlign: "center" }}>Hora Llegada</th>
                  <th style={{ textAlign: "left" }}>Encargado del Punto</th>
                  <th style={{ textAlign: "left" }}>Teléfono de Contacto</th>
                  <th style={{ textAlign: "center" }}>Unidad</th>
                  <th style={{ textAlign: "center" }}>Funcs.</th>
                  <th style={{ textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No hay equipos registrados que coincidan con los filtros seleccionados para esta fecha.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontWeight: 800,
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background: r.department === "bomberos" ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.15)",
                              color: r.department === "bomberos" ? "#ef4444" : "#38bdf8",
                              border: `1px solid ${r.department === "bomberos" ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
                            }}
                          >
                            {r.department === "bomberos" ? "BOM" : "PC"}
                          </span>
                          <span>{r.groupName}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={12} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{r.locationTitle}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", fontFamily: "var(--mono-font)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: r.departureTime !== "-" ? "var(--text-main)" : "var(--text-muted)" }}>
                          <Clock size={11} style={{ opacity: 0.7 }} />
                          <span>{r.departureTime}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", fontFamily: "var(--mono-font)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: r.arrivalTime !== "-" ? "var(--color-green)" : "var(--text-muted)" }}>
                          <Clock size={11} style={{ opacity: 0.7 }} />
                          <span>{r.arrivalTime}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: r.managerName !== "-" ? 600 : 400, color: r.managerName !== "-" ? "#f8fafc" : "var(--text-muted)" }}>
                          {r.managerName}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {r.managerPhone !== "-" && <Phone size={11} style={{ color: "var(--color-info)" }} />}
                          <span style={{ fontFamily: "var(--mono-font)", color: r.managerPhone !== "-" ? "#38bdf8" : "var(--text-muted)" }}>
                            {r.managerPhone}
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.65rem" }}>
                        {r.unitOut}
                      </td>

                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        {r.officersCount}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`rr-status-pill ${r.hasArrived ? "arrived" : "pending"}`}
                          style={{ fontSize: "0.62rem" }}
                        >
                          {r.hasArrived ? "En Sitio" : "Pendiente"}
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
