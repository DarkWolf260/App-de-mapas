import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert, Shield, Flame, HelpCircle } from "lucide-react";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  checkPizarraRecordExists,
  CampamentoEntry,
  StatePersonnelCount,
  getEntryType,
} from "../services/baseService";
import { useAuth } from "../hooks/useAuth";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs, saveDailyLog } from "../services/logService";
import { getNormalizedGroupList, getLocalDateStr } from "../utils/logUtils";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";
import { generateAndDownloadReportImage } from "../utils/reportImageExporter";
import type { DrawnFeature } from "../types";

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
import { OverwriteWarningModal } from "./pizarra/OverwriteWarningModal";
import { AddBaseBanner } from "./pizarra/AddBaseBanner";
import { EditModeBanner } from "./pizarra/EditModeBanner";
import { AddCampEntryModal } from "./pizarra/AddCampEntryModal";
import { ReportImageTab } from "./pizarra/ReportImageTab";

export const PizarraOperacional: React.FC = () => {
  const { isAdmin, isOperador, isAuthenticated, permissions, loading } = useAuth();
  const canAccess = isAuthenticated && (isAdmin || isOperador);

  const [activeTab, setActiveTab] = useState<"equipos" | "imagen">("equipos");
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr());

  const isToday = selectedDate === getLocalDateStr();
  const canEditHistorical = isAdmin || (isOperador && !!permissions?.edit_historical_logs);

  const canManageBases = isAdmin || (isOperador && !!permissions?.manage_campamentos && (isToday || canEditHistorical));
  const canManageEntries = isAdmin || (isOperador && !!permissions?.manage_camp_entries && (isToday || canEditHistorical));

  // Edición de registros/equipos: admins siempre, operadores solo en la fecha actual (o histórica si tienen el permiso)
  const canEditLogs = isAdmin || (isOperador && !!permissions?.edit_logs && (isToday || canEditHistorical));

  const canEdit = canManageBases || canManageEntries;
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [workTeams, setWorkTeams] = useState<WorkTeam[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [showAddBase, setShowAddBase] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [addEntryTarget, setAddEntryTarget] = useState<{ campId: string; campName: string; entryToEdit?: StatePersonnelCount | null } | null>(null);
  const [deptFilter, setDeptFilter] = useState<"all" | "pc" | "bomberos">("all");
  const [campDeptFilter, setCampDeptFilter] = useState<"all" | "pc" | "bomberos" | "otros">("all");
  const [refreshTeamsCounter, setRefreshTeamsCounter] = useState(0);
  const [editingTeam, setEditingTeam] = useState<WorkTeam | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [allFeatures, setAllFeatures] = useState<DrawnFeature[]>([]);

  useEffect(() => {
    if (!canEdit) {
      setIsEditMode(false);
    }
  }, [canEdit]);

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

  const handleExportReportImage = useCallback(() => {
    generateAndDownloadReportImage({
      features: allFeatures,
      startDate: selectedDate,
      endDate: selectedDate,
      activeDepartment: deptFilter === "all" ? "mixto" : (deptFilter as any),
    });
  }, [allFeatures, selectedDate, deptFilter]);

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
    if (!canManageBases) return;
    setCamps((prev) => prev.map((c) => (c.id === campId ? { ...c, campName: name } : c)));
  };

  const handleAddStateToCamp = (campId: string) => {
    if (!canManageEntries) return;
    const targetCamp = camps.find((c) => c.id === campId);
    if (targetCamp) {
      setAddEntryTarget({ campId: targetCamp.id, campName: targetCamp.campName, entryToEdit: null });
    }
  };

  const handleEditStateInCamp = (campId: string, entry: StatePersonnelCount) => {
    if (!canManageEntries) return;
    const targetCamp = camps.find((c) => c.id === campId);
    if (targetCamp) {
      setAddEntryTarget({ campId: targetCamp.id, campName: targetCamp.campName, entryToEdit: entry });
    }
  };

  const handleConfirmSaveEntry = (
    campId: string,
    entry: { id?: string; stateName: string; officersCount: number; type: "pc" | "bomberos" | "otros" }
  ) => {
    if (!canManageEntries) return;
    setCamps((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        const currentDetails = c.statesDetail || [];
        if (entry.id) {
          const updated = currentDetails.map((sd) =>
            sd.id === entry.id
              ? { ...sd, stateName: entry.stateName, officersCount: entry.officersCount, type: entry.type }
              : sd
          );
          return { ...c, statesDetail: updated };
        } else {
          return {
            ...c,
            statesDetail: [
              ...currentDetails,
              {
                id: crypto.randomUUID(),
                stateName: entry.stateName,
                officersCount: entry.officersCount,
                type: entry.type,
              },
            ],
          };
        }
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

  let pcTotal = 0;
  let bomberosTotal = 0;
  let otrosTotal = 0;

  const stateTotalsMap = new Map<string, number>();
  camps.forEach((c) => {
    (c.statesDetail || []).forEach((sd) => {
      const cnt = Number(sd.officersCount) || 0;
      const current = stateTotalsMap.get(sd.stateName) || 0;
      stateTotalsMap.set(sd.stateName, current + cnt);

      const entryType = getEntryType(sd.stateName, sd.type);
      if (entryType === "pc") pcTotal += cnt;
      else if (entryType === "bomberos") bomberosTotal += cnt;
      else otrosTotal += cnt;
    });
  });

  const getRegionTotalFromCamps = (regionStates: string[]): number => {
    return regionStates.reduce((sum, st) => {
      const exact = stateTotalsMap.get(st) || 0;
      const cleanState = st.replace(/^PC\s+/i, "").toLowerCase();
      let aliasSum = 0;
      stateTotalsMap.forEach((cnt, sName) => {
        if (sName !== st && sName.toLowerCase().includes(cleanState)) {
          aliasSum += cnt;
        }
      });
      return sum + exact + aliasSum;
    }, 0);
  };

  const totalGeneralPersonnel = pcTotal + bomberosTotal + otrosTotal;

  const displayedCamps = camps.map((c) => {
    if (campDeptFilter === "all") return c;
    const filteredStates = (c.statesDetail || []).filter(
      (sd) => getEntryType(sd.stateName, sd.type) === campDeptFilter
    );
    return { ...c, statesDetail: filteredStates };
  });

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        canEdit={canEdit}
        canManageBases={canManageBases}
        canManageEntries={canManageEntries}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        saving={saving}
        saveSuccess={saveSuccess}
        handleSaveAll={handleSaveAll}
        handleAddCamp={handleAddCamp}
        handleExportTeamsExcel={handleExportTeamsExcel}
        handleExportReportImage={handleExportReportImage}
        workTeamsCount={workTeams.length}
        onAddTeam={() => setIsCreateTeamOpen(true)}
      />

      {activeTab === "equipos" ? (
        <WorkTeamsTab
          workTeams={workTeams}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          onEditTeam={canEditLogs ? setEditingTeam : undefined}
          onDeleteTeam={canEditLogs ? requestDeleteTeam : undefined}
        />
      ) : (
        <ReportImageTab
          features={allFeatures}
          selectedDate={selectedDate}
        />
      )}

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

      <OverwriteWarningModal
        open={showOverwriteWarning}
        saving={saving}
        date={selectedDate}
        onCancel={() => setShowOverwriteWarning(false)}
        onConfirm={executeSaveAll}
      />

      <AddCampEntryModal
        key={addEntryTarget ? `${addEntryTarget.campId}-${addEntryTarget.entryToEdit?.id || 'new'}` : 'closed'}
        isOpen={!!addEntryTarget}
        campId={addEntryTarget?.campId || ""}
        campName={addEntryTarget?.campName || ""}
        entryToEdit={addEntryTarget?.entryToEdit}
        onClose={() => setAddEntryTarget(null)}
        onConfirm={handleConfirmSaveEntry}
      />
    </div>
  );
};
