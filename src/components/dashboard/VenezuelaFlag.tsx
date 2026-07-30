import React from "react";

export const VenezuelaFlag: React.FC<{ width?: number; height?: number }> = ({
  width = 46,
  height = 31,
}) => {
  // 8 Stars in a tighter, pronounced semi-circular arch inside the blue band
  const stars = [
    { x: 29.4, y: 40.5 },
    { x: 34.2, y: 34.5 },
    { x: 40.5, y: 30.5 },
    { x: 46.8, y: 28.2 },
    { x: 53.2, y: 28.2 },
    { x: 59.5, y: 30.5 },
    { x: 65.8, y: 34.5 },
    { x: 70.6, y: 40.5 },
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 66"
      style={{
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.25)",
        flexShrink: 0,
      }}
    >
      {/* Yellow Band */}
      <rect x="0" y="0" width="100" height="22" fill="#ffcc00" />
      {/* Blue Band */}
      <rect x="0" y="22" width="100" height="22" fill="#00247d" />
      {/* Red Band */}
      <rect x="0" y="44" width="100" height="22" fill="#cf142b" />

      {/* 8 Stars in a Tighter Semi-Circular Arch */}
      {stars.map((pos, idx) => (
        <polygon
          key={idx}
          fill="#ffffff"
          points="0,-2.5 0.7,-0.8 2.5,-0.8 1,-0.3 1.6,1.4 0,0.4 -1.6,1.4 -1,-0.3 -2.5,-0.8 -0.7,-0.8"
          transform={`translate(${pos.x}, ${pos.y})`}
        />
      ))}
    </svg>
  );
};
