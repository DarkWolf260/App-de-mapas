import React, { useState, useMemo } from "react";
import type { DailyLog, GroupLogEntry, CustomActivity, NovedadEntry } from "../../types";
import { getNormalizedGroupList } from "../../utils/logUtils";
import {
  Calendar,
  FileText,
  Car,
  UserCheck,
  Phone,
  Copy,
  Check,
  Search,
  Tag,
  Clock,
} from "lucide-react";

interface HistoryTabProps {
  logs: DailyLog[] | undefined;
  featureTitle?: string;
  isPolygon?: boolean;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PAGE_SIZE = 10;

function formatHistoryDate(dateStr: string): { formatted: string; weekday: string } {
  if (!dateStr) return { formatted: "Sin fecha", weekday: "" };
  const parts = dateStr.split("-");
  if (parts.length !== 3) return { formatted: dateStr, weekday: "" };

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, monthIdx, day);
  const weekday = !Number.isNaN(dateObj.getTime()) ? WEEKDAY_SHORT[dateObj.getDay()] : "";
  const formatted = `${day} ${MONTH_NAMES[monthIdx] || parts[1]} ${year}`;

  return { formatted, weekday };
}

interface CombinedGroupItem extends GroupLogEntry {
  dept?: "pc" | "bomberos";
}

