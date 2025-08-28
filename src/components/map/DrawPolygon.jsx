import React, { useEffect, useRef } from "react";
import { Draw } from "ol/interaction";
import { writeWkt } from "./WktUtils";

/**
 * Polygon çizimi – canlı çizgi & ilk noktaya yaklaşınca kapanma.
 */
export default function DrawPolygon({ map, sketchSource, onWkt }) {
  const drawRef = useRef(null);

  useEffect(() => {
    if (!map || !sketchSource) return;

    const draw = new Draw({
      source: sketchSource,
      type: "Polygon",
      // autoClose = true: OL kendisi ilk noktaya yakınsa kapatır (default davranış)
      // freehand: false → tıklayarak çiz
      freehand: false
    });

    drawRef.current = draw;

    draw.on("drawstart", () => {
      sketchSource.clear();        // önceki çizimi temizle
      setCursor(map, true);
    });

    draw.on("drawend", (evt) => {
      const geom = evt.feature.getGeometry();
      onWkt?.(writeWkt(geom));
      setCursor(map, false);
    });

    map.addInteraction(draw);
    return () => {
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
