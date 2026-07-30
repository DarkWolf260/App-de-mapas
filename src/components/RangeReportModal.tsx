import React, { useState, useMemo, useEffect, useRef } from "react";
import type { DrawnFeature, DailyLog, DepartmentView, NovedadEntry, NovedadType } from "../types";

import { ConfirmModal } from "./ConfirmModal";
import { buildParentsMap } from "../utils/spatialUtils";
import {
  getDatesRange,
  logMatchesArrivalFilter,
  logHasAnyData,
  isSectorFeature,
  getDayStats,
  featureMatchesSearch,
  REPORT_START_DATE,
  emptyLog,
  getPeriodStats,
  mergeLogs,
} from "../utils/logUtils";

import { RangeReportHeader } from "./report/RangeReportHeader";
import { RangeReportStatsTab } from "./report/RangeReportStatsTab";
import { RangeReportNovedadesTab, TableEntry } from "./report/RangeReportNovedadesTab";
import { RangeReportRegisterTab } from "./report/RangeReportRegisterTab";

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  activeDepartment?: DepartmentView;
  selectedDate?: string;
  onSelectedDateChange?: (date: string) => void;
  globalNovedades?: NovedadEntry[];
  onFetchGlobalNovedades?: (date: string, department?: string) => void;
  onSaveGlobalNovedad?: (entry: NovedadEntry, date: string, department: string) => Promise<void>;
  onDeleteGlobalNovedad?: (entryId: string) => Promise<void>;
  onUpdateGlobalNovedad?: (entryId: string, newText: string, newTime?: string) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  canEdit?: boolean;
}

