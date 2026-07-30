import React, { useState, useEffect, useCallback } from "react";
import { Activity, Map as MapIcon, Plus, Save, Check, Trash2, Edit3, ShieldAlert, CheckSquare, AlertTriangle, X } from "lucide-react";
import { REDAN_REGIONS } from "../data/redanStructure";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  CampamentoEntry,
  VENEZUELA_STATES,
} from "../services/baseService";

interface DeleteTarget {
  type: "camp" | "state";
  campId: string;
  stateIdTarget?: string;
  title: string;
  subtitle: string;
}

export const PizarraOperacional: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [showAddBase, setShowAddBase] = useState(false);

  // Modal confirmation target
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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

  // Handle saving campamentos to Supabase
  const handleSaveAll = useCallback(async () => {
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
  }, [selectedDate, camps]);

  // Handlers for Base management
  const handleAddCamp = () => {
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
    const name = campName?.trim() || "esta base";
    setDeleteTarget({
      type: "camp",
      campId,
      title: "Eliminar Base Operacional",
      subtitle: `¿Estás seguro de que deseas eliminar permanentemente "${name}"?`,
    });
  };

  const requestRemoveState = (campId: string, stateId: string, stateName?: string) => {
    setDeleteTarget({
      type: "state",
      campId,
      stateIdTarget: stateId,
      title: "Quitar Estado de la Base",
      subtitle: `¿Deseas remover "${stateName || 'este estado'}" de esta base operacional?`,
    });
  };

  const confirmExecuteDelete = () => {
    if (!deleteTarget) return;

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
    setCamps((prev) => prev.map((c) => (c.id === campId ? { ...c, campName: name } : c)));
  };

  const handleAddStateToCamp = (campId: string) => {
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        </div>
      </header>

      {/* BANNER SECUNDARIO NUEVA BASE */}
      {isEditMode && showAddBase && (
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

      {/* CONTENIDO PRINCIPAL CON FLUJO HORIZONTAL DE COLUMNAS */}
      <main
        style={{
          padding: "10px 16px",
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          overflowX: "auto",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* BANNER NOTIFICACIÓN MODO EDICIÓN */}
        {isEditMode && (
          <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.7rem", fontWeight: 600, flexShrink: 0 }}>
            <ShieldAlert size={14} />
            <span><strong>Modo Edición Activado:</strong> Puedes modificar los nombres de las bases, cambiar o eliminar estados y crear nuevas bases.</span>
          </div>
        )}

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
                  {isEditMode ? (
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

                  {isEditMode && (
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
                <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {isEditMode && (
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
                        {isEditMode ? (
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
                            value={sd.officersCount === 0 || !sd.officersCount ? "" : String(sd.officersCount)}
                            onChange={(e) => {
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
                            }}
                          />

                          {isEditMode && (
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

      {/* MODAL DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteTarget && (
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
