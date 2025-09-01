// src/components/map/MapControls.jsx
import React from "react";
import "../../styles/map-controls.css";

// import custom icons (normal import)
import MoveShapeIcon from "../../assets/icons/MoveShape.svg";
import MoveVertexIcon from "../../assets/icons/MoveVertex.svg";
import SaveIcon from "../../assets/icons/Save.svg";

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
 * - mode: "cursor" | "point" | "move-shape" | "move-vertex"
 * - onToggleMode: (mode) => void
 * - onReset: () => void
 * - onSave: () => void
 * - canSave: boolean (save aktif/pasif durumu)
 * - className?: string
 */
export default function MapControls({
  mode = "cursor",
  onToggleMode,
  onReset,
  onSave,
  canSave = false,
  className = "",
}) {
  const isPoint = mode === "point";
  const isMoveShape = mode === "move-shape";
  const isMoveVertex = mode === "move-vertex";

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
        className="control-btn cyan"
        title={isPoint ? "Nokta Seçme Aktif" : "Fare (Pan) Modu Aktif"}
        onClick={() => onToggleMode(isPoint ? "cursor" : "point")}
        aria-label="Mod Değiştir"
        data-active={isPoint}
      >
        {isPoint ? <IconPoint /> : <IconCursor />}
      </button>

      {/* Move Shape */}
      <button
        type="button"
        className="control-btn purple"
        title="Şekil Taşı (Move Shape)"
        onClick={() => onToggleMode("move-shape")}
        aria-label="Şekil Taşı"
        data-active={isMoveShape}
      >
        <img src={MoveShapeIcon} alt="Move Shape" width={20} height={20} />
      </button>

      {/* Move Vertex */}
      <button
        type="button"
        className="control-btn yellow"
        title="Vertex Taşı (Move Vertex)"
        onClick={() => onToggleMode("move-vertex")}
        aria-label="Vertex Taşı"
        data-active={isMoveVertex}
      >
        <img src={MoveVertexIcon} alt="Move Vertex" width={20} height={20} />
      </button>

      {/* Save */}
      <button
        type="button"
        className="control-btn green"
        title="Değişiklikleri Kaydet"
        onClick={onSave}
        aria-label="Kaydet"
        disabled={!canSave}
      >
        <img src={SaveIcon} alt="Save" width={20} height={20} />
      </button>
    </div>
  );
}
