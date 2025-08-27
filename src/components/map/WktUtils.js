// Projeksiyon & WKT yardımcıları (SRID konfigürasyonlu + EWKT desteği)
import WKT from "ol/format/WKT";

const RAW_SRID = (import.meta.env.VITE_WKT_SRID || "EPSG:4326").toString().trim();
export const BACKEND_SRID = /^\d+$/.test(RAW_SRID) ? `EPSG:${RAW_SRID}` : RAW_SRID.toUpperCase();
export const MAP_SRID = "EPSG:3857";

export const WRITE_EWKT = String(import.meta.env.VITE_WKT_EWKT || "false").toLowerCase() === "true";
export const BACKEND_EPSG_NUM = BACKEND_SRID.replace(/^EPSG:/i, "");

const fmt = new WKT();

/** EWKT "SRID=xxxx;..." prefiksini sök ve SRID ipucunu döndür */
function stripSridPrefix(raw) {
  const m = String(raw || "").match(/^\s*SRID=(\d+)\s*;\s*(.+)$/i);
  if (m) return { srid: `EPSG:${m[1]}`, wkt: m[2] };
  return { srid: null, wkt: String(raw || "") };
}

/** Ondalık virgül, parantez, ring onarımı, degenerate line fix (hafif) */
export function normalizeWkt(raw) {
  if (!raw) return "";
  let s = String(raw).trim();

  // 12,34 -> 12.34 (yalnızca ondalık)
  s = s.replace(/(\d),(?=\d)/g, (_m, d) => `${d}.`);

  // Parantez dengesi
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  if (close < open) s += ")".repeat(open - close);

  // Polygon ring kapat
  if (/^\s*POLYGON/i.test(s)) {
    s = s.replace(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i, (m, ring) => {
      const pts = ring.split(",").map(t => t.trim()).filter(Boolean);
      if (pts.length >= 3 && pts[0] !== pts[pts.length - 1]) pts.push(pts[0]);
      return `POLYGON((${pts.join(", ")}))`;
    });
  }

  // Linestring tek nokta / iki aynı nokta -> point'e indir
  const ls = /^\s*LINESTRING\s*\(([^)]+)\)\s*$/i.exec(s);
  if (ls) {
    const coords = ls[1].split(",").map(t => t.trim()).filter(Boolean);
    if (coords.length <= 1 || (coords.length === 2 && coords[0] === coords[1])) {
      s = `POINT (${coords[0]})`;
    }
  }
  return s;
}

/** İlk sayı çiftinden 3857/4326 tahmini */
export function guessInputSrid(wkt) {
  const m = String(wkt || "").match(/-?\d+(\.\d+)?\s+-?\d+(\.\d+)?/);
  if (!m) return BACKEND_SRID;
  const [x, y] = m[0].split(/\s+/).map(Number);
  return (Math.abs(x) > 180 || Math.abs(y) > 90) ? "EPSG:3857" : "EPSG:4326";
}

/** WKT -> Feature (hedef projeksiyon) — EWKT de destekler */
export function readFeatureSmart(inWkt, targetSrid = MAP_SRID) {
  if (!inWkt) return null;
  const { srid: ewktHint, wkt } = stripSridPrefix(inWkt);
  const s = normalizeWkt(wkt);
  if (!s) return null;

  const dataProjection = ewktHint || guessInputSrid(s);
  try {
    return fmt.readFeature(s, { dataProjection, featureProjection: targetSrid });
  } catch {
    return null;
  }
}

/** Geometri -> WKT (BACKEND_SRID’e dönüştürerek). EWKT istenirse SRID=...; prefiksi eklenir. */
export function writeWkt(geometry, toSrid = BACKEND_SRID, decimals = 6) {
  if (!geometry) return "";
  const clone = geometry.clone();
  clone.transform(MAP_SRID, toSrid);
  const text = fmt.writeGeometry(clone, { decimals });
  return WRITE_EWKT ? `SRID=${BACKEND_EPSG_NUM};${text}` : text;
}
