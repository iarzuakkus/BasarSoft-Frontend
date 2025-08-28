// hooks/useGeometries.js
import { useEffect, useState, useCallback } from "react";
import { getAllGeometries, createGeometry } from "../api/geometryApi.js";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import Feature from "ol/Feature";
import { WKT } from "ol/format";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";

const defaultStyle = new Style({
  stroke: new Stroke({ color: "#2979ff", width: 2 }),
  fill: new Fill({ color: "rgba(41, 121, 255, 0.2)" }),
  image: new CircleStyle({ radius: 5, fill: new Fill({ color: "#2979ff" }) })
});

export function useGeometries() {
  const [items, setItems] = useState([]);
  const [layer, setLayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const format = new WKT();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllGeometries();
      const valid = Array.isArray(data) ? data : [];
      setItems(valid);

      const source = new VectorSource();

      const features = valid.map((item) => {
        const geom = format.readGeometry(item.wkt);
        geom.transform("EPSG:4326", "EPSG:3857");

        const feat = new Feature({
          geometry: geom,
          id: item.id,         // ✅ doğrudan constructor'a ekledik
          name: item.name,
          type: item.type,
          wkt: item.wkt,
        });

        // Yedek amaçlı ayrıca .set ile de atanıyor
        feat.set("id", item.id);
        feat.set("name", item.name);
        feat.set("type", item.type);
        feat.set("wkt", item.wkt);

        return feat;
      });

      source.addFeatures(features);

      const vectorLayer = new VectorLayer({
        source,
        style: defaultStyle,
      });

      setLayer(vectorLayer);
    } catch (e) {
      setError(e.message || "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (dto) => {
    setSaving(true);
    setError("");
    try {
      await createGeometry(dto);
      await load();
      return true;
    } catch (e) {
      setError(e.message || "Kayıt hatası");
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, layer, loading, saving, error, setError, load, add };
}
