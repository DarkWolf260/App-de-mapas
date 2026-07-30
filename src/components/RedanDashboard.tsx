import React, { useState, useEffect, useCallback } from "react";
import { REDAN_REGIONS } from "../data/redanStructure";
import { Plus, Trash2, Save, Check, Calendar, Building2 } from "lucide-react";
import {
  fetchCampamentos,
  saveCampamentos,
  deleteCampamento,
  CampamentoEntry,
  VENEZUELA_STATES,
} from "../services/baseService";

const ACCENT = "#3b82f6";

const RedanDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from Supabase on date change
  useEffect(() => {
    let isMounted = true;
    fetchCampamentos(selectedDate).then((fetched) => {
      if (isMounted) {
        setCamps(fetched || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Handle Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const processed = camps.map((c) => {
        const total = (c.statesDetail || []).reduce((sum, s) => sum + (Number(s.officersCount) || 0), 0);
        return {
          ...c,
          personnelCount: total,
        };
      });

      await saveCampamentos(selectedDate, processed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error al guardar campamentos en Supabase:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedDate, camps]);

  // Add new Campamento
  const handleAddCamp = () => {
    const newCamp: CampamentoEntry = {
      id: crypto.randomUUID(),
      campName: `Campamento ${camps.length + 1}`,
      capacity: 0,
      personnelCount: 0,
      status: "Activo",
      statesDetail: [{ id: crypto.randomUUID(), stateName: "-", officersCount: 0 }],
    };
    setCamps((prev) => [...prev, newCamp]);
  };

  // Delete entire Campamento
  const handleDeleteCamp = (campId: string, campName?: string) => {
    const confirmMsg = campName?.trim()
      ? `¿Estás seguro de que deseas eliminar el campamento "${campName.trim()}"?`
      : "¿Estás seguro de que deseas eliminar este campamento?";

    if (!window.confirm(confirmMsg)) return;

    deleteCampamento(campId);
    setCamps((prev) => prev.filter((c) => c.id !== campId));
  };

  // Update Camp Name
  const handleUpdateCampName = (campId: string, name: string) => {
    setCamps((prev) =>
      prev.map((c) => (c.id === campId ? { ...c, campName: name } : c))
    );
  };

  // Add State to a Campamento
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

  // Remove State from a Campamento
  const handleRemoveStateFromCamp = (campId: string, stateIndex: number, stateName?: string) => {
    const confirmMsg = stateName && stateName.trim()
      ? `¿Deseas quitar "${stateName.trim()}" de este campamento?`
      : "¿Deseas quitar este estado de este campamento?";
    if (!window.confirm(confirmMsg)) return;

    setCamps((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        const updated = (c.statesDetail || []).filter((_, idx) => idx !== stateIndex);
        return { ...c, statesDetail: updated };
      })
    );
  };

  // Update State in a Campamento
  const handleUpdateStateInCamp = (
    campId: string,
    stateIndex: number,
    field: "stateName" | "officersCount",
    val: string | number
  ) => {
    setCamps((prev) =>
      prev.map((c) => {
        if (c.id !== campId) return c;
        const updated = (c.statesDetail || []).map((sd, idx) => {
          if (idx !== stateIndex) return sd;
          if (field === "stateName") return { ...sd, stateName: String(val) };
          const numVal = parseInt(String(val), 10);
          return { ...sd, officersCount: isNaN(numVal) ? 0 : numVal };
        });
        return { ...c, statesDetail: updated };
      })
    );
  };

  // Calculate totals per state across all camps
  const stateTotalsMap = new Map<string, number>();
  camps.forEach((c) => {
    (c.statesDetail || []).forEach((sd) => {
      const current = stateTotalsMap.get(sd.stateName) || 0;
      stateTotalsMap.set(sd.stateName, current + (Number(sd.officersCount) || 0));
    });
  });

  const getRegionTotal = (states: string[]): number =>
    states.reduce((sum, st) => sum + (stateTotalsMap.get(st) || 0), 0);

  const grandTotal = Array.from(stateTotalsMap.values()).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* HEADER */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(16,24,40,0.6)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={18} style={{ color: ACCENT }} />
          <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
            Gestión de Bases Operativas y REDAN
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "5px",
                color: "#fff",
                fontSize: "0.72rem",
                padding: "4px 8px",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          <button
            onClick={handleAddCamp}
            style={{
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "5px",
              color: "#38bdf8",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} /> Nuevo Campamento
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saveSuccess
                ? "linear-gradient(135deg, #15803d, #166534)"
                : "linear-gradient(135deg, #0284c7, #0369a1)",
              border: `1px solid ${saveSuccess ? "#22c55e" : "#38bdf8"}`,
              borderRadius: "5px",
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {saveSuccess ? <Check size={12} /> : <Save size={12} />}
            <span>{saving ? "Guardando..." : saveSuccess ? "Guardado" : "Guardar"}</span>
          </button>

          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: ACCENT }}>
            Total Personal: {grandTotal}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT: LEFT CAMPAMENTOS, RIGHT REDAN CONSOLIDADO */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        
        {/* COLUMNA 1: GESTIÓN DE CAMPAMENTOS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "0.78rem", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Campamentos Registrados ({camps.length})
            </h4>
          </div>

          {camps.length === 0 ? (
            <div style={{ background: "rgba(15,23,42,0.5)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "8px", padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              No hay campamentos registrados para la fecha seleccionada.
              <br />
              Haz clic en <strong>+ Nuevo Campamento</strong> para crear uno.
            </div>
          ) : (
            camps.map((camp) => {
              const campTotal = (camp.statesDetail || []).reduce((s, sd) => s + (Number(sd.officersCount) || 0), 0);
              return (
                <div
                  key={camp.id}
                  style={{
                    background: "rgba(15,23,42,0.7)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* HEADER DE CAMPAMENTO */}
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "rgba(30,41,59,0.8)",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      value={camp.campName}
                      onChange={(e) => handleUpdateCampName(camp.id, e.target.value)}
                      placeholder="Nombre del campamento"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        color: "#fff",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        outline: "none",
                        flex: 1,
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleDeleteCamp(camp.id, camp.campName)}
                        title="Eliminar campamento"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "2px",
                          display: "inline-flex",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* LISTA DE ESTADOS EN ESTE CAMPAMENTO */}
                  <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Estados / Despliegue de Personal
                      </span>
                      <button
                        onClick={() => handleAddStateToCamp(camp.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(59,130,246,0.3)",
                          borderRadius: "4px",
                          color: ACCENT,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plus size={10} /> Añadir Estado
                      </button>
                    </div>

                    {(camp.statesDetail || [])
                      .slice()
                      .sort((a, b) => a.stateName.localeCompare(b.stateName, "es"))
                      .map((sd, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "4px",
                          padding: "3px 6px",
                        }}
                      >
                        <select
                          value={sd.stateName}
                          onChange={(e) => handleUpdateStateInCamp(camp.id, sIdx, "stateName", e.target.value)}
                          style={{
                            background: "rgba(15,23,42,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "3px",
                            color: "#fff",
                            fontSize: "0.68rem",
                            padding: "2px 4px",
                            outline: "none",
                            flex: 1,
                          }}
                        >
                          {VENEZUELA_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="number"
                            min="0"
                            value={sd.officersCount}
                            onChange={(e) => handleUpdateStateInCamp(camp.id, sIdx, "officersCount", e.target.value)}
                            style={{
                              width: "60px",
                              background: "rgba(0,0,0,0.3)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "3px",
                              color: "#fff",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textAlign: "center",
                              padding: "2px 4px",
                              outline: "none",
                            }}
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleRemoveStateFromCamp(camp.id, sIdx, sd.stateName)}
                            title="Eliminar este estado"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "1px",
                              display: "inline-flex",
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PIE DE TARJETA CON TOTAL DE CAMPAMENTO */}
                  <div
                    style={{
                      padding: "6px 12px",
                      background: "rgba(30,41,59,0.5)",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Total Campamento
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: ACCENT }}>
                      {campTotal}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA 2: CONSOLIDADO REDAN (CALCULADO AUTOMÁTICAMENTE DE SUPABASE) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h4 style={{ margin: 0, fontSize: "0.78rem", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Consolidado por Regiones REDAN
          </h4>

          <div
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "6px 10px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    REDAN / Estado
                  </th>
                  <th style={{ padding: "6px 10px", textAlign: "center", fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", width: "90px" }}>
                    Personal
                  </th>
                </tr>
              </thead>
              <tbody>
                {REDAN_REGIONS.map((region) => {
                  const regTotal = getRegionTotal(region.states);
                  return (
                    <React.Fragment key={region.name}>
                      <tr>
                        <td
                          colSpan={2}
                          style={{
                            padding: "5px 10px",
                            background: "rgba(59,130,246,0.08)",
                            borderBottom: "1px solid rgba(59,130,246,0.15)",
                            borderTop: "1px solid rgba(59,130,246,0.15)",
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            color: ACCENT,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          {region.name}
                        </td>
                      </tr>
                      {region.states.slice().sort((a, b) => a.localeCompare(b, "es")).map((state) => {
                        const count = stateTotalsMap.get(state) || 0;
                        return (
                          <tr
                            key={state}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              background: count > 0 ? "rgba(59,130,246,0.03)" : "transparent",
                            }}
                          >
                            <td style={{ padding: "4px 10px", fontWeight: 600, color: "var(--text-main)", fontSize: "0.68rem" }}>
                              {state}
                            </td>
                            <td style={{ padding: "4px 10px", textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: count > 0 ? "#fff" : "var(--text-muted)" }}>
                              {count || "—"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderBottom: "1.5px solid rgba(59,130,246,0.25)" }}>
                        <td style={{ padding: "4px 10px", fontSize: "0.64rem", fontWeight: 800, color: ACCENT }}>
                          Total {region.name}
                        </td>
                        <td style={{ padding: "4px 10px", textAlign: "center", fontSize: "0.72rem", fontWeight: 800, color: "#fff" }}>
                          {regTotal}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    style={{
                      padding: "8px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: ACCENT,
                      borderTop: "2px solid rgba(59,130,246,0.4)",
                      background: "rgba(59,130,246,0.08)",
                    }}
                  >
                    TOTAL GENERAL REDAN
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "#fff",
                      borderTop: "2px solid rgba(59,130,246,0.4)",
                      background: "rgba(59,130,246,0.08)",
                    }}
                  >
                    {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export { RedanDashboard };
