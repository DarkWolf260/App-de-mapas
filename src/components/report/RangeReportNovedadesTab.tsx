import React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { NovedadEntry, NovedadType, DrawnFeature, DailyLog } from "../../types";
import { BitacoraCalendar } from "../BitacoraCalendar";
import { formatDateFriendly } from "../../utils/logUtils";
import { NovedadesAddForm } from "./NovedadesAddForm";
import { NovedadesTable } from "./NovedadesTable";

export interface TableEntry {
  id: string;
  time: string;
  text: string;
  origin: string;
  isObservation: boolean;
  type?: NovedadType;
  featureId?: number | string;
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
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
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
  const canEditActions = !!(onSaveDailyLog || onDeleteGlobalNovedad);

  return (
    <div className="rr-list" style={{ gap: "12px", padding: "12px 16px" }}>
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

      {canEdit && onSaveGlobalNovedad && (
        <NovedadesAddForm
          novText={novText}
          setNovText={setNovText}
          novTime={novTime}
          setNovTime={setNovTime}
          handleAddNovedad={handleAddNovedad}
        />
      )}

      <NovedadesTable
        entries={tableEntries}
        showOrigin={showOrigin}
        onToggleOrigin={() => setShowOrigin(!showOrigin)}
        canEdit={canEdit}
        canEditActions={canEditActions}
        editingEntryId={editingEntryId}
        editingEntryTime={editingEntryTime}
        setEditingEntryTime={setEditingEntryTime}
        editingEntryText={editingEntryText}
        setEditingEntryText={setEditingEntryText}
        handleSaveEditEntry={handleSaveEditEntry}
        handleCancelEditEntry={handleCancelEditEntry}
        handleStartEditEntry={handleStartEditEntry}
        handleNavigateToEntry={handleNavigateToEntry}
        onDeleteEntry={setConfirmDeleteNovedad}
        onNavigateToFeature={onNavigateToFeature}
      />
    </div>
  );
};
