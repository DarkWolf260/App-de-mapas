import { useState, useCallback } from "react";
import type { GroupLogEntry } from "../../types";
import { COMMISSION_INDEPENDENT, COMMISSION_PREFIX } from "./metricFields";

interface UseGroupingOptions {
  polygonGroups: GroupLogEntry[];
  onGroupFieldChange?: (idx: number, field: string, value: string) => void;
  onSaveStats?: () => void;
}

export function useGrouping({ polygonGroups, onGroupFieldChange, onSaveStats }: UseGroupingOptions) {
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const getNextCommissionId = useCallback(() => {
    const usedNums = polygonGroups
      .map((g) => g.commissionId)
      .filter((c): c is string => !!c && c.startsWith(COMMISSION_PREFIX))
      .map((c) => parseInt(c.replace(COMMISSION_PREFIX, ""), 10))
      .filter((n) => !isNaN(n));
    let n = 1;
    while (usedNums.includes(n)) n++;
    return `${COMMISSION_PREFIX}${n}`;
  }, [polygonGroups]);

  const handleGroupSelected = useCallback(() => {
    if (selectedIndices.size < 2 || !onGroupFieldChange) return;
    const newCommId = getNextCommissionId();
    for (const idx of selectedIndices) {
      onGroupFieldChange(idx, "commissionId", newCommId);
    }
    setSelectedIndices(new Set());
    setTimeout(() => onSaveStats?.(), 80);
  }, [selectedIndices, getNextCommissionId, onGroupFieldChange, onSaveStats]);

  const handleUngroup = useCallback((commissionId: string) => {
    if (!onGroupFieldChange) return;
    polygonGroups.forEach((g, idx) => {
      if ((g.commissionId || COMMISSION_INDEPENDENT) === commissionId) {
        onGroupFieldChange(idx, "commissionId", COMMISSION_INDEPENDENT);
      }
    });
    setTimeout(() => onSaveStats?.(), 80);
  }, [polygonGroups, onGroupFieldChange, onSaveStats]);

  const toggleSelect = useCallback((idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const exitGroupingMode = useCallback(() => {
    setGroupingMode(false);
    setSelectedIndices(new Set());
  }, []);

  return {
    groupingMode,
    setGroupingMode,
    selectedIndices,
    handleGroupSelected,
    handleUngroup,
    toggleSelect,
    exitGroupingMode,
  };
}
