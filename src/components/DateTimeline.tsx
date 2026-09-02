import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { BitacoraCalendar } from "./BitacoraCalendar";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDate(dateStr: string): { day: string; dayName: string } {
  const parts = dateStr.split("-").map(Number);
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const d = dateObj.getDate();
  const dayOfWeek = DAYS[dateObj.getDay()];
  return { day: String(d), dayName: dayOfWeek };
}

function buildDateRange(startDate: string): string[] {
  const dates: string[] = [];
  const end = new Date();
  end.setDate(end.getDate() + 1); // Mañana
  end.setHours(0, 0, 0, 0);
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
  const allDates = useMemo(() => buildDateRange(startDate), [startDate]);
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toLocaleDateString("en-CA");
  }, []);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarWrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!calendarOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (calendarWrapperRef.current && !calendarWrapperRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [calendarOpen]);

  const selectedIndex = allDates.indexOf(selectedDate);

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const startIdx = Math.max(0, Math.min(selectedIndex - half, allDates.length - windowSize));
  const visibleDates = allDates.slice(startIdx, startIdx + windowSize).filter((d) => d <= tomorrowStr);

  const handlePrev = () => {
    if (selectedIndex > 0) {
      onDateChange(allDates[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < allDates.length - 1) {
      const nextDate = allDates[selectedIndex + 1];
      if (nextDate <= tomorrowStr) {
        onDateChange(nextDate);
      }
    }
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="date-timeline">
      <button
        className="dt-nav-btn"
        onClick={handlePrev}
        disabled={selectedIndex <= 0}
        title="Día anterior"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="dt-dates">
        {visibleDates.map((dateStr) => {
          const { day, dayName } = formatDate(dateStr);
          const isActive = dateStr === selectedDate;
          const isTodayDate = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              className={`dt-date-btn ${isActive ? "active" : ""} ${isTodayDate ? "today" : ""}`}
              onClick={() => onDateChange(dateStr)}
            >
              <span className="dt-date-day">{day}</span>
              <span className="dt-date-month">{dayName}</span>
            </button>
          );
        })}
      </div>

      <button
        className="dt-nav-btn"
        onClick={handleNext}
        disabled={selectedIndex >= allDates.length - 1 || allDates[selectedIndex] >= tomorrowStr}
        title="Día siguiente"
      >
        <ChevronRight size={14} />
      </button>

      <div className="dt-calendar-wrapper" ref={calendarWrapperRef}>
        <button
          className="dt-calendar-btn"
          onClick={() => setCalendarOpen((prev) => !prev)}
          title="Seleccionar fecha"
        >
          <Calendar size={14} />
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
              maxDate={tomorrowStr}
            />
          </div>
        )}
      </div>

      {!isToday && (
        <button className="dt-today-btn" onClick={handleToday} title="Volver a hoy">
          Hoy
        </button>
      )}
    </div>
  );
};
