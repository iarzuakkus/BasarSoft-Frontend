import React, { useEffect, useRef } from "react";
import Overlay from "ol/Overlay";
import "../../styles/popup.css";

export default function PopupOverlay({ map, content, coordinate, onClose }) {
  const popupRef = useRef(null);
  const overlayRef = useRef(null);

  // Overlay'i bir kez oluştur
  useEffect(() => {
    if (!map || !popupRef.current) return;

    overlayRef.current = new Overlay({
      element: popupRef.current,
      positioning: "bottom-center",
      stopEvent: true,                  // iç klikler map'e gitmesin
      autoPan: true,
      autoPanAnimation: { duration: 250 },
      offset: [0, -14],
    });

    map.addOverlay(overlayRef.current);

    return () => {
      try { map.removeOverlay(overlayRef.current); } catch {}
      overlayRef.current = null;
    };
  }, [map]);

  // Konumu güncelle (content de değişince tekrar set et)
  useEffect(() => {
    if (!overlayRef.current) return;
    if (coordinate) overlayRef.current.setPosition(coordinate);
    else overlayRef.current.setPosition(undefined);
  }, [coordinate, content]);

  const handleClose = (e) => {
    e.stopPropagation();
    onClose && onClose();
  };

  // ARTIK: her zaman render ediyoruz; görünürlüğü CSS ile yönetiyoruz
  const visible = Boolean(coordinate && content);

  return (
    <div
      ref={popupRef}
      className="ol-popup"
      onClick={(e) => e.stopPropagation()}
      style={{ display: visible ? "block" : "none" }}
    >
      {onClose && (
        <button className="close-btn" onClick={handleClose} aria-label="Close">✕</button>
      )}
      <h4>Geometry Info</h4>
      <div className="popup-content">{content}</div>
    </div>
  );
}
