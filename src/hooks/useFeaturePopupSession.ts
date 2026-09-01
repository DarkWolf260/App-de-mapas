import { useState, useEffect } from "react";
import type { DrawnFeature, DailyLog, Department, DepartmentView } from "../types";
import { FeatureLogBook } from "../utils/featureLogBook";

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

  const [localLog, setLocalLog] = useState<DailyLog>({ date: popupEditDate, ...EMPTY_LOG });

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

    let deptToUse: Department = selectedDept;
    if (activeDepartment === "mixto") {
      const hasPc = activeFeat.dailyLogs?.some(
        (l) => l.date === popupEditDate && (l.department === "pc" || !l.department)
      );
      const hasBomberos = activeFeat.dailyLogs?.some(
        (l) => l.date === popupEditDate && l.department === "bomberos"
      );
      if (!hasPc && hasBomberos && selectedDept === "pc") {
        deptToUse = "bomberos";
        setSelectedDept("bomberos");
      }
    } else {
      deptToUse = activeDepartment === "bomberos" ? "bomberos" : "pc";
    }

    const todayLogs =
      activeFeat.dailyLogs?.filter((l) =>
        l.date === popupEditDate &&
        (activeDepartment === "mixto"
          ? l.department === deptToUse || (!l.department && deptToUse === "pc")
          : l.department === activeDepartment || !l.department)
      ) || [];
    const todayLog = todayLogs[0];
    setLocalLog(
      todayLog ? { ...todayLog, department: deptToUse } : { date: popupEditDate, department: deptToUse, ...EMPTY_LOG }
    );
    setShowSecondGroup(todayLog ? Boolean(todayLog.groups && todayLog.groups.length > 1) : false);
  }, [activeFeat?.id, popupEditDate, activeDepartment, selectedDept]);

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
      const deptToUse: Department =
        activeDepartment === "mixto" ? selectedDept : activeDepartment === "bomberos" ? "bomberos" : "pc";
      const logToSave = { ...localLog, department: deptToUse };
      await onSaveDailyLog(activeFeat.id, logToSave);
      await onRefreshFeatures?.();
      setLogSaveSuccess(true);
      setTimeout(() => setLogSaveSuccess(false), 2000);
    } catch (err) {
      console.error("[useFeaturePopupSession] Error saving daily logs:", err);
    }
  };

  const handleLogFieldChange = (field: string, val: unknown) => {
    if (!canEditLog) return;
    setLocalLog((prev) => ({ ...prev, [field]: val }));
  };

  const handleGroupFieldChange = (groupIdx: number, field: string, value: string | boolean) => {
    if (!canEditLog) return;
    setLocalLog((prev) => {
      const base =
        Array.isArray(prev.groups) && prev.groups.length > 0
          ? [...prev.groups]
          : FeatureLogBook.normalizeGroups(prev as DailyLog).map((g) => ({ ...g }));
      if (base[groupIdx] !== undefined) {
        base[groupIdx] = { ...base[groupIdx], [field]: value };
      }
      return { ...prev, groups: base };
    });
  };

  const handleGeneralFieldChange = (field: string, value: string) => {
    if (!canEditLog) return;
    setLocalLog((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNovedad = async (time: string, text: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      time,
      text,
      type: "novedad" as const,
    };
    const deptToUse: Department =
      activeDepartment === "mixto" ? selectedDept : activeDepartment === "bomberos" ? "bomberos" : "pc";
    const updatedLog = { ...localLog, department: deptToUse, novedades: [...(localLog.novedades || []), entry] };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleDeleteNovedad = async (entryId: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const deptToUse: Department =
      activeDepartment === "mixto" ? selectedDept : activeDepartment === "bomberos" ? "bomberos" : "pc";
    const updatedLog = {
      ...localLog,
      department: deptToUse,
      novedades: (localLog.novedades || []).filter((n) => n.id !== entryId),
    };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleUpdateNovedad = async (entryId: string, newText: string, newTime?: string) => {
    if (!canEditLog || !onSaveDailyLog || !activeFeat) return;
    const deptToUse: Department =
      activeDepartment === "mixto" ? selectedDept : activeDepartment === "bomberos" ? "bomberos" : "pc";
    const updatedNovedades = (localLog.novedades || []).map((n) =>
      n.id === entryId ? { ...n, text: newText, ...(newTime !== undefined ? { time: newTime } : {}) } : n
    );
    const updatedLog = { ...localLog, department: deptToUse, novedades: updatedNovedades };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleToggleArrivalGroup = async (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => {
    if (!canToggleArrival || !onSaveDailyLog || !activeFeat) return;
    const deptToUse: Department =
      activeDepartment === "mixto" ? selectedDept : activeDepartment === "bomberos" ? "bomberos" : "pc";
    const updatedGroups = [...(localLog.groups || [])];
    const targetIdx = groupIndex - 1;
    if (targetIdx < updatedGroups.length) {
      updatedGroups[targetIdx] = { ...updatedGroups[targetIdx], hasArrived };
    }
    const updatedLog = {
      ...localLog,
      department: deptToUse,
      groups: updatedGroups,
    };
    setLocalLog(updatedLog);
    try {
      await onSaveDailyLog(activeFeat.id, updatedLog);
      await onRefreshFeatures?.();
    } catch (err) {
      console.error("[useFeaturePopupSession] Error saving arrival status:", err);
    }
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
    setLocalLog,
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
