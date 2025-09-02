// src/utils/jsonOrThrow.js
import { toastManager } from "../components/ToastProvider";

// JSON parse + hata yönetimi + toast entegrasyonu
export async function jsonOrThrow(res) {
  let json;
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  const result = {
    success: json?.success ?? res.ok,
    message: json?.message || (res.ok ? "İşlem başarılı" : "İstek başarısız"),
    data: json?.data ?? json?.result ?? json?.value ?? null,
  };

  // ✅ Toaster entegrasyonu
  if (result.message) {
    toastManager.show(result.message, result.success ? "success" : "error");
  }

  if (!res.ok || result.success === false) {
    throw new Error(result.message);
  }

  return result;
}
