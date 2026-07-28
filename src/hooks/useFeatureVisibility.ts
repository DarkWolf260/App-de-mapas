import { useLocalStorageState } from "./useLocalStorageState";

export function useFeatureVisibility() {
  const [hiddenFeatures, setHiddenFeatures] = useLocalStorageState<Record<string, boolean>>("pc_hidden_features", {});

  const handleToggleFeatureVisibility = (id: string | number): void => {
    const key = String(id);
    setHiddenFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleFeaturesVisibility = (ids: (string | number)[], visible: boolean): void => {
    setHiddenFeatures((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[String(id)] = !visible; });
      return next;
    });
  };

  return { hiddenFeatures, handleToggleFeatureVisibility, handleToggleFeaturesVisibility };
}
