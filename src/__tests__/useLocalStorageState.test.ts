import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

beforeEach(() => {
  localStorage.clear();
});

describe("useLocalStorageState", () => {
  it("returns default value when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorageState("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns value from localStorage when key exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorageState("test-key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("updates state and persists to localStorage when setter called", () => {
    const { result } = renderHook(() => useLocalStorageState("test-key", "default"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("updated");
  });

  it("supports functional updater pattern", () => {
    const { result } = renderHook(() => useLocalStorageState<number>("counter", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 10);
    });

    expect(result.current[0]).toBe(11);
    expect(JSON.parse(localStorage.getItem("counter")!)).toBe(11);
  });

  it("handles corrupted JSON in localStorage gracefully", () => {
    localStorage.setItem("bad-key", "{not valid json!!!");
    const { result } = renderHook(() => useLocalStorageState("bad-key", [1, 2, 3]));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });
});
