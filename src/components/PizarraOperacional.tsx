import React, { useState, useEffect, useCallback } from "react";
import { Activity, Map as MapIcon, Plus, Save, Check, Trash2, Edit3, ShieldAlert, CheckSquare, AlertTriangle, X, Lock, Users, Search, Download, FileSpreadsheet, Clock, Truck, Phone } from "lucide-react";
import { REDAN_REGIONS } from "../data/redanStructure";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  CampamentoEntry,
  VENEZUELA_STATES,
} from "../services/baseService";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "./AuthModal";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs } from "../services/logService";
import { getNormalizedGroupList, mergeLogs } from "../utils/logUtils";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";

interface DeleteTarget {
  type: "camp" | "state";
  campId: string;
  stateIdTarget?: string;
  title: string;
  subtitle: string;
}

interface WorkTeam {
  id: string;
  groupName: string;
  pointTitle: string;
  officersCount: number;
  hasArrived: boolean;
  department?: string;
  unitOut?: string;
  departureTime?: string;
  arrivalTime?: string;
  managerName?: string;
  managerPhone?: string;
}

export const PizarraOperacional: React.FC = () => {
  const { isAdmin, isOperador, isAuthenticated } = useAuth();
  const canEdit = isAdmin || isOperador;

  const [activeTab, setActiveTab] = useState<"pizarra" | "equipos">("pizarra");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [workTeams, setWorkTeams] = useState<WorkTeam[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [showAddBase, setShowAddBase] = useState(false);

  // Modal confirmation target
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // If user loses permissions, turn off edit mode
  useEffect(() => {
    if (!canEdit) {
      setIsEditMode(false);
    }
  }, [canEdit]);

  // Load campamentos from Supabase on date change
  useEffect(() => {
    let isMounted = true;
    fetchCampamentos(selectedDate).then((fetchedCamps) => {
      if (isMounted && fetchedCamps) {
        setCamps(fetchedCamps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Load active work teams for the selected date
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchFeatures(), fetchLogs()]).then(([features, logsMap]) => {
      if (!isMounted) return;
      const teams: WorkTeam[] = [];
      features.forEach((f) => {
        const fidStr = String(f.id);
        const featureLogs = logsMap.get(fidStr) || [];
        const dateLogs = featureLogs.filter((l) => l.date === selectedDate);
        const merged = mergeLogs(dateLogs);
        if (!merged) return;

        const groupList = getNormalizedGroupList(merged);
        groupList.forEach((g, idx) => {
          if (g.groupName?.trim()) {
            teams.push({
              id: `${f.id}-gt-${idx}`,
              groupName: g.groupName.trim(),
              pointTitle: f.title || "Sitio no especificado",
              officersCount: parseInt(g.officersCount || "0", 10) || 0,
              hasArrived: !!g.hasArrived,
              department: merged.department || "Protección Civil",
              unitOut: g.unitOut || "",
              departureTime: g.departureTime || "",
              arrivalTime: g.arrivalTime || "",
              managerName: g.managerName || "",
              managerPhone: g.managerPhone || "",
            });
          }
        });
      });
      setWorkTeams(teams);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Handle saving campamentos to Supabase
  const handleSaveAll = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const processedCamps = camps.map((c) => {
        const total = (c.statesDetail || []).reduce((sum, s) => sum + (Number(s.officersCount) || 0), 0);
        return { ...c, personnelCount: total };
      });

      await saveCampamentos(selectedDate, processedCamps);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving campamentos to Supabase:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedDate, camps, canEdit]);

  // Handle exporting Work Teams to Excel (.xlsx)
  const handleExportTeamsExcel = () => {
    const exportRows: WorkTeamExportRow[] = workTeams.map((t) => ({
      date: selectedDate,
      department: t.department || "Protección Civil",
      locationTitle: t.pointTitle,
      groupName: t.groupName,
      unitOut: t.unitOut || "",
      departureTime: t.departureTime || "",
      arrivalTime: t.arrivalTime || "",
      managerName: t.managerName || "",
      managerPhone: t.managerPhone || "",
      officersCount: String(t.officersCount),
      hasArrived: t.hasArrived ? "Sí" : "No",
    }));
    exportWorkTeamsToExcel(exportRows, selectedDate);
  };

  // Handlers for Base management
  const handleAddCamp = () => {
    if (!canEdit) return;
    if (showAddBase && newBaseName.trim()) {
      const newCamp: CampamentoEntry = {
        id: crypto.randomUUID(),
        campName: newBaseName.trim(),
        capacity: 0,
        personnelCount: 0,
        status: "Activo",
        statesDetail: [{ id: crypto.randomUUID(), stateName: "-", officersCount: 0 }],
      };
      setCamps((prev) => [...prev, newCamp]);
      setNewBaseName("");
      setShowAddBase(false);
    } else {
      setShowAddBase(!showAddBase);
    }
  };

  const requestDeleteCamp = (campId: string, campName?: string) => {
    if (!canEdit) return;
    const name = campName?.trim() || "esta base";
    setDeleteTarget({
      type: "camp",
      campId,
      title: "Eliminar Base Operacional",
      subtitle: `¿Estás seguro de que deseas eliminar permanentemente "${name}"?`,
    });
  };

  const requestRemoveState = (campId: string, stateId: string, stateName?: string) => {
    if (!canEdit) return;
    setDeleteTarget({
      type: "state",
      campId,
      stateIdTarget: stateId,
      title: "Quitar Estado de la Base",
      subtitle: `¿Deseas remover "${stateName || 'este estado'}" de esta base operacional?`,
    });
  };

  const confirmExecuteDelete = () => {
    if (!canEdit || !deleteTarget) return;

    if (deleteTarget.type === "camp") {
      deleteCampamento(deleteTarget.campId);
      setCamps((prev) => prev.filter((c) => c.id !== deleteTarget.campId));
    } else if (deleteTarget.type === "state" && deleteTarget.stateIdTarget) {
      const { campId, stateIdTarget } = deleteTarget;
      setCamps((prev) =>
        prev.map((c) => {
          if (c.id !== campId) return c;
          return {
            ...c,
            statesDetail: (c.statesDetail || []).filter((sd) => sd.id !== stateIdTarget),
          };
        })
      );
    }

    setDeleteTarget(null);
  };

  const handleUpdateCampName = (campId: string, name: string) => {
    if (!canEdit) return;
    setCamps((prev) => prev.map((c) => (c.id === campId ? { ...c, campName: name } : c)));
  };

  const handleAddStateToCamp = (campId: string) => {
    if (!canEdit) return;
    setCamps((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        const currentDetails = c.statesDetail || [];
        return {
          ...c,
          statesDetail: [...currentDetails, { id: crypto.randomUUID(), stateName: "-", officersCount: 0 }],
        };
      })
    );
  };

  // Target state entry by unique row ID (sd.id) preventing any key or index collisions
  const handleUpdateStateInCamp = (
    campId: string,
    stateIdTarget: string,
    field: "stateName" | "officersCount",
    val: string | number
  ) => {
    if (!canEdit) return;
    setCamps((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        const updated = (c.statesDetail || []).map((sd) => {
          if (sd.id !== stateIdTarget) return sd;
          if (field === "stateName") return { ...sd, stateName: String(val) };
          if (val === "" || val === undefined || val === null) {
            return { ...sd, officersCount: 0 };
          }
          const numVal = parseInt(String(val), 10);
          return { ...sd, officersCount: isNaN(numVal) ? 0 : numVal };
        });
        return { ...c, statesDetail: updated };
      })
    );
  };

  // Dynamic REDAN calculations
  const stateTotalsMap = new Map<string, number>();
  camps.forEach((c) => {
    (c.statesDetail || []).forEach((sd) => {
      const current = stateTotalsMap.get(sd.stateName) || 0;
      stateTotalsMap.set(sd.stateName, current + (Number(sd.officersCount) || 0));
    });
  });

  const getRegionTotalFromCamps = (regionStates: string[]): number => {
    return regionStates.reduce((sum, st) => sum + (stateTotalsMap.get(st) || 0), 0);
  };

  const redanGrandTotal = REDAN_REGIONS.reduce(
    (sum, r) => sum + getRegionTotalFromCamps(r.states),
    0
  );

  const filteredTeams = workTeams.filter((t) =>
    t.groupName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    t.pointTitle.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.unitOut || "").toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.managerName || "").toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        height: "100vh",
        width: "100vw",
        fontFamily: "var(--sans-font)",
        fontSize: "0.76rem",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER ALINEADO AL DISEÑO GLOBAL */}
      <header
        style={{
          height: "64px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-secondary)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              color: "var(--accent-orange)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <h1 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", margin: 0, lineHeight: 1.2 }}>
              COE La Guaira — Pizarra Operacional
            </h1>
            <p style={{ color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Consolidado Unificado de Personal en Bases y REDAN
            </p>
          </div>

          {/* BARRA DE PESTAÑAS (PIZARRA OPERACIONAL | EQUIPOS DE TRABAJO) */}
          <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.3)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-color)", marginLeft: "12px" }}>
            <button
              onClick={() => setActiveTab("pizarra")}
              style={{
                background: activeTab === "pizarra" ? "var(--accent-orange)" : "transparent",
                color: activeTab === "pizarra" ? "#fff" : "var(--text-muted)",
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
              <Activity size={14} /> Pizarra Operacional
            </button>
            <button
              onClick={() => setActiveTab("equipos")}
              style={{
                background: activeTab === "equipos" ? "#a855f7" : "transparent",
                color: activeTab === "equipos" ? "#fff" : "var(--text-muted)",
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
              <Users size={14} /> Equipos de Trabajo
              <span
                style={{
                  background: activeTab === "equipos" ? "rgba(255, 255, 255, 0.25)" : "rgba(168, 85, 247, 0.2)",
                  color: activeTab === "equipos" ? "#fff" : "#c084fc",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "0.6rem",
                  fontWeight: 800,
                }}
              >
                {workTeams.length}
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => window.location.href = '/'}
            title="Ir al Mapa"
            style={{
              height: "32px",
              padding: "0 12px",
              borderRadius: "7px",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              background: "rgba(249, 115, 22, 0.1)",
              color: "var(--accent-orange)",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <MapIcon size={14} /> Mapa
          </button>
          {/* SELECTOR DE FECHA */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "0.74rem",
              fontFamily: "var(--sans-font)",
              padding: "5px 10px",
              outline: "none",
              cursor: "pointer",
            }}
          />

          {activeTab === "pizarra" && canEdit && (
            <>
              {/* MODO EDICIÓN TOGGLE */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isEditMode ? "rgba(249, 115, 22, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${isEditMode ? "rgba(249, 115, 22, 0.4)" : "var(--border-color)"}`,
                  borderRadius: "6px",
                  padding: "5px 10px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={isEditMode}
                  onChange={(e) => setIsEditMode(e.target.checked)}
                  style={{ display: "none" }}
                />
                {isEditMode ? (
                  <CheckSquare size={14} style={{ color: "var(--accent-orange)" }} />
                ) : (
                  <Edit3 size={14} style={{ color: "var(--text-muted)" }} />
                )}
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: isEditMode ? "var(--accent-orange)" : "var(--text-main)" }}>
                  {isEditMode ? "Modo Edición Activo" : "Modo Edición"}
                </span>
              </label>

              {/* BOTÓN NUEVA BASE (SOLO VISIBLE EN MODO EDICIÓN) */}
              {isEditMode && (
                <button
                  onClick={handleAddCamp}
                  style={{
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "6px",
                    color: "var(--color-info)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "5px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontFamily: "var(--sans-font)",
                  }}
                >
                  <Plus size={14} /> Nueva Base
                </button>
              )}

              {/* BOTÓN GUARDAR */}
              <button
                onClick={handleSaveAll}
                disabled={saving}
                style={{
                  background: saveSuccess
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(249, 115, 22, 0.2)",
                  border: `1px solid ${saveSuccess ? "var(--color-green)" : "var(--accent-orange)"}`,
                  borderRadius: "6px",
                  color: saveSuccess ? "var(--color-green)" : "var(--accent-orange)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "5px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--sans-font)",
                }}
              >
                {saveSuccess ? <Check size={14} /> : <Save size={14} />}
                <span>{saving ? "Guardando..." : saveSuccess ? "Guardado" : "Guardar"}</span>
              </button>
            </>
          )}

          {activeTab === "equipos" && (
            <button
              onClick={handleExportTeamsExcel}
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "6px",
                color: "#4ade80",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--sans-font)",
              }}
            >
              <FileSpreadsheet size={14} />
              <span>Exportar Excel</span>
            </button>
          )}

          {!canEdit && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "5px 10px",
                color: "var(--text-muted)",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              <Lock size={13} style={{ color: "var(--text-muted)" }} />
              <span>Modo Lectura</span>
            </div>
          )}

          {/* BOTÓN DE AUTENTICACIÓN / ROL DE USUARIO */}
          <AuthModal />
        </div>
      </header>

      {/* BANNER SECUNDARIO NUEVA BASE */}
      {activeTab === "pizarra" && canEdit && isEditMode && showAddBase && (
        <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", padding: "8px 24px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-main)", fontWeight: 600 }}>Nombre de la Nueva Base:</span>
          <input
            type="text"
            placeholder="Ej: Base Caruao..."
            value={newBaseName}
            onChange={(e) => setNewBaseName(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.72rem",
              padding: "4px 8px",
              width: "220px",
              outline: "none",
              fontFamily: "var(--sans-font)",
            }}
          />
          <button
            onClick={handleAddCamp}
            style={{
              background: "var(--accent-blue)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            Crear
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DEPENDIENDO DE LA PESTAÑA SELECCIONADA */}
      {activeTab === "pizarra" ? (
        <main
          style={{
            padding: "10px 16px",
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* BANNER NOTIFICACIÓN MODO EDICIÓN O ADVERTENCIA SIN PERMISOS */}
          {canEdit && isEditMode ? (
            <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.7rem", fontWeight: 600, flexShrink: 0 }}>
              <ShieldAlert size={14} />
              <span><strong>Modo Edición Activado:</strong> Puedes modificar los nombres de las bases, cambiar o eliminar estados y crear nuevas bases.</span>
            </div>
          ) : !canEdit ? (
            <div style={{ background: "rgba(30, 41, 59, 0.4)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 500, flexShrink: 0 }}>
              <Lock size={14} />
              <span><strong>Modo Lectura Protegido:</strong> Solo Administradores y Operadores autenticados pueden modificar datos.</span>
            </div>
          ) : null}

          {/* CONTENEDOR FLEX DE APILAMIENTO VERTICAL Y PASO A SIGUIENTE COLUMNA AL LLENAR PANTALLA */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              flexWrap: "wrap",
              alignContent: "center",
              gap: "8px",
              boxSizing: "border-box",
              maxHeight: "100%",
            }}
          >
            {/* TARJETAS DE BASES */}
            {camps.map((camp) => {
              const campTotal = (camp.statesDetail || []).reduce((s, sd) => s + (Number(sd.officersCount) || 0), 0);
              return (
                <div
                  key={camp.id}
                  style={{
                    width: "280px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                  }}
                >
                  {/* ENCABEZADO BASE */}
                  <div
                    style={{
                      padding: "6px 10px",
                      background: "var(--bg-tertiary)",
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {canEdit && isEditMode ? (
                      <input
                        type="text"
                        value={camp.campName}
                        onChange={(e) => handleUpdateCampName(camp.id, e.target.value)}
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          color: "#fff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          outline: "none",
                          flex: 1,
                          fontFamily: "var(--sans-font)",
                        }}
                      />
                    ) : (
                      <h3 style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", margin: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {camp.campName}
                      </h3>
                    )}

                    {canEdit && isEditMode && (
                      <button
                        onClick={() => requestDeleteCamp(camp.id, camp.campName)}
                        title="Eliminar esta base"
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "inline-flex" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* FILAS DE ESTADOS Y CONTEOS */}
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px", maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}>
                    {canEdit && isEditMode && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Estados en Base</span>
                        <button
                          onClick={() => handleAddStateToCamp(camp.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            color: "var(--color-info)",
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            padding: "2px 6px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontFamily: "var(--sans-font)",
                          }}
                        >
                          <Plus size={10} /> Estado
                        </button>
                      </div>
                    )}

                    {(camp.statesDetail || [])
                      .slice()
                      .sort((a, b) => a.stateName.localeCompare(b.stateName, "es"))
                      .map((sd) => (
                        <div
                          key={sd.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            background: "rgba(0, 0, 0, 0.2)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                          }}
                        >
                          {canEdit && isEditMode ? (
                            <select
                              value={sd.stateName || "-"}
                              onChange={(e) => handleUpdateStateInCamp(camp.id, sd.id, "stateName", e.target.value)}
                              style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "0.68rem",
                                padding: "2px 4px",
                                outline: "none",
                                flex: 1,
                                fontFamily: "var(--sans-font)",
                              }}
                            >
                              <option value="-">-</option>
                              {VENEZUELA_STATES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: "0.7rem", color: "var(--text-main)", fontWeight: 500, flex: 1 }}>
                              {sd.stateName}
                            </span>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              readOnly={!canEdit}
                              value={sd.officersCount === 0 || !sd.officersCount ? "" : String(sd.officersCount)}
                              onChange={(e) => {
                                if (!canEdit) return;
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                handleUpdateStateInCamp(camp.id, sd.id, "officersCount", val);
                              }}
                              style={{
                                width: "55px",
                                background: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                                color: "#ffffff",
                                fontSize: "0.72rem",
                                fontFamily: "var(--sans-font)",
                                fontWeight: 700,
                                textAlign: "center",
                                padding: "3px 4px",
                                outline: "none",
                                cursor: canEdit ? "text" : "default",
                              }}
                            />

                            {canEdit && isEditMode && (
                              <button
                                onClick={() => requestRemoveState(camp.id, sd.id, sd.stateName)}
                                title="Eliminar este estado"
                                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "1px", display: "inline-flex" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* PIE DE TARJETA CON TOTAL */}
                  <div
                    style={{
                      padding: "7px 12px",
                      background: "var(--bg-tertiary)",
                      borderTop: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                      TOTAL BASE
                    </span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                      {campTotal}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* TARJETA DESPLIEGUE REDAN */}
            <div
              style={{
                width: "280px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              <div style={{ padding: "8px 12px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapIcon size={15} style={{ color: "var(--color-info)" }} />
                  <h3 style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Despliegue REDAN</h3>
                </div>
              </div>

              <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {REDAN_REGIONS.map((r) => {
                  const regTotal = getRegionTotalFromCamps(r.states);
                  return (
                    <div key={r.name} style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-subtle)", borderRadius: "4px", padding: "5px 8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-main)", fontWeight: 600 }}>{r.name}</span>
                        <span
                          style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            color: "var(--accent-orange)",
                            fontSize: "0.76rem",
                            fontFamily: "var(--sans-font)",
                            fontWeight: 700,
                            padding: "2px 8px",
                            minWidth: "40px",
                            textAlign: "center",
                            display: "inline-block",
                          }}
                        >
                          {regTotal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "7px 12px", background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>TOTAL REDAN</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>{redanGrandTotal}</span>
              </div>
            </div>

            {/* TARJETA TOTAL GENERAL SOBRIA */}
            <div
              style={{
                width: "280px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              <div style={{ padding: "8px 12px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={15} style={{ color: "var(--accent-orange)" }} />
                <h3 style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Total General</h3>
              </div>

              <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Personal Desplegado
                </span>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent-orange)", fontFamily: "var(--sans-font)", lineHeight: 1.1 }}>
                  {redanGrandTotal}
                </span>
              </div>
            </div>

          </div>
        </main>
      ) : (
        /* PESTAÑA DEDICADA DE EQUIPOS DE TRABAJO CON TODOS LOS CAMPOS */
        <main style={{ padding: "16px 24px", flex: 1, width: "100%", boxSizing: "border-box", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* BARRA DE BÚSQUEDA Y METRICAS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar equipo, punto, unidad o encargado..."
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

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Equipos Registrados</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#c084fc", fontFamily: "var(--sans-font)" }}>{workTeams.length}</span>
              </div>

              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Efectivos Totales</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                  {workTeams.reduce((sum, t) => sum + t.officersCount, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* TABLA COMPLETA DE EQUIPOS DE TRABAJO CON HORAS Y ENCARGADOS */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Equipo de Trabajo</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Ubicación / Punto</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Unidad / Vehículo</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Hora Salida</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Hora Llegada</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Encargado</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Efectivos</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                      {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr key={team.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                        {team.groupName}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                        📍 {team.pointTitle}
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
                            background: team.hasArrived ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)",
                            border: `1px solid ${team.hasArrived ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            display: "inline-block",
                          }}
                        >
                          {team.hasArrived ? "En Sitio" : "Desplegado"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* MODAL DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {canEdit && deleteTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 15, 29, 0.96)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "12px",
              padding: "20px 24px",
              width: "400px",
              maxWidth: "90vw",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                display: "inline-flex",
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  padding: "10px",
                  borderRadius: "10px",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                  {deleteTarget.title}
                </h3>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {deleteTarget.subtitle}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-main)",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmExecuteDelete}
                style={{
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                  boxShadow: "0 2px 10px rgba(239, 68, 68, 0.3)",
                }}
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
