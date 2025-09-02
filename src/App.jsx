import React, { useEffect, useState } from "react";
import { useGeometries } from "./hooks/useGeometries.js";

import GeometryToolbar from "./components/GeometryToolbar.jsx";
import GeometryForm from "./components/GeometryForm.jsx";
import GeometryList from "./components/GeometryList.jsx";
import MapCanvas from "./components/MapCanvas.jsx";

import { ToastProvider } from "./components/ToastProvider.jsx"; // ✅ yeni
// import Toast from "./components/Toast.jsx"; // ❌ artık gerekmiyor

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/form.css";
import "./styles/map.css";
import "./styles/popup.css";

function AppInner() {
  const [type, setType] = useState("POINT");
  const [openCreate, setOpenCreate] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [sketchWkt, setSketchWkt] = useState("");

  const { items, loading, saving, load, add } = useGeometries();

  const handleCreate = async (dto) => {
    const ok = await add(dto);
    if (ok) {
      setOpenCreate(false);
      setSketchWkt("");
      await load();
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
              onGetAll={load}
              onOpenList={() => setOpenList(true)}
              onSketchWkt={(w) => setSketchWkt(w)}
            />
          </div>
        </section>
      </div>

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

      {openList && (
        <div className="modal-backdrop" onClick={() => setOpenList(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <GeometryList items={items} loading={loading} />
          </div>
        </div>
      )}

      <footer className="footer"><span>by Arzu Akkuş</span></footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
