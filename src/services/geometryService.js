// Basit fetch servisleri (axios gerekmez)
// .env.development içine VITE_API_BASE_URL ekleyebilirsin; yoksa 7274 kullanır.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7274";

const jsonOrThrow = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || res.statusText || "İstek başarısız";
    throw new Error(msg);
  }
  // Backend ApiResponse döndürüyorsa data.data, değilse data
  return data?.data ?? data;
};

// === TÜM GEOMETRİLERİ AL ===
export async function getAllGeometries() {
  const res = await fetch(`${BASE_URL}/api/geometry`, { method: "GET" });
  return jsonOrThrow(res); // -> Array<GeometryItem>
}

// === YENİ GEOMETRİ OLUŞTUR ===
export async function createGeometry(dto) {
  const res = await fetch(`${BASE_URL}/api/geometry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto)
  });
  return jsonOrThrow(res); // -> created item
}

// === ID İLE GEOMETRİ AL ===
export async function getGeometryById(id) {
  const res = await fetch(`${BASE_URL}/api/geometry/${id}`, { method: "GET" });
  return jsonOrThrow(res); // -> GeometryItem
}

// === GEOMETRİ GÜNCELLE ===
export async function updateGeometry(id, dto) {
  const res = await fetch(`${BASE_URL}/api/geometry/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto)
  });
  return jsonOrThrow(res); // -> updated item
}

// === GEOMETRİ SİL ===
export async function deleteGeometry(id) {
  const res = await fetch(`${BASE_URL}/api/geometry/${id}`, {
    method: "DELETE"
  });
  return jsonOrThrow(res); // -> true/ok/null
}