interface CombinedDateEntry {
  date: string;
  formatted: string;
  weekday: string;
  groups: CombinedGroupItem[];
  rescued: number;
  recovered: number;
  prehospital: number;
  transfers: number;
  pets: number;
  customActivities: CustomActivity[];
  novedades: NovedadEntry[];
  observations: Array<{ dept?: "pc" | "bomberos"; text: string }>;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  logs = [],
  isPolygon = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const combinedDateEntries = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];

    const dateMap = new Map<string, CombinedDateEntry>();

    logs.forEach((log) => {
      if (!log.date) return;
      const d = log.date;
      const deptKey: "pc" | "bomberos" = log.department === "bomberos" ? "bomberos" : "pc";

      if (!dateMap.has(d)) {
        const { formatted, weekday } = formatHistoryDate(d);
        dateMap.set(d, {
          date: d,
          formatted,
          weekday,
          groups: [],
          rescued: 0,
          recovered: 0,
          prehospital: 0,
          transfers: 0,
          pets: 0,
          customActivities: [],
          novedades: [],
          observations: [],
        });
      }

      const entry = dateMap.get(d)!;

      const groupList = getNormalizedGroupList(log);
      groupList.forEach((g) => {
        const groupDept: "pc" | "bomberos" =
          g.department === "bomberos" ? "bomberos" : g.department === "pc" ? "pc" : deptKey;

        entry.groups.push({ ...g, dept: groupDept });

        entry.rescued += parseInt(g.rescuedCount || "0", 10) || 0;
        entry.recovered += parseInt(g.recoveredCount || "0", 10) || 0;
        entry.prehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
        entry.transfers += parseInt(g.transfersCount || "0", 10) || 0;
        entry.pets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
      });

      entry.rescued += parseInt(log.rescuedCount || "0", 10) || 0;
      entry.recovered += parseInt(log.recoveredCount || "0", 10) || 0;
      entry.prehospital += parseInt(log.prehospitalCareCount || "0", 10) || 0;
      entry.transfers += parseInt(log.transfersCount || "0", 10) || 0;
      entry.pets += parseInt(log.rescuedPetsCount || "0", 10) || 0;

      if (Array.isArray(log.customActivities)) {
        log.customActivities.forEach((act) => {
          if (
            !entry.customActivities.some(
              (existing) =>
                existing.name === act.name &&
                existing.value === act.value &&
                (existing.description || "") === (act.description || "")
            )
          ) {
            entry.customActivities.push(act);
          }
        });
      }

      if (Array.isArray(log.novedades)) {
        log.novedades.forEach((nov) => {
          if (
            !entry.novedades.some(
              (existing) => existing.id === nov.id || (existing.text === nov.text && existing.time === nov.time)
            )
          ) {
            entry.novedades.push(nov);
          }
        });
      }

      if (log.observations && log.observations.trim()) {
        const obsTrimmed = log.observations.trim();
        if (!entry.observations.some((o) => o.text === obsTrimmed)) {
          entry.observations.push({ dept: deptKey, text: obsTrimmed });
        }
      }
    });

    const list = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    list.forEach((entry) => {
      entry.novedades.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });

    return list;
  }, [logs]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return combinedDateEntries;

    return combinedDateEntries.filter((entry) => {
      if (entry.date.toLowerCase().includes(q)) return true;
      if (entry.formatted.toLowerCase().includes(q) || entry.weekday.toLowerCase().includes(q)) return true;
      const matchGroup = entry.groups.some(
        (g) =>
          (g.groupName && g.groupName.toLowerCase().includes(q)) ||
          (g.managerName && g.managerName.toLowerCase().includes(q)) ||
          (g.unitOut && g.unitOut.toLowerCase().includes(q)) ||
          (g.managerPhone && g.managerPhone.includes(q))
      );
      if (matchGroup) return true;
      if (entry.observations.some((o) => o.text.toLowerCase().includes(q))) return true;
      if (entry.novedades.some((n) => n.text.toLowerCase().includes(q))) return true;
      if (
        entry.customActivities.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.description && a.description.toLowerCase().includes(q))
        )
      ) {
        return true;
      }
      return false;
    });
  }, [combinedDateEntries, searchQuery]);

  const displayedEntries = searchQuery.trim()
    ? filteredEntries
    : filteredEntries.slice(0, visibleCount);
  const remainingCount = filteredEntries.length - displayedEntries.length;

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone).catch(() => {});
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1800);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        fontFamily: "var(--font-sans)",
        color: "#f8fafc",
        paddingBottom: "24px",
      }}
    >
      {/* Buscador compacto cuando hay más de una fecha */}
      {combinedDateEntries.length > 1 && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: "9px",
              color: "#64748b",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Filtrar por fecha, grupo, actividad o nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px 6px 28px",
              fontSize: "0.72rem",
              borderRadius: "7px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "#f8fafc",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Línea cronológica limpia (sin flechas ni acordeones) */}
      {displayedEntries.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {displayedEntries.map((entry) => {
            const metricItems = [
              entry.rescued > 0 && { label: `${entry.rescued} Resc.`, color: "#38bdf8" },
              entry.recovered > 0 && { label: `${entry.recovered} Recup.`, color: "#ef4444" },
              entry.pets > 0 && { label: `${entry.pets} Masc.`, color: "#22c55e" },
              entry.prehospital > 0 && { label: `${entry.prehospital} Atenc.`, color: "#fb923c" },
              entry.transfers > 0 && { label: `${entry.transfers} Trasl.`, color: "#cbd5e1" },
            ].filter(Boolean) as Array<{ label: string; color: string }>;

            const hasDetails =
              entry.groups.length > 0 ||
              entry.customActivities.length > 0 ||
              entry.novedades.length > 0 ||
              entry.observations.length > 0 ||
              metricItems.length > 0;

            return (
              <div
                key={entry.date}
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "9px 11px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Encabezado de fecha + métricas en línea */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "6px",
                    paddingBottom: hasDetails ? "5px" : 0,
                    borderBottom: hasDetails ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: 800, color: "#f8fafc" }}>
                    <Calendar size={12} style={{ color: "#94a3b8" }} aria-hidden="true" />
                    {entry.formatted}
                    {entry.weekday && (
                      <span style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600 }}>
                        · {entry.weekday}
                      </span>
                    )}
                  </span>

                  {metricItems.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontVariantNumeric: "tabular-nums" }}>
                      {metricItems.map((m) => (
                        <span key={m.label} style={{ fontSize: "0.64rem", fontWeight: 700, color: m.color }}>
                          {m.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Equipos (filas planas sin cajas anidadas) */}
                {entry.groups.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {entry.groups.map((group, gIdx) => {
                      const isGroupBomberos = group.dept === "bomberos";
                      const sched =
                        group.departureTime || group.arrivalTime
                          ? `${group.departureTime || "--:--"}–${group.arrivalTime || "--:--"}`
                          : null;

                      return (
                        <div
                          key={group.id || gIdx}
                          style={{
                            paddingTop: gIdx > 0 ? "5px" : 0,
                            borderTop: gIdx > 0 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.56rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                background: isGroupBomberos ? "rgba(239, 68, 68, 0.14)" : "rgba(249, 115, 22, 0.14)",
                                color: isGroupBomberos ? "#fca5a5" : "#fdba74",
                                border: `1px solid ${isGroupBomberos ? "rgba(239, 68, 68, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
                              }}
                            >
                              {group.isVolunteer ? "VOL" : isGroupBomberos ? "Bomberos" : "PC"}
                            </span>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f8fafc" }}>
                              {group.groupName || "Equipo de Trabajo"}
                            </span>
                            {group.officersCount && (
                              <span style={{ fontSize: "0.62rem", color: "#94a3b8", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                                {group.officersCount} func.
                              </span>
                            )}
                          </div>

                          {(group.unitOut || group.managerName || group.managerPhone || sched) && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px 10px",
                                fontSize: "0.64rem",
                                color: "#94a3b8",
                                alignItems: "center",
                              }}
                            >
                              {group.unitOut && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <Car size={10} /> <span style={{ color: "#cbd5e1" }}>{group.unitOut}</span>
                                </span>
                              )}
                              {group.managerName && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <UserCheck size={10} /> <span style={{ color: "#cbd5e1" }}>{group.managerName}</span>
                                </span>
                              )}
                              {sched && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontFamily: "var(--font-mono, monospace)", fontSize: "0.6rem" }}>
                                  <Clock size={10} /> {sched}
                                </span>
                              )}
                              {group.managerPhone && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Phone size={9} style={{ color: "#4ade80" }} />
                                  <a href={`tel:${group.managerPhone}`} style={{ color: "#4ade80", textDecoration: "none", fontWeight: 600 }}>
                                    {group.managerPhone}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(group.managerPhone!)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: copiedPhone === group.managerPhone ? "#4ade80" : "#64748b",
                                      cursor: "pointer",
                                      padding: 0,
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                    title="Copiar teléfono"
                                    aria-label="Copiar teléfono"
                                  >
                                    {copiedPhone === group.managerPhone ? <Check size={9} /> : <Copy size={9} />}
                                  </button>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actividades */}
                {entry.customActivities.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {entry.customActivities.map((act, idx) => (
                      <div
                        key={act.id || `${act.name}-${idx}`}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "5px",
                          fontSize: "0.66rem",
                          color: "#cbd5e1",
                          lineHeight: 1.35,
                        }}
                      >
                        <Tag size={10} style={{ color: "#94a3b8", flexShrink: 0, alignSelf: "center" }} />
                        <span style={{ fontWeight: 700, color: "#f8fafc" }}>{act.name}</span>
                        {act.value && (
                          <span style={{ fontWeight: 800, color: "#fdba74", fontVariantNumeric: "tabular-nums" }}>
                            ({act.value})
                          </span>
                        )}
                        {act.description && (
                          <span style={{ color: "#94a3b8" }}>— {act.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Novedades */}
                {entry.novedades.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {entry.novedades.map((novedad) => (
                      <div
                        key={novedad.id}
                        style={{
                          fontSize: "0.64rem",
                          color: "#cbd5e1",
                          borderLeft: "2px solid rgba(249, 115, 22, 0.55)",
                          paddingLeft: "6px",
                          lineHeight: 1.35,
                        }}
                      >
                        <span style={{ color: "#fdba74", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", marginRight: "5px" }}>
                          {novedad.time || novedad.timestamp?.slice(11, 16) || "--:--"}
                        </span>
                        {novedad.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Observaciones */}
                {entry.observations.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {entry.observations.map((obs, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          fontSize: "0.64rem",
                          color: "#cbd5e1",
                          borderLeft: "2px solid rgba(148, 163, 184, 0.4)",
                          paddingLeft: "6px",
                          lineHeight: 1.35,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "4px",
                        }}
                      >
                        <FileText size={10} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} />
                        <span>{obs.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "7px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Mostrar más fechas ({remainingCount} restantes)
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: "0.72rem",
            color: "#64748b",
            textAlign: "center",
            padding: "20px 14px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Calendar size={18} style={{ opacity: 0.45 }} />
          <div>
            {searchQuery
              ? "No se encontraron registros que coincidan con la búsqueda."
              : isPolygon
              ? "Este sector no tiene registros históricos cargados directamente."
              : "No hay registros anteriores guardados para este punto."}
          </div>
        </div>
      )}
    </div>
  );
};
