import React, { useEffect, useMemo, useState } from "react";

const normalizeForPost = (raw, type) => {
  if (!raw) return "";
  let s = String(raw).trim();
  // 12,34 → 12.34 (yalnızca ondalık)
  s = s.replace(/(\d),(?=\d)/g, (_m, d) => `${d}.`);
  // parantezleri tamamla
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  if (close < open) s += ")".repeat(open - close);
  // polygon ring kapat
  if (/^\s*POLYGON/i.test(s)) {
    s = s.replace(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i, (m, ring) => {
      const pts = ring.split(",").map(t => t.trim()).filter(Boolean);
      if (pts.length >= 3 && pts[0] !== pts[pts.length - 1]) pts.push(pts[0]);
      return `POLYGON((${pts.join(", ")}))`;
    });
  }
  // linestring tek noktaysa -> point
  if (/^\s*LINESTRING/i.test(s)) {
    const body = s.replace(/^\s*LINESTRING\s*\(|\)\s*$/gi, "");
    const coords = body.split(",").map(t => t.trim()).filter(Boolean);
    if (coords.length <= 1 || (coords.length === 2 && coords[0] === coords[1])) {
      s = `POINT (${coords[0]})`;
    }
  }
  return s;
};

export default function GeometryForm({ type, initialWkt = "", onSubmit, saving }) {
  const [name, setName] = useState("");
  const [wkt, setWkt]   = useState(initialWkt);

  useEffect(() => { setWkt(initialWkt || ""); }, [initialWkt]);

  const label = useMemo(() => type.charAt(0) + type.slice(1).toLowerCase(), [type]);

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
    if (!name.trim() || !wkt.trim()) return;
    const clean = normalizeForPost(wkt, type);
    await onSubmit({ name: name.trim(), type, wkt: clean });
  };

  return (
    <>
      <h3>Add Geometry</h3>
      <form onSubmit={submit}>
        <div className="row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., School Yard" />
        </div>
        <div className="row">
          <label>{label}</label>
          <input className="mono" value={wkt} onChange={(e) => setWkt(e.target.value)} placeholder={placeholder} />
        </div>
        <div className="actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
      </form>
    </>
  );
}
