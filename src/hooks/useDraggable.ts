import React, { useCallback, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "pc_toolbar_position";

interface Position {
  x: number;
  y: number;
}

function loadPosition(): Position | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch {}
  return null;
}

function savePosition(pos: Position) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}

export function useDraggable(defaultX: number, defaultY: number) {
  const [pos, setPos] = useState<Position>(() => {
    const saved = loadPosition();
    return saved ?? { x: defaultX, y: defaultY };
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const x = e.clientX - offset.current.x;
    const y = e.clientY - offset.current.y;
    setPos({ x, y });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setPos((prev) => {
        savePosition(prev);
        return prev;
      });
    },
    [],
  );

  const resetPosition = useCallback(() => {
    setPos({ x: defaultX, y: defaultY });
    savePosition({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY]);

  const dragHandleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style: { cursor: dragging.current ? "grabbing" : "grab" } as React.CSSProperties,
  };

  return { position: pos, dragHandleProps, resetPosition };
}
