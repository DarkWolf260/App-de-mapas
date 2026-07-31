import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert, Lock } from "lucide-react";
import { REDAN_REGIONS } from "../data/redanStructure";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  checkPizarraRecordExists,
  CampamentoEntry,
} from "../services/baseService";
import { useAuth } from "../hooks/useAuth";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs } from "../services/logService";
import { getNormalizedGroupList, mergeLogs } from "../utils/logUtils";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";

// SOLID Sub-components
import { DeleteTarget, WorkTeam } from "./pizarra/types";
import { PizarraHeader } from "./pizarra/PizarraHeader";
import { BaseCard } from "./pizarra/BaseCard";
import { RedanCard } from "./pizarra/RedanCard";
import { TotalGeneralCard } from "./pizarra/TotalGeneralCard";
import { WorkTeamsTab } from "./pizarra/WorkTeamsTab";
import { DeleteConfirmModal } from "./pizarra/DeleteConfirmModal";

export const PizarraOperacional: React.FC = () => {
  const { isAdmin, isOperador } = useAuth();
  const canEdit = isAdmin || isOperador;

  const [activeTab, setActiveTab] = useState<"pizarra" | "equipos">("pizarra");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [workTeams, setWorkTeams] = useState<WorkTeam[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [showAddBase, setShowAddBase] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Modal confirmation target
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Turn off edit mode if user lacks permission
  useEffect(() => {
    if (!canEdit) {
      setIsEditMode(false);
    }
  }, [canEdit]);

  // Load campamentos on date change
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
    } catch (err) {
      console.error("Error saving campamentos:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle save button trigger with overwrite warning prompt
  const handleSaveAll = useCallback(async () => {
    if (!canEdit) return;
    const exists = await checkPizarraRecordExists(selectedDate);
    if (exists) {
      setShowOverwriteWarning(true);
    } else {
      await executeSaveAll();
    }
  }, [selectedDate, camps, canEdit]);

  // Export Work Teams to Excel
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
            padding: "16px 24px 70px 24px",
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            maxWidth: "1600px",
            margin: "0 auto",
          }}
        >
          {/* BANNER NOTIFICACIÓN MODO EDICIÓN O ADVERTENCIA SIN PERMISOS */}
          {canEdit && isEditMode ? (
            <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
              <ShieldAlert size={15} />
              <span><strong>Modo Edición Activado:</strong> Puedes modificar los nombres de las bases, cambiar o eliminar estados y crear nuevas bases.</span>
            </div>
          ) : !canEdit ? (
            <div style={{ background: "rgba(30, 41, 59, 0.4)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 500, flexShrink: 0 }}>
              <Lock size={15} />
              <span><strong>Modo Lectura Protegido:</strong> Solo Administradores y Operadores autenticados pueden modificar datos.</span>
            </div>
          ) : null}

          {/* PANEL SUPERIOR DE RESUMEN EJECUTIVO (TOTAL GENERAL + DESPLIEGUE REDAN) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
              alignItems: "stretch",
            }}
          >
            <TotalGeneralCard redanGrandTotal={redanGrandTotal} />
            <RedanCard
              getRegionTotalFromCamps={getRegionTotalFromCamps}
              redanGrandTotal={redanGrandTotal}
            />
          </div>

          {/* ENCABEZADO DE SECCIÓN BASES OPERACIONALES */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Bases Operacionales y Campamentos</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--accent-orange)", background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.3)", borderRadius: "10px", padding: "1px 8px" }}>
                {camps.length}
              </span>
            </h2>
          </div>

          {/* MATRIZ REUTILIZABLE Y BALANCEADA DE BASES OPERACIONALES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
              paddingBottom: "24px",
              alignItems: "start",
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
        </main>
      ) : (
        /* PESTAÑA DEDICADA DE EQUIPOS DE TRABAJO */
        <WorkTeamsTab workTeams={workTeams} />
      )}

      {/* MODAL DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmExecuteDelete}
      />

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
