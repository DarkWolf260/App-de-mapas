import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getQueueItems,
  getPendingQueueItems,
  getPendingCount,
  enqueueSyncItem,
  markItemStatus,
  removeQueueItem,
  clearCompletedItems,
  clearAllQueue,
  subscribeToQueue,
} from "../services/syncQueueService";

describe("syncQueueService", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllQueue();
  });

  it("starts with an empty queue", () => {
    expect(getQueueItems()).toEqual([]);
    expect(getPendingCount()).toBe(0);
  });

  it("enqueues a new item with pending status and generates ID/timestamp", () => {
    const item = enqueueSyncItem({
      entityType: "feature",
      entityId: "123",
      action: "upsert",
      title: "Puesto Alpha",
      payload: { id: "123", title: "Puesto Alpha" },
    });

    expect(item.id).toBeDefined();
    expect(item.status).toBe("pending");
    expect(item.retryCount).toBe(0);
    expect(getPendingCount()).toBe(1);

    const items = getQueueItems();
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Puesto Alpha");
  });

  it("updates existing pending item when enqueuing same entity and action", () => {
    enqueueSyncItem({
      entityType: "feature",
      entityId: "123",
      action: "upsert",
      title: "Puesto Alpha 1",
      payload: { title: "Puesto Alpha 1" },
    });

    enqueueSyncItem({
      entityType: "feature",
      entityId: "123",
      action: "upsert",
      title: "Puesto Alpha 2",
      payload: { title: "Puesto Alpha 2" },
    });

    const items = getQueueItems();
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Puesto Alpha 2");
  });

  it("marks item status and updates error message & retryCount on failure", () => {
    const item = enqueueSyncItem({
      entityType: "log",
      entityId: "log_1",
      action: "upsert",
      title: "Bitácora 2026-09-14",
      payload: {},
    });

    markItemStatus(item.id, "failed", "Network Timeout");
    let updated = getQueueItems()[0];
    expect(updated.status).toBe("failed");
    expect(updated.errorMessage).toBe("Network Timeout");
    expect(updated.retryCount).toBe(1);

    markItemStatus(item.id, "synced");
    updated = getQueueItems()[0];
    expect(updated.status).toBe("synced");
    expect(getPendingCount()).toBe(0);
  });

  it("removes single queue item by id", () => {
    const item1 = enqueueSyncItem({
      entityType: "novedad",
      entityId: "nov_1",
      action: "upsert",
      title: "Novedad 1",
      payload: {},
    });
    const item2 = enqueueSyncItem({
      entityType: "novedad",
      entityId: "nov_2",
      action: "upsert",
      title: "Novedad 2",
      payload: {},
    });

    expect(getQueueItems().length).toBe(2);
    removeQueueItem(item1.id);
    expect(getQueueItems().length).toBe(1);
    expect(getQueueItems()[0].id).toBe(item2.id);
  });

  it("clears only completed synced items from queue", () => {
    const item1 = enqueueSyncItem({
      entityType: "feature",
      entityId: "f1",
      action: "upsert",
      title: "F1",
      payload: {},
    });
    const item2 = enqueueSyncItem({
      entityType: "feature",
      entityId: "f2",
      action: "upsert",
      title: "F2",
      payload: {},
    });

    markItemStatus(item1.id, "synced");
    expect(getQueueItems().length).toBe(2);

    clearCompletedItems();
    const remaining = getQueueItems();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(item2.id);
  });

  it("notifies subscribers when queue changes", () => {
    const listener = vi.fn();
    const unsub = subscribeToQueue(listener);

    expect(listener).toHaveBeenCalledWith([]);

    enqueueSyncItem({
      entityType: "daily_activity",
      entityId: "2026-09-14",
      action: "upsert",
      title: "Actividad",
      payload: {},
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].length).toBe(1);

    unsub();
  });

  it("replaces already synced item when enqueuing a new action for the same entity to avoid duplicates", () => {
    const item1 = enqueueSyncItem({
      entityType: "feature",
      entityId: "feat_100",
      action: "upsert",
      title: "Sector D",
      payload: { id: "feat_100", title: "Sector D" },
    });
    markItemStatus(item1.id, "synced");

    expect(getQueueItems().length).toBe(1);
    expect(getQueueItems()[0].status).toBe("synced");

    // Later, locking or updating the feature
    enqueueSyncItem({
      entityType: "feature",
      entityId: "feat_100",
      action: "update",
      title: "Bloquear: Sector D",
      payload: { id: "feat_100", payload: { locked: true } },
    });

    const items = getQueueItems();
    // Must NOT have 2 items for feat_100
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Bloquear: Sector D");
    expect(items[0].status).toBe("pending");
  });

  it("cancels out pending upsert when followed by delete before syncing", () => {
    enqueueSyncItem({
      entityType: "feature",
      entityId: "temp_offline_feat",
      action: "upsert",
      title: "Temporal",
      payload: { id: "temp_offline_feat" },
    });

    expect(getPendingCount()).toBe(1);

    // Delete while still pending
    enqueueSyncItem({
      entityType: "feature",
      entityId: "temp_offline_feat",
      action: "delete",
      title: "Eliminar: Temporal",
      payload: { id: "temp_offline_feat" },
    });

    // Should be canceled/removed
    expect(getQueueItems().length).toBe(0);
    expect(getPendingCount()).toBe(0);
  });

  it("preserves upsert action and merges payload when pending upsert is followed by update", () => {
    enqueueSyncItem({
      entityType: "feature",
      entityId: "offline_feat",
      action: "upsert",
      title: "Elemento polygon",
      payload: { id: "offline_feat", title: "Elemento polygon", color: "#3b82f6" },
    });

    // Color updated while still pending
    enqueueSyncItem({
      entityType: "feature",
      entityId: "offline_feat",
      action: "update",
      title: "Color: Elemento polygon",
      payload: { id: "offline_feat", payload: { color: "#ff0000" } },
    });

    const items = getQueueItems();
    expect(items.length).toBe(1);
    expect(items[0].action).toBe("upsert"); // Action stays upsert so it creates row in Supabase
    expect(items[0].payload.color).toBe("#ff0000");
  });

  it("getQueueItems cleans up pre-existing duplicated items in localStorage", () => {
    const rawDuplicates = [
      {
        id: "1",
        entityType: "feature",
        entityId: "dup_1",
        action: "upsert",
        title: "Elemento polygon",
        createdAt: "2026-09-23T01:33:35.000Z",
        status: "synced",
        retryCount: 0,
      },
      {
        id: "2",
        entityType: "feature",
        entityId: "dup_1",
        action: "update",
        title: "Bloquear elemento",
        createdAt: "2026-09-23T01:33:49.000Z",
        status: "synced",
        retryCount: 0,
      },
    ];

    localStorage.setItem("pc_offline_sync_queue_v1", JSON.stringify(rawDuplicates));

    const cleaned = getQueueItems();
    expect(cleaned.length).toBe(1);
    expect(cleaned[0].entityId).toBe("dup_1");
    // Keeps newest
    expect(cleaned[0].title).toBe("Bloquear elemento");
  });
});
