// .env.development: VITE_API_BASE_URL=https://localhost:7294
const RAW = (import.meta.env?.VITE_API_BASE_URL ?? "").trim();
if (!RAW) {
  console.warn("VITE_API_BASE_URL yok; geçici https://localhost:7294 kullanılacak.");
}
const BASE = (RAW || "https://localhost:7294").replace(/\/+$/, "");

const GET_URL  = `${BASE}/api/Geometry`;
const POST_URL = `${BASE}/api/Geometry`;

const unwrap = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.result ?? data?.value ?? data;
};

const jsonOrThrow = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || res.statusText || "İstek başarısız";
    throw new Error(msg);
  }
  return unwrap(data);
};

export async function getAllGeometries() {
  const res = await fetch(GET_URL, { method: "GET" });
  return jsonOrThrow(res);
}

const TYPE_MAP = { POINT: 1, LINESTRING: 2, POLYGON: 3 };

export async function createGeometry({ name, type, wkt }) {
  const payload = { name, type: TYPE_MAP[type] ?? TYPE_MAP.POINT, wkt };
  const res = await fetch(POST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}