const RangeReportModal: React.FC<RangeReportModalProps> = ({
  feat,
  allFeatures = [],
  onClose,
  onSaveDailyLog,
  activeDepartment = "pc",
  selectedDate: externalDate,
  onSelectedDateChange,
  globalNovedades = [],
  onFetchGlobalNovedades,
  onSaveGlobalNovedad,
  onDeleteGlobalNovedad,
  onUpdateGlobalNovedad,
  onRefreshFeatures,
  onNavigateToFeature,
  canEdit = false,
}) => {
  const [activeTab, setActiveTab] = useState<"registro" | "estadisticas" | "novedades">("registro");
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<"all" | "arrived" | "not_arrived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statsSortKey, setStatsSortKey] = useState<
    "nombre" | "daysActive" | "totalRescued" | "totalRecovered" | "totalPrehospitalCare" | "totalTransfers" | "totalPets"
  >("daysActive");
  const [statsSortDir, setStatsSortDir] = useState<"desc" | "asc">("asc");
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [novText, setNovText] = useState("");
  const [novTime, setNovTime] = useState(() =>
    new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [novType] = useState<NovedadType>("novedad");
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

  const getLogForDate = (pt: DrawnFeature, dateStr: string): DailyLog => {
    const logs = pt.dailyLogs?.filter(
      (l) => l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department),
    ) || [];
    return mergeLogs(logs) || emptyLog(dateStr, activeDepartment === "mixto" ? undefined : activeDepartment);
  };

  const activePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (activeEditFeatureId === pt.id) return true;
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const log = getLogForDate(pt, activeDate);
      if (!log || !logHasAnyData(log)) return false;
      return logMatchesArrivalFilter(log, arrivalFilter);
    }).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  }, [isAllMode, allFeatures, feat, activeEditFeatureId, searchQuery, activeDate, arrivalFilter, activeDepartment]);

  const inactivePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const log = getLogForDate(pt, activeDate);
      return !log || !logHasAnyData(log);
    }).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  }, [isAllMode, allFeatures, feat, searchQuery, activeDate, activeDepartment]);

  const filteredDates = useMemo(() => {
    if (!feat) return [];
    return dates.filter((dateStr) => {
      if (isAllMode) return true;
      const log = getLogForDate(feat, dateStr);
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

  const tableEntries = useMemo<TableEntry[]>(() => {
    const features = isAllMode ? allFeatures : feat ? [feat] : [];
    const entries: TableEntry[] = [];

    globalNovedades.forEach((n) => {
      entries.push({ id: n.id, time: n.time, text: n.text, origin: "Bitácora", isObservation: false, type: n.type, rawTimestamp: n.timestamp, level: "libro" });
    });

    for (const pt of features) {
      const log = getLogForDate(pt, activeDate);
      const isSector = isSectorFeature(pt);
      (log.novedades || []).forEach((n) => {
        entries.push({ id: n.id, time: n.time, text: n.text, origin: pt.title, isObservation: false, type: n.type, featureId: pt.id, rawTimestamp: n.timestamp, level: isSector ? "zona" : "punto" });
      });
      if (isSector && isAllMode) {
        const containedPts = allFeatures.filter((c) => String(parentsMap[c.id]) === String(pt.id));
        for (const cPt of containedPts) {
          const cLog = getLogForDate(cPt, activeDate);
          (cLog.novedades || []).forEach((n) => {
            entries.push({ id: n.id, time: n.time, text: n.text, origin: cPt.title, isObservation: false, type: n.type, featureId: cPt.id, rawTimestamp: n.timestamp, level: "punto" });
          });
        }
      }
    }
    return entries
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [isAllMode, allFeatures, feat, activeDate, activeDepartment, parentsMap, globalNovedades]);

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

    const updatedGroups = [...(currentLog.groups || [])];
    while (updatedGroups.length < groupIndex) updatedGroups.push({ id: crypto.randomUUID(), groupName: "" });
    if (updatedGroups[groupIndex - 1]) {
      updatedGroups[groupIndex - 1] = { ...updatedGroups[groupIndex - 1], hasArrived: newArrived };
    }
    const updatedLog = { ...currentLog, groups: updatedGroups };

    await onSaveDailyLog(pt.id, updatedLog);
  };


  const handleSortToggle = (key: typeof statsSortKey) => {
    if (statsSortKey === key) setStatsSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setStatsSortKey(key);
      setStatsSortDir("desc");
    }
  };

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
        <RangeReportHeader
          isAllMode={isAllMode}
          feat={feat}
          daysWithData={daysWithData}
          totalDatesCount={dates.length}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={onClose}
        />

        {/* ── STATISTICS TAB ── */}
        {activeTab === "estadisticas" && periodStats && (
          <RangeReportStatsTab
            periodStats={periodStats}
            allFeatures={allFeatures}
            parentsMap={parentsMap}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statsSortKey={statsSortKey}
            statsSortDir={statsSortDir}
            handleSortToggle={handleSortToggle}
            sortedGroupStats={sortedGroupStats}
            sortedJointCommissions={sortedJointCommissions}
            sortedIndependentGroups={sortedIndependentGroups}
          />
        )}

        {/* ── REGISTRO TAB ── */}
        {activeTab === "registro" && (
          <RangeReportRegisterTab
            isAllMode={isAllMode}
            activeDateIndex={activeDateIndex}
            dates={dates}
            activeDate={activeDate}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            showCalendarPopover={showCalendarPopover}
            setShowCalendarPopover={setShowCalendarPopover}
            syncDateChange={syncDateChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            arrivalFilter={arrivalFilter}
            setArrivalFilter={setArrivalFilter}
            dayStats={dayStats}
            activePoints={activePoints}
            inactivePoints={inactivePoints}
            filteredDates={filteredDates}
            feat={isAllMode ? "all" : feat}
            allFeatures={allFeatures}
            parentsMap={parentsMap}
            activeEditFeatureId={activeEditFeatureId}
            setActiveEditFeatureId={setActiveEditFeatureId}
            activeDepartment={activeDepartment}
            canEdit={canEdit}
            onSaveDailyLog={onSaveDailyLog}
            handleToggleArrivalQuick={handleToggleArrivalQuick}
          />
        )}

        {/* ── NOVEDADES TAB ── */}
        {activeTab === "novedades" && (
          <RangeReportNovedadesTab
            isAllMode={isAllMode}
            activeDateIndex={activeDateIndex}
            dates={dates}
            activeDate={activeDate}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            showCalendarPopover={showCalendarPopover}
            setShowCalendarPopover={setShowCalendarPopover}
            syncDateChange={syncDateChange}
            canEdit={canEdit}
            onSaveGlobalNovedad={onSaveGlobalNovedad}
            novText={novText}
            setNovText={setNovText}
            novTime={novTime}
            setNovTime={setNovTime}
            handleAddNovedad={handleAddNovedad}
            tableEntries={tableEntries}
            showOrigin={showOrigin}
            setShowOrigin={setShowOrigin}
            onSaveDailyLog={onSaveDailyLog}
            onDeleteGlobalNovedad={onDeleteGlobalNovedad}
            onNavigateToFeature={onNavigateToFeature}
            handleNavigateToEntry={handleNavigateToEntry}
            editingEntryId={editingEntryId}
            editingEntryTime={editingEntryTime}
            setEditingEntryTime={setEditingEntryTime}
            editingEntryText={editingEntryText}
            setEditingEntryText={setEditingEntryText}
            handleSaveEditEntry={handleSaveEditEntry}
            handleCancelEditEntry={handleCancelEditEntry}
            handleStartEditEntry={handleStartEditEntry}
            setConfirmDeleteNovedad={setConfirmDeleteNovedad}
          />
        )}


      </div>

      {/* Confirm modal for novedad delete */}
      <ConfirmModal
        isOpen={confirmDeleteNovedad !== null}
        title="Eliminar Novedad"
        message="¿Está seguro de que desea eliminar esta novedad?"
        onConfirm={() => {
          if (confirmDeleteNovedad) {
            handleDeleteNovedad(confirmDeleteNovedad);
            setConfirmDeleteNovedad(null);
          }
        }}
        onCancel={() => setConfirmDeleteNovedad(null)}
      />
    </div>
  );
};

export { RangeReportModal };
