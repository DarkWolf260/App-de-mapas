import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert } from "lucide-react";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  checkPizarraRecordExists,
  CampamentoEntry,
} from "../services/baseService";
import { useAuth } from "../hooks/useAuth";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs, saveDailyLog } from "../services/logService";
import { getNormalizedGroupList, mergeLogs, getLocalDateStr } from "../utils/logUtils";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";

// SOLID Sub-components
import { DeleteTarget, WorkTeam } from "./pizarra/types";
import { PizarraHeader } from "./pizarra/PizarraHeader";
import { BaseCard } from "./pizarra/BaseCard";
import { RedanCard } from "./pizarra/RedanCard";
import { TotalGeneralCard } from "./pizarra/TotalGeneralCard";
import { WorkTeamsTab } from "./pizarra/WorkTeamsTab";
import { DeleteConfirmModal } from "./pizarra/DeleteConfirmModal";
import { EditWorkTeamModal } from "./pizarra/EditWorkTeamModal";
import { CreateWorkTeamModal } from "./pizarra/CreateWorkTeamModal";

export const PizarraOperacional: React.FC = () => {
  const { user, isAdmin, isOperador, isAuthenticated, permissions, loading } = useAuth();
  const canAccess = isAuthenticated && (isAdmin || isOperador);
  const canEdit = isAdmin || (isOperador && !!permissions.manage_campamentos);

  // ALL STATES MUST BE DECLARED UNCONDITIONALLY AT TOP LEVEL
  const [activeTab, setActiveTab] = useState<"pizarra" | "equipos">("pizarra");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => getLocalDateStr()
  );
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [workTeams, setWorkTeams] = useState<WorkTeam[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [showAddBase, setShowAddBase] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deptFilter, setDeptFilter] = useState<"all" | "pc" | "bomberos">("all");
  const [refreshTeamsCounter, setRefreshTeamsCounter] = useState(0);
  const [editingTeam, setEditingTeam] = useState<WorkTeam | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  // ALL HOOKS MUST BE DECLARED UNCONDITIONALLY BEFORE ANY EARLY RETURN

  // 1. Turn off edit mode if user lacks permission
  useEffect(() => {
    if (!canEdit) {
      setIsEditMode(false);
    }
  }, [canEdit]);

  // 2. Load campamentos on date change
  useEffect(() => {
    if (!canAccess) return;
    let isMounted = true;
    fetchCampamentos(selectedDate).then((fetchedCamps) => {
      if (isMounted && fetchedCamps) {
        setCamps(fetchedCamps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate, canAccess]);

  // 3. Load active work teams for the selected date
  useEffect(() => {
    if (!canAccess) return;
    let isMounted = true;
    Promise.all([fetchFeatures(), fetchLogs()]).then(([features, logsMap]) => {
      if (!isMounted) return;
      const teams: WorkTeam[] = [];
      features.forEach((f) => {
        const fidStr = String(f.id);
        const featureLogs = logsMap.get(fidStr) || [];
        const dateLogs = featureLogs.filter((l) => l.date === selectedDate);
        
        dateLogs.forEach((log) => {
          const groupList = getNormalizedGroupList(log);
          groupList.forEach((g, idx) => {
            if (g.groupName?.trim()) {
              teams.push({
                id: `${f.id}-gt-${log.department || "pc"}-${idx}`,
                featureId: f.id,
                groupIndex: idx,
                groupName: g.groupName.trim(),
                pointTitle: f.title || "Sitio no especificado",
                officersCount: parseInt(g.officersCount || "0", 10) || 0,
                hasArrived: !!g.hasArrived,
                department: log.department || "Protección Civil",
                unitOut: g.unitOut || "",
                departureTime: g.departureTime || "",
                arrivalTime: g.arrivalTime || "",
                managerName: g.managerName || "",
                managerPhone: g.managerPhone || "",
                rescuedCount: g.rescuedCount || "",
                recoveredCount: g.recoveredCount || "",
                rescuedPetsCount: g.rescuedPetsCount || "",
                prehospitalCareCount: g.prehospitalCareCount || "",
                transfersCount: g.transfersCount || "",
              });
            }
          });
        });
      });
      setWorkTeams(teams);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate, canAccess, refreshTeamsCounter]);

  // Core save function
  const executeSaveAll = async () => {
    if (!canEdit) return;
    setSaving(true);
    setShowOverwriteWarning(false);
    try {
      const processedCamps = camps.map((c) => {
        const total = (c.statesDetail || []).reduce((sum, s) => sum + (Number(s.officersCount) || 0), 0);
        return { ...c, personnelCount: total };
      });

      await saveCampamentos(selectedDate, processedCamps);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      // Re-fetch to update local state with real Supabase UUIDs
      const refetchedCamps = await fetchCampamentos(selectedDate);
      if (refetchedCamps && refetchedCamps.length > 0) {
        setCamps(refetchedCamps);
      }
    } catch (err) {
      console.error("Error saving campamentos:", err);
    } finally {
      setSaving(false);
    }
  };

  // 4. Handle save button trigger with overwrite warning prompt
  const handleSaveAll = useCallback(async () => {
    if (!canEdit) return;
    const exists = await checkPizarraRecordExists(selectedDate);
    if (exists) {
      setShowOverwriteWarning(true);
    } else {
      await executeSaveAll();
    }
  }, [selectedDate, camps, canEdit]);

  const handleSaveTeam = async (updatedTeam: WorkTeam) => {
    try {
      const logsMap = await fetchLogs();
      const fidStr = String(updatedTeam.featureId);
      const featureLogs = logsMap.get(fidStr) || [];
      const deptToUse = updatedTeam.department?.toLowerCase().includes("bombero") ? "bomberos" : "pc";
      
      let log = featureLogs.find(
        (l) => l.date === selectedDate && (l.department === deptToUse || (!l.department && deptToUse === "pc"))
      );
      
      if (!log) {
        log = {
          date: selectedDate,
          department: deptToUse,
          groups: [],
          observations: "",
          novedades: [],
        };
      }
      
      const groups = Array.isArray(log.groups) ? [...log.groups] : [];
      const groupIdx = updatedTeam.groupIndex;
      
      while (groups.length <= groupIdx) {
        groups.push({ id: crypto.randomUUID(), groupName: "" });
      }
      
      groups[groupIdx] = {
        ...groups[groupIdx],
        groupName: updatedTeam.groupName,
        unitOut: updatedTeam.unitOut,
        managerName: updatedTeam.managerName,
        managerPhone: updatedTeam.managerPhone,
        officersCount: String(updatedTeam.officersCount),
        departureTime: updatedTeam.departureTime,
        arrivalTime: updatedTeam.arrivalTime,
        hasArrived: updatedTeam.hasArrived,
        rescuedCount: updatedTeam.rescuedCount,
        recoveredCount: updatedTeam.recoveredCount,
        rescuedPetsCount: updatedTeam.rescuedPetsCount,
        prehospitalCareCount: updatedTeam.prehospitalCareCount,
        transfersCount: updatedTeam.transfersCount,
      };
      
      log.groups = groups;
      
      await saveDailyLog(updatedTeam.featureId, log as any);
      setRefreshTeamsCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error saving work team log from pizarra:", err);
    }
  };

  const handleCreateTeam = async (newTeam: Omit<WorkTeam, "id" | "groupIndex">) => {
    try {
      const logsMap = await fetchLogs();
      const fidStr = String(newTeam.featureId);
      const featureLogs = logsMap.get(fidStr) || [];
      const deptToUse = newTeam.department?.toLowerCase().includes("bombero") ? "bomberos" : "pc";

      let log = featureLogs.find(
        (l) => l.date === selectedDate && (l.department === deptToUse || (!l.department && deptToUse === "pc"))
      );

      if (!log) {
        log = {
          date: selectedDate,
          department: deptToUse,
          groups: [],
          observations: "",
          novedades: [],
        };
      }

      const groups = Array.isArray(log.groups) ? [...log.groups] : [];
      groups.push({
        id: crypto.randomUUID(),
        groupName: newTeam.groupName,
        unitOut: newTeam.unitOut,
        managerName: newTeam.managerName,
        managerPhone: newTeam.managerPhone,
        officersCount: String(newTeam.officersCount),
        departureTime: newTeam.departureTime,
        arrivalTime: newTeam.arrivalTime,
        hasArrived: newTeam.hasArrived,
        rescuedCount: newTeam.rescuedCount,
        recoveredCount: newTeam.recoveredCount,
        rescuedPetsCount: newTeam.rescuedPetsCount,
        prehospitalCareCount: newTeam.prehospitalCareCount,
        transfersCount: newTeam.transfersCount,
      });

      log.groups = groups;

      await saveDailyLog(newTeam.featureId, log as any);
      setRefreshTeamsCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error creating work team from pizarra:", err);
    }
  };

  // EARLY RETURNS AFTER ALL HOOKS HAVE BEEN EXECUTED UNCONDITIONALLY

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-muted)",
          fontFamily: "var(--sans-font)",
        }}
      >
        Cargando Pizarra Operacional...
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--sans-font)",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 8px 0" }}>
            Acceso Restringido
          </h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 24px 0" }}>
            La Pizarra Operacional es de acceso exclusivo para el personal autorizado (<strong>Administradores y Operadores</strong>). Inicia sesión con tus credenciales para acceder.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: "var(--accent-orange)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: "var(--sans-font)",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
              }}
            >
              Ir al Mapa Principal / Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Export Work Teams to Excel
  const handleExportTeamsExcel = () => {
    let filtered = workTeams;
    if (deptFilter === "pc") {
      filtered = workTeams.filter((t) =>
        !t.department ||
        t.department === "pc" ||
        t.department.toLowerCase().includes("protección") ||
        t.department.toLowerCase().includes("proteccion")
      );
    } else if (deptFilter === "bomberos") {
      filtered = workTeams.filter((t) =>
        t.department &&
        (t.department === "bomberos" ||
          t.department.toLowerCase().includes("bombero"))
      );
    }

    const exportRows: WorkTeamExportRow[] = filtered.map((t) => ({
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
    exportWorkTeamsToExcel(exportRows, selectedDate, camps);
  };

  // Base handlers
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

  const requestDeleteTeam = (team: WorkTeam) => {
    if (!canEdit) return;
    setDeleteTarget({
      type: "team",
      teamTarget: team,
      title: "Eliminar Equipo de Trabajo",
      subtitle: `¿Estás seguro de que deseas eliminar permanentemente el equipo "${team.groupName}"? Esta acción no se puede deshacer.`,
    });
  };

  const handleDeleteTeam = async (teamToDelete: WorkTeam) => {
    try {
      const logsMap = await fetchLogs();
      const fidStr = String(teamToDelete.featureId);
      const featureLogs = logsMap.get(fidStr) || [];
      const deptToUse = teamToDelete.department?.toLowerCase().includes("bombero") ? "bomberos" : "pc";
      
      let log = featureLogs.find(
        (l) => l.date === selectedDate && (l.department === deptToUse || (!l.department && deptToUse === "pc"))
      );
      
      if (!log) return;
      
      const groups = Array.isArray(log.groups) ? [...log.groups] : [];
      const groupIdx = teamToDelete.groupIndex;
      
      if (groupIdx >= 0 && groupIdx < groups.length) {
        groups.splice(groupIdx, 1);
      }
      
      log.groups = groups;
      
      await saveDailyLog(teamToDelete.featureId, log as any);
      setRefreshTeamsCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting work team log from pizarra:", err);
    }
  };

  const confirmExecuteDelete = async () => {
    if (!deleteTarget || !canEdit) return;

    if (deleteTarget.type === "camp" && deleteTarget.campId) {
      setCamps((prev) => prev.filter((c) => c.id !== deleteTarget.campId));
      await deleteCampamento(deleteTarget.campId);
    } else if (deleteTarget.type === "state" && deleteTarget.stateIdTarget) {
      setCamps((prev) =>
        prev.map((c) => {
          if (c.id !== deleteTarget.campId) return c;
          return {
            ...c,
            statesDetail: (c.statesDetail || []).filter((sd) => sd.id !== deleteTarget.stateIdTarget),
          };
        })
      );
    } else if (deleteTarget.type === "team" && deleteTarget.teamTarget) {
      await handleDeleteTeam(deleteTarget.teamTarget);
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

  const totalGeneralPersonnel = camps.reduce((sum, c) => {
    return (
      sum +
      (c.statesDetail || []).reduce((sSum, sd) => sSum + (Number(sd.officersCount) || 0), 0)
    );
  }, 0);

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
      {/* HEADER DE LA PIZARRA OPERACIONAL */}
      <PizarraHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        canEdit={canEdit}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        saving={saving}
        saveSuccess={saveSuccess}
        handleSaveAll={handleSaveAll}
        handleAddCamp={handleAddCamp}
        handleExportTeamsExcel={handleExportTeamsExcel}
        workTeamsCount={workTeams.length}
        onAddTeam={() => setIsCreateTeamOpen(true)}
      />

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
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "16px 24px 70px 24px",
              display: "flex",
              flexDirection: "column",
              maxWidth: "1600px",
              margin: "0 auto",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
          {/* BANNER NOTIFICACIÓN MODO EDICIÓN O ADVERTENCIA SIN PERMISOS */}
          {canEdit && isEditMode ? (
            <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
              <span>✏️ <strong>Modo Edición Activo:</strong> Puedes editar nombres, modificar números de oficiales y agregar/eliminar bases u organismos.</span>
            </div>
          ) : !canEdit ? (
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.72rem", flexShrink: 0 }}>
              <span>🔒 <strong>Modo Solo Lectura:</strong> Tu usuario no posee permisos para modificar los registros.</span>
            </div>
          ) : null}

          {/* KPI RESUMEN EJECUTIVO EN CÁPSULAS DE IGUAL PROPORCIÓN */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
              alignItems: "stretch",
            }}
          >
            <RedanCard getRegionTotalFromCamps={getRegionTotalFromCamps} />
            <TotalGeneralCard redanGrandTotal={totalGeneralPersonnel} />
          </div>

          {/* MATRIZ MASONRY/GRID DE BASES OPERACIONALES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
              width: "100%",
            }}
          >
            {camps.map((camp) => (
              <BaseCard
                key={camp.id}
                camp={camp}
                canEdit={canEdit}
                isEditMode={isEditMode}
                handleUpdateCampName={handleUpdateCampName}
                requestDeleteCamp={requestDeleteCamp}
                handleAddStateToCamp={handleAddStateToCamp}
                handleUpdateStateInCamp={handleUpdateStateInCamp}
                requestRemoveState={requestRemoveState}
              />
            ))}
          </div>
          </div>
        </main>
      ) : (
        /* PESTAÑA DEDICADA DE EQUIPOS DE TRABAJO */
        <WorkTeamsTab
          workTeams={workTeams}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          onEditTeam={setEditingTeam}
          onDeleteTeam={canEdit ? requestDeleteTeam : undefined}
        />
      )}

      {/* MODAL DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmExecuteDelete}
      />

      {/* MODAL DE EDICIÓN DE EQUIPO DE TRABAJO */}
      {editingTeam && (
        <EditWorkTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={handleSaveTeam}
        />
      )}

      {/* MODAL DE CREACIÓN DE EQUIPO DE TRABAJO */}
      {isCreateTeamOpen && (
        <CreateWorkTeamModal
          onClose={() => setIsCreateTeamOpen(false)}
          onSave={handleCreateTeam}
        />
      )}

      {/* MODAL DIÁLOGO DE ADVERTENCIA DE SOBREESCRITURA AL GUARDAR */}
      {showOverwriteWarning && (
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
          onClick={() => setShowOverwriteWarning(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-primary)",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              borderRadius: "14px",
              padding: "24px",
              width: "420px",
              maxWidth: "90vw",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(249, 115, 22, 0.15)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-orange)",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                  Registro Existente Detectado
                </h3>
                <p style={{ fontSize: "0.72rem", color: "var(--accent-orange)", fontWeight: 600, margin: 0 }}>
                  Día: {selectedDate.split("-").reverse().join("/")}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              Ya se encuentra guardada una Pizarra Operacional para esta fecha. Si continúas, <strong>se actualizará y sobreescribirá el registro existente del día</strong> con los datos actuales.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setShowOverwriteWarning(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={executeSaveAll}
                disabled={saving}
                style={{
                  background: "linear-gradient(135deg, var(--accent-orange), #ea580c)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                  boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
                }}
              >
                {saving ? "Actualizando..." : "Sí, Actualizar Registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
