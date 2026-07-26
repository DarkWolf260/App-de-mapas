import React, { useState, useMemo, useEffect, useRef } from "react";
import type { DrawnFeature, DailyLog, DepartmentView, WorkGroup, NovedadEntry, NovedadType } from "../types";
import { X, Calendar, ShieldAlert, Users, Search, Printer, ChevronLeft, ChevronRight, ChevronDown, BarChart2, HeartHandshake, HeartPulse, Ambulance, TrendingUp, MapPin, List, Layers, FileText, Plus, Pencil, EyeOff } from "lucide-react";
import { sectionBox } from "./popup/popupStyles";
import { ConfirmModal } from "./ConfirmModal";
import { DateRow } from "./DateRow";
import { InlineRowEditor } from "./InlineRowEditor";
import { GroupDisplay } from "./GroupDisplay";
import { BitacoraCalendar } from "./BitacoraCalendar";
import { buildParentsMap } from "../utils/spatialUtils";
import {
  formatDateFriendly,
  getDatesRange,
  getGroupData,
  logMatchesArrivalFilter,
  logHasPersonnel,
  logHasAnyData,
  isSectorFeature,
  getDayStats,
  featureMatchesSearch,
  REPORT_START_DATE,
  emptyLog,
  getPeriodStats,
} from "../utils/logUtils";

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  activeDepartment?: DepartmentView;
  workGroups?: WorkGroup[];
  selectedDate?: string;
  onSelectedDateChange?: (date: string) => void;
  globalNovedades?: NovedadEntry[];
  onFetchGlobalNovedades?: (date: string, department?: string) => void;
  onSaveGlobalNovedad?: (entry: NovedadEntry, date: string, department: string) => Promise<void>;
  onDeleteGlobalNovedad?: (entryId: string) => Promise<void>;
  onUpdateGlobalNovedad?: (entryId: string, newText: string, newTime?: string) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
}

