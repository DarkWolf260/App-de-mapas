import React from "react";
import type { DrawnFeature, DailyLog } from "../types";
import { GroupLogForm } from "./GroupLogForm";
import { useLogEditor } from "../hooks/useLogEditor";
import { emptyLog } from "../utils/logUtils";

interface InlineRowEditorProps {
  dateStr: string;
  log: DailyLog | undefined;
  feat: DrawnFeature;
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
  onCloseEditor: () => void;
}

export const InlineRowEditor: React.FC<InlineRowEditorProps> = ({
  dateStr,
  log,
  feat,
  onSaveDailyLog,
  onCloseEditor,
}) => {
  const { draft, saving, saved, handleChange, handleSave } = useLogEditor(
    log ?? emptyLog(dateStr),
    async (d) => { if (onSaveDailyLog) await onSaveDailyLog(feat.id, d); },
    1500,
    onCloseEditor,
  );

  return (
    <GroupLogForm
      draft={draft}
      onChange={handleChange}
      onSave={handleSave}
      saving={saving}
      saved={saved}
      compact
    />
  );
};
