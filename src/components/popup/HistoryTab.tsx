import React, { useState, useMemo } from "react";
import type { DailyLog, GroupLogEntry, CustomActivity, NovedadEntry } from "../../types";
import { getNormalizedGroupList } from "../../utils/logUtils";
import {
  Calendar,
  HeartHandshake,
  ShieldAlert,
  HeartPulse,
  Ambulance,
  Dog,
  FileText,
  Car,
  UserCheck,
  Phone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  Layers,
  MapPin,
  Flame,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

interface HistoryTabProps {
  logs: DailyLog[] | undefined;
  featureTitle?: string;
  isPolygon?: boolean;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const WEEKDAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

function formatHistoryDate(dateStr: string): { formatted: string; weekday: string } {
  if (!dateStr) return { formatted: "Fecha desconocida", weekday: "" };
  const parts = dateStr.split("-");
  if (parts.length !== 3) return { formatted: dateStr, weekday: "" };

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, monthIdx, day);
  const weekday = !isNaN(dateObj.getTime()) ? WEEKDAY_NAMES[dateObj.getDay()] : "";
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
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Group and merge logs by date, combining PC and Bomberos
  const combinedDateEntries = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];

    const dateMap = new Map<string, CombinedDateEntry>();

    logs.forEach((log) => {
      if (!log.date) return;
      const d = log.date;
      const isBomberos = log.department === "bomberos";
      const deptKey: "pc" | "bomberos" = isBomberos ? "bomberos" : "pc";

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

      // Extract and combine groups
      const groupList = getNormalizedGroupList(log);
      groupList.forEach((g) => {
        const groupDept: "pc" | "bomberos" =
          g.department === "bomberos" ? "bomberos" : g.department === "pc" ? "pc" : deptKey;

        entry.groups.push({
          ...g,
          dept: groupDept,
        });

        // Add metrics from group level
        entry.rescued += parseInt(g.rescuedCount || "0", 10) || 0;
        entry.recovered += parseInt(g.recoveredCount || "0", 10) || 0;
        entry.prehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
        entry.transfers += parseInt(g.transfersCount || "0", 10) || 0;
        entry.pets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
      });

      // Add metrics from log level
      entry.rescued += parseInt(log.rescuedCount || "0", 10) || 0;
      entry.recovered += parseInt(log.recoveredCount || "0", 10) || 0;
      entry.prehospital += parseInt(log.prehospitalCareCount || "0", 10) || 0;
      entry.transfers += parseInt(log.transfersCount || "0", 10) || 0;
      entry.pets += parseInt(log.rescuedPetsCount || "0", 10) || 0;

      // Combine custom activities
      if (Array.isArray(log.customActivities)) {
        log.customActivities.forEach((act) => {
          if (!entry.customActivities.some((existing) => existing.name === act.name && existing.value === act.value)) {
            entry.customActivities.push(act);
          }
        });
      }

      // Combine novedades
      if (Array.isArray(log.novedades)) {
        log.novedades.forEach((nov) => {
          if (!entry.novedades.some((existing) => existing.id === nov.id || (existing.text === nov.text && existing.time === nov.time))) {
            entry.novedades.push(nov);
          }
        });
      }

      // Combine observations
      if (log.observations && log.observations.trim()) {
        const obsTrimmed = log.observations.trim();
        if (!entry.observations.some((o) => o.text === obsTrimmed)) {
          entry.observations.push({ dept: deptKey, text: obsTrimmed });
        }
      }
    });

    // Convert map to array and sort newest date first
    const list = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    // Sort novedades by time if present
    list.forEach((entry) => {
      entry.novedades.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });

    return list;
  }, [logs]);

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return combinedDateEntries;
    const q = searchQuery.toLowerCase().trim();

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
      if (entry.customActivities.some((a) => a.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [combinedDateEntries, searchQuery]);

  const toggleExpand = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: prev[dateStr] === undefined ? false : !prev[dateStr],
    }));
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        fontFamily: "var(--sans-font, sans-serif)",
        color: "var(--text-main, #fff)",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(14, 165, 233, 0.03) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: "8px",
          padding: "8px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isPolygon ? (
            <Layers size={13} style={{ color: "var(--color-info, #38bdf8)" }} />
          ) : (
            <MapPin size={13} style={{ color: "var(--color-info, #38bdf8)" }} />
          )}
          <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {isPolygon ? "Historial del Sector" : "Historial del Punto"}
          </span>
        </div>
        <span
          style={{
            background: "rgba(56, 189, 248, 0.15)",
            color: "var(--color-info, #38bdf8)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            padding: "1px 7px",
            borderRadius: "10px",
            fontSize: "0.6rem",
            fontWeight: 800,
          }}
        >
          {combinedDateEntries.length} {combinedDateEntries.length === 1 ? "fecha" : "fechas"}
        </span>
      </div>

      {/* Search Input if > 1 date */}
      {combinedDateEntries.length > 1 && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search
            size={12}
            style={{
              position: "absolute",
              left: "8px",
              color: "var(--text-muted, #94a3b8)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Buscar fecha, grupo, novedad u observación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "5px 8px 5px 26px",
              fontSize: "0.7rem",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              color: "#fff",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Dates List */}
      {filteredEntries.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%" }}>
          {filteredEntries.map((entry) => {
            const isExpanded = expandedDates[entry.date] !== false; // expanded by default

            const hasAnyMetrics =
              entry.rescued > 0 ||
              entry.recovered > 0 ||
              entry.prehospital > 0 ||
              entry.transfers > 0 ||
              entry.pets > 0;

            const hasCustomActivities = entry.customActivities.length > 0;
            const hasNovedades = entry.novedades.length > 0;
            const hasObservations = entry.observations.length > 0;

            return (
              <div
                key={entry.date}
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                }}
              >
                {/* Date Header */}
                <div
                  onClick={() => toggleExpand(entry.date)}
                  style={{
                    padding: "7px 10px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderBottom: isExpanded ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={12} style={{ color: "var(--color-info, #38bdf8)" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fff" }}>
                      {entry.formatted}
                    </span>
                    {entry.weekday && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
                        ({entry.weekday})
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {entry.groups.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.58rem",
                          color: "var(--text-muted, #94a3b8)",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "1px 5px",
                          borderRadius: "4px",
                        }}
                      >
                        {entry.groups.length} {entry.groups.length === 1 ? "grupo" : "grupos"}
                      </span>
                    )}
                    <span style={{ color: "var(--text-muted, #94a3b8)", display: "flex", alignItems: "center" }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                      background: "rgba(0, 0, 0, 0.12)",
                    }}
                  >
                    {/* Compact Metrics Row — Only show if any metric > 0 */}
                    {hasAnyMetrics && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        {entry.rescued > 0 && (
                          <div
                            style={{
                              background: "rgba(34, 197, 94, 0.14)",
                              border: "1px solid rgba(34, 197, 94, 0.28)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "var(--color-green, #22c55e)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <HeartHandshake size={10} />
                            <span>{entry.rescued} Rescat.</span>
                          </div>
                        )}
                        {entry.recovered > 0 && (
                          <div
                            style={{
                              background: "rgba(239, 68, 68, 0.14)",
                              border: "1px solid rgba(239, 68, 68, 0.28)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "#ef4444",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <ShieldAlert size={10} />
                            <span>{entry.recovered} Recup.</span>
                          </div>
                        )}
                        {entry.prehospital > 0 && (
                          <div
                            style={{
                              background: "rgba(14, 165, 233, 0.14)",
                              border: "1px solid rgba(14, 165, 233, 0.28)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "#38bdf8",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <HeartPulse size={10} />
                            <span>{entry.prehospital} Atenc.</span>
                          </div>
                        )}
                        {entry.transfers > 0 && (
                          <div
                            style={{
                              background: "rgba(168, 85, 247, 0.14)",
                              border: "1px solid rgba(168, 85, 247, 0.28)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "var(--color-purple, #c084fc)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Ambulance size={10} />
                            <span>{entry.transfers} Trasl.</span>
                          </div>
                        )}
                        {entry.pets > 0 && (
                          <div
                            style={{
                              background: "rgba(245, 158, 11, 0.14)",
                              border: "1px solid rgba(245, 158, 11, 0.28)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "#fbbf24",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Dog size={10} />
                            <span>{entry.pets} Masc.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Combined Groups List */}
                    {entry.groups.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {entry.groups.map((group, gIdx) => {
                          const isGroupBomberos = group.dept === "bomberos";
                          const isVolunteer = !!group.isVolunteer;

                          return (
                            <div
                              key={group.id || gIdx}
                              style={{
                                background: "rgba(0, 0, 0, 0.25)",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                borderRadius: "6px",
                                padding: "6px 8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              {/* Group Header */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "4px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                  {isVolunteer ? (
                                    <span
                                      style={{
                                        fontSize: "0.55rem",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        padding: "1px 5px",
                                        borderRadius: "3px",
                                        background: "rgba(168, 85, 247, 0.2)",
                                        color: "#c084fc",
                                        border: "1px solid rgba(168, 85, 247, 0.4)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "2px",
                                      }}
                                    >
                                      <Sparkles size={8} /> Voluntario
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "0.55rem",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        padding: "1px 4px",
                                        borderRadius: "3px",
                                        background: isGroupBomberos
                                          ? "rgba(239, 68, 68, 0.15)"
                                          : "rgba(249, 115, 22, 0.15)",
                                        color: isGroupBomberos ? "#ef4444" : "var(--accent-orange, #f97316)",
                                        border: `1px solid ${isGroupBomberos ? "rgba(239, 68, 68, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "2px",
                                      }}
                                    >
                                      {isGroupBomberos ? <Flame size={8} /> : <Shield size={8} />}
                                      {isGroupBomberos ? "Bomberos" : "PC"}
                                    </span>
                                  )}

                                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>
                                    {group.groupName || "Equipo de Trabajo"}
                                  </span>
                                </div>
                              </div>

                              {/* Group Details (Vehicle, Manager, Phone) */}
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "6px 10px",
                                  fontSize: "0.62rem",
                                  color: "var(--text-muted, #94a3b8)",
                                  alignItems: "center",
                                }}
                              >
                                {group.unitOut && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <Car size={10} style={{ color: "#cbd5e1" }} />
                                    <span style={{ color: "#e2e8f0" }}>{group.unitOut}</span>
                                  </div>
                                )}

                                {group.managerName && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <UserCheck size={10} style={{ color: "#cbd5e1" }} />
                                    <span style={{ color: "#e2e8f0" }}>{group.managerName}</span>
                                  </div>
                                )}

                                {group.managerPhone && (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      background: "rgba(255, 255, 255, 0.04)",
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                    }}
                                  >
                                    <Phone size={9} style={{ color: "var(--color-green, #22c55e)" }} />
                                    <a
                                      href={`tel:${group.managerPhone}`}
                                      style={{
                                        color: "var(--color-green, #22c55e)",
                                        textDecoration: "none",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {group.managerPhone}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyPhone(group.managerPhone!, e)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: copiedPhone === group.managerPhone ? "#22c55e" : "var(--text-muted)",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                      title="Copiar teléfono"
                                    >
                                      {copiedPhone === group.managerPhone ? <Check size={9} /> : <Copy size={9} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom Activities */}
                    {hasCustomActivities && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "2px" }}>
                        {entry.customActivities.map((act) => (
                          <div
                            key={act.id || act.name}
                            style={{
                              background: "rgba(56, 189, 248, 0.07)",
                              border: "1px solid rgba(56, 189, 248, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 5px",
                              fontSize: "0.6rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Activity size={9} style={{ color: "#38bdf8" }} />
                            <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{act.name}:</span>
                            <span style={{ fontWeight: 800, color: "#38bdf8" }}>{act.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Novedades Timeline */}
                    {hasNovedades && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                        {entry.novedades.map((novedad) => (
                          <div
                            key={novedad.id}
                            style={{
                              fontSize: "0.6rem",
                              background: "rgba(0, 0, 0, 0.2)",
                              borderLeft: "2px solid #fb923c",
                              padding: "2px 5px",
                              borderRadius: "0 3px 3px 0",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                color: "#fb923c",
                                fontWeight: 800,
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: "0.56rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              [{novedad.time || novedad.timestamp?.slice(11, 16) || "--:--"}]
                            </span>
                            <span style={{ color: "#e2e8f0", lineHeight: 1.25 }}>{novedad.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Observations */}
                    {hasObservations && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "2px" }}>
                        {entry.observations.map((obs, oIdx) => (
                          <div
                            key={oIdx}
                            style={{
                              fontSize: "0.6rem",
                              color: "var(--color-info, #38bdf8)",
                              background: "rgba(56, 189, 248, 0.04)",
                              borderLeft: "2px solid var(--color-info, #38bdf8)",
                              padding: "3px 6px",
                              borderRadius: "0 3px 3px 0",
                              lineHeight: 1.3,
                            }}
                          >
                            <strong style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginRight: "4px" }}>
                              <FileText size={9} /> Obs{entry.observations.length > 1 ? ` (${obs.dept === "bomberos" ? "Bomberos" : "PC"}):` : ":"}
                            </strong>
                            <span style={{ color: "#f1f5f9" }}>{obs.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted, #94a3b8)",
            textAlign: "center",
            padding: "20px 14px",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Calendar size={20} style={{ opacity: 0.4 }} />
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
