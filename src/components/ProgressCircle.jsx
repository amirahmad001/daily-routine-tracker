import React from "react";

/**
 * ProgressCircle
 * - Blue circular border
 * - Inside fill grows from TOP → BOTTOM
 * - Fill snaps every 10%
 * - Percentage text shown in center
 *
 * Props:
 *  value: number (0–100)
 *  size: number (px) default 64
 *  stroke: number (px) default 3
 */
export default function ProgressCircle({
  value = 0,
  size = 64,
  stroke = 3,
}) {
  // Clamp value between 0 and 100
  const safeValue = Math.max(0, Math.min(100, value));

  // Snap to lower 10%
  const snapped = Math.floor(safeValue / 10) * 10;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${stroke}px solid #2563eb`, // blue-600
        position: "relative",
        overflow: "hidden",
        background: "#0f172a", // dark background inside
      }}
    >
      {/* Fill */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${snapped}%`,
          background: "#3b82f6", // blue-500
          transition: "height 0.25s ease",
        }}
      />

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.28,
          fontWeight: 600,
          color: "#ffffff",
          zIndex: 1,
          userSelect: "none",
        }}
      >
        {snapped}%
      </div>
    </div>
  );
}
