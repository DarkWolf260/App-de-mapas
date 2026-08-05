import React from "react";
import { FileText, EyeOff, Layers, MapPin, Pencil, X } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { sectionBox } from "../popup/popupStyles";
import type { TableEntry } from "./RangeReportNovedadesTab";

interface NovedadesTableProps {
  entries: TableEntry[];
  showOrigin: boolean;
  onToggleOrigin: () => void;
  canEdit: boolean;
  canEditActions: boolean;
  editingEntryId: string | null;
  editingEntryTime: string;
  setEditingEntryTime: (val: string) => void;
  editingEntryText: string;
  setEditingEntryText: (val: string) => void;
  handleSaveEditEntry: (entry: TableEntry) => Promise<void>;
  handleCancelEditEntry: () => void;
  handleStartEditEntry: (entry: TableEntry) => void;
  handleNavigateToEntry: (entry: TableEntry) => void;
  onDeleteEntry: (entry: TableEntry) => void;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
}

export const NovedadesTable: React.FC<NovedadesTableProps> = ({
  entries,
  showOrigin,
  onToggleOrigin,
  canEdit,
  canEditActions,
  editingEntryId,
  editingEntryTime,
  setEditingEntryTime,
  editingEntryText,
  setEditingEntryText,
  handleSaveEditEntry,
  handleCancelEditEntry,
  handleStartEditEntry,
  handleNavigateToEntry,
  onDeleteEntry,
  onNavigateToFeature,
}) => {
  return (
    <div
      style={{
        ...sectionBox,
        background: "rgba(56, 189, 248, 0.03)",
        borderColor: "rgba(56, 189, 248, 0.15)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: "var(--color-info)",
          padding: "8px 12px 6px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FileText size={10} /> Libro de Novedades
        <span style={{ marginLeft: "auto", fontSize: "0.55rem", fontWeight: 400, color: "var(--text-muted)" }}>
          {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
        </span>
      </div>

      {entries.length === 0 ? (
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", padding: "20px 12px", textAlign: "center" }}>
          Sin novedades ni observaciones registradas para este día.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.62rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", width: "60px" }}>
                  Hora
                </th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Novedad
                </th>
                {showOrigin && (
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>
                    Origen
                  </th>
                )}
                <th style={{ width: "48px" }}>
                  {canEdit && canEditActions && (
                    <button
                      onClick={onToggleOrigin}
                      title={showOrigin ? "Ocultar columna Origen" : "Mostrar columna Origen"}
                      style={{
                        padding: "0 2px",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        margin: "0 auto",
                      }}
                    >
                      <EyeOff size={11} style={{ opacity: showOrigin ? 0.5 : 1, color: showOrigin ? "var(--text-muted)" : "var(--color-info)" }} />
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isPunto = entry.level === "punto";
                const isLibro = entry.level === "libro";
                const isZona = entry.level === "zona";
                const canNavigate = !entry.isObservation && entry.featureId && onNavigateToFeature;
                const rowBg = entry.isObservation
                  ? "rgba(251,146,60,0.04)"
                  : isLibro
                  ? idx % 2 === 0
                    ? "rgba(34,197,94,0.04)"
                    : "rgba(34,197,94,0.02)"
                  : isPunto
                  ? idx % 2 === 0
                    ? "rgba(167,139,250,0.04)"
                    : "rgba(167,139,250,0.02)"
                  : idx % 2 === 0
                  ? "transparent"
                  : "rgba(255,255,255,0.01)";

                return (
                  <tr
                    key={entry.id}
                    onClick={canNavigate ? () => handleNavigateToEntry(entry) : undefined}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: rowBg,
                      cursor: canNavigate ? "pointer" : "default",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={
                      canNavigate
                        ? (e) => {
                            e.currentTarget.style.background = isPunto ? "rgba(167,139,250,0.12)" : "rgba(56,189,248,0.08)";
                          }
                        : undefined
                    }
                    onMouseLeave={
                      canNavigate
                        ? (e) => {
                            e.currentTarget.style.background = rowBg;
                          }
                        : undefined
                    }
                  >
                    <td
                      style={{
                        padding: "6px 10px",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: entry.isObservation
                          ? "var(--text-muted)"
                          : isLibro
                          ? "var(--color-green)"
                          : isPunto
                          ? "#c4b5fd"
                          : "var(--text-main)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.isObservation ? (
                        <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontStyle: "italic" }}>obs.</span>
                      ) : (
                        <>
                          {entry.time} <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>HLV</span>
                        </>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "6px 10px",
                        color: entry.isObservation
                          ? "var(--text-muted)"
                          : isLibro
                          ? "var(--color-green)"
                          : isPunto
                          ? "#c4b5fd"
                          : "var(--text-main)",
                        fontStyle: entry.isObservation ? "italic" : "normal",
                        lineHeight: 1.4,
                      }}
                    >
                      {entry.isObservation && (
                        <span style={{ color: "var(--accent-orange)", fontWeight: 700, fontSize: "0.55rem", marginRight: "4px" }}>
                          OBS:
                        </span>
                      )}
                      {editingEntryId === entry.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input
                              type="time"
                              value={editingEntryTime}
                              onChange={(e) => setEditingEntryTime(e.target.value)}
                              style={{
                                width: "80px",
                                fontSize: "0.6rem",
                                padding: "4px 5px",
                                borderRadius: "4px",
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(17,24,39,0.7)",
                                color: "var(--text-main)",
                                fontVariantNumeric: "tabular-nums",
                                outline: "none",
                                fontFamily: "inherit",
                              }}
                            />
                          </div>
                          <textarea
                            value={editingEntryText}
                            onChange={(e) => setEditingEntryText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditEntry(entry);
                              }
                            }}
                            autoFocus
                            rows={3}
                            style={{
                              fontSize: "0.62rem",
                              padding: "4px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(56,189,248,0.3)",
                              background: "rgba(17,24,39,0.7)",
                              color: "var(--text-main)",
                              fontFamily: "inherit",
                              resize: "vertical",
                              outline: "none",
                              width: "100%",
                            }}
                          />
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => handleSaveEditEntry(entry)}
                              disabled={!editingEntryText.trim()}
                              style={{
                                fontSize: "0.55rem",
                                padding: "2px 8px",
                                borderRadius: "3px",
                                border: "1px solid rgba(34,197,94,0.3)",
                                background: editingEntryText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)",
                                color: editingEntryText.trim() ? "var(--color-green)" : "var(--text-muted)",
                                cursor: editingEntryText.trim() ? "pointer" : "default",
                              }}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEditEntry}
                              style={{
                                fontSize: "0.55rem",
                                padding: "2px 8px",
                                borderRadius: "3px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.03)",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span
                          onClick={
                            canNavigate
                              ? (e) => {
                                  e.stopPropagation();
                                  handleNavigateToEntry(entry);
                                }
                              : undefined
                          }
                          style={canNavigate ? { cursor: "pointer" } : {}}
                        >
                          {entry.text}
                        </span>
                      )}
                    </td>
                    {showOrigin && (
                      <td style={{ padding: "6px 10px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontSize: "0.55rem",
                            fontWeight: 600,
                            background: entry.isObservation
                              ? "rgba(251, 146, 60, 0.1)"
                              : isLibro
                              ? "rgba(34, 197, 94, 0.1)"
                              : isPunto
                              ? "rgba(167, 139, 250, 0.12)"
                              : "rgba(56, 189, 248, 0.1)",
                            color: entry.isObservation
                              ? "var(--accent-orange)"
                              : isLibro
                              ? "var(--color-green)"
                              : isPunto
                              ? "#a78bfa"
                              : "var(--color-info)",
                            ...(canNavigate ? { cursor: "pointer" } : {}),
                          }}
                        >
                          {isZona && <Layers size={10} />}
                          {isPunto && <MapPin size={10} />}
                          {entry.origin}
                        </span>
                      </td>
                    )}
                    {canEdit && canEditActions && (
                      <td style={{ padding: "6px 2px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {!entry.isObservation && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditEntry(entry);
                              }}
                              title="Editar"
                              style={{
                                padding: "2px",
                                borderRadius: "3px",
                                border: "none",
                                background: "transparent",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                transition: "color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-info)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(entry);
                              }}
                              title="Eliminar"
                              style={{
                                padding: "2px",
                                borderRadius: "3px",
                                border: "none",
                                background: "transparent",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                transition: "color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-high)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              <X size={11} />
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
