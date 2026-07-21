import { useState, useCallback } from "react";
import type { DailyLog } from "../types";

export function useLogEditor(
  initialLog: DailyLog,
  onSave: (log: DailyLog) => Promise<void>,
  autoCloseMs?: number,
  onClose?: () => void,
) {
  const [draft, setDraft] = useState<DailyLog>(initialLog);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((field: keyof DailyLog, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (autoCloseMs && onClose) {
        setTimeout(onClose, autoCloseMs);
      }
    }, 1500);
  };

  const resetDraft = (log: DailyLog) => setDraft(log);

  return { draft, saving, saved, handleChange, handleSave, resetDraft };
}
