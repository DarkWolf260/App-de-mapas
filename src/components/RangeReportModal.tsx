import React, { useState, useMemo } from "react";
import type { DrawnFeature, DailyLog, DepartmentView, NovedadEntry } from "../types";
import { buildParentsMap } from "../utils/spatialUtils";
import {
  getDatesRange,
  logHasAnyData,
  REPORT_START_DATE,
  getPeriodStats,
} from "../utils/logUtils";

import { RangeReportHeader } from "./report/RangeReportHeader";
import { RangeReportStatsTab } from "./report/RangeReportStatsTab";

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
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
  activeDepartment = "pc",
}) => {
  const isAllMode = feat === "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [statsSortKey, setStatsSortKey] = useState<
    "nombre" | "daysActive" | "totalRescued" | "totalRecovered" | "totalPrehospitalCare" | "totalTransfers" | "totalPets"
  >("daysActive");
  const [statsSortDir, setStatsSortDir] = useState<"desc" | "asc">("asc");

  const dates = useMemo(() => getDatesRange(REPORT_START_DATE), []);
  const { parentsMap } = useMemo(() => buildParentsMap(allFeatures || []), [allFeatures]);

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

  const handleSortToggle = (key: typeof statsSortKey) => {
    if (statsSortKey === key) setStatsSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setStatsSortKey(key);
      setStatsSortDir("desc");
    }
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
          onClose={onClose}
        />

        {/* ── STATISTICS TAB ── */}
        {periodStats && (
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
      </div>
    </div>
  );
};

export { RangeReportModal };
