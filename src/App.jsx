// src/App.jsx
import React, { useEffect, useState } from "react";
import { useGeometries } from "./hooks/useGeometries.js";

import GeometryToolbar from "./components/GeometryToolbar.jsx";
import GeometryForm from "./components/GeometryForm.jsx";
import GeometryList from "./components/GeometryList.jsx";
import MapCanvas from "./components/MapCanvas.jsx";

import { ToastProvider } from "./components/ToastProvider.jsx";

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

  // 🔹 getAllowedKinds eklendi
  const { items, loading, saving, load, add, getAllowedKinds } = useGeometries();

  const handleCreate = async (dto) => {
    const ok = await add(dto);
    if (ok) {
      setOpenCreate(false);
      setSketchWkt("");
      await load();

      // ✅ create sonrası MapCanvas’a sketch temizlet
      if (typeof window.finishSketch === "function") {
        window.finishSketch();
      }
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
              onFinishSketch={() => {
                // ✅ MapCanvas’tan çağrılır → App tarafında da state resetler
                setSketchWkt("");
              }}
            />
          </div>
        </section>
      </div>

      {openCreate && (
        <div className="modal-backdrop" onClick={() => setOpenCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <GeometryForm
              type={type}
              // 🔹 hem wkt hem status(kind) normalize edildi
              initialWkt={{
                wkt:
                  typeof sketchWkt === "object"
                    ? sketchWkt.wkt || ""
                    : sketchWkt || "",
                status:
                  typeof sketchWkt === "object"
                    ? sketchWkt.status || sketchWkt.kind || ""
                    : "",
              }}
              // 🔹 Allowed kinds backend + mesafe kontrolünden
              allowedKinds={getAllowedKinds(
                typeof sketchWkt === "object" ? sketchWkt.wkt : sketchWkt,
                type
              )}
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
