import { describe, it, expect, vi } from "vitest";
import type {
  IFeatureRepository,
  ILogRepository,
  INovedadRepository,
  IStorage,
  IRealtimeProvider,
  IMigrationRepository,
} from "../repositories/interfaces";
import type { DrawnFeature, DailyLog, NovedadEntry } from "../types";

const mockFeature: DrawnFeature = {
  id: 1,
  title: "Test Point",
  type: "point",
  color: "#3b82f6",
  geojsonGeometry: { type: "Point", coordinates: [-66.9, 10.6] },
};

const mockLog: DailyLog = {
  date: "2026-07-15",
  department: "pc",
  groups: [{ id: "g1", groupName: "Alpha", officersCount: "5" }],
  observations: "",
};

const mockNovedad: NovedadEntry = {
  id: "n1",
  timestamp: "2026-07-15T10:00:00Z",
  time: "10:00",
  text: "Novedad de prueba",
  type: "novedad",
};

describe("IFeatureRepository", () => {
  it("can be implemented with a mock", async () => {
    const repo: IFeatureRepository = {
      fetchAll: vi.fn().mockResolvedValue([mockFeature]),
      upsert: vi.fn().mockResolvedValue(undefined),
      updateTitle: vi.fn().mockResolvedValue(undefined),
      updateDescription: vi.fn().mockResolvedValue(undefined),
      updateColor: vi.fn().mockResolvedValue(undefined),
      updateLock: vi.fn().mockResolvedValue(undefined),
      updateCollapsed: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const features = await repo.fetchAll();
    expect(features).toEqual([mockFeature]);

    await repo.upsert(mockFeature);
    expect(repo.upsert).toHaveBeenCalledWith(mockFeature);

    await repo.updateTitle(1, "Nuevo");
    expect(repo.updateTitle).toHaveBeenCalledWith(1, "Nuevo");

    await repo.delete(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});

describe("ILogRepository", () => {
  it("can be implemented with a mock", async () => {
    const map = new Map<string, DailyLog[]>();
    map.set("1", [mockLog]);

    const repo: ILogRepository = {
      fetchAll: vi.fn().mockResolvedValue(map),
      save: vi.fn().mockResolvedValue(undefined),
    };

    const logs = await repo.fetchAll();
    expect(logs.get("1")).toEqual([mockLog]);

    await repo.save(1, mockLog);
    expect(repo.save).toHaveBeenCalledWith(1, mockLog);
  });
});

describe("INovedadRepository", () => {
  it("can be implemented with a mock", async () => {
    const repo: INovedadRepository = {
      fetch: vi.fn().mockResolvedValue([mockNovedad]),
      insert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };

    const novedades = await repo.fetch("2026-07-15", "pc");
    expect(novedades).toEqual([mockNovedad]);

    await repo.insert(mockNovedad, "2026-07-15", "pc");
    expect(repo.insert).toHaveBeenCalled();

    await repo.delete("n1");
    expect(repo.delete).toHaveBeenCalledWith("n1");

    await repo.update("n1", { text: "editado" });
    expect(repo.update).toHaveBeenCalledWith("n1", { text: "editado" });
  });
});

describe("IStorage", () => {
  it("can be implemented with a mock", () => {
    const store: Record<string, string> = {};
    const storage: IStorage = {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
    };

    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");

    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });
});

describe("IRealtimeProvider", () => {
  it("can be implemented with a mock", () => {
    let cb: ((payload?: any) => void) | null = null;
    let authCb: ((event: string) => void) | null = null;

    const realtime: IRealtimeProvider = {
      subscribeToChanges(callback) {
        cb = callback;
        return () => { cb = null; };
      },
      subscribeToAuthChanges(callback) {
        authCb = callback;
        return () => { authCb = null; };
      },
    };

    let receivedPayload: any = null;
    const unsub1 = realtime.subscribeToChanges((payload) => {
      receivedPayload = payload;
    });
    expect(typeof unsub1).toBe("function");
    if (cb) (cb as any)({ table: "novedades", eventType: "INSERT", new: { id: "n1" }, old: {} });
    expect(receivedPayload).toEqual({ table: "novedades", eventType: "INSERT", new: { id: "n1" }, old: {} });
    unsub1();

    const unsub2 = realtime.subscribeToAuthChanges(() => {});
    expect(typeof unsub2).toBe("function");
    unsub2();
  });
});

describe("IMigrationRepository", () => {
  it("can be implemented with a mock", async () => {
    const repo: IMigrationRepository = {
      run: vi.fn().mockResolvedValue(undefined),
    };

    await repo.run(async () => {});
    expect(repo.run).toHaveBeenCalled();
  });
});
