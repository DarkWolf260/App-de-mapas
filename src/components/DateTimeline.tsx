import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { BitacoraCalendar } from "./BitacoraCalendar";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatDate(dateStr: string): { day: string; dayName: string; monthYear: string } {
  const parts = dateStr.split("-").map(Number);
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const d = dateObj.getDate();
  const dayOfWeek = DAYS[dateObj.getDay()];
  const monthName = MONTHS_SHORT[dateObj.getMonth()] || "";
  return { day: String(d), dayName: dayOfWeek, monthYear: `${monthName} ${dateObj.getFullYear()}` };
}

function buildDateRange(startDate: string, maxDate: string): string[] {
  const dates: string[] = [];
  const end = new Date(maxDate + "T00:00:00");
  const start = new Date(startDate + "T00:00:00");
  let current = new Date(start);
  while (current <= end) {
    dates.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

interface DateTimelineProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  startDate?: string;
}

export const DateTimeline: React.FC<DateTimelineProps> = ({
  selectedDate,
  onDateChange,
  startDate = "2026-06-24",
}) => {
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const allDates = useMemo(() => buildDateRange(startDate, todayStr), [startDate, todayStr]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarWrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!calendarOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (calendarWrapperRef.current && !calendarWrapperRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [calendarOpen]);

  const rawIndex = allDates.indexOf(selectedDate);
  const selectedIndex = rawIndex >= 0 ? rawIndex : allDates.length - 1;

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const startIdx = Math.max(0, Math.min(selectedIndex - half, Math.max(0, allDates.length - windowSize)));
  const visibleDates = allDates.slice(startIdx, startIdx + windowSize);

  const activeMeta = useMemo(() => formatDate(selectedDate || todayStr), [selectedDate, todayStr]);

  const handlePrev = () => {
    if (selectedIndex > 0) {
      onDateChange(allDates[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < allDates.length - 1) {
      onDateChange(allDates[selectedIndex + 1]);
    }
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="date-timeline" role="region" aria-label="Selector de fecha operativa">
      <button
        type="button"
        className="dt-nav-btn"
        onClick={handlePrev}
        disabled={selectedIndex <= 0}
        title="Día anterior"
        aria-label="Día anterior"
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </button>

      <div className="dt-dates">
        {visibleDates.map((dateStr) => {
          const { day, dayName, monthYear } = formatDate(dateStr);
          const isActive = dateStr === selectedDate;
          const isTodayDate = dateStr === todayStr;
          return (
            <button
              type="button"
              key={dateStr}
              className={`dt-date-btn ${isActive ? "active" : ""} ${isTodayDate ? "today" : ""}`}
              onClick={() => onDateChange(dateStr)}
              aria-current={isActive ? "date" : undefined}
              aria-label={`${dayName} ${day} ${monthYear}${isTodayDate ? " (Hoy)" : ""}`}
            >
              <span className="dt-date-day">{day}</span>
              <span className="dt-date-month">{dayName}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="dt-nav-btn"
        onClick={handleNext}
        disabled={selectedIndex >= allDates.length - 1}
        title="Día siguiente"
        aria-label="Día siguiente"
      >
        <ChevronRight size={14} aria-hidden="true" />
      </button>

      <div className="dt-calendar-wrapper" ref={calendarWrapperRef}>
        <button
          type="button"
          className="dt-calendar-btn"
          onClick={() => setCalendarOpen((prev) => !prev)}
          title="Abrir calendario de bitácora"
          aria-label={`Abrir calendario (${activeMeta.monthYear})`}
          aria-expanded={calendarOpen}
        >
          <Calendar size={14} aria-hidden="true" />
          <span className="dt-month-label">{activeMeta.monthYear}</span>
        </button>

        {calendarOpen && (
          <div className="dt-calendar-popup">
            <BitacoraCalendar
              selectedDate={selectedDate}
              onSelectDate={(dateStr) => {
                onDateChange(dateStr);
                setCalendarOpen(false);
              }}
              minDate={startDate}
              maxDate={todayStr}
            />
          </div>
        )}
      </div>

      {!isToday && (
        <button
          type="button"
          className="dt-today-btn"
          onClick={handleToday}
          title="Volver a la fecha actual"
        >
          Hoy
        </button>
      )}
    </div>
  );
};
