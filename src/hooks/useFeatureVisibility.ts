import { useLocalStorageState } from "./useLocalStorageState";

export function useFeatureVisibility() {
  const [hiddenFeatures, setHiddenFeatures] = useLocalStorageState<Record<number, boolean>>("pc_hidden_features", {});

  const handleToggleFeatureVisibility = (id: number): void => {
    setHiddenFeatures((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleFeaturesVisibility = (ids: number[], visible: boolean): void => {
    setHiddenFeatures((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[id] = !visible; });
      return next;
    });
  };

  return { hiddenFeatures, handleToggleFeatureVisibility, handleToggleFeaturesVisibility };
}
