import { useEffect, useRef } from "react";
import { Draw } from "ol/interaction";
import { writeWkt } from "./WktUtils";

/**
 * Polygon çizimi – canlı kapanış kenarı & dolgu görünümü (OL default sketch).
 * Bitirme: Double-Click veya Enter
 * Undo: Backspace/Delete
 * İptal: Esc
 */
export default function DrawPolygon({ map, sketchSource, onWkt }) {
  const drawRef = useRef(null);

  useEffect(() => {
    if (!map || !sketchSource) return;

    const draw = new Draw({
      source: sketchSource,
      type: "Polygon",
    });
    drawRef.current = draw;

    // klavye kısayolları
    const onKey = (e) => {
      if (e.key === "Enter") {
        try { draw.finishDrawing(); } catch {}
      } else if (e.key === "Escape") {
        try { draw.abortDrawing(); } catch {}
      } else if (e.key === "Backspace" || e.key === "Delete") {
        try { draw.removeLastPoint(); } catch {}
      }
    };
    window.addEventListener("keydown", onKey);

    draw.on("drawstart", (evt) => {
      sketchSource.clear();
      setCursor(map, true);
      const geom = evt.feature.getGeometry();
      const push = () => onWkt?.(writeWkt(geom)); // 4326
      geom.on("change", push);
      push();
    });

    draw.on("drawend", (evt) => {
      onWkt?.(writeWkt(evt.feature.getGeometry()));
      setCursor(map, false);
    });

    map.addInteraction(draw);
    return () => {
      window.removeEventListener("keydown", onKey);
      map.removeInteraction(draw);
      setCursor(map, false);
    };
  }, [map, sketchSource, onWkt]);

  return null;
}

function setCursor(map, on) {
  const el = map.getTargetElement?.();
  if (el) el.style.cursor = on ? "crosshair" : "";
}
