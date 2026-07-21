import { renderHook, act } from "@testing-library/react";
import { useFeatureOrder } from "../hooks/useFeatureOrder";
import type { DrawnFeature } from "../types";

const makeFeature = (id: number, title?: string): DrawnFeature => ({
  id,
  title: title ?? `Feature ${id}`,
  type: "point",
  geojsonGeometry: { type: "Point", coordinates: [0, 0] },
});

beforeEach(() => {
  localStorage.clear();
});

describe("useFeatureOrder", () => {
  it("features are sorted according to saved order", () => {
    localStorage.setItem("pc_feature_order", JSON.stringify([3, 1, 2]));
    const features = [makeFeature(1), makeFeature(2), makeFeature(3)];
    const { result } = renderHook(() => useFeatureOrder(features));
    expect(result.current.sortedDrawnFeatures.map((f) => f.id)).toEqual([3, 1, 2]);
  });

  it("new features are added to the beginning of the order", () => {
    const features = [makeFeature(1), makeFeature(2)];
    const { result, rerender } = renderHook(
      ({ feats }) => useFeatureOrder(feats),
      { initialProps: { feats: features } },
    );

    const newFeatures = [...features, makeFeature(3)];
    rerender({ feats: newFeatures });

    const order = result.current.sortedDrawnFeatures.map((f) => f.id);
    expect(order[0]).toBe(3);
    expect(order).toContain(1);
    expect(order).toContain(2);
  });

  it('handleReorderFeature "up" moves feature earlier in order', () => {
    localStorage.setItem("pc_feature_order", JSON.stringify([1, 2, 3]));
    const features = [makeFeature(1), makeFeature(2), makeFeature(3)];
    const { result } = renderHook(() => useFeatureOrder(features));

    act(() => {
      result.current.handleReorderFeature(2, "up");
    });

    expect(result.current.sortedDrawnFeatures.map((f) => f.id)).toEqual([2, 1, 3]);
  });

  it('handleReorderFeature "down" moves feature later in order', () => {
    localStorage.setItem("pc_feature_order", JSON.stringify([1, 2, 3]));
    const features = [makeFeature(1), makeFeature(2), makeFeature(3)];
    const { result } = renderHook(() => useFeatureOrder(features));

    act(() => {
      result.current.handleReorderFeature(1, "down");
    });

    expect(result.current.sortedDrawnFeatures.map((f) => f.id)).toEqual([2, 1, 3]);
  });

  it("handleReorderFeature with non-existent id is a no-op", () => {
    localStorage.setItem("pc_feature_order", JSON.stringify([1, 2, 3]));
    const features = [makeFeature(1), makeFeature(2), makeFeature(3)];
    const { result } = renderHook(() => useFeatureOrder(features));

    act(() => {
      result.current.handleReorderFeature(999, "up");
    });

    expect(result.current.sortedDrawnFeatures.map((f) => f.id)).toEqual([1, 2, 3]);
  });
});
