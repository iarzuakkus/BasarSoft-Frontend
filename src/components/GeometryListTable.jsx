// src/components/GeometryListTable.jsx
import React from "react";
import EyeIcon from "./ui/EyeIcon.jsx";

const TYPE_TEXT = (t) =>
  typeof t === "number"
    ? ({ 1: "Point", 2: "Linestring", 3: "Polygon" }[t] ?? String(t))
    : (t || "");

export default function GeometryListTable({ items, loading, onZoom, onClose }) {
  // Eğer loading aktif ve daha önce data varsa → data'yı göster, üstte "Loading…" overlay olacak
  if (loading && items.length > 0) {
    return (
      <tbody className="loading-overlay">
        {items.map((g) => (
          <tr key={g.id ?? `${g.name}-${Math.random()}`}>
            <td>{g.id ?? "-"}</td>
            <td>{g.name ?? "-"}</td>
            <td>{TYPE_TEXT(g.type)}</td>
            <td className="wkt">{g.wkt}</td>
            <td>
              <button
                className="zoom-btn"
                onClick={() => { onZoom?.(g); onClose?.(); }}
                title="Zoom to geometry"
              >
                <EyeIcon size={18} />
              </button>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={5} className="muted">Loading…</td>
        </tr>
      </tbody>
    );
  }

  // İlk yükleme veya hiç data yokken loading
  if (loading && items.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={5} className="muted">Loading…</td>
        </tr>
      </tbody>
    );
  }

  // Data yok
  if (!loading && items.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={5} className="muted">No data</td>
        </tr>
      </tbody>
    );
  }

  // Normal data gösterimi
  return (
    <tbody>
      {items.map((g) => (
        <tr key={g.id ?? `${g.name}-${Math.random()}`}>
          <td>{g.id ?? "-"}</td>
          <td>{g.name ?? "-"}</td>
          <td>{TYPE_TEXT(g.type)}</td>
          <td className="wkt">{g.wkt}</td>
          <td>
            <button
              className="zoom-btn"
              onClick={() => { onZoom?.(g); onClose?.(); }}
              title="Zoom to geometry"
            >
              <EyeIcon size={18} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
