import React, { useState } from "react";
import type { CustomActivity } from "../../types";
import { Activity, Plus, Trash2, Tag, Check, MessageSquare } from "lucide-react";
import { sectionBox, sectionTitleStyle, inputStyle } from "./popupStyles";
import { generateUUID } from "../../utils/uuidUtils";
import { ACTIVITY_CATALOG_GROUPS, ALL_CATALOG_ACTIVITIES } from "../../utils/activityCatalog";

interface CustomActivitiesSectionProps {
  customActivities: CustomActivity[];
  onChange: (activities: CustomActivity[]) => void;
  canEdit?: boolean;
  title?: string;
  subtitle?: string;
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  fontSize: "0.7rem",
  background: "rgba(10, 15, 29, 0.94)",
  color: "#f8fafc",
  cursor: "pointer",
};

export const CustomActivitiesSection: React.FC<CustomActivitiesSectionProps> = ({
  customActivities = [],
  onChange,
  canEdit = true,
  title = "Actividades",
  subtitle = "Catálogo estandarizado",
}) => {
  const [selectedName, setSelectedName] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleAdd = () => {
    const name = selectedName.trim();
    const val = value.trim() || "1";
    if (!name) return;

    const newActivity: CustomActivity = {
      id: generateUUID(),
      name,
      value: val,
      description: description.trim() || undefined,
    };

    onChange([...customActivities, newActivity]);
    setSelectedName("");
    setValue("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(customActivities.filter((act) => act.id !== id));
  };

  const handleUpdateName = (id: string, newName: string) => {
    if (!newName.trim()) return;
    onChange(
      customActivities.map((act) => (act.id === id ? { ...act, name: newName } : act))
    );
  };

  const handleUpdateValue = (id: string, newVal: string) => {
    onChange(
      customActivities.map((act) => (act.id === id ? { ...act, value: newVal } : act))
    );
  };

  const handleUpdateDescription = (id: string, newDesc: string) => {
    onChange(
      customActivities.map((act) => (act.id === id ? { ...act, description: newDesc } : act))
    );
  };

  return (
    <div style={sectionBox}>
      <div style={sectionTitleStyle}>
        <Activity size={11} style={{ color: "#94a3b8" }} />
        <span>{title}</span>
        {subtitle && (
          <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 500, marginLeft: "auto", textTransform: "none", letterSpacing: 0 }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Lista de Actividades Registradas */}
      {customActivities.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {customActivities.map((act) => {
            const isLegacyValue = !ALL_CATALOG_ACTIVITIES.includes(act.name);
            return (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px",
                  padding: "6px 8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Tag size={11} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  {canEdit ? (
                    <select
                      aria-label="Tipo de actividad"
                      value={act.name}
                      onChange={(e) => handleUpdateName(act.id, e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "4px",
                        padding: "3px 5px",
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {isLegacyValue && (
                        <option value={act.name}>{act.name} (histórico)</option>
                      )}
                      {ACTIVITY_CATALOG_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f8fafc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {act.name}
                    </span>
                  )}
                  {canEdit ? (
                    <input
                      type="text"
                      aria-label="Cantidad"
                      value={act.value}
                      onChange={(e) => handleUpdateValue(act.id, e.target.value)}
                      style={{
                        width: "48px",
                        textAlign: "center",
                        padding: "3px 4px",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: "#fdba74",
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: "#fdba74",
                        background: "rgba(249, 115, 22, 0.12)",
                        border: "1px solid rgba(249, 115, 22, 0.28)",
                        borderRadius: "5px",
                        padding: "1px 7px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {act.value}
                    </span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemove(act.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#f87171",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.85,
                      }}
                      title="Eliminar actividad"
                      aria-label={`Eliminar actividad ${act.name}`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>

                {/* Descripción / Nota del Detalle */}
                {canEdit ? (
                  <input
                    type="text"
                    placeholder="Detalle (tema, escuela, asistentes, estado)..."
                    value={act.description || ""}
                    onChange={(e) => handleUpdateDescription(act.id, e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: "0.66rem",
                      color: "#e2e8f0",
                      background: "rgba(15, 23, 42, 0.75)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "4px 7px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  !!act.description && (
                    <div style={{ fontSize: "0.66rem", color: "#cbd5e1", padding: "4px 7px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", display: "flex", alignItems: "flex-start", gap: "5px", lineHeight: 1.35 }}>
                      <MessageSquare size={11} style={{ flexShrink: 0, color: "#94a3b8", marginTop: "2px" }} />
                      <span>{act.description}</span>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showAddForm && (
          <div style={{ fontSize: "0.66rem", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "2px 0" }}>
            No hay actividades registradas
          </div>
        )
      )}

      {/* Formulario / Botón para Añadir */}
      {canEdit && (
        <>
          {showAddForm ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                background: "rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <span style={{ fontSize: "0.64rem", fontWeight: 700, color: "#cbd5e1" }}>
                Nueva actividad
              </span>

              <select
                aria-label="Seleccionar actividad del catálogo"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                style={selectStyle}
                autoFocus
              >
                <option value="">Selecciona una actividad del catálogo...</option>
                {ACTIVITY_CATALOG_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Cant. (Ej: 1)"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ ...inputStyle, fontSize: "0.7rem", width: "80px" }}
                />
                <input
                  type="text"
                  placeholder="Detalle (tema, turno, asistentes, estado)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, fontSize: "0.7rem", flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedName.trim()}
                  style={{
                    background: selectedName.trim() ? "rgba(249, 115, 22, 0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedName.trim() ? "rgba(249, 115, 22, 0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "5px",
                    color: selectedName.trim() ? "#fdba74" : "#64748b",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    cursor: selectedName.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Check size={11} /> Añadir
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "5px",
                    color: "#94a3b8",
                    fontSize: "0.66rem",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px dashed rgba(255, 255, 255, 0.18)",
                borderRadius: "6px",
                color: "#cbd5e1",
                fontSize: "0.66rem",
                fontWeight: 700,
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={11} /> Añadir Actividad
            </button>
          )}
        </>
      )}
    </div>
  );
};
