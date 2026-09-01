import React, { useState, useRef, useEffect } from "react";
import { Activity, Plus, Save, Check, Edit3, CheckSquare, Lock, Users, FileSpreadsheet, Download, Image as ImageIcon, Calendar as CalendarIcon } from "lucide-react";
import { UserNavMenu } from "../UserNavMenu";
import { BitacoraCalendar } from "../BitacoraCalendar";
import { getLocalDateStr } from "../../utils/dateUtils";

export interface PizarraHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  canEdit: boolean;
  canManageBases?: boolean;
  canManageEntries?: boolean;
  isEditMode?: boolean;
  setIsEditMode?: (val: boolean) => void;
  saving?: boolean;
  saveSuccess?: boolean;
  handleSaveAll?: () => void;
  handleAddCamp?: () => void;
  handleExportTeamsExcel: () => void;
  handleExportReportImage?: () => void;
  workTeamsCount: number;
  onAddTeam?: () => void;
}

export const PizarraHeader: React.FC<PizarraHeaderProps> = ({
  selectedDate,
  setSelectedDate,
  canEdit,
  canManageBases: _canManageBases = true,
  isEditMode: _isEditMode,
  setIsEditMode: _setIsEditMode,
  saving: _saving,
  saveSuccess: _saveSuccess,
  handleSaveAll: _handleSaveAll,
  handleAddCamp: _handleAddCamp,
  handleExportTeamsExcel,
  handleExportReportImage: _handleExportReportImage,
  workTeamsCount,
  onAddTeam,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDate = selectedDate ? selectedDate.split("-").reverse().join("/") : "";

  return (
    <>
      {/* HEADER PRINCIPAL CON MARCA Y PERFIL */}
      <header
        style={{
          minHeight: "56px",
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* LOGO + MARCA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--accent-orange), #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
              flexShrink: 0,
            }}
          >
            <Activity size={17} />
          </div>
          <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", fontFamily: "var(--sans-font)" }}>
            COE La Guaira <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.78rem" }}>— Consolidado de Equipos de Trabajo</span>
          </span>
        </div>
        <UserNavMenu currentPage="consolidado" />
      </header>

      {/* BARRA FLOTANTE INFERIOR DE ACCIONES Y CALENDARIO */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "14px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.6)",
          maxWidth: "95vw",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* CALENDARIO */}
        <div className="dt-calendar-wrapper" ref={calendarRef}>
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            title="Seleccionar fecha"
            style={{
              height: "32px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.72rem",
              fontWeight: 700,
              fontFamily: "var(--sans-font)",
              padding: "0 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <CalendarIcon size={14} style={{ color: "var(--accent-orange)" }} />
            <span>{formattedDate}</span>
          </button>

          {showCalendar && (
            <div style={{ position: "absolute", bottom: "44px", top: "auto", left: "50%", transform: "translateX(-50%)", zIndex: 1100 }}>
              <BitacoraCalendar
                selectedDate={selectedDate}
                minDate="2026-06-24"
                maxDate={getLocalDateStr()}
                onSelectDate={(dateStr) => {
                  setSelectedDate(dateStr);
                  setShowCalendar(false);
                }}
              />
            </div>
          )}
        </div>

        <div style={{ height: "18px", width: "1px", background: "rgba(255, 255, 255, 0.12)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleExportTeamsExcel}
            style={{
              height: "32px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "6px",
              color: "#4ade80",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>

          {canEdit && onAddTeam && (
            <button
              onClick={onAddTeam}
              style={{
                height: "32px",
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: "6px",
                color: "#c084fc",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--sans-font)",
              }}
            >
              <Plus size={14} />
              <span>Agregar Equipo</span>
            </button>
          )}
        </div>

        {!canEdit && (
          <div
            style={{
              height: "32px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "0 8px",
              color: "var(--text-muted)",
              fontSize: "0.68rem",
              fontWeight: 600,
            }}
          >
            <Lock size={12} />
            <span>Lectura</span>
          </div>
        )}
      </div>
    </>
  );
};
