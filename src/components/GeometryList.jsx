import React from "react";

const TYPE_TEXT = (t) =>
  typeof t === "number"
    ? ({ 1: "Point", 2: "Linestring", 3: "Polygon" }[t] ?? String(t))
    : (t || "");

export default function GeometryList({ items = [], loading }) {
  return (
    <div className="list-modal">
      <div className="list-title">Geometries</div>

      <div className="list-scroll">
        <table className="geo-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>ID</th>
              <th style={{ width: 180 }}>Name</th>
              <th style={{ width: 120 }}>Type</th>
              <th>WKT</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="muted">Loading…</td>
              </tr>
            )}

            {!loading && items?.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">No data</td>
              </tr>
            )}

            {!loading &&
              items?.map((g) => (
                <tr key={g.id ?? `${g.name}-${Math.random()}`}>
                  <td>{g.id ?? "-"}</td>
                  <td>{g.name ?? "-"}</td>
                  <td>{TYPE_TEXT(g.type)}</td>
                  <td className="wkt">{g.wkt}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