const RangeReportModal: React.FC<RangeReportModalProps> = ({
  feat,
  allFeatures = [],
  onClose,
  onSaveDailyLog,
  activeDepartment = "pc",
  workGroups = [],
  selectedDate: externalDate,
  onSelectedDateChange,
  globalNovedades = [],
  onFetchGlobalNovedades,
  onSaveGlobalNovedad,
  onDeleteGlobalNovedad,
  onUpdateGlobalNovedad,
  onRefreshFeatures,
  onNavigateToFeature,
}) => {
  const [activeTab, setActiveTab] = useState<"registro" | "estadisticas" | "novedades">("registro");
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<"all" | "arrived" | "not_arrived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statsSortKey, setStatsSortKey] = useState<"nombre" | "daysActive" | "totalRescued" | "totalRecovered" | "totalPrehospitalCare" | "totalTransfers" | "totalPets">("daysActive");
  const [statsSortDir, setStatsSortDir] = useState<"desc" | "asc">("asc");
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [novText, setNovText] = useState("");
  const [novTime, setNovTime] = useState(() => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [novType, setNovType] = useState<NovedadType>("novedad");
    const [confirmDeleteNovedad, setConfirmDeleteNovedad] = useState<TableEntry | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryText, setEditingEntryText] = useState("");
  const [editingEntryTime, setEditingEntryTime] = useState("");
  const [showOrigin, setShowOrigin] = useState(true);

  const dates = useMemo(() => getDatesRange(REPORT_START_DATE), []);
  const [activeDateIndex, setActiveDateIndex] = useState(() => {
    if (externalDate) {
      const idx = dates.indexOf(externalDate);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const isAllMode = feat === "all";
  const activeDate = dates[activeDateIndex];
  const { parentsMap } = useMemo(() => buildParentsMap(allFeatures || []), [allFeatures]);

  const lastExternalDateRef = useRef(externalDate);

  useEffect(() => {
    if (externalDate && externalDate !== lastExternalDateRef.current) {
      lastExternalDateRef.current = externalDate;
      const idx = dates.indexOf(externalDate);
      if (idx !== -1 && idx !== activeDateIndex) {
        setActiveDateIndex(idx);
        setActiveEditFeatureId(null);
      }
    }
  }, [externalDate, dates, activeDateIndex]);

  useEffect(() => {
    if (onFetchGlobalNovedades && activeDate) {
      onFetchGlobalNovedades(activeDate, activeDepartment);
    }
  }, [activeDate, activeDepartment, onFetchGlobalNovedades]);

  const syncDateChange = (newIndex: number) => {
    setActiveDateIndex(newIndex);
    setActiveEditFeatureId(null);
    if (onSelectedDateChange && dates[newIndex]) {
      onSelectedDateChange(dates[newIndex]);
    }
  };

  const dayStats = useMemo(
    () => (feat ? (isAllMode ? getDayStats(allFeatures, activeDate, activeDepartment) : getDayStats([feat], activeDate, activeDepartment)) : null),
    [isAllMode, allFeatures, feat, activeDate, activeDepartment],
  );

  const periodStats = useMemo(
    () => (feat ? getPeriodStats(isAllMode ? allFeatures : [feat as DrawnFeature], activeDepartment) : null),
    [feat, isAllMode, allFeatures, activeDepartment],
  );

  const sortedGroupStats = useMemo(() => {
    if (!periodStats) return [];
    let list = periodStats.groupStats;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((g) => g.groupName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (statsSortKey === "nombre") {
        const diff = a.groupName.localeCompare(b.groupName, "es", { sensitivity: "base" });
        return statsSortDir === "asc" ? diff : -diff;
      }
      const diff = (b[statsSortKey] as number) - (a[statsSortKey] as number);
      return statsSortDir === "desc" ? diff : -diff;
    });
  }, [periodStats, searchQuery, statsSortKey, statsSortDir]);

  const sortedJointCommissions = useMemo(() => {
    if (!periodStats?.jointCommissionStats) return [];
    let list = periodStats.jointCommissionStats;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (jc) =>
          jc.commissionLabel.toLowerCase().includes(q) ||
          jc.participatingGroups.some((p) => p.groupName.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (statsSortKey === "nombre") {
        const nameA = a.participatingGroups.map((p) => p.groupName).join(" ");
        const nameB = b.participatingGroups.map((p) => p.groupName).join(" ");
        const diff = nameA.localeCompare(nameB, "es", { sensitivity: "base" });
        return statsSortDir === "asc" ? diff : -diff;
      }
      const valA =
        statsSortKey === "daysActive"
          ? a.daysActive
          : statsSortKey === "totalRescued"
          ? a.totalRescued
          : statsSortKey === "totalRecovered"
          ? a.totalRecovered
          : statsSortKey === "totalPrehospitalCare"
          ? a.totalPrehospitalCare
          : statsSortKey === "totalTransfers"
          ? a.totalTransfers
          : statsSortKey === "totalPets"
          ? a.totalPets
          : 0;
      const valB =
        statsSortKey === "daysActive"
          ? b.daysActive
          : statsSortKey === "totalRescued"
          ? b.totalRescued
          : statsSortKey === "totalRecovered"
          ? b.totalRecovered
          : statsSortKey === "totalPrehospitalCare"
          ? b.totalPrehospitalCare
          : statsSortKey === "totalTransfers"
          ? b.totalTransfers
          : statsSortKey === "totalPets"
          ? b.totalPets
          : 0;
      const diff = valB - valA;
      return statsSortDir === "desc" ? diff : -diff;
    });
  }, [periodStats, searchQuery, statsSortKey, statsSortDir]);

  const sortedIndependentGroups = useMemo(() => {
    if (!periodStats?.independentGroupStats) return [];
    let list = periodStats.independentGroupStats;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((g) => g.groupName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (statsSortKey === "nombre") {
        const diff = a.groupName.localeCompare(b.groupName, "es", { sensitivity: "base" });
        return statsSortDir === "asc" ? diff : -diff;
      }
      const valA = (a[statsSortKey] as number) || 0;
      const valB = (b[statsSortKey] as number) || 0;
      const diff = valB - valA;
      return statsSortDir === "desc" ? diff : -diff;
    });
  }, [periodStats, searchQuery, statsSortKey, statsSortDir]);

  const activePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (activeEditFeatureId === pt.id) return true;
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const logs = pt.dailyLogs?.filter((l) =>
        l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      if (!log || !logHasAnyData(log)) return false;
      return logMatchesArrivalFilter(log, arrivalFilter);
    }).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  }, [isAllMode, allFeatures, feat, activeEditFeatureId, searchQuery, activeDate, arrivalFilter, activeDepartment]);

  const inactivePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const logs = pt.dailyLogs?.filter((l) =>
        l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      return !log || !logHasAnyData(log);
    }).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  }, [isAllMode, allFeatures, feat, searchQuery, activeDate, activeDepartment]);

  const filteredDates = useMemo(() => {
    if (!feat) return [];
    return dates.filter((dateStr) => {
      if (isAllMode) return true;
      const logs = feat.dailyLogs?.filter((l) =>
        l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      return logMatchesArrivalFilter(log, arrivalFilter);
    });
  }, [dates, isAllMode, feat, arrivalFilter, activeDepartment]);

  const daysWithData = useMemo(() => {
    if (!feat) return 0;
    return dates.reduce((acc, dateStr) => {
      if (isAllMode) {
        return acc + (allFeatures.some((f) => f.dailyLogs?.some((l) =>
          l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l)
        )) ? 1 : 0);
      }
      const logs = feat.dailyLogs?.filter((l) =>
        l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      return acc + (logs.some((l) => logHasAnyData(l)) ? 1 : 0);
    }, 0);
  }, [dates, isAllMode, allFeatures, feat, activeDepartment]);

  if (!feat) return null;

  const handlePrevDay = () => {
    if (activeDateIndex < dates.length - 1) {
      syncDateChange(activeDateIndex + 1);
    }
  };

  const handleNextDay = () => {
    if (activeDateIndex > 0) {
      syncDateChange(activeDateIndex - 1);
    }
  };

  const handleToggleArrivalQuick = async (pt: DrawnFeature, groupIndex: 1 | 2 | 3 | 4, newArrived: boolean) => {
    if (!onSaveDailyLog) return;
    const logs = pt.dailyLogs?.filter((l) =>
      l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
    ) || [];
    const currentLog = logs[0] || emptyLog(activeDate);

    const nowTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    let updatedLog: DailyLog;
    if (groupIndex === 1) {
      updatedLog = { ...currentLog, hasArrivedG1: newArrived };
    } else if (groupIndex === 2) {
      updatedLog = { ...currentLog, hasArrivedG2: newArrived };
    } else if (groupIndex === 3) {
      updatedLog = { ...currentLog, hasArrivedG3: newArrived };
    } else {
      updatedLog = { ...currentLog, hasArrivedG4: newArrived };
    }

    if (currentLog.groups && currentLog.groups.length >= groupIndex) {
      const updatedGroups = [...currentLog.groups];
      if (updatedGroups[groupIndex - 1]) {
        updatedGroups[groupIndex - 1] = {
          ...updatedGroups[groupIndex - 1],
          hasArrived: newArrived,
        };
      }
      updatedLog.groups = updatedGroups;
    }

    await onSaveDailyLog(pt.id, updatedLog);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSortToggle = (key: typeof statsSortKey) => {
    if (statsSortKey === key) setStatsSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setStatsSortKey(key); setStatsSortDir("desc"); }
  };

  const getLogForDate = (pt: DrawnFeature, dateStr: string): DailyLog => {
    const logs = pt.dailyLogs?.filter(
      (l) => l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department),
    ) || [];
    return logs[0] || emptyLog(dateStr, activeDepartment === "mixto" ? undefined : activeDepartment);
  };

  const defaultSaveFeature = useMemo(() => {
    const features = isAllMode ? allFeatures : feat ? [feat] : [];
    return features[0] || null;
  }, [isAllMode, allFeatures, feat]);

  interface TableEntry {
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

  const tableEntries = useMemo<TableEntry[]>(() => {
    const features = isAllMode ? allFeatures : feat ? [feat] : [];
    const entries: TableEntry[] = [];

    // Novedades globales independientes de la bitácora
    globalNovedades.forEach((n) => {
      entries.push({ id: n.id, time: n.time, text: n.text, origin: "Bitácora", isObservation: false, type: n.type, rawTimestamp: n.timestamp, level: "libro" });
    });

    for (const pt of features) {
      const log = getLogForDate(pt, activeDate);
      const isSector = isSectorFeature(pt);
      (log.novedades || []).forEach((n) => {
        entries.push({ id: n.id, time: n.time, text: n.text, origin: pt.title, isObservation: false, type: n.type, featureId: pt.id, rawTimestamp: n.timestamp, level: isSector ? "zona" : "punto" });
      });
      if (log.observations && log.observations.trim()) {
        entries.push({ id: `obs-${pt.id}`, time: "—", text: log.observations, origin: pt.title, isObservation: true, featureId: pt.id, level: isSector ? "zona" : "punto" });
      }
      if (isSector && isAllMode) {
        const containedPts = allFeatures.filter((c) => String(parentsMap[c.id]) === String(pt.id));
        for (const cPt of containedPts) {
          const cLog = getLogForDate(cPt, activeDate);
          (cLog.novedades || []).forEach((n) => {
            entries.push({ id: n.id, time: n.time, text: n.text, origin: cPt.title, isObservation: false, type: n.type, featureId: cPt.id, rawTimestamp: n.timestamp, level: "punto" });
          });
          if (cLog.observations && cLog.observations.trim()) {
            entries.push({ id: `obs-${cPt.id}`, time: "—", text: cLog.observations, origin: cPt.title, isObservation: true, featureId: cPt.id, level: "punto" });
          }
        }
      }
    }
    return entries
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
      .sort((a, b) => {
        const timeA = a.time || "";
        const timeB = b.time || "";
        if (timeA === "—") return 1;
        if (timeB === "—") return -1;
        return timeA.localeCompare(timeB);
      });
  }, [isAllMode, allFeatures, feat, activeDate, activeDepartment, parentsMap, globalNovedades]);

  const handleAddNovedad = async () => {
    if (!novText.trim() || !onSaveGlobalNovedad) return;
    const now = new Date();
    const entry: NovedadEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      time: novTime,
      text: novText.trim(),
      type: novType,
    };
    await onSaveGlobalNovedad(entry, activeDate, activeDepartment === "mixto" ? "pc" : activeDepartment);
    setNovText("");
    await onFetchGlobalNovedades?.(activeDate, activeDepartment);
    await onRefreshFeatures?.();
  };

  const handleDeleteNovedad = async (entry: TableEntry) => {
    if (entry.level === "libro") {
      if (onDeleteGlobalNovedad) await onDeleteGlobalNovedad(entry.id);
      if (onFetchGlobalNovedades) onFetchGlobalNovedades(activeDate, activeDepartment);
      await onRefreshFeatures?.();
      return;
    }
    if (!onSaveDailyLog || !entry.featureId) return;
    const pt = (isAllMode ? allFeatures : feat ? [feat] : []).find((f) => f.id === entry.featureId);
    if (!pt) return;
    const log = getLogForDate(pt, activeDate);
    const updatedLog = { ...log, novedades: (log.novedades || []).filter((n) => n.id !== entry.id) };
    await onSaveDailyLog(pt.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const singleFeatContainedPts = useMemo(() => {
    if (!feat || isAllMode || !isSectorFeature(feat)) return [];
    return allFeatures.filter((c) => String(parentsMap[c.id]) === String(feat.id));
  }, [feat, isAllMode, allFeatures, parentsMap]);

  const handleNavigateToEntry = (entry: TableEntry) => {
    if (!entry.featureId || !onNavigateToFeature) return;
    const target = allFeatures.find((f) => f.id === entry.featureId);
    if (target) onNavigateToFeature(target);
  };

  const handleStartEditEntry = (entry: TableEntry) => {
    if (entry.isObservation) return;
    setEditingEntryId(entry.id);
    setEditingEntryText(entry.text);
    setEditingEntryTime(entry.time && entry.time !== "—" ? entry.time : "");
  };

  const handleSaveEditEntry = async (entry: TableEntry) => {
    if (!editingEntryText.trim()) return;
    if (entry.level === "libro") {
      await onUpdateGlobalNovedad?.(entry.id, editingEntryText.trim(), editingEntryTime || undefined);
    } else if (entry.featureId && onSaveDailyLog) {
      const pt = allFeatures.find((f) => f.id === entry.featureId);
      if (pt) {
        const log = getLogForDate(pt, activeDate);
        const updatedNovedades = (log.novedades || []).map((n) =>
          n.id === entry.id ? { ...n, text: editingEntryText.trim(), time: editingEntryTime || n.time } : n
        );
        await onSaveDailyLog(pt.id, { ...log, novedades: updatedNovedades });
      }
    }
    setEditingEntryId(null);
    setEditingEntryText("");
    setEditingEntryTime("");
    await onRefreshFeatures?.();
  };

  const handleCancelEditEntry = () => {
    setEditingEntryId(null);
    setEditingEntryText("");
    setEditingEntryTime("");
  };

  return (
    <div className="rr-backdrop">
      <div className="rr-modal">
        {/* Header */}
        <div className="rr-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }} size={18} />
            <div>
              <h3 className="rr-title">
                {isAllMode ? "Bitácora General" : "Bitácora de Rango"}
              </h3>
              <p className="rr-subtitle">
                {isAllMode ? (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>Todos los sitios</strong> · {daysWithData} de {dates.length} días con registros
                  </span>
                ) : (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>{feat.title}</strong> · {daysWithData} de {dates.length} días con registros
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="rr-close-btn" onClick={onClose} title="Cerrar">
            <X size={15} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="rr-tabs">
          <button className={`rr-tab ${activeTab === "registro" ? "active" : ""}`} onClick={() => setActiveTab("registro")}>
            <Calendar size={13} /> Registro
          </button>
          <button className={`rr-tab ${activeTab === "estadisticas" ? "active" : ""}`} onClick={() => setActiveTab("estadisticas")}>
            <BarChart2 size={13} /> Estadísticas
          </button>
          <button className={`rr-tab ${activeTab === "novedades" ? "active" : ""}`} onClick={() => setActiveTab("novedades")}>
            <FileText size={13} /> Novedades
          </button>
        </div>

        {/* ── STATISTICS TAB ── */}
        {activeTab === "estadisticas" && periodStats && (
          <div className="rr-list" style={{ gap: "14px" }}>
            {/* Global period totals — all values are log-level totals (may include manually entered data) */}
            <div className="rr-stats-cards-grid">
              <div className="rr-scard" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
                <HeartHandshake size={14} style={{ color: "var(--color-green)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-green)" }}>{periodStats.totalRescued}</div>
                <div className="rr-scard-label">Rescatados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                <ShieldAlert size={14} style={{ color: "var(--color-high)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-high)" }}>{periodStats.totalRecovered}</div>
                <div className="rr-scard-label">Recuperados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(56,189,248,0.2)" }}>
                <HeartPulse size={14} style={{ color: "#38bdf8" }} />
                <div className="rr-scard-val">{periodStats.totalPrehospitalCare}</div>
                <div className="rr-scard-label">Atenciones Prehosp.</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
                <Ambulance size={14} style={{ color: "var(--color-purple)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-purple)" }}>{periodStats.totalTransfers}</div>
                <div className="rr-scard-label">Traslados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
                <span style={{ fontSize: "14px" }}>🐾</span>
                <div className="rr-scard-val" style={{ color: "#fbbf24" }}>{periodStats.totalPets}</div>
                <div className="rr-scard-label">Animales Rescatados</div>
              </div>
              <div className="rr-scard">
                <TrendingUp size={14} style={{ color: "var(--text-muted)" }} />
                <div className="rr-scard-val">{periodStats.totalDaysWithData}</div>
                <div className="rr-scard-label">Días con Actividad</div>
              </div>
            </div>
             {/* Sección: Desglose por Grupos y Comisiones */}
            {((periodStats.jointCommissionStats && periodStats.jointCommissionStats.length > 0) || (periodStats.independentGroupStats && periodStats.independentGroupStats.length > 0) || sortedGroupStats.length > 0) && (
              <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={10} /> Desglose por Grupos y Comisiones
                  <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto", fontStyle: "italic" }}>
                    * Comisión Conjunta = borde punteado
                  </span>
                </div>
                {/* Buscador */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={13} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Filtrar por nombre de grupo, comisión o sitio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "5px 8px 5px 26px",
                        fontSize: "0.66rem",
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "6px",
                        color: "var(--text-main)",
                        outline: "none",
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="rr-stats-table-wrap">
                  <table className="rr-stats-table">
                    <thead>
                      <tr>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("nombre")}>Grupo / Agrupación {statsSortKey === "nombre" ? (statsSortDir === "asc" ? "↑" : "↓") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("daysActive")}>Días {statsSortKey === "daysActive" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalRescued")} style={{ color: "var(--color-green)" }}>Rescatados {statsSortKey === "totalRescued" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalRecovered")} style={{ color: "var(--color-high)" }}>Recuperados {statsSortKey === "totalRecovered" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalPrehospitalCare")}>Atenciones {statsSortKey === "totalPrehospitalCare" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalTransfers")} style={{ color: "var(--color-purple)" }}>Traslados {statsSortKey === "totalTransfers" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalPets")} style={{ color: "#fbbf24" }}>Animales {statsSortKey === "totalPets" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 1. GRUPOS EN TRABAJO INDEPENDIENTE */}
                      {sortedIndependentGroups.map((gs, i) => (
                        <tr key={"indiv_" + gs.groupName + i} className={i % 2 === 0 ? "rr-tr-even" : ""}>
                          <td style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                            <div className="rr-td-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="rr-td-dept" style={{ color: gs.department === "pc" ? "var(--color-info)" : "#ef4444" }}>
                                {gs.department === "pc" ? "PC" : "B"}
                              </span>
                              <span style={{ fontWeight: 700 }}>{gs.groupName}</span>
                              {gs.isVolunteer && (
                                <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.52rem", fontWeight: 800 }}>
                                  VOLUNTARIO
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.daysActive}</td>
                          <td style={{ textAlign: "center", color: gs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalRescued}</td>
                          <td style={{ textAlign: "center", color: gs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalRecovered}</td>
                          <td style={{ textAlign: "center", color: gs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalPrehospitalCare}</td>
                          <td style={{ textAlign: "center", color: gs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalTransfers}</td>
                          <td style={{ textAlign: "center", color: gs.totalPets > 0 ? "#fbbf24" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalPets || 0}</td>
                        </tr>
                      ))}

                      {/* 2. GRUPOS COMBINADOS EN OPERACIÓN CONJUNTA */}
                      {sortedJointCommissions.map((jc) => {
                        const rowCount = jc.participatingGroups.length;
                        return jc.participatingGroups.map((gItem, gIdx) => {
                          const isFirst = gIdx === 0;
                          const isLast = gIdx === rowCount - 1;

                          return (
                            <tr key={`jc_${jc.commissionId}_${gItem.groupName}_${gIdx}`}>
                              {/* Celda del Nombre del Grupo */}
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderTop: isFirst ? "1.5px solid rgba(56, 189, 248, 0.5)" : "none",
                                  borderBottom: isLast ? "1.5px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                                  borderLeft: "1.5px solid rgba(56, 189, 248, 0.5)",
                                  background: "rgba(56, 189, 248, 0.02)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span className="rr-td-dept" style={{ color: gItem.department === "pc" ? "var(--color-info)" : "#ef4444" }}>
                                    {gItem.department === "pc" ? "PC" : "B"}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>{gItem.groupName}</span>
                                  {gItem.isVolunteer && (
                                    <span style={{ background: "rgba(168, 85, 247, 0.25)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "3px", padding: "0 3px", fontSize: "0.5rem", fontWeight: 800 }}>
                                      VOLUNTARIO
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Casillas numéricas unificadas / combinadas mediante rowSpan */}
                              {isFirst && (
                                <>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                    }}
                                  >
                                    {jc.daysActive}
                                  </td>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                      color: jc.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)",
                                    }}
                                  >
                                    {jc.totalRescued}
                                  </td>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                      color: jc.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)",
                                    }}
                                  >
                                    {jc.totalRecovered}
                                  </td>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                      color: jc.totalPrehospitalCare > 0 ? "#38bdf8" : "var(--text-muted)",
                                    }}
                                  >
                                    {jc.totalPrehospitalCare}
                                  </td>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                      color: jc.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)",
                                    }}
                                  >
                                    {jc.totalTransfers}
                                  </td>
                                  <td
                                    rowSpan={rowCount}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      verticalAlign: "middle",
                                      background: "rgba(56, 189, 248, 0.04)",
                                      borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                      borderRight: "1.5px solid rgba(56, 189, 248, 0.5)",
                                      color: jc.totalPets > 0 ? "#fbbf24" : "var(--text-muted)",
                                    }}
                                  >
                                    {jc.totalPets}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        });
                      })}

                      {/* 3. SUMA GENERAL DE LA BITÁCORA */}
                      <tr style={{ background: "rgba(15, 23, 42, 0.95)", borderTop: "2px solid #38bdf8", fontWeight: 800 }}>
                        <td style={{ color: "var(--text-main)", fontSize: "0.68rem" }}>
                          SUMA GENERAL DE LA BITÁCORA
                        </td>
                        <td style={{ textAlign: "center", color: "#38bdf8" }}>{periodStats.totalDaysWithData}d</td>
                        <td style={{ textAlign: "center", color: "var(--color-green)", fontSize: "0.72rem" }}>{periodStats.totalRescued}</td>
                        <td style={{ textAlign: "center", color: "var(--color-high)", fontSize: "0.72rem" }}>{periodStats.totalRecovered}</td>
                        <td style={{ textAlign: "center", color: "#38bdf8", fontSize: "0.72rem" }}>{periodStats.totalPrehospitalCare}</td>
                        <td style={{ textAlign: "center", color: "var(--color-purple)", fontSize: "0.72rem" }}>{periodStats.totalTransfers}</td>
                        <td style={{ textAlign: "center", color: "#fbbf24", fontSize: "0.72rem" }}>{periodStats.totalPets}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Per-site statistics separated by Sectors vs Sitios de Trabajo */}
            {periodStats.featureStats.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Sectors section with dedicated Puntos Contenidos column */}
                {periodStats.featureStats.some((fs) => isSectorFeature(fs)) && (
                  <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Layers size={10} /> Sectores
                    </div>
                    <div className="rr-stats-table-wrap">
                      <table className="rr-stats-table">
                        <thead>
                          <tr>
                            <th>Sector</th>
                            <th style={{ color: "#38bdf8" }}>Puntos Contenidos</th>
                            <th style={{ textAlign: "center" }}>Días</th>
                            <th style={{ textAlign: "center", color: "var(--color-green)" }}>Rescatados</th>
                            <th style={{ textAlign: "center", color: "var(--color-high)" }}>Recuperados</th>
                            <th style={{ textAlign: "center", color: "var(--color-info)" }}>Atenciones</th>
                            <th style={{ textAlign: "center", color: "var(--color-purple)" }}>Traslados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodStats.featureStats.filter((fs) => isSectorFeature(fs)).map((fs, idx) => {
                            const containedPoints = (allFeatures || []).filter((c) => String(parentsMap[c.id]) === String(fs.featureId));
                            const pointsText = containedPoints.map((c) => c.title).join(", ");

                            return (
                              <tr key={fs.featureId} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: fs.featureColor || "var(--color-info)", flexShrink: 0 }} />
                                    <Layers size={11} style={{ color: "var(--color-info)", flexShrink: 0 }} />
                                    <span>{fs.featureTitle}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center", fontWeight: 700, color: containedPoints.length > 0 ? "#38bdf8" : "var(--text-muted)" }}>
                                  {containedPoints.length}
                                </td>
                                <td style={{ textAlign: "center", fontWeight: 700 }}>{fs.daysActive}</td>
                                <td style={{ textAlign: "center", color: fs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)" }}>{fs.totalRescued}</td>
                                <td style={{ textAlign: "center", color: fs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)" }}>{fs.totalRecovered}</td>
                                <td style={{ textAlign: "center", color: fs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)" }}>{fs.totalPrehospitalCare}</td>
                                <td style={{ textAlign: "center", color: fs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)" }}>{fs.totalTransfers}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sitios de Trabajo section */}
                {periodStats.featureStats.some((fs) => !isSectorFeature(fs)) && (
                  <div style={{ ...sectionBox, background: "rgba(251, 146, 60, 0.03)", borderColor: "rgba(251, 146, 60, 0.15)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fb923c", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={10} /> Sitios de Trabajo
                    </div>
                    <div className="rr-stats-table-wrap">
                      <table className="rr-stats-table">
                        <thead>
                          <tr>
                            <th>Sitio de Trabajo</th>
                            <th style={{ textAlign: "center" }}>Días</th>
                            <th style={{ textAlign: "center", color: "var(--color-green)" }}>Rescatados</th>
                            <th style={{ textAlign: "center", color: "var(--color-high)" }}>Recuperados</th>
                            <th style={{ textAlign: "center", color: "var(--color-info)" }}>Atenciones</th>
                            <th style={{ textAlign: "center", color: "var(--color-purple)" }}>Traslados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodStats.featureStats.filter((fs) => !isSectorFeature(fs)).map((fs, idx) => (
                            <tr key={fs.featureId} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: fs.featureColor || "var(--color-green)", flexShrink: 0 }} />
                                  <MapPin size={11} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                                  <span>{fs.featureTitle}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 700 }}>{fs.daysActive}</td>
                              <td style={{ textAlign: "center", color: fs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)" }}>{fs.totalRescued}</td>
                              <td style={{ textAlign: "center", color: fs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)" }}>{fs.totalRecovered}</td>
                              <td style={{ textAlign: "center", color: fs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)" }}>{fs.totalPrehospitalCare}</td>
                              <td style={{ textAlign: "center", color: fs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)" }}>{fs.totalTransfers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {periodStats.groupStats.length === 0 && (
              <div className="rr-empty-state">
                <BarChart2 size={28} style={{ opacity: 0.4, color: "var(--color-info)" }} />
                <div>Aún no hay datos suficientes para mostrar estadísticas.</div>
              </div>
            )}
          </div>
        )}

        {/* ── REGISTRO TAB ── */}
        {activeTab === "registro" && (
        <>{/* Integrated Sober Toolbar */}
        <div className="rr-toolbar">
          {isAllMode && (
            <div className="rr-toolbar-date">
              <button
                onClick={handlePrevDay}
                disabled={activeDateIndex === dates.length - 1}
                className="rr-icon-btn"
                title="Día anterior"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Botón Selector de Fecha que abre el Calendario */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="rr-date-trigger-btn"
                  onClick={() => setShowCalendarPopover((v) => !v)}
                  title="Abrir calendario para seleccionar fecha"
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

                {/* Popover flotante de Calendario */}
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
          )}

          {isAllMode && (
            <div className="rr-toolbar-search">
              <Search size={13} className="rr-search-icon" />
              <input
                type="text"
                className="rr-search-input"
                placeholder="Buscar por nombre, grupo, encargado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="rr-search-clear" onClick={() => setSearchQuery("")} title="Limpiar">
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="rr-toolbar-filter">
            {(["all", "arrived", "not_arrived"] as const).map((key) => (
              <button
                key={key}
                className={`rr-filter-btn ${arrivalFilter === key ? "active" : ""}`}
                onClick={() => setArrivalFilter(key)}
              >
                {key === "all" ? "Todos" : key === "arrived" ? "Llegaron" : "Pendientes"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary Bar */}
        {isAllMode && dayStats && dayStats.activePoints > 0 && (
          <div className="rr-stats-summary">
            <div className="rr-stat-item">
              <Users size={12} style={{ color: "var(--color-info)" }} />
              <span>Personal: <strong>{dayStats.totalPersonnel}</strong></span>
            </div>
            <span className="rr-stat-divider">•</span>
            <div className="rr-stat-item">
              <span>Rescatados: <strong style={{ color: "var(--color-green)" }}>{dayStats.totalRescued}</strong></span>
            </div>
            <span className="rr-stat-divider">•</span>
            <div className="rr-stat-item">
              <span>Recuperados: <strong style={{ color: "#ef4444" }}>{dayStats.totalRecovered}</strong></span>
            </div>
            {dayStats.totalPrehospitalCare > 0 && (
              <>
                <span className="rr-stat-divider">•</span>
                <div className="rr-stat-item">
                  <span>Atenciones: <strong style={{ color: "#38bdf8" }}>{dayStats.totalPrehospitalCare}</strong></span>
                </div>
              </>
            )}
            {dayStats.totalTransfers > 0 && (
              <>
                <span className="rr-stat-divider">•</span>
                <div className="rr-stat-item">
                  <span>Traslados: <strong style={{ color: "var(--color-purple)" }}>{dayStats.totalTransfers}</strong></span>
                </div>
              </>
            )}
            {dayStats.totalPets > 0 && (
              <>
                <span className="rr-stat-divider">•</span>
                <div className="rr-stat-item">
                  <span>Mascotas: <strong>{dayStats.totalPets}</strong></span>
                </div>
              </>
            )}
            <span className="rr-stat-divider">•</span>
            <div className="rr-stat-item">
              <span>Sitios Activos: <strong>{dayStats.activePoints}</strong></span>
            </div>
          </div>
        )}

        {/* Scrollable list */}
        <div className="rr-list">
          {isAllMode ? (
            <>
              {activePoints.length === 0 ? (
                <div className="rr-empty-state">
                  <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                  <div>
                    {searchQuery
                      ? `No se encontraron resultados para "${searchQuery}"`
                      : arrivalFilter === "all"
                        ? "No hay personal reportado en ningún Sitio de Trabajo para este día."
                        : arrivalFilter === "arrived"
                          ? "No hay grupos que hayan llegado para este día."
                          : "Todos los grupos de este día ya han llegado o no hay personal reportado."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Sectors group */}
                  {activePoints.some((pt) => isSectorFeature(pt)) && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 800, color: "var(--color-info)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                        <Layers size={12} /> Sectores ({activePoints.filter((pt) => isSectorFeature(pt)).length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {activePoints.filter((pt) => isSectorFeature(pt)).map((pt) => {
                          const logs = pt.dailyLogs?.filter((l) =>
                            l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                          ) || [];
                          const log = logs[0];
                          const isEditingThis = activeEditFeatureId === pt.id;
                          const hasG2 = !!(log?.groupName2 || log?.unitOut2);
                          const containedPoints = (allFeatures || []).filter((c) => String(parentsMap[c.id]) === String(pt.id));

                          return (
                            <div key={pt.id} className="rr-point-card" style={{ borderColor: "rgba(56, 189, 248, 0.25)" }}>
                              <div className="rr-card-header">
                                <div className="rr-card-title-group">
                                  <span className="rr-card-dot" style={{ backgroundColor: pt.color || "var(--color-info)", color: pt.color || "var(--color-info)" }} />
                                  <Layers size={12} style={{ color: "var(--color-info)" }} />
                                  <span className="rr-card-title">{pt.title}</span>
                                  <span className="rr-meta-chip" style={{ background: "rgba(56, 189, 248, 0.12)", color: "var(--color-info)", fontSize: "0.58rem" }}>
                                    SECTOR
                                  </span>
                                </div>
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
                              </div>

                              {!isEditingThis && log && (
                                <div className="rr-card-body">
                                  <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="#38bdf8" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 1, newArrived)} />
                                  {hasG2 && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="#a855f7" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 2, newArrived)} />}
                                </div>
                              )}

                              {containedPoints.some((cp) => cp.dailyLogs?.some((l) => l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l))) && (
                                <div style={{ marginTop: "6px", padding: "6px 10px", background: "rgba(56, 189, 248, 0.05)", borderRadius: "8px", border: "1px dashed rgba(56, 189, 248, 0.25)", display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <MapPin size={10} /> PUNTOS CONTENIDOS EN ESTE SECTOR ({activeDate}):
                                  </div>
                                  {containedPoints.map((cp) => {
                                    const cpLog = cp.dailyLogs?.find((l) => l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l));
                                    if (!cpLog) return null;
                                    const r = (parseInt(cpLog.rescuedCount || "0", 10) + parseInt(cpLog.rescuedCount2 || "0", 10));
                                    const rc = (parseInt(cpLog.recoveredCount || "0", 10) + parseInt(cpLog.recoveredCount2 || "0", 10));
                                    const ph = (parseInt(cpLog.prehospitalCareCount || "0", 10) + parseInt(cpLog.prehospitalCareCount2 || "0", 10));
                                    const tr = (parseInt(cpLog.transfersCount || "0", 10) + parseInt(cpLog.transfersCount2 || "0", 10));
                                    const off = (parseInt(cpLog.officersCount || "0", 10) + parseInt(cpLog.officersCount2 || "0", 10));
                                    return (
                                      <div key={cp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.63rem", color: "var(--text-main)", padding: "2px 4px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px" }}>
                                        <span style={{ fontWeight: 600 }}>📍 {cp.title} {cpLog.groupName ? `(${cpLog.groupName})` : ""}</span>
                                        <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem" }}>
                                          {off > 0 && <span style={{ color: "#94a3b8" }}>👥 {off}</span>}
                                          {r > 0 && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>↑{r}</span>}
                                          {rc > 0 && <span style={{ color: "var(--color-high)", fontWeight: 700 }}>✝{rc}</span>}
                                          {ph > 0 && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>⚕{ph}</span>}
                                          {tr > 0 && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>⇒{tr}</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {log?.observations && !isEditingThis && (
                                <div className="rr-card-obs"><span className="rr-obs-label">Nota:</span> {log.observations}</div>
                              )}

                              {isEditingThis && (
                                <div className="rr-point-edit-zone">
                                  <InlineRowEditor dateStr={activeDate} log={log} feat={pt} onSaveDailyLog={onSaveDailyLog} onCloseEditor={() => setActiveEditFeatureId(null)} workGroups={workGroups} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sitios de Trabajo group */}
                  {activePoints.some((pt) => !isSectorFeature(pt)) && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 800, color: "var(--accent-orange)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                        <MapPin size={12} /> Sitios de Trabajo ({activePoints.filter((pt) => !isSectorFeature(pt)).length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {activePoints.filter((pt) => !isSectorFeature(pt)).map((pt) => {
                          const logs = pt.dailyLogs?.filter((l) =>
                            l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                          ) || [];
                          const log = logs[0];
                          const isEditingThis = activeEditFeatureId === pt.id;
                          const hasG2 = !!(log?.groupName2 || log?.unitOut2);

                          return (
                            <div key={pt.id} className="rr-point-card">
                              <div className="rr-card-header">
                                <div className="rr-card-title-group">
                                  <span className="rr-card-dot" style={{ backgroundColor: pt.color || "var(--color-green)", color: pt.color || "var(--color-green)" }} />
                                  <MapPin size={12} style={{ color: "var(--accent-orange)" }} />
                                  <span className="rr-card-title">{pt.title}</span>
                                  <span className="rr-meta-chip" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#fb923c", fontSize: "0.58rem" }}>SITIO</span>
                                </div>
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
                              </div>

                              {!isEditingThis && log && (
                                <div className="rr-card-body">
                                  <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="#38bdf8" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 1, newArrived)} />
                                  {!!(log.groupName2 || log.unitOut2) && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="#a855f7" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 2, newArrived)} />}
                                  {!!(log.groupName3 || log.unitOut3) && <GroupDisplay group={getGroupData(log, 3)} label="G3" accentColor="#c084fc" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 3, newArrived)} />}
                                  {!!(log.groupName4 || log.unitOut4) && <GroupDisplay group={getGroupData(log, 4)} label="G4" accentColor="#fb923c" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 4, newArrived)} />}
                                </div>
                              )}

                              {log?.observations && !isEditingThis && (
                                <div className="rr-card-obs"><span className="rr-obs-label">Nota:</span> {log.observations}</div>
                              )}

                              {isEditingThis && (
                                <div className="rr-point-edit-zone">
                                  <InlineRowEditor dateStr={activeDate} log={log} feat={pt} onSaveDailyLog={onSaveDailyLog} onCloseEditor={() => setActiveEditFeatureId(null)} workGroups={workGroups} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inactivePoints.length > 0 && (
                <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(255, 255, 255, 0.01)", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    + REGISTRAR EN OTRO SITIO O SECTOR
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => { const val = e.target.value; if (val) { setActiveEditFeatureId(parseInt(val, 10)); e.target.value = ""; } }}
                    style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "5px", color: "var(--text-main)", fontSize: "0.68rem", padding: "4px 8px", outline: "none", width: "100%", cursor: "pointer" }}
                  >
                    <option value="" disabled style={{ background: "#1e293b" }}>-- Seleccionar Sitio o Sector --</option>
                    {inactivePoints.some((pt) => isSectorFeature(pt)) && (
                      <optgroup label="🗺️ Sectores" style={{ background: "#1e293b", color: "#38bdf8" }}>
                        {inactivePoints.filter((pt) => isSectorFeature(pt)).map((pt) => (
                          <option key={pt.id} value={pt.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>{pt.title}</option>
                        ))}
                      </optgroup>
                    )}
                    {inactivePoints.some((pt) => !isSectorFeature(pt)) && (
                      <optgroup label="📍 Sitios de Trabajo" style={{ background: "#1e293b", color: "#fb923c" }}>
                        {inactivePoints.filter((pt) => !isSectorFeature(pt)).map((pt) => (
                          <option key={pt.id} value={pt.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>{pt.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </>
            ) : (
              <>
                {filteredDates.length === 0 && !isSectorFeature(feat) ? (
                  <div className="rr-empty-state">
                    <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                    <div>No hay registros que coincidan con el filtro en este rango de fechas.</div>
                  </div>
                ) : (
                  filteredDates.map((dateStr) => {
                    const logs = feat.dailyLogs?.filter((l) =>
                      l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                    ) || [];
                    const log = logs[0];
                    return <DateRow key={dateStr} dateStr={dateStr} log={log} feat={feat} onSaveDailyLog={onSaveDailyLog} activeDepartment={activeDepartment} workGroups={workGroups} />;
                  })
                )}
                {singleFeatContainedPts.length > 0 && (
                    <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(56, 189, 248, 0.04)", borderRadius: "8px", border: "1px dashed rgba(56, 189, 248, 0.2)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={10} /> PUNTOS CONTENIDOS ({singleFeatContainedPts.length})
                      </div>
                      {singleFeatContainedPts.map((cp) => {
                        const cpLogs = cp.dailyLogs?.filter((l) =>
                          l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                        ) || [];
                        const cpLog = cpLogs[0];
                        if (!cpLog) return null;
                        const hasData = logHasAnyData(cpLog);
                        return (
                          <div key={cp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.63rem", color: "var(--text-main)", padding: "3px 6px", background: hasData ? "rgba(167, 139, 250, 0.06)" : "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${hasData ? "#a78bfa" : "transparent"}` }}>
                            <span style={{ fontWeight: 600 }}>{cp.title} {cpLog.groupName ? `(${cpLog.groupName})` : ""}</span>
                            <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem" }}>
                              {hasData ? (
                                <>
                                  {(parseInt(cpLog.rescuedCount || "0", 10) + parseInt(cpLog.rescuedCount2 || "0", 10)) > 0 && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{parseInt(cpLog.rescuedCount || "0", 10) + parseInt(cpLog.rescuedCount2 || "0", 10)}</span>}
                                  {(parseInt(cpLog.recoveredCount || "0", 10) + parseInt(cpLog.recoveredCount2 || "0", 10)) > 0 && <span style={{ color: "var(--color-high)", fontWeight: 700 }}>{parseInt(cpLog.recoveredCount || "0", 10) + parseInt(cpLog.recoveredCount2 || "0", 10)}</span>}
                                  {(parseInt(cpLog.prehospitalCareCount || "0", 10) + parseInt(cpLog.prehospitalCareCount2 || "0", 10)) > 0 && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{parseInt(cpLog.prehospitalCareCount || "0", 10) + parseInt(cpLog.prehospitalCareCount2 || "0", 10)}</span>}
                                </>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.58rem" }}>Sin datos</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </>
            )}
        </div>
        </> /* end registro tab */
        )}

        {/* ── NOVEDADES TAB ── */}
        {activeTab === "novedades" && (
          <div className="rr-list" style={{ gap: "12px", padding: "12px 16px" }}>
            {/* Date toolbar */}
            {isAllMode && (
              <div className="rr-toolbar" style={{ borderRadius: "10px" }}>
                <div className="rr-toolbar-date">
                  <button onClick={handlePrevDay} disabled={activeDateIndex === dates.length - 1} className="rr-icon-btn" title="Día anterior">
                    <ChevronLeft size={14} />
                  </button>
                  <div style={{ position: "relative" }}>
                    <button type="button" className="rr-date-trigger-btn" onClick={() => setShowCalendarPopover((v) => !v)}>
                      <Calendar size={13} style={{ color: "var(--color-info)" }} />
                      <span>{formatDateFriendly(activeDate)}</span>
                      <ChevronDown size={12} style={{ color: "var(--text-muted)", transition: "transform 0.2s ease", transform: showCalendarPopover ? "rotate(180deg)" : "none" }} />
                    </button>
                    {showCalendarPopover && (
                      <div className="rr-calendar-popover" onClick={(e) => e.stopPropagation()}>
                        <BitacoraCalendar selectedDate={activeDate} onSelectDate={(dStr) => { const idx = dates.indexOf(dStr); if (idx !== -1) { syncDateChange(idx); } setShowCalendarPopover(false); }} />
                      </div>
                    )}
                  </div>
                  <button onClick={handleNextDay} disabled={activeDateIndex === 0} className="rr-icon-btn" title="Día siguiente">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Add form */}
            {onSaveGlobalNovedad && (
              <div style={{ ...sectionBox, background: "rgba(34, 197, 94, 0.03)", borderColor: "rgba(34, 197, 94, 0.15)" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={10} /> Nueva Entrada
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Novedad</span>
                    <textarea
                      value={novText}
                      onChange={(e) => setNovText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNovedad(); } }}
                      placeholder="Escribir novedad..."
                      rows={4}
                      style={{ resize: "vertical", fontSize: "0.65rem", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(17, 24, 39, 0.5)", color: "var(--text-main)", fontFamily: "inherit", outline: "none", lineHeight: 1.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Hora</span>
                      <input
                        type="time"
                        value={novTime}
                        onChange={(e) => setNovTime(e.target.value)}
                        style={{ width: "90px", fontSize: "0.65rem", padding: "6px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(17, 24, 39, 0.6)", color: "var(--text-main)", fontVariantNumeric: "tabular-nums", outline: "none" }}
                      />
                    </div>
                    <button
                      onClick={handleAddNovedad}
                      disabled={!novText.trim()}
                      title="Agregar"
                      style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.3)", background: novText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)", color: novText.trim() ? "var(--color-green)" : "var(--text-muted)", cursor: novText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.65rem", fontWeight: 700, transition: "all 0.15s ease", whiteSpace: "nowrap" }}
                    >
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)", padding: 0, overflow: "hidden" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={10} /> Libro de Novedades
                <span style={{ marginLeft: "auto", fontSize: "0.55rem", fontWeight: 400, color: "var(--text-muted)" }}>{tableEntries.length} {tableEntries.length === 1 ? "entrada" : "entradas"}</span>
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
                        <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", width: "60px" }}>Hora</th>
                        <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Novedad</th>
                        {showOrigin && (
                          <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Origen</th>
                        )}
                        <th style={{ width: showOrigin ? "48px" : "48px" }}>
                          {(onSaveDailyLog || onDeleteGlobalNovedad) && (
                            <button onClick={() => setShowOrigin(!showOrigin)} title={showOrigin ? "Ocultar columna Origen" : "Mostrar columna Origen"} style={{ padding: "0 2px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", margin: "0 auto" }}>
                              <EyeOff size={11} style={{ opacity: showOrigin ? 0.5 : 1, color: showOrigin ? "var(--text-muted)" : "var(--color-info)" }} />
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
                            ? (idx % 2 === 0 ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.02)")
                            : isPunto
                              ? (idx % 2 === 0 ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.02)")
                              : (idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)");
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
                          onMouseEnter={canNavigate ? (e) => { e.currentTarget.style.background = isPunto ? "rgba(167,139,250,0.12)" : "rgba(56,189,248,0.08)"; } : undefined}
                          onMouseLeave={canNavigate ? (e) => { e.currentTarget.style.background = rowBg; } : undefined}
                        >
                          <td style={{ padding: "6px 10px", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: entry.isObservation ? "var(--text-muted)" : isLibro ? "var(--color-green)" : isPunto ? "#c4b5fd" : "var(--text-main)", whiteSpace: "nowrap" }}>
                            {entry.isObservation ? (
                              <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontStyle: "italic" }}>obs.</span>
                            ) : (
                              <>{entry.time} <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>HLV</span></>
                            )}
                          </td>
                          <td style={{ padding: "6px 10px", color: entry.isObservation ? "var(--text-muted)" : isLibro ? "var(--color-green)" : isPunto ? "#c4b5fd" : "var(--text-main)", fontStyle: entry.isObservation ? "italic" : "normal", lineHeight: 1.4 }}>
                            {entry.isObservation && <span style={{ color: "var(--accent-orange)", fontWeight: 700, fontSize: "0.55rem", marginRight: "4px" }}>OBS:</span>}
                            {editingEntryId === entry.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input
                                    type="time"
                                    value={editingEntryTime}
                                    onChange={(e) => setEditingEntryTime(e.target.value)}
                                    style={{ width: "80px", fontSize: "0.6rem", padding: "4px 5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(17,24,39,0.7)", color: "var(--text-main)", fontVariantNumeric: "tabular-nums", outline: "none", fontFamily: "inherit" }}
                                  />
                                </div>
                                <textarea
                                  value={editingEntryText}
                                  onChange={(e) => setEditingEntryText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEditEntry(entry); } }}
                                  autoFocus
                                  rows={3}
                                  style={{
                                    fontSize: "0.62rem", padding: "4px 6px", borderRadius: "4px",
                                    border: "1px solid rgba(56,189,248,0.3)", background: "rgba(17,24,39,0.7)",
                                    color: "var(--text-main)", fontFamily: "inherit", resize: "vertical",
                                    outline: "none", width: "100%",
                                  }}
                                />
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button onClick={() => handleSaveEditEntry(entry)} disabled={!editingEntryText.trim()} style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: "3px", border: "1px solid rgba(34,197,94,0.3)", background: editingEntryText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)", color: editingEntryText.trim() ? "var(--color-green)" : "var(--text-muted)", cursor: editingEntryText.trim() ? "pointer" : "default" }}>
                                    Guardar
                                  </button>
                                  <button onClick={handleCancelEditEntry} style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--text-muted)", cursor: "pointer" }}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span
                                onClick={canNavigate ? (e) => { e.stopPropagation(); handleNavigateToEntry(entry); } : undefined}
                                style={canNavigate ? { cursor: "pointer" } : {}}
                              >
                                {entry.text}
                              </span>
                            )}
                          </td>
                          {showOrigin && (
                          <td style={{ padding: "6px 10px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 6px", borderRadius: "4px", fontSize: "0.55rem", fontWeight: 600, background: entry.isObservation ? "rgba(251, 146, 60, 0.1)" : isLibro ? "rgba(34, 197, 94, 0.1)" : isPunto ? "rgba(167, 139, 250, 0.12)" : "rgba(56, 189, 248, 0.1)", color: entry.isObservation ? "var(--accent-orange)" : isLibro ? "var(--color-green)" : isPunto ? "#a78bfa" : "var(--color-info)", ...(canNavigate ? { cursor: "pointer" } : {}) }}>
                              {isZona && <Layers size={10} />}
                              {isPunto && <MapPin size={10} />}
                              {entry.origin}
                            </span>
                          </td>
                          )}
                          {(onSaveDailyLog || onDeleteGlobalNovedad) && (
                            <td style={{ padding: "6px 2px", textAlign: "center", whiteSpace: "nowrap" }}>
                              {!entry.isObservation && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleStartEditEntry(entry); }} title="Editar" style={{ padding: "2px", borderRadius: "3px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.15s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-info)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                                    <Pencil size={11} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteNovedad(entry); }} title="Eliminar" style={{ padding: "2px", borderRadius: "3px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.15s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-high)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
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
        )}

        {/* Footer */}
        <div className="rr-footer">
          <div className="rr-footer-left">
            <button onClick={handlePrint} className="rr-print-btn">
              <Printer size={12} />
              Imprimir
            </button>
          </div>
          <button onClick={onClose} className="sim-btn" style={{ padding: "5px 18px", fontSize: "0.72rem" }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirm modal for novedad delete */}
      <ConfirmModal
        isOpen={confirmDeleteNovedad !== null}
        title="Eliminar Novedad"
        message="¿Está seguro de que desea eliminar esta novedad?"
        onConfirm={() => { if (confirmDeleteNovedad) { handleDeleteNovedad(confirmDeleteNovedad); setConfirmDeleteNovedad(null); } }}
        onCancel={() => setConfirmDeleteNovedad(null)}
      />
    </div>
  );
};

export { RangeReportModal };
