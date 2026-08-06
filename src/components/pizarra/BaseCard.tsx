import React from "react";
import { Plus, Trash2, Shield, MapPin, Edit3 } from "lucide-react";
import { CampamentoEntry, StatePersonnelCount, getEntryType } from "../../services/baseService";

export interface BaseCardProps {
  camp: CampamentoEntry;
  canEdit: boolean;
  isEditMode: boolean;
  canManageBases?: boolean;
  canManageEntries?: boolean;
  handleUpdateCampName: (campId: string, name: string) => void;
  requestDeleteCamp: (campId: string, campName?: string) => void;
  handleAddStateToCamp: (campId: string) => void;
  handleEditStateInCamp: (campId: string, entry: StatePersonnelCount) => void;
  requestRemoveState: (campId: string, stateId: string, stateName?: string) => void;
  handleUpdateOfficersCount?: (campId: string, stateId: string, newCount: number) => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  camp,
  canEdit,
  isEditMode,
  canManageBases,
  canManageEntries,
  handleUpdateCampName,
  requestDeleteCamp,
  handleAddStateToCamp,
  handleEditStateInCamp,
  requestRemoveState,
  handleUpdateOfficersCount,
}) => {
  const allowManageBases = canEdit && (canManageBases ?? true);
  const allowManageEntries = canEdit && (canManageEntries ?? true);

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

          {allowManageBases && isEditMode ? (
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

        {allowManageBases && isEditMode && (
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

      {/* FILAS DE ENTRADAS CON SCROLL INTERNO */}
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
        {allowManageEntries && isEditMode && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Entradas Asignadas
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
            Sin entradas agregadas
          </div>
        ) : (
          (camp.statesDetail || [])
            .slice()
            .sort((a, b) => a.stateName.localeCompare(b.stateName, "es"))
            .map((sd) => {
              const entryType = getEntryType(sd.stateName, sd.type);
              const typeBadgeColor =
                entryType === "pc"
                  ? "#f97316"
                  : entryType === "bomberos"
                  ? "#ef4444"
                  : "#38bdf8";

              const typeBadgeBg =
                entryType === "pc"
                  ? "rgba(249, 115, 22, 0.15)"
                  : entryType === "bomberos"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(56, 189, 248, 0.15)";

              return (
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
                    padding: "6px 10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "0.56rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        color: typeBadgeColor,
                        background: typeBadgeBg,
                        border: `1px solid ${typeBadgeColor}33`,
                        flexShrink: 0,
                      }}
                    >
                      {entryType === "pc" ? "PC" : entryType === "bomberos" ? "BOM" : "OTR"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "#e2e8f0",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sd.stateName}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {allowManageEntries ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={sd.officersCount ?? 0}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9]/g, "");
                          const val = parseInt(sanitized, 10) || 0;
                          if (handleUpdateOfficersCount) {
                            handleUpdateOfficersCount(camp.id, sd.id, val);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "44px",
                          textAlign: "center",
                          background: "rgba(0, 0, 0, 0.6)",
                          border: "1px solid rgba(249, 115, 22, 0.5)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontSize: "0.76rem",
                          fontFamily: "var(--sans-font)",
                          fontWeight: 800,
                          padding: "3px 4px",
                          outline: "none",
                          boxShadow: "0 0 8px rgba(249, 115, 22, 0.15)",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          minWidth: "32px",
                          textAlign: "center",
                          background: "rgba(0, 0, 0, 0.4)",
                          border: "1px solid rgba(249, 115, 22, 0.3)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontSize: "0.76rem",
                          fontFamily: "var(--sans-font)",
                          fontWeight: 800,
                          padding: "2px 6px",
                        }}
                      >
                        {sd.officersCount || 0}
                      </span>
                    )}

                    {allowManageEntries && isEditMode && (
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <button
                          onClick={() => handleEditStateInCamp(camp.id, sd)}
                          title="Editar esta entrada en ventana flotante"
                          style={{
                            background: "rgba(56, 189, 248, 0.1)",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            borderRadius: "5px",
                            color: "#38bdf8",
                            cursor: "pointer",
                            padding: "3px 5px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => requestRemoveState(camp.id, sd.id, sd.stateName)}
                          title="Eliminar esta entrada"
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "5px",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "3px 5px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
