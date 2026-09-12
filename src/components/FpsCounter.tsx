import React, { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";

interface FpsCounterProps {
  compact?: boolean;
}

export const FpsCounter: React.FC<FpsCounterProps> = ({ compact = false }) => {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const reqAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (now: number) => {
      frameCountRef.current++;
      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      reqAnimRef.current = requestAnimationFrame(loop);
    };
    reqAnimRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, []);

  const color = fps >= 50 ? "#22c55e" : fps >= 30 ? "#eab308" : "#ef4444";
  const bgGlow = fps >= 50 ? "rgba(34, 197, 94, 0.15)" : fps >= 30 ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)";

  return (
    <div
      title={`Rendimiento en tiempo real: ${fps} FPS`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "4px" : "6px",
        height: "34px",
        padding: compact ? "0 8px" : "0 10px",
        borderRadius: "10px",
        background: "rgba(10, 15, 28, 0.92)",
        border: `1px solid ${color}66`,
        boxShadow: `0 4px 14px rgba(0, 0, 0, 0.4), inset 0 0 10px ${bgGlow}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui)",
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <Activity size={13} style={{ color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: compact ? "0.7rem" : "0.75rem",
          fontWeight: 800,
          color,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fps}
      </span>
      <span
        style={{
          fontSize: "0.62rem",
          color: "rgba(255, 255, 255, 0.6)",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        FPS
      </span>
    </div>
  );
};
