import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface BitacoraCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const BitacoraCalendar: React.FC<BitacoraCalendarProps> = ({
  selectedDate,
  onSelectDate,
  minDate = "2026-06-24",
}) => {
  const initialDate = useMemo(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedDate]);

  const [viewDate, setViewDate] = useState<Date>(initialDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

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

    // Empty cells before 1st day
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -firstDayOfWeek + i + 1);
      const dStr = prevMonthDay.toLocaleDateString("en-CA");
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
      const dateObj = new Date(year, month, day);
      const dStr = dateObj.toLocaleDateString("en-CA");
      const isDisabled = dStr < minDate || dStr > todayStr;

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
  }, [year, month, firstDayOfWeek, daysInMonth, minDate, todayStr, selectedDate]);

  return (
    <div className="bcal-container">
      {/* Calendar Header */}
      <div className="bcal-header">
        <div className="bcal-title-group">
          <CalendarIcon size={14} style={{ color: "var(--color-info)" }} />
          <span className="bcal-month-title">
            {MONTH_NAMES[month]} <strong style={{ color: "var(--text-main)" }}>{year}</strong>
          </span>
        </div>

        <div className="bcal-nav-group">
          <button onClick={handleToday} className="bcal-today-btn" title="Ir a hoy">
            Hoy
          </button>
          <button onClick={handlePrevMonth} className="bcal-nav-btn" title="Mes anterior">
            <ChevronLeft size={14} />
          </button>
          <button onClick={handleNextMonth} className="bcal-nav-btn" title="Mes siguiente">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="bcal-weekdays">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="bcal-weekday">{name}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="bcal-grid">
        {gridCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div key={cell.dateStr + idx} className="bcal-cell empty">
                <span>{cell.dayNumber}</span>
              </div>
            );
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={cell.isDisabled}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`bcal-cell ${cell.isSelected ? "selected" : ""} ${cell.isToday ? "today" : ""} ${cell.isDisabled ? "disabled" : ""}`}
              title={cell.dateStr}
            >
              <span className="bcal-day-num">{cell.dayNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

