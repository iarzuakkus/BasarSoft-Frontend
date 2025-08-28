import React, { useEffect, useRef } from "react";
import Overlay from "ol/Overlay";

export default function PopupOverlay({ map, content, coordinate }) {
  const popupRef = useRef();

  useEffect(() => {
    if (!map || !popupRef.current) return;
    const overlay = new Overlay({
      element: popupRef.current,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -12],
    });
    map.addOverlay(overlay);

    if (coordinate) {
      overlay.setPosition(coordinate);
    } else {
      overlay.setPosition(undefined);
    }

    return () => map.removeOverlay(overlay);
  }, [map, coordinate]);

  if (!coordinate || !content) return null;

  return (
    <div ref={popupRef} className="ol-popup">
      <div className="popup-content">{content}</div>
    </div>
  );
}
