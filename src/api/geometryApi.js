// src/api/geometryApi.js
// .env.development: VITE_API_BASE_URL=https://localhost:7294
import { jsonOrThrow } from "../utils/jsonOrThrow";

const RAW = (import.meta.env?.VITE_API_BASE_URL ?? "").trim();
if (!RAW) {
  console.warn("VITE_API_BASE_URL yok; geçici https://localhost:7294 kullanılacak.");
}
const BASE = (RAW || "https://localhost:7294").replace(/\/+$/, "");

const GET_URL   = `${BASE}/api/Geometry`;
const POST_URL  = `${BASE}/api/Geometry`;
const BY_ID_URL = (id) => `${BASE}/api/Geometry/${id}`;
const PAGED_URL = `${BASE}/api/Geometry/paged`; // ✅ yeni eklenen endpoint

// 🔑 backend int bekliyor (1=Point, 2=LineString, 3=Polygon)
const TYPE_MAP = { POINT: 1, LINESTRING: 2, POLYGON: 3 };

// === API Fonksiyonları ===

// GET → sadece data, toast yok
export async function getAllGeometries() {
  const res = await fetch(GET_URL, { method: "GET" });
  return jsonOrThrow(res, { showToast: false });
}

// GET (Paged) → sayfalama + arama
export async function getPagedGeometries({ page = 1, pageSize = 10, search = "" }) {
  const url = new URL(PAGED_URL);
  url.searchParams.set("page", page);
  url.searchParams.set("pageSize", pageSize);
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), { method: "GET" });
  return jsonOrThrow(res, { showToast: false });
}

export async function getGeometryById(id) {
  const res = await fetch(BY_ID_URL(id), { method: "GET" });
  return jsonOrThrow(res, { showToast: false });
}

// POST → kayıt oluşturur, toast çıkar
export async function createGeometry({ name, type, wkt }) {
  const payload = { 
    name, 
    type: typeof type === "string" ? TYPE_MAP[type.toUpperCase()] ?? 0 : type, 
    wkt 
  };

  console.log("createGeometry payload:", payload);

  const res = await fetch(POST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res); // ✅ toast çıkar
}

// PUT → güncelleme yapar, toast çıkar
export async function updateGeometry(id, { name, type, wkt }) {
  const payload = { 
    id, 
    name, 
    type: typeof type === "string" ? TYPE_MAP[type.toUpperCase()] ?? 0 : type, 
    wkt 
  };

  console.log("updateGeometry payload:", payload);

  const res = await fetch(BY_ID_URL(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res); 
}

// DELETE → silme yapar, toast çıkar
export async function deleteGeometry(id) {
  const res = await fetch(BY_ID_URL(id), { method: "DELETE" });
  return jsonOrThrow(res);
}
