import React, { useMemo } from "react";
import type { InspeccionRecord } from "../types";
import { Building2, Calendar, Filter, X, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { useDraggable } from "../hooks/useDraggable";

interface InspeccionesSummaryWidgetProps {
  inspeccionesRecords: InspeccionRecord[];
  visible: boolean;
  selectedColorFilter: "all" | "rojo" | "amarillo" | "verde";
  setSelectedColorFilter: (color: "all" | "rojo" | "amarillo" | "verde") => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (date: string) => void;
  globalDate?: string;
  style?: React.CSSProperties;
}

export const InspeccionesSummaryWidget: React.FC<InspeccionesSummaryWidgetProps> = ({
  inspeccionesRecords,
  visible,
  selectedColorFilter,
  setSelectedColorFilter,
  selectedDateFilter,
  setSelectedDateFilter,
  globalDate,
  style,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { position, dragHandleProps, isDragging } = useDraggable(30, 200);

  // Fechas únicas disponibles ordenadas descendente
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    inspeccionesRecords.forEach((r) => {
      if (r.fecha && r.fecha.trim().length >= 8) {
        datesSet.add(r.fecha.trim());
      }
    });
    return Array.from(datesSet).sort().reverse();
  }, [inspeccionesRecords]);

  // Registros filtrados por fecha (filtro del widget o fecha de la línea de tiempo)
  const recordsByDate = useMemo(() => {
    const targetDate = selectedDateFilter || globalDate;
    if (!targetDate) return inspeccionesRecords;
    return inspeccionesRecords.filter((r) => r.fecha && r.fecha.startsWith(targetDate));
  }, [inspeccionesRecords, selectedDateFilter, globalDate]);

  // Conteos por color de riesgo dentro de los registros filtrados por fecha
  const counts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;

    recordsByDate.forEach((r) => {
      const tag = String(r.riesgo_color || "").toLowerCase();
      if (tag.includes("rojo") || tag.includes("roja") || tag.includes("alto") || tag.includes("insegur")) {
        red++;
      } else if (tag.includes("amarillo") || tag.includes("amarilla") || tag.includes("medio") || tag.includes("precau")) {
        yellow++;
      } else {
        green++;
      }
    });

    return { total: recordsByDate.length, red, yellow, green };
  }, [recordsByDate]);

  if (!visible) return null;

  const hasFilterActive = selectedColorFilter !== "all" || selectedDateFilter !== "";

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? "none" : "all 0.1s ease-out",
        touchAction: "none",
        ...style,
      }}
      className="fixed z-30 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 transition-all duration-200"
    >
      {/* Encabezado Arrastrable */}
      <div
        {...dragHandleProps}
        className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm text-slate-100 tracking-wide">Inspecciones Kobo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            {counts.total}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition"
        >
          {collapsed ? "Mostrar" : "Minimizar"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4 text-xs">
          {/* Filtro de Fecha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Filtrar por Día:
              </span>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter("")}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <X className="w-3 h-3" /> Ver todas
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">Todas las fechas ({inspeccionesRecords.length} inspecciones)</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro e Insignias de Conteo por Color de Riesgo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                Filtrar por Riesgo / Color:
              </span>
              {selectedColorFilter !== "all" && (
                <button
                  onClick={() => setSelectedColorFilter("all")}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <X className="w-3 h-3" /> Todos
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Botón Rojo */}
              <button
                onClick={() =>
                  setSelectedColorFilter(selectedColorFilter === "rojo" ? "all" : "rojo")
                }
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 ${
                  selectedColorFilter === "rojo"
                    ? "bg-red-500/30 border-red-500 text-red-200 shadow-lg shadow-red-500/20 ring-1 ring-red-400"
                    : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-red-500/50"
                }`}
              >
                <div className="flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-bold text-sm text-red-400">{counts.red}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Alto Riesgo</span>
              </button>

              {/* Botón Amarillo */}
              <button
                onClick={() =>
                  setSelectedColorFilter(selectedColorFilter === "amarillo" ? "all" : "amarillo")
                }
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 ${
                  selectedColorFilter === "amarillo"
                    ? "bg-amber-500/30 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400"
                    : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-sm text-amber-400">{counts.yellow}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Precaución</span>
              </button>

              {/* Botón Verde */}
              <button
                onClick={() =>
                  setSelectedColorFilter(selectedColorFilter === "verde" ? "all" : "verde")
                }
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 ${
                  selectedColorFilter === "verde"
                    ? "bg-emerald-500/30 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400"
                    : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-emerald-500/50"
                }`}
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-400">{counts.green}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Bajo Riesgo</span>
              </button>
            </div>
          </div>

          {/* Resumen del Filtro Activo */}
          {hasFilterActive && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Mostrando: <strong className="text-slate-200">{counts.total}</strong> inspecciones
              </span>
              <button
                onClick={() => {
                  setSelectedColorFilter("all");
                  setSelectedDateFilter("");
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
