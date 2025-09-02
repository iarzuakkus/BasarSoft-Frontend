// hooks/useGeometries.js
import { useEffect, useState, useCallback } from "react";
import { 
  getAllGeometries, 
  createGeometry, 
  updateGeometry, 
  deleteGeometry 
} from "../api/geometryApi.js";
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

  // === Yardımcı: Feature oluştur ===
  const makeFeature = (item) => {
    const geom = format.readGeometry(item.wkt);
    geom.transform("EPSG:4326", "EPSG:3857");

    const feat = new Feature({
      geometry: geom,
      name: item.name,
      type: item.type,
      wkt: item.wkt,
    });

    feat.setId(item.id); // 🔑 OL feature id
    feat.set("id", item.id);
    feat.set("name", item.name);
    feat.set("type", item.type);
    feat.set("wkt", item.wkt);

    return feat;
  };

  // === GET ALL ===
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllGeometries(); // { success, message, data }
      const valid = Array.isArray(response?.data) ? response.data : [];
      setItems(valid);

      const source = new VectorSource();
      source.addFeatures(valid.map(makeFeature));

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

  // === CREATE ===
  const add = useCallback(async (dto) => {
    setSaving(true);
    setError("");
    try {
      const response = await createGeometry(dto);
      if (response?.success && response.data) {
        const newItem = response.data;
        setItems((prev) => [...prev, newItem]);

        if (layer) {
          const feat = makeFeature(newItem);
          layer.getSource().addFeature(feat);
        }
      }
      return response;
    } catch (e) {
      return { success: false, message: e.message || "Kayıt hatası" };
    } finally {
      setSaving(false);
    }
  }, [layer]);

  // === UPDATE ===
  const update = useCallback(async (id, dto) => {
    setSaving(true);
    setError("");
    try {
      const response = await updateGeometry(id, dto);
      if (response?.success && response.data) {
        const updated = response.data;

        // items state güncelle
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );

        // layer'daki feature güncelle
        if (layer) {
          const feature = layer.getSource().getFeatureById(id);
          if (feature) {
            const geom = format.readGeometry(updated.wkt);
            geom.transform("EPSG:4326", "EPSG:3857");
            feature.setGeometry(geom);
            feature.set("name", updated.name);
            feature.set("type", updated.type);
            feature.set("wkt", updated.wkt);
          }
        }
      }
      return response;
    } catch (e) {
      return { success: false, message: e.message || "Güncelleme hatası" };
    } finally {
      setSaving(false);
    }
  }, [layer]);

  // === DELETE ===
  const remove = useCallback(async (id) => {
    setSaving(true);
    setError("");
    try {
      const response = await deleteGeometry(id);
      if (response?.success) {
        // items state güncelle
        setItems((prev) => prev.filter((item) => item.id !== id));

        // layer'dan sil
        if (layer) {
          const feature = layer.getSource().getFeatureById(id);
          if (feature) {
            layer.getSource().removeFeature(feature);
          }
        }
      }
      return response;
    } catch (e) {
      return { success: false, message: e.message || "Silme hatası" };
    } finally {
      setSaving(false);
    }
  }, [layer]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, layer, loading, saving, error, setError, load, add, update, remove };
}
