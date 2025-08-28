// src/components/GeometryList.jsx
import React, { useState } from "react";
import EyeIcon from "./ui/EyeIcon.jsx";
import "../styles/geometry-list.css";

const TYPE_TEXT = (t) =>
  typeof t === "number"
    ? ({ 1: "Point", 2: "Linestring", 3: "Polygon" }[t] ?? String(t))
    : (t || "");

export default function GeometryList({ items = [], loading, onZoom, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = items.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="list-modal">
      {/* header: sol tarafta çarpı */}
      <div className="list-header">
        <div className="list-title">Geometries</div>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {/* search */}
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="geometry-search"
      />

      <div className="list-scroll">
        <table className="geo-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>ID</th>
              <th style={{ width: 180 }}>Name</th>
              <th style={{ width: 120 }}>Type</th>
              <th>WKT</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="muted">Loading…</td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No data</td>
              </tr>
            )}

            {!loading && filtered.map((g) => (
              <tr key={g.id ?? `${g.name}-${Math.random()}`}>
                <td>{g.id ?? "-"}</td>
                <td>{g.name ?? "-"}</td>
                <td>{TYPE_TEXT(g.type)}</td>
                <td className="wkt">{g.wkt}</td>
                <td>
                  <button
                    className="zoom-btn"
                    onClick={() => { onZoom?.(g); onClose?.(); }}  // zoom + kapat
                    title="Zoom to geometry"
                  >
                    <EyeIcon size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
