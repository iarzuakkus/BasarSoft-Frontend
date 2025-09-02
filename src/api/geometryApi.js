// .env.development: VITE_API_BASE_URL=https://localhost:7294
import { toastManager } from "../components/ToastProvider";

const RAW = (import.meta.env?.VITE_API_BASE_URL ?? "").trim();
if (!RAW) {
  console.warn("VITE_API_BASE_URL yok; geçici https://localhost:7294 kullanılacak.");
}
const BASE = (RAW || "https://localhost:7294").replace(/\/+$/, "");

const GET_URL  = `${BASE}/api/Geometry`;
const POST_URL = `${BASE}/api/Geometry`;
const BY_ID_URL = (id) => `${BASE}/api/Geometry/${id}`;

// ✅ Backend cevabını normalize eden ve Toaster tetikleyen yardımcı
const jsonOrThrow = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  const result = {
    success: data?.success ?? res.ok,
    message: data?.message || (res.ok ? "İşlem başarılı" : "İstek başarısız"),
    data: data?.data ?? data?.result ?? data?.value ?? null,
  };

  // Toaster: her mesaj için yukarıdan göster
  if (result.message) {
    toastManager.show(result.message, result.success ? "success" : "error");
  }

  if (!res.ok || result.success === false) {
    throw new Error(result.message);
  }

  return result;
};

// === API Fonksiyonları ===
export async function getAllGeometries() {
  const res = await fetch(GET_URL, { method: "GET" });
  return jsonOrThrow(res); // { success, message, data }
}

export async function getGeometryById(id) {
  const res = await fetch(BY_ID_URL(id), { method: "GET" });
  return jsonOrThrow(res);
}

export async function updateGeometry(id, { name, type, wkt }) {
  const payload = { id, name, type, wkt };
  const res = await fetch(BY_ID_URL(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function deleteGeometry(id) {
  const res = await fetch(BY_ID_URL(id), { method: "DELETE" });
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
