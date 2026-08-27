import { renderHook, act } from "@testing-library/react";
import { useLogEditor } from "../hooks/useLogEditor";
import type { DailyLog } from "../types";

const baseLog: DailyLog = {
  date: "2026-07-21",
  groups: [
    { id: "g1", groupName: "Alpha", managerName: "Juan", managerPhone: "555-1234", unitOut: "Unit 1" }
  ],
  observations: "Nota inicial",
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useLogEditor", () => {
  it("returns initial log as draft", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));
    expect(result.current.draft).toEqual(baseLog);
  });

  it("handleChange updates the specific field", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));

    act(() => {
      result.current.handleChange("observations", "Novedad test");
    });

    expect(result.current.draft.observations).toBe("Novedad test");
    expect(result.current.draft.date).toBe("2026-07-21");
  });

  it("handleChange sets saved to false", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));

    act(() => {
      result.current.handleChange("observations", "test");
    });

    expect(result.current.saved).toBe(false);
  });

  it("handleSave calls onSave with current draft", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));

    act(() => {
      result.current.handleChange("observations", "Novedad test");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ observations: "Novedad test" }),
    );
  });

  it("handleSave calls onSave with draft and sets saved=true after", async () => {
    let resolveSave!: () => void;
    const onSave = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveSave = r; }),
    );
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));

    await act(async () => {
      const promise = result.current.handleSave();
      resolveSave();
      await promise;
    });

    expect(onSave).toHaveBeenCalledWith(baseLog);
    expect(result.current.saving).toBe(false);
    expect(result.current.saved).toBe(true);
  });

  it("resetDraft replaces the draft with new log", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogEditor(baseLog, onSave));

    const newLog: DailyLog = {
      ...baseLog,
      observations: "Charlie nova",
    };

    act(() => {
      result.current.resetDraft(newLog);
    });

    expect(result.current.draft).toEqual(newLog);
  });
});
