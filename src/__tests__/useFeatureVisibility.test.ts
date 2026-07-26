import { renderHook, act } from "@testing-library/react";
import { useFeatureVisibility } from "../hooks/useFeatureVisibility";

describe("useFeatureVisibility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty hidden features", () => {
    const { result } = renderHook(() => useFeatureVisibility());
    expect(result.current.hiddenFeatures).toEqual({});
  });

  it("toggles feature visibility on and off", () => {
    const { result } = renderHook(() => useFeatureVisibility());
    act(() => result.current.handleToggleFeatureVisibility(1));
    expect(result.current.hiddenFeatures[1]).toBe(true);
    act(() => result.current.handleToggleFeatureVisibility(1));
    expect(result.current.hiddenFeatures[1]).toBe(false);
  });

  it("toggles multiple features at once", () => {
    const { result } = renderHook(() => useFeatureVisibility());
    act(() => result.current.handleToggleFeaturesVisibility([1, 2, 3], false));
    expect(result.current.hiddenFeatures[1]).toBe(true);
    expect(result.current.hiddenFeatures[2]).toBe(true);
    expect(result.current.hiddenFeatures[3]).toBe(true);
  });

  it("makes specific features visible", () => {
    const { result } = renderHook(() => useFeatureVisibility());
    act(() => result.current.handleToggleFeaturesVisibility([1, 2, 3], false));
    act(() => result.current.handleToggleFeaturesVisibility([2], true));
    expect(result.current.hiddenFeatures[1]).toBe(true);
    expect(result.current.hiddenFeatures[2]).toBe(false);
    expect(result.current.hiddenFeatures[3]).toBe(true);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFeatureVisibility());
    act(() => result.current.handleToggleFeatureVisibility(5));
    const stored = JSON.parse(localStorage.getItem("pc_hidden_features") || "{}");
    expect(stored[5]).toBe(true);
  });
});
