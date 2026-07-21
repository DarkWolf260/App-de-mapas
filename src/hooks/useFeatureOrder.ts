import { useState, useEffect, useMemo } from "react";
import type { DrawnFeature } from "../types";

export function useFeatureOrder(drawnFeatures: DrawnFeature[]) {
  const [featureOrder, setFeatureOrder] = useState<number[]>(() => {
    const saved = localStorage.getItem("pc_feature_order");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

  useEffect(() => {
    if (drawnFeatures.length > 0) {
      setFeatureOrder((prev) => {
        const next = [...prev];
        let changed = false;
        drawnFeatures.forEach((f) => {
          if (!next.includes(f.id)) {
            next.unshift(f.id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("pc_feature_order", JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, [drawnFeatures]);

  const sortedDrawnFeatures = useMemo(() => {
    return [...drawnFeatures].sort((a, b) => {
      const indexA = featureOrder.indexOf(a.id);
      const indexB = featureOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [drawnFeatures, featureOrder]);

  const handleReorderFeature = (id: number, direction: "up" | "down"): void => {
    setFeatureOrder((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const next = [...prev];
      if (direction === "up" && index > 0) {
        const temp = next[index];
        next[index] = next[index - 1];
        next[index - 1] = temp;
      } else if (direction === "down" && index < next.length - 1) {
        const temp = next[index];
        next[index] = next[index + 1];
        next[index + 1] = temp;
      }
      localStorage.setItem("pc_feature_order", JSON.stringify(next));
      return next;
    });
  };

  return { sortedDrawnFeatures, handleReorderFeature };
}
