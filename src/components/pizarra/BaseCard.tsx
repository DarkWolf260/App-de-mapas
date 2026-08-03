import React from "react";
import { Plus, Trash2, Shield, MapPin } from "lucide-react";
import { CampamentoEntry, VENEZUELA_STATES } from "../../services/baseService";
import Select from "../ui/Select";

export interface BaseCardProps {
  camp: CampamentoEntry;
  canEdit: boolean;
  isEditMode: boolean;
  handleUpdateCampName: (campId: string, name: string) => void;
  requestDeleteCamp: (campId: string, campName?: string) => void;
  handleAddStateToCamp: (campId: string) => void;
  handleUpdateStateInCamp: (
    campId: string,
    stateIdTarget: string,
    field: "stateName" | "officersCount",
    val: string | number
  ) => void;
  requestRemoveState: (campId: string, stateId: string, stateName?: string) => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  camp,
  canEdit,
  isEditMode,
  handleUpdateCampName,
  requestDeleteCamp,
  handleAddStateToCamp,
  handleUpdateStateInCamp,
  requestRemoveState,
}) => {
  const campTotal = (camp.statesDetail || []).reduce(
    (s, sd) => s + (Number(sd.officersCount) || 0),
    0
  );

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(22, 30, 46, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "340px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        transition: "all 0.2s ease-in-out",
        boxSizing: "border-box",
      }}
    >
      {/* ENCABEZADO BASE */}
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(0, 0, 0, 0.25)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-orange)",
              flexShrink: 0,
            }}
          >
            <MapPin size={13} />
          </div>

          {canEdit && isEditMode ? (
            <input
              type="text"
              value={camp.campName}
              onChange={(e) => handleUpdateCampName(camp.id, e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
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
            <h3
              style={{
                color: "#f8fafc",
                fontWeight: 700,
                fontSize: "0.82rem",
                margin: 0,
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {camp.campName}
            </h3>
          )}
        </div>

        {canEdit && isEditMode && (
          <button
            onClick={() => requestDeleteCamp(camp.id, camp.campName)}
            title="Eliminar esta base"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              color: "#ef4444",
              cursor: "pointer",
              padding: "4px 6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "0.62rem",
              fontWeight: 600,
            }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* FILAS DE ESTADOS Y CONTEOS CON SCROLL INTERNO COMPACTO */}
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flex: 1,
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {canEdit && isEditMode && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estados Asignados
            </span>
            <button
              onClick={() => handleAddStateToCamp(camp.id)}
              style={{
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "5px",
                color: "#38bdf8",
                fontSize: "0.62rem",
                fontWeight: 600,
                padding: "2px 7px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontFamily: "var(--sans-font)",
              }}
            >
              <Plus size={11} /> Agregar
            </button>
          </div>
        )}

        {(camp.statesDetail || []).length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.7rem", fontStyle: "italic" }}>
            Sin estados agregados
          </div>
        ) : (
          (camp.statesDetail || [])
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
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "6px",
                  padding: "5px 10px",
                }}
              >
                {canEdit && isEditMode ? (
                  <Select
                    compact
                    options={[{ value: "-", label: "-" }, ...VENEZUELA_STATES.map((st) => ({ value: st, label: st }))]}
                    value={sd.stateName || "-"}
                    onChange={(v) => handleUpdateStateInCamp(camp.id, sd.id, "stateName", v)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 600, flex: 1 }}>
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
                      width: "52px",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(249, 115, 22, 0.3)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "0.76rem",
                      fontFamily: "var(--sans-font)",
                      fontWeight: 800,
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
            ))
        )}
      </div>

      {/* PIE DE TARJETA CON TOTAL BASE */}
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(0, 0, 0, 0.3)",
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Shield size={13} style={{ color: "var(--accent-orange)" }} />
          <span style={{ fontSize: "0.64rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Total Base
          </span>
        </div>
        <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
          {campTotal}
        </span>
      </div>
    </div>
  );
};
