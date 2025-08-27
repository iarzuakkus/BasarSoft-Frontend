import { useEffect, useState, useCallback } from "react";
import { getAllGeometries, createGeometry } from "../api/geometryApi.js";

export function useGeometries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllGeometries();
      setItems(Array.isArray(data) ? data : []);
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

  useEffect(() => { load(); }, [load]);

  return { items, loading, saving, error, setError, load, add };
}
