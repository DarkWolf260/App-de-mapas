import React, { useCallback, useRef, useState } from "react";
import { browserStorage } from "../repositories/storageImpl";
import type { IStorage } from "../repositories/interfaces";

const STORAGE_KEY = "pc_toolbar_position";

interface Position { x: number; y: number; }

function loadPosition(storage: IStorage): Position | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch {}
  return null;
}

function savePosition(storage: IStorage, pos: Position) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

export function useDraggable(defaultX: number, defaultY: number, storage: IStorage = browserStorage) {
  const [pos, setPos] = useState<Position>(() => {
    const saved = loadPosition(storage);
    return saved ?? { x: defaultX, y: defaultY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      setIsDragging(true);
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const x = Math.max(16, Math.min(window.innerWidth - 300, e.clientX - offset.current.x));
    const y = Math.max(20, Math.min(window.innerHeight - 80, e.clientY - offset.current.y));
    setPos({ x, y });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setPos((prev) => { savePosition(storage, prev); return prev; });
    },
    [storage],
  );

  const resetPosition = useCallback(() => {
    setPos({ x: defaultX, y: defaultY });
    savePosition(storage, { x: defaultX, y: defaultY });
  }, [defaultX, defaultY, storage]);

  const dragHandleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style: { cursor: dragging ? "grabbing" : "grab" } as React.CSSProperties,
  };

  return { position: pos, dragHandleProps, resetPosition, isDragging };
}
