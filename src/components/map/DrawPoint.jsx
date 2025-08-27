import { useEffect, useRef } from "react";
import { Draw } from "ol/interaction";
import { defaults as defaultInteractions } from "ol/interaction";
import { writeWkt } from "./WktUtils";

/**
 * @param {{ map: import('ol/Map').default, sketchSource: import('ol/source/Vector').default, onWkt:(w:string)=>void }} props
 */
export default function DrawPoint({ map, sketchSource, onWkt }) {
  const drawRef = useRef(null);

  useEffect(() => {
    if (!map || !sketchSource) return;

    // Haritanın çift tık zoom'u kapalı olmalı (MapCanvas'ta zaten kapatıyoruz)
    const draw = new Draw({ source: sketchSource, type: "Point" });
    drawRef.current = draw;

    draw.on("drawstart", () => {
      sketchSource.clear();
      setCursor(map, true);
    });

    draw.on("drawend", (evt) => {
      const wkt = writeWkt(evt.feature.getGeometry()); // 4326 olarak yaz
      onWkt?.(wkt);
      setCursor(map, false);
    });

    map.addInteraction(draw);
    return () => { map.removeInteraction(draw); setCursor(map, false); };
  }, [map, sketchSource, onWkt]);

  return null;
}

function setCursor(map, on) {
  const el = map.getTargetElement?.();
  if (el) el.style.cursor = on ? "crosshair" : "";
}
