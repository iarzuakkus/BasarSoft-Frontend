import React, { useEffect } from "react";
import "../styles/toast.css";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 2000); // 2 saniye sonra kapan
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}
