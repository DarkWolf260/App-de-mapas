import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs, saveDailyLog } from "../services/logService";
import { getNormalizedGroupList, getLocalDateStr } from "../utils/logUtils";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";
import type { DrawnFeature } from "../types";

// Sub-components
import { DeleteTarget, WorkTeam } from "./pizarra/types";
import { PizarraHeader } from "./pizarra/PizarraHeader";
import { WorkTeamsTab } from "./pizarra/WorkTeamsTab";
import { DeleteConfirmModal } from "./pizarra/DeleteConfirmModal";
import { EditWorkTeamModal } from "./pizarra/EditWorkTeamModal";
import { CreateWorkTeamModal } from "./pizarra/CreateWorkTeamModal";

export const PizarraOperacional: React.FC = () => {
  const { isAdmin, isOperador, isAuthenticated, permissions, loading } = useAuth();
  const canAccess = isAuthenticated && (isAdmin || isOperador);

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr());

  const isToday = selectedDate === getLocalDateStr();
  const canEditHistorical = isAdmin || (isOperador && !!permissions?.edit_historical_logs);

  // Edición de registros/equipos: admins siempre, operadores solo en la fecha actual (o histórica si tienen el permiso)
  const canEditLogs = isAdmin || (isOperador && !!permissions?.edit_logs && (isToday || canEditHistorical));

  const [workTeams, setWorkTeams] = useState<WorkTeam[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deptFilter, setDeptFilter] = useState<"all" | "pc" | "bomberos">("all");
  const [refreshTeamsCounter, setRefreshTeamsCounter] = useState(0);
  const [editingTeam, setEditingTeam] = useState<WorkTeam | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [allFeatures, setAllFeatures] = useState<DrawnFeature[]>([]);

  useEffect(() => {
    if (!canAccess) return;
    let isMounted = true;
    Promise.all([fetchFeatures(), fetchLogs()]).then(([features, logsMap]) => {
      if (!isMounted) return;
      const enrichedFeatures = features.map((f) => {
        const fidStr = String(f.id);
        const featureLogs = logsMap.get(fidStr) || [];
        return { ...f, dailyLogs: featureLogs };
      });
      setAllFeatures(enrichedFeatures);

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
        Cargando Consolidado Operacional...
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
            El Consolidado Operacional es de acceso exclusivo para el personal autorizado (<strong>Administradores y Operadores</strong>). Inicia sesión con tus credenciales para acceder.
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
    exportWorkTeamsToExcel(exportRows, selectedDate);
  };

  const requestDeleteTeam = (team: WorkTeam) => {
    if (!canEditLogs) return;
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
    if (!deleteTarget || !canEditLogs) return;

    if (deleteTarget.type === "team" && deleteTarget.teamTarget) {
      await handleDeleteTeam(deleteTarget.teamTarget);
    }

    setDeleteTarget(null);
  };

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
      <PizarraHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        canEdit={canEditLogs}
        handleExportTeamsExcel={handleExportTeamsExcel}
        workTeamsCount={workTeams.length}
        onAddTeam={() => setIsCreateTeamOpen(true)}
      />

      <WorkTeamsTab
        workTeams={workTeams}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        onEditTeam={canEditLogs ? setEditingTeam : undefined}
        onDeleteTeam={canEditLogs ? requestDeleteTeam : undefined}
      />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmExecuteDelete}
      />

      {editingTeam && (
        <EditWorkTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={handleSaveTeam}
        />
      )}

      {isCreateTeamOpen && (
        <CreateWorkTeamModal
          onClose={() => setIsCreateTeamOpen(false)}
          onSave={handleCreateTeam}
        />
      )}
    </div>
  );
};
