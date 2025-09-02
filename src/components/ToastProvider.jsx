import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast.jsx";

const ToastContext = createContext();
export let toastManager = { show: () => {} };

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  toastManager.show = showToast; // dışarıdan erişim

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
