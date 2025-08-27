// src/components/map/MapControls.jsx
import React from "react";
import "../../styles/map-controls.css";

/* ---- Minimal, crisp SVG icons (stroke = currentColor) ---- */
function IconRotateLeft(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.5 8.5A9 9 0 1 0 7 3.8" />
      </g>
    </svg>
  );
}
function IconCursor(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3l8 18 2-7 7-2z" />
      </g>
    </svg>
  );
}
function IconPoint(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/**
 * Props:
 * - mode: "cursor" | "point"
 * - onToggleMode: () => void
 * - onReset: () => void
 * - className?: string
 */
export default function MapControls({
  mode = "cursor",
  onToggleMode,
  onReset,
  className = "",
}) {
  const isPoint = mode === "point";

  return (
    <div className={`map-controls ${className}`} data-mode={mode}>
      {/* Reset */}
      <button
        type="button"
        className="control-btn orange"
        title="Haritayı Sıfırla"
        onClick={onReset}
        aria-label="Haritayı Sıfırla"
      >
        <IconRotateLeft />
      </button>

      {/* Mod: Cursor <-> Point */}
      <button
        type="button"
        className={`control-btn cyan`}
        title={isPoint ? "Nokta Seçme Aktif" : "Fare (Pan) Modu Aktif"}
        onClick={onToggleMode}
        aria-label="Mod Değiştir"
        aria-pressed={isPoint}
        data-active={isPoint ? "point" : "cursor"}
      >
        {isPoint ? <IconPoint /> : <IconCursor />}
      </button>
    </div>
  );
}
