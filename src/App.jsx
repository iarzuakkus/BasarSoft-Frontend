import React, { useEffect, useState } from "react";
import { useGeometries } from "./hooks/useGeometries.js";

import GeometryToolbar from "./components/GeometryToolbar.jsx";
import GeometryForm from "./components/GeometryForm.jsx";
import GeometryList from "./components/GeometryList.jsx";
import MapCanvas from "./components/MapCanvas.jsx";
import Toast from "./components/Toast.jsx";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/form.css";
import "./styles/map.css";

export default function App() {
  const [type, setType] = useState("POINT");
  const [openCreate, setOpenCreate] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [sketchWkt, setSketchWkt] = useState(""); // haritada çizilen son WKT

  const { items, loading, saving, error, setError, load, add } = useGeometries();

  // KAYDET: başarılı olursa modalı kapat, çizim WKT'sini temizle ve listeyi/haritayı yenile
  const handleCreate = async (dto) => {
    const ok = await add(dto);
    if (ok) {
      setOpenCreate(false);
      setSketchWkt("");
      await load(); // yeni kaydı anında getir ve haritada çiz
    }
  };

  // ESC -> modalları kapat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenCreate(false);
        setOpenList(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sheet">
      <header className="header">
        <h1 className="brand mono">BasarSoft Map Application</h1>
      </header>

      <div className="stage">
        <GeometryToolbar
          type={type}
          onChangeType={(t) => setType(t)}
          onOpenCreate={() => setOpenCreate(true)}
        />

        <section className="work">
          <div className="work-inner">
            <MapCanvas
              type={type}
              items={items}
              onGetAll={load}                 // Get All => API'den çek, MapCanvas items'ı çizer
              onOpenList={() => setOpenList(true)}
              onSketchWkt={(w) => setSketchWkt(w)} // harita çiziminden WKT al
            />
          </div>
        </section>
      </div>

      {/* Create Modal (WKT otomatik dolu gelebilir) */}
      {openCreate && (
        <div className="modal-backdrop" onClick={() => setOpenCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <GeometryForm
              type={type}
              initialWkt={sketchWkt}
              onSubmit={handleCreate}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* List Modal */}
      {openList && (
        <div className="modal-backdrop" onClick={() => setOpenList(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <GeometryList items={items} loading={loading} />
          </div>
        </div>
      )}

      <Toast message={error} onClose={() => setError("")} />
      <footer className="footer"><span>by Arzu Akkuş</span></footer>
    </div>
  );
}
