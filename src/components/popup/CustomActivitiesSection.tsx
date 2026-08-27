import React, { useState } from "react";
import type { CustomActivity } from "../../types";
import { Activity, Plus, Trash2, Tag, Check } from "lucide-react";
import { sectionBox, inputStyle } from "./popupStyles";

interface CustomActivitiesSectionProps {
  customActivities: CustomActivity[];
  onChange: (activities: CustomActivity[]) => void;
  canEdit?: boolean;
  title?: string;
  subtitle?: string;
}

export const CustomActivitiesSection: React.FC<CustomActivitiesSectionProps> = ({
  customActivities = [],
  onChange,
  canEdit = true,
  title = "Actividades Personalizadas",
  subtitle = "Adicionales a los indicadores estándar",
}) => {
  const [customName, setCustomName] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleAdd = () => {
    const name = customName.trim();
    const val = value.trim() || "1";
    if (!name) return;

    const newActivity: CustomActivity = {
      id: crypto.randomUUID(),
      name,
      value: val,
      description: description.trim() || undefined,
    };

    onChange([...customActivities, newActivity]);
    setCustomName("");
    setValue("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(customActivities.filter((act) => act.id !== id));
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
    <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.04)", borderColor: "rgba(168, 85, 247, 0.2)" }}>
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: "#c084fc",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingBottom: "2px",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Activity size={10} /> {title}
        {subtitle && (
          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Lista de Actividades Registradas */}
      {customActivities.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
          {customActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(168, 85, 247, 0.25)",
                borderRadius: "5px",
                padding: "5px 7px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Tag size={10} style={{ color: "#c084fc", flexShrink: 0 }} />
                <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--text-main)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {act.name}
                </span>
                {canEdit ? (
                  <input
                    type="text"
                    value={act.value}
                    onChange={(e) => handleUpdateValue(act.id, e.target.value)}
                    style={{
                      width: "50px",
                      textAlign: "center",
                      padding: "2px 4px",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#a855f7",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                      borderRadius: "4px",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#a855f7" }}>
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
                      opacity: 0.8,
                    }}
                    title="Eliminar actividad"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>

              {/* Descripción / Nota del Detalle */}
              {canEdit ? (
                <input
                  type="text"
                  placeholder="Texto descriptivo / detalle de la actividad (opcional)..."
                  value={act.description || ""}
                  onChange={(e) => handleUpdateDescription(act.id, e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "0.62rem",
                    color: "#e2e8f0",
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    borderRadius: "4px",
                    padding: "3px 6px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    marginTop: "2px",
                  }}
                />
              ) : (
                !!act.description && (
                  <div style={{ fontSize: "0.62rem", color: "#e2e8f0", fontStyle: "italic", padding: "3px 6px", background: "rgba(168, 85, 247, 0.12)", borderRadius: "4px", marginTop: "2px", borderLeft: "2px solid #c084fc" }}>
                    💬 {act.description}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", margin: "4px 0" }}>
            No hay actividades personalizadas añadidas
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
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "6px",
                padding: "8px",
                marginTop: "4px",
              }}
            >
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#c084fc" }}>
                Nueva Actividad Personalizada
              </span>

              <input
                type="text"
                placeholder="Nombre de la actividad (Ej: Guardia preventiva)..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ ...inputStyle, fontSize: "0.68rem" }}
                autoFocus
              />

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Cant. (Ej: 1)"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ ...inputStyle, fontSize: "0.68rem", width: "80px" }}
                />
                <input
                  type="text"
                  placeholder="Texto descriptivo (opcional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, fontSize: "0.68rem", flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!customName.trim()}
                  style={{
                    background: customName.trim() ? "rgba(168, 85, 247, 0.25)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${customName.trim() ? "rgba(168, 85, 247, 0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "5px",
                    color: customName.trim() ? "#c084fc" : "var(--text-muted)",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    cursor: customName.trim() ? "pointer" : "default",
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
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "5px",
                    color: "var(--text-muted)",
                    fontSize: "0.64rem",
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
                background: "rgba(168, 85, 247, 0.12)",
                border: "1px dashed rgba(168, 85, 247, 0.35)",
                borderRadius: "5px",
                color: "#c084fc",
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                marginTop: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={10} /> Añadir Actividad Personalizada
            </button>
          )}
        </>
      )}
    </div>
  );
};
