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
import { getDistance } from "ol/sphere"; // 🔹 mesafe ölçümü için

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
  const RADIUS = 500; // metre

  // === Yardımcı: Feature oluştur ===
  const makeFeature = (item) => {
    const geom = format.readGeometry(item.wkt); // ✅ sadece 4326
    const feat = new Feature({
      geometry: geom,
      name: item.name,
      type: item.type,
      wkt: item.wkt,
      kind: item.kind,
    });

    feat.setId(item.id);
    feat.set("id", item.id);
    feat.set("name", item.name);
    feat.set("type", item.type);
    feat.set("wkt", item.wkt);
    feat.set("kind", item.kind);

    return feat;
  };

  // === GET ALL ===
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllGeometries();
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

        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );

        if (layer) {
          const feature = layer.getSource().getFeatureById(id);
          if (feature) {
            const geom = format.readGeometry(updated.wkt);
            feature.setGeometry(geom);
            feature.set("name", updated.name);
            feature.set("type", updated.type);
            feature.set("wkt", updated.wkt);
            feature.set("kind", updated.kind);
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
        setItems((prev) => prev.filter((item) => item.id !== id));

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

  // === 500m içinde hangi kind’ler seçilebilir? ===
  const getAllowedKinds = useCallback((newWkt, newType) => {
    try {
      const newGeom = format.readGeometry(newWkt);

      // sadece Point eklenirken kontrol yapılacak
      if (newType === "POINT") {
        let matchedKind = null;

        items.forEach((item) => {
          if (!item.wkt || !item.kind) return;
          if (item.type !== 2) return; // sadece LineString’lere bak

          const geom = format.readGeometry(item.wkt);
          const coords = geom.getCoordinates();
          const start = coords[0];
          const end = coords[coords.length - 1];

          const distStart = getDistance(newGeom.getCoordinates(), start);
          const distEnd = getDistance(newGeom.getCoordinates(), end);

          if (distStart <= RADIUS || distEnd <= RADIUS) {
            matchedKind = item.kind;
          }
        });

        return matchedKind ? [matchedKind] : ["A", "B", "C"];
      }

      return ["A", "B", "C"];
    } catch {
      return ["A", "B", "C"];
    }
  }, [items]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, layer, loading, saving, error, setError, load, add, update, remove, getAllowedKinds };
}
