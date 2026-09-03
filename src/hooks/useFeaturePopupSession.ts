import { useState, useEffect, useMemo, useCallback } from "react";
import type { DrawnFeature, DailyLog, Department, DepartmentView, GroupLogEntry } from "../types";
import { generateUUID } from "../utils/uuidUtils";
import { FeatureLogBook } from "../utils/featureLogBook";
import { mergeLogs, logHasAnyData } from "../utils/logUtils";

const EMPTY_LOG: Omit<DailyLog, "date"> = {
  groups: [],
  observations: "",
  novedades: [],
  rescuedCount: "",
  recoveredCount: "",
  rescuedPetsCount: "",
  prehospitalCareCount: "",
  transfersCount: "",
  customActivities: [],
};

export interface FeaturePopupSessionProps {
  activeFeat: DrawnFeature | null;
  popupEditDate: string;
  activeDepartment?: DepartmentView;
  canEditMap?: boolean;
  canEditLog?: boolean;
  canToggleArrival?: boolean;
  onRenameFeature?: (id: number | string, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number | string, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number | string, newColor: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number | string, isCollapsed: boolean, collapsedCount: string | number) => Promise<void>;
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
}

export function useFeaturePopupSession({
  activeFeat,
  popupEditDate,
  activeDepartment = "pc",
  canEditMap = false,
  canEditLog = false,
  canToggleArrival = false,
  onRenameFeature,
  onUpdateFeatureDescription,
  onUpdateFeatureColor,
  onUpdateFeatureCollapsed,
  onSaveDailyLog,
  onRefreshFeatures,
}: FeaturePopupSessionProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localColor, setLocalColor] = useState("#3b82f6");
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const [localCollapsedCount, setLocalCollapsedCount] = useState("1");
  const [localIsCampement, setLocalIsCampement] = useState(false);
  const [localCampementCount, setLocalCampementCount] = useState("");
  const [localIsHealthCenter, setLocalIsHealthCenter] = useState(false);
  const [localHealthCenterType, setLocalHealthCenterType] = useState("");
  const [localOtherCategoryName, setLocalOtherCategoryName] = useState("");
  const [showSecondGroup, setShowSecondGroup] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
  const [logSaveSuccess, setLogSaveSuccess] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department>(activeDepartment === "bomberos" ? "bomberos" : "pc");

  // Multi-department daily log state
  const [pcLog, setPcLog] = useState<DailyLog>({ date: popupEditDate, department: "pc", ...EMPTY_LOG });
  const [bomberosLog, setBomberosLog] = useState<DailyLog>({ date: popupEditDate, department: "bomberos", ...EMPTY_LOG });

  // Initialize/refresh logs on feature or date change
  useEffect(() => {
    if (!activeFeat) return;
    setLocalTitle(activeFeat.title);
    setLocalDescription(activeFeat.description || "");
    setLocalColor(activeFeat.color || "#3b82f6");
    setLocalIsCollapsed(!!activeFeat.isCollapsed);
    setLocalCollapsedCount(activeFeat.collapsedCount ? String(activeFeat.collapsedCount) : "1");
    setLocalIsCampement(!!activeFeat.isCampement);
    setLocalCampementCount(activeFeat.campementCount ? String(activeFeat.campementCount) : "");
    setLocalIsHealthCenter(!!activeFeat.isHealthCenter);
    setLocalHealthCenterType(activeFeat.healthCenterType || "");
    setLocalOtherCategoryName(activeFeat.otherCategoryName || "");
    setGeneralSaveSuccess(false);
    setLogSaveSuccess(false);

    const existingPc = activeFeat.dailyLogs?.find(
      (l) => l.date === popupEditDate && (l.department === "pc" || !l.department)
    );
    const existingBomberos = activeFeat.dailyLogs?.find(
      (l) => l.date === popupEditDate && l.department === "bomberos"
    );

    setPcLog(
      existingPc
        ? { ...existingPc, department: "pc" }
        : { date: popupEditDate, department: "pc", ...EMPTY_LOG }
    );
    setBomberosLog(
      existingBomberos
        ? { ...existingBomberos, department: "bomberos" }
        : { date: popupEditDate, department: "bomberos", ...EMPTY_LOG }
    );

    if (activeDepartment === "bomberos") {
      setSelectedDept("bomberos");
    } else if (activeDepartment === "pc") {
      setSelectedDept("pc");
    } else if (activeDepartment === "mixto") {
      if (!existingPc && existingBomberos) {
        setSelectedDept("bomberos");
      }
    }
  }, [activeFeat?.id, popupEditDate, activeDepartment]);

  // Current active single department log
  const localLog = useMemo(() => {
    return selectedDept === "bomberos" ? bomberosLog : pcLog;
  }, [selectedDept, bomberosLog, pcLog]);

  // Merged log for display in mixto mode
  const mergedLog = useMemo(() => {
    const hasPcData = logHasAnyData(pcLog);
    const hasBomberosData = logHasAnyData(bomberosLog);

    if (!hasPcData && !hasBomberosData) {
      return { date: popupEditDate, ...EMPTY_LOG, groups: [] };
    }
    if (hasPcData && !hasBomberosData) {
      return { ...pcLog, groups: (pcLog.groups || []).map((g) => ({ ...g, department: "pc" })) };
    }
    if (!hasPcData && hasBomberosData) {
      return { ...bomberosLog, groups: (bomberosLog.groups || []).map((g) => ({ ...g, department: "bomberos" })) };
    }
    return mergeLogs([
      { ...pcLog, department: "pc" },
      { ...bomberosLog, department: "bomberos" },
    ]) || { date: popupEditDate, ...EMPTY_LOG };
  }, [pcLog, bomberosLog, popupEditDate]);

  const handleGeneralSave = async () => {
    if (!canEditMap || !activeFeat) return;
    try {
      activeFeat.isCampement = localIsCampement;
      activeFeat.campementCount = localCampementCount;
      activeFeat.isHealthCenter = localIsHealthCenter;
      activeFeat.healthCenterType = localHealthCenterType;
      activeFeat.otherCategoryName = localOtherCategoryName;

      if (onRenameFeature) await onRenameFeature(activeFeat.id, localTitle);
      if (onUpdateFeatureDescription) await onUpdateFeatureDescription(activeFeat.id, localDescription);
      if (onUpdateFeatureColor) await onUpdateFeatureColor(activeFeat.id, localColor);
      if (onUpdateFeatureCollapsed)
        await onUpdateFeatureCollapsed(activeFeat.id, localIsCollapsed, localCollapsedCount);
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 2000);
    } catch (err) {
      console.error("[useFeaturePopupSession] Error saving general features:", err);
    }
  };

  const handleLogSave = async () => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    try {
      if (activeDepartment === "mixto") {
        const hadPc = activeFeat.dailyLogs?.some(
          (l) => l.date === popupEditDate && (l.department === "pc" || !l.department)
        );
        const hadBomberos = activeFeat.dailyLogs?.some(
          (l) => l.date === popupEditDate && l.department === "bomberos"
        );

        if (logHasAnyData(pcLog) || hadPc) {
          await onSaveDailyLog(activeFeat.id, { ...pcLog, department: "pc" });
        }
        if (logHasAnyData(bomberosLog) || hadBomberos) {
          await onSaveDailyLog(activeFeat.id, { ...bomberosLog, department: "bomberos" });
        }
      } else if (activeDepartment === "bomberos") {
        await onSaveDailyLog(activeFeat.id, { ...bomberosLog, department: "bomberos" });
      } else {
        await onSaveDailyLog(activeFeat.id, { ...pcLog, department: "pc" });
      }

      await onRefreshFeatures?.();
      setLogSaveSuccess(true);
      setTimeout(() => setLogSaveSuccess(false), 2000);
    } catch (err) {
      console.error("[useFeaturePopupSession] Error saving daily logs:", err);
    }
  };

  const handleLogFieldChange = (field: string, val: unknown) => {
    if (!canEditLog) return;
    if (selectedDept === "bomberos") {
      setBomberosLog((prev) => ({ ...prev, [field]: val }));
    } else {
      setPcLog((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handleGroupFieldChange = useCallback((
    groupIdx: number,
    field: string,
    value: string | boolean,
    dept?: "pc" | "bomberos",
    groupId?: string
  ) => {
    if (!canEditLog) return;

    // Helper to update a group list
    const updateGroupInList = (groups: GroupLogEntry[]): { updated: GroupLogEntry[]; found: boolean } => {
      const list = [...groups];
      let targetIdx = -1;

      if (groupId) {
        targetIdx = list.findIndex((g) => g.id === groupId);
      }
      if (targetIdx === -1 && groupIdx >= 0 && groupIdx < list.length) {
        targetIdx = groupIdx;
      }

      if (targetIdx !== -1) {
        list[targetIdx] = { ...list[targetIdx], [field]: value };
        return { updated: list, found: true };
      }
      return { updated: list, found: false };
    };

    if (dept === "bomberos") {
      setBomberosLog((prev) => {
        const base = Array.isArray(prev.groups) && prev.groups.length > 0
          ? prev.groups
          : FeatureLogBook.normalizeGroups(prev);
        const { updated } = updateGroupInList(base);
        return { ...prev, groups: updated };
      });
    } else if (dept === "pc") {
      setPcLog((prev) => {
        const base = Array.isArray(prev.groups) && prev.groups.length > 0
          ? prev.groups
          : FeatureLogBook.normalizeGroups(prev);
        const { updated } = updateGroupInList(base);
        return { ...prev, groups: updated };
      });
    } else {
      // If dept not explicitly passed, check by groupId in pcLog and bomberosLog
      if (groupId) {
        setPcLog((prev) => {
          const base = Array.isArray(prev.groups) ? prev.groups : [];
          if (base.some((g) => g.id === groupId)) {
            const { updated } = updateGroupInList(base);
            return { ...prev, groups: updated };
          }
          return prev;
        });

        setBomberosLog((prev) => {
          const base = Array.isArray(prev.groups) ? prev.groups : [];
          if (base.some((g) => g.id === groupId)) {
            const { updated } = updateGroupInList(base);
            return { ...prev, groups: updated };
          }
          return prev;
        });
      } else {
        // Fallback to selectedDept
        if (selectedDept === "bomberos") {
          setBomberosLog((prev) => {
            const base = Array.isArray(prev.groups) && prev.groups.length > 0
              ? prev.groups
              : FeatureLogBook.normalizeGroups(prev);
            const { updated } = updateGroupInList(base);
            return { ...prev, groups: updated };
          });
        } else {
          setPcLog((prev) => {
            const base = Array.isArray(prev.groups) && prev.groups.length > 0
              ? prev.groups
              : FeatureLogBook.normalizeGroups(prev);
            const { updated } = updateGroupInList(base);
            return { ...prev, groups: updated };
          });
        }
      }
    }
  }, [canEditLog, selectedDept]);

  const handleGeneralFieldChange = (field: string, value: string) => {
    if (!canEditLog) return;
    if (selectedDept === "bomberos") {
      setBomberosLog((prev) => ({ ...prev, [field]: value }));
    } else {
      setPcLog((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddNovedad = async (time: string, text: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const entry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      time,
      text,
      type: "novedad" as const,
    };
    const deptToUse = selectedDept || "pc";
    if (deptToUse === "bomberos") {
      const updatedLog = { ...bomberosLog, department: "bomberos" as const, novedades: [...(bomberosLog.novedades || []), entry] };
      setBomberosLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    } else {
      const updatedLog = { ...pcLog, department: "pc" as const, novedades: [...(pcLog.novedades || []), entry] };
      setPcLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    }
    await onRefreshFeatures?.();
  };

  const handleDeleteNovedad = async (entryId: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const deptToUse = selectedDept || "pc";
    if (deptToUse === "bomberos") {
      const updatedLog = {
        ...bomberosLog,
        department: "bomberos" as const,
        novedades: (bomberosLog.novedades || []).filter((n) => n.id !== entryId),
      };
      setBomberosLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    } else {
      const updatedLog = {
        ...pcLog,
        department: "pc" as const,
        novedades: (pcLog.novedades || []).filter((n) => n.id !== entryId),
      };
      setPcLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    }
    await onRefreshFeatures?.();
  };

  const handleUpdateNovedad = async (entryId: string, newText: string, newTime?: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const deptToUse = selectedDept || "pc";
    if (deptToUse === "bomberos") {
      const updatedNovedades = (bomberosLog.novedades || []).map((n) =>
        n.id === entryId ? { ...n, text: newText, ...(newTime !== undefined ? { time: newTime } : {}) } : n
      );
      const updatedLog = { ...bomberosLog, department: "bomberos" as const, novedades: updatedNovedades };
      setBomberosLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    } else {
      const updatedNovedades = (pcLog.novedades || []).map((n) =>
        n.id === entryId ? { ...n, text: newText, ...(newTime !== undefined ? { time: newTime } : {}) } : n
      );
      const updatedLog = { ...pcLog, department: "pc" as const, novedades: updatedNovedades };
      setPcLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    }
    await onRefreshFeatures?.();
  };

  const handleToggleArrivalGroup = async (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => {
    if (!canToggleArrival || !onSaveDailyLog || !activeFeat) return;
    const deptToUse = selectedDept || "pc";
    const targetIdx = groupIndex - 1;

    if (deptToUse === "bomberos") {
      const updatedGroups = [...(bomberosLog.groups || [])];
      if (targetIdx < updatedGroups.length) {
        updatedGroups[targetIdx] = { ...updatedGroups[targetIdx], hasArrived };
      }
      const updatedLog = { ...bomberosLog, department: "bomberos" as const, groups: updatedGroups };
      setBomberosLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    } else {
      const updatedGroups = [...(pcLog.groups || [])];
      if (targetIdx < updatedGroups.length) {
        updatedGroups[targetIdx] = { ...updatedGroups[targetIdx], hasArrived };
      }
      const updatedLog = { ...pcLog, department: "pc" as const, groups: updatedGroups };
      setPcLog(updatedLog);
      await onSaveDailyLog(activeFeat.id, updatedLog);
    }
    await onRefreshFeatures?.();
  };

  return {
    localTitle,
    setLocalTitle,
    localDescription,
    setLocalDescription,
    localColor,
    setLocalColor,
    localIsCollapsed,
    setLocalIsCollapsed,
    localCollapsedCount,
    setLocalCollapsedCount,
    localIsCampement,
    setLocalIsCampement,
    localCampementCount,
    setLocalCampementCount,
    localIsHealthCenter,
    setLocalIsHealthCenter,
    localHealthCenterType,
    setLocalHealthCenterType,
    localOtherCategoryName,
    setLocalOtherCategoryName,
    showSecondGroup,
    setShowSecondGroup,
    generalSaveSuccess,
    logSaveSuccess,
    selectedDept,
    setSelectedDept,
    localLog,
    pcLog,
    bomberosLog,
    mergedLog,
    handleGeneralSave,
    handleLogSave,
    handleLogFieldChange,
    handleGroupFieldChange,
    handleGeneralFieldChange,
    handleAddNovedad,
    handleDeleteNovedad,
    handleUpdateNovedad,
    handleToggleArrivalGroup,
  };
}
