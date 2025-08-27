import React, { useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { Draw } from "ol/interaction";
import { LineString } from "ol/geom";
import { writeWkt } from "./WktUtils";

/**
 * Ref destekli DrawLine bileşeni.
 * Props:
 * - map: OpenLayers Map nesnesi
 * - sketchSource: çizim yapılan kaynak
 * - onWkt: (wkt: string) => void
 */
const DrawLine = forwardRef(function DrawLine({ map, sketchSource, onWkt }, ref) {
  const drawRef = useRef(null);
  const featureRef = useRef(null);

  useEffect(() => {
    if (!map || !sketchSource) return;

    // Interaction oluştur
    const draw = new Draw({
      source: sketchSource,
      type: "LineString",
    });
    drawRef.current = draw;

    draw.on("drawstart", (evt) => {
      sketchSource.clear();
      featureRef.current = evt.feature;
      setCursor(map, true);
    });

    draw.on("drawend", (evt) => {
      const geom = evt.feature.getGeometry();
      const wkt = writeWkt(geom);
      onWkt?.(wkt);
      setCursor(map, false);
    });

    map.addInteraction(draw);
    return () => {
      map.removeInteraction(draw);
      setCursor(map, false);
    };
  }, [map, sketchSource, onWkt]);

  // Ref üzerinden dışarıdan çizimi bitirme imkanı
  useImperativeHandle(ref, () => ({
    finish() {
      const feature = featureRef.current;
      if (feature) {
        const geom = feature.getGeometry();
        if (geom instanceof LineString && geom.getCoordinates().length >= 2) {
          const wkt = writeWkt(geom);
          onWkt?.(wkt);
        }
        // Çizimi bırakma → tekrar eklenebilmesi için interaction'ı sıfırla
        map.removeInteraction(drawRef.current);
        setCursor(map, false);
      }
    },
  }));

  return null;
});

function setCursor(map, on) {
  const el = map.getTargetElement?.();
  if (el) el.style.cursor = on ? "crosshair" : "";
}

export default DrawLine;
