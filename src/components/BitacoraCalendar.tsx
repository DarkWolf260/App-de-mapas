import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface BitacoraCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export const BitacoraCalendar: React.FC<BitacoraCalendarProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}) => {
  const parsedDate = useMemo(() => {
    if (!selectedDate) return new Date();
    const parts = selectedDate.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  }, [selectedDate]);

  const [viewDate, setViewDate] = useState<Date>(parsedDate);

  useEffect(() => {
    setViewDate(parsedDate);
  }, [parsedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayObj = new Date();
  const todayStr = formatDateStr(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(todayStr);
  };

  const gridCells = useMemo(() => {
    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Empty cells before 1st day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -firstDayOfWeek + i + 1);
      const dStr = formatDateStr(
        prevMonthDay.getFullYear(),
        prevMonthDay.getMonth(),
        prevMonthDay.getDate()
      );
      cells.push({
        dayNumber: prevMonthDay.getDate(),
        dateStr: dStr,
        isCurrentMonth: false,
        isDisabled: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = formatDateStr(year, month, day);
      const isDisabled = (minDate ? dStr < minDate : false) || (maxDate ? dStr > maxDate : false);

      cells.push({
        dayNumber: day,
        dateStr: dStr,
        isCurrentMonth: true,
        isDisabled,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      });
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth, minDate, maxDate, todayStr, selectedDate]);

  return (
    <div
      style={{
        width: "256px",
        minWidth: "256px",
        background: "rgba(10, 15, 29, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "12px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        userSelect: "none",
        fontFamily: "var(--sans-font, system-ui, sans-serif)",
        boxSizing: "border-box",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
      }}
    >
      {/* Encabezado del Calendario */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "6px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CalendarIcon size={14} style={{ color: "var(--accent-orange)" }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-orange)" }}>
            {MONTH_NAMES[month]} <strong style={{ color: "#f8fafc" }}>{year}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={handleToday}
            style={{
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              borderRadius: "5px",
              color: "var(--accent-orange)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 7px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            title="Ir al día de hoy"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#f8fafc",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
            title="Mes anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#f8fafc",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
            title="Mes siguiente"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} style={{ fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            {name}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {gridCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.dateStr + idx}
                style={{
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.15,
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                {cell.dayNumber}
              </div>
            );
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={cell.isDisabled}
              onClick={() => !cell.isDisabled && onSelectDate(cell.dateStr)}
              style={{
                height: "28px",
                width: "100%",
                borderRadius: "6px",
                border: cell.isSelected
                  ? "none"
                  : cell.isToday
                  ? "1px solid var(--accent-orange)"
                  : "1px solid transparent",
                background: cell.isSelected
                  ? "var(--accent-orange)"
                  : cell.isToday
                  ? "rgba(249, 115, 22, 0.15)"
                  : "rgba(255, 255, 255, 0.04)",
                color: cell.isSelected
                  ? "#ffffff"
                  : cell.isToday
                  ? "var(--accent-orange)"
                  : cell.isDisabled
                  ? "#475569"
                  : "#f8fafc",
                fontSize: "0.72rem",
                fontWeight: cell.isSelected || cell.isToday ? 800 : 600,
                cursor: cell.isDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxShadow: cell.isSelected ? "0 2px 8px rgba(249, 115, 22, 0.4)" : "none",
                transition: "all 0.12s ease",
              }}
              title={cell.dateStr}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};
