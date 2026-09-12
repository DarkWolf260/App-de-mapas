import React, { useRef, useCallback } from "react";

export interface MapSwipeControlProps {
  position: number; // 0 to 100
  onPositionChange: (pos: number) => void;
  onClose: () => void;
  orientation?: "horizontal" | "vertical";
  beforeLabel?: string;
  afterLabel?: string;
}

export const MapSwipeControl: React.FC<MapSwipeControlProps> = ({
  position,
  onPositionChange,
  onClose,
  orientation = "horizontal",
  beforeLabel = "Antes (Esri Satelital)",
  afterLabel = "Después (Google Satelital HD)",
}) => {
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVertical = orientation === "vertical";

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      if (isVertical) {
        const y = e.clientY - rect.top;
        const clampedPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
        onPositionChange(Math.round(clampedPercent * 10) / 10);
      } else {
        const x = e.clientX - rect.left;
        const clampedPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        onPositionChange(Math.round(clampedPercent * 10) / 10);
      }
    },
    [isVertical, onPositionChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 25,
        overflow: "hidden",
      }}
    >
      {/* Línea Divisoria Deslizable con Estilos Originales del App */}
      <div
        style={
          isVertical
            ? {
                position: "absolute",
                left: 0,
                right: 0,
                top: `${position}%`,
                height: "3px",
                transform: "translateY(-50%)",
                background: "rgba(10, 15, 28, 0.95)",
                boxShadow: "0 0 8px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.15)",
                pointerEvents: "auto",
                cursor: "ns-resize",
                zIndex: 28,
              }
            : {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${position}%`,
                width: "3px",
                transform: "translateX(-50%)",
                background: "rgba(10, 15, 28, 0.95)",
                boxShadow: "0 0 8px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.15)",
                pointerEvents: "auto",
                cursor: "ew-resize",
                zIndex: 28,
              }
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Manija Central Arrastrable estilo Interfaz del App */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isVertical ? "44px" : "36px",
            height: isVertical ? "36px" : "44px",
            borderRadius: "8px",
            background: "rgba(10, 15, 28, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5px",
            cursor: isVertical ? "ns-resize" : "ew-resize",
            userSelect: "none",
            touchAction: "none",
            transition: "border-color 0.15s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.6)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.7), 0 0 10px rgba(56, 189, 248, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)";
          }}
        >
          {isVertical ? (
            <>
              <span style={{ width: "18px", height: "2px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
              <span style={{ width: "18px", height: "2px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
              <span style={{ width: "18px", height: "2px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
            </>
          ) : (
            <>
              <span style={{ width: "2px", height: "18px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
              <span style={{ width: "2px", height: "18px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
              <span style={{ width: "2px", height: "18px", background: "rgba(255, 255, 255, 0.65)", borderRadius: "1px", display: "inline-block" }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapSwipeControl;
