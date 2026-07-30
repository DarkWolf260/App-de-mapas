import React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  EyeOff,
  Layers,
  MapPin,
  Pencil,
  X,
} from "lucide-react";
import type { NovedadEntry, NovedadType, DrawnFeature, DailyLog } from "../../types";
import { sectionBox } from "../popup/popupStyles";
import { BitacoraCalendar } from "../BitacoraCalendar";
import { formatDateFriendly } from "../../utils/logUtils";

export interface TableEntry {
  id: string;
  time: string;
  text: string;
  origin: string;
  isObservation: boolean;
  type?: NovedadType;
  featureId?: number;
  rawTimestamp?: string;
  level?: "libro" | "zona" | "punto";
}

interface RangeReportNovedadesTabProps {
  isAllMode: boolean;
  activeDateIndex: number;
  dates: string[];
  activeDate: string;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  showCalendarPopover: boolean;
  setShowCalendarPopover: React.Dispatch<React.SetStateAction<boolean>>;
  syncDateChange: (newIndex: number) => void;
  canEdit: boolean;
  onSaveGlobalNovedad?: (entry: NovedadEntry, date: string, department: string) => Promise<void>;
  novText: string;
  setNovText: (val: string) => void;
  novTime: string;
  setNovTime: (val: string) => void;
  handleAddNovedad: () => Promise<void>;
  tableEntries: TableEntry[];
  showOrigin: boolean;
  setShowOrigin: (val: boolean) => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onDeleteGlobalNovedad?: (entryId: string) => Promise<void>;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  handleNavigateToEntry: (entry: TableEntry) => void;
  editingEntryId: string | null;
  editingEntryTime: string;
  setEditingEntryTime: (val: string) => void;
  editingEntryText: string;
  setEditingEntryText: (val: string) => void;
  handleSaveEditEntry: (entry: TableEntry) => Promise<void>;
  handleCancelEditEntry: () => void;
  handleStartEditEntry: (entry: TableEntry) => void;
  setConfirmDeleteNovedad: (entry: TableEntry | null) => void;
}

export const RangeReportNovedadesTab: React.FC<RangeReportNovedadesTabProps> = ({
  isAllMode,
  activeDateIndex,
  dates,
  activeDate,
  handlePrevDay,
  handleNextDay,
  showCalendarPopover,
  setShowCalendarPopover,
  syncDateChange,
  canEdit,
  onSaveGlobalNovedad,
  novText,
  setNovText,
  novTime,
  setNovTime,
  handleAddNovedad,
  tableEntries,
  showOrigin,
  setShowOrigin,
  onSaveDailyLog,
  onDeleteGlobalNovedad,
  onNavigateToFeature,
  handleNavigateToEntry,
  editingEntryId,
  editingEntryTime,
  setEditingEntryTime,
  editingEntryText,
  setEditingEntryText,
  handleSaveEditEntry,
  handleCancelEditEntry,
  handleStartEditEntry,
  setConfirmDeleteNovedad,
}) => {
  return (
    <div className="rr-list" style={{ gap: "12px", padding: "12px 16px" }}>
      {/* Date toolbar */}
      {isAllMode && (
        <div className="rr-toolbar" style={{ borderRadius: "10px" }}>
          <div className="rr-toolbar-date">
            <button
              onClick={handlePrevDay}
              disabled={activeDateIndex === dates.length - 1}
              className="rr-icon-btn"
              title="Día anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="rr-date-trigger-btn"
                onClick={() => setShowCalendarPopover((v) => !v)}
              >
                <Calendar size={13} style={{ color: "var(--color-info)" }} />
                <span>{formatDateFriendly(activeDate)}</span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "var(--text-muted)",
                    transition: "transform 0.2s ease",
                    transform: showCalendarPopover ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
              {showCalendarPopover && (
                <div className="rr-calendar-popover" onClick={(e) => e.stopPropagation()}>
                  <BitacoraCalendar
                    selectedDate={activeDate}
                    onSelectDate={(dStr) => {
                      const idx = dates.indexOf(dStr);
                      if (idx !== -1) {
                        syncDateChange(idx);
                      }
                      setShowCalendarPopover(false);
                    }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleNextDay}
              disabled={activeDateIndex === 0}
              className="rr-icon-btn"
              title="Día siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add form */}
      {canEdit && onSaveGlobalNovedad && (
        <div style={{ ...sectionBox, background: "rgba(34, 197, 94, 0.03)", borderColor: "rgba(34, 197, 94, 0.15)" }}>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "var(--color-green)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              paddingBottom: "6px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={10} /> Nueva Entrada
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Novedad</span>
              <textarea
                value={novText}
                onChange={(e) => setNovText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNovedad();
                  }
                }}
                placeholder="Escribir novedad..."
                rows={4}
                style={{
                  resize: "vertical",
                  fontSize: "0.65rem",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(17, 24, 39, 0.5)",
                  color: "var(--text-main)",
                  fontFamily: "inherit",
                  outline: "none",
                  lineHeight: 1.5,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Hora</span>
                <input
                  type="time"
                  value={novTime}
                  onChange={(e) => setNovTime(e.target.value)}
                  style={{
                    width: "90px",
                    fontSize: "0.65rem",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(17, 24, 39, 0.6)",
                    color: "var(--text-main)",
                    fontVariantNumeric: "tabular-nums",
                    outline: "none",
                  }}
                />
              </div>
              <button
                onClick={handleAddNovedad}
                disabled={!novText.trim()}
                title="Agregar"
                style={{
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: "1px solid rgba(34,197,94,0.3)",
                  background: novText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)",
                  color: novText.trim() ? "var(--color-green)" : "var(--text-muted)",
                  cursor: novText.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
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
            {tableEntries.length} {tableEntries.length === 1 ? "entrada" : "entradas"}
          </span>
        </div>

        {tableEntries.length === 0 ? (
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", padding: "20px 12px", textAlign: "center" }}>
            Sin novedades ni observaciones registradas para este día.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.62rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      fontSize: "0.55rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      width: "60px",
                    }}
                  >
                    Hora
                  </th>
                  <th
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      fontSize: "0.55rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Novedad
                  </th>
                  {showOrigin && (
                    <th
                      style={{
                        padding: "6px 10px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        fontSize: "0.55rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        width: "120px",
                      }}
                    >
                      Origen
                    </th>
                  )}
                  <th style={{ width: showOrigin ? "48px" : "48px" }}>
                    {canEdit && (onSaveDailyLog || onDeleteGlobalNovedad) && (
                      <button
                        onClick={() => setShowOrigin(!showOrigin)}
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
                        <EyeOff
                          size={11}
                          style={{
                            opacity: showOrigin ? 0.5 : 1,
                            color: showOrigin ? "var(--text-muted)" : "var(--color-info)",
                          }}
                        />
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableEntries.map((entry, idx) => {
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
                              e.currentTarget.style.background = isPunto
                                ? "rgba(167,139,250,0.12)"
                                : "rgba(56,189,248,0.08)";
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
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            obs.
                          </span>
                        ) : (
                          <>
                            {entry.time}{" "}
                            <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>HLV</span>
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
                          <span
                            style={{
                              color: "var(--accent-orange)",
                              fontWeight: 700,
                              fontSize: "0.55rem",
                              marginRight: "4px",
                            }}
                          >
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
                                  background: editingEntryText.trim()
                                    ? "rgba(34,197,94,0.12)"
                                    : "rgba(255,255,255,0.02)",
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
                      {canEdit && (onSaveDailyLog || onDeleteGlobalNovedad) && (
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
                                  setConfirmDeleteNovedad(entry);
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
    </div>
  );
};
