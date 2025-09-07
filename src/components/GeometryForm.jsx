// src/components/GeometryForm.jsx
import React, { useEffect, useMemo, useState } from "react";

// WKT temizleme ve düzeltme
const normalizeForPost = (raw, type) => {
  if (!raw) return "";
  let s = String(raw).trim();

  // 12,34 → 12.34 (ondalık ayracı düzelt)
  s = s.replace(/(\d),(?=\d)/g, (_m, d) => `${d}.`);

  // Parantezleri dengele
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  if (close < open) s += ")".repeat(open - close);

  // POLYGON: dış ring kapalı mı kontrol et
  if (/^\s*POLYGON/i.test(s)) {
    s = s.replace(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i, (_m, ring) => {
      const pts = ring.split(",").map((t) => t.trim()).filter(Boolean);
      if (pts.length >= 3 && pts[0] !== pts[pts.length - 1]) pts.push(pts[0]);
      return `POLYGON((${pts.join(", ")}))`;
    });
  }

  return s;
};

export default function GeometryForm({
  type,
  initialWkt = "", // artık string veya {wkt, status} gelebilir
  onSubmit,
  saving,
  allowedKinds = ["A", "B", "C"], // 🔹 MapCanvas’tan geliyor
}) {
  const [name, setName] = useState("");
  const [wkt, setWkt] = useState(
    typeof initialWkt === "object" ? initialWkt.wkt || "" : initialWkt
  );
  const [kind, setKind] = useState(
    typeof initialWkt === "object" ? initialWkt.status || "" : ""
  );

  // 🔹 initialWkt değişince güncelle
  useEffect(() => {
    if (typeof initialWkt === "object") {
      setWkt(initialWkt.wkt || "");
      setKind(initialWkt.status || "");
    } else {
      setWkt(initialWkt || "");
      setKind("");
    }
  }, [initialWkt]);

  // 🔹 allowedKinds değişince geçersiz kind seçimini temizle
  useEffect(() => {
    if (kind && !allowedKinds.includes(kind)) {
      setKind("");
    }
  }, [allowedKinds, kind]);

  const label = useMemo(() => {
    switch (type) {
      case "POINT": return "Point";
      case "LINESTRING": return "LineString";
      case "POLYGON": return "Polygon";
      default: return "Geometry";
    }
  }, [type]);

  const placeholder = useMemo(() => {
    switch (type) {
      case "POINT": return "POINT (30 10)";
      case "LINESTRING": return "LINESTRING (30 10, 10 30, 40 40)";
      case "POLYGON": return "POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))";
      default: return "WKT";
    }
  }, [type]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !wkt.trim() || !kind) return;

    const clean = normalizeForPost(wkt, type);
    await onSubmit({ name: name.trim(), type, kind, wkt: clean });
  };

  return (
    <div className="geometry-form">
      <h3>Add Geometry</h3>
      <form onSubmit={submit}>
        {/* Name */}
        <div className="row">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., School Yard"
          />
        </div>

        {/* WKT */}
        <div className="row">
          <label>{label}</label>
          <input
            className="mono"
            value={wkt}
            onChange={(e) => setWkt(e.target.value)}
            placeholder={placeholder}
          />
        </div>

        {/* Kind seçimi */}
        <div className="row kind-buttons">
          <label>Kind</label>
          <div className="kind-options">
            {["A", "B", "C"].map((k) => {
              const colorClass =
                k === "A" ? "orange" : k === "B" ? "blue" : "purple";
              const isAllowed = allowedKinds.includes(k);

              return (
                <button
                  key={k}
                  type="button"
                  className={`kind-btn ${colorClass} ${
                    kind === k && isAllowed ? "active" : ""
                  }`}
                  onClick={() => isAllowed && setKind(k)}
                  disabled={!isAllowed}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
