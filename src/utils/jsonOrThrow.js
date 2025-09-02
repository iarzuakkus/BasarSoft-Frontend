// src/utils/jsonOrThrow.js
import { toastManager } from "../components/ToastProvider";

/**
 * API response'u normalize eder ve opsiyonel olarak Toaster gösterir.
 * @param {Response} res - fetch response
 * @param {Object} options - { showToast: true/false }
 * @returns {Object} { success, message, data }
 */
export async function jsonOrThrow(res, { showToast = true } = {}) {
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

  // ✅ Toaster sadece showToast=true olduğunda çalışır
  if (showToast && result.message) {
    toastManager.show(result.message, result.success ? "success" : "error");
  }

  if (!res.ok || result.success === false) {
    throw new Error(result.message);
  }

  return result;
}
