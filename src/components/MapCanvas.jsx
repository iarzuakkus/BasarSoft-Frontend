// src/components/MapCanvas.jsx
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import { defaults as defaultInteractions, Translate, Modify } from "ol/interaction";
import WKT from "ol/format/WKT";

import { MAP_SRID, readFeatureSmart } from "./map/WktUtils.js";
import DrawControls from "./DrawControls.jsx";
import MapControls from "./map/MapControls.jsx";
import { createDataLayer, createSketchLayer } from "./layers.js";
import HoverAndClickPopup from "./map/HoverAndClickPopup.jsx";
import ShapeMenu from "./ui/ShapeMenu.jsx";
import GeometryList from "./GeometryList.jsx";

import { createHighlightLayer, createHighlightSource } from "./map/highlightLayer.js";
import { addHighlight } from "./map/highlightUtils.js";

import { updateGeometry } from "../api/geometryApi.js";

export default function MapCanvas({
  type,
  items: itemsProp,
  onGetAll,
  onOpenList,
  onSketchWkt,
  onFinishSketch
}) {
  const slotRef = useRef(null);
  const mapRef = useRef(null);

  const dataSourceRef = useRef(new VectorSource());
  const sketchSourceRef = useRef(new VectorSource());

  const dataLayerRef = useRef(createDataLayer(dataSourceRef.current));
  const sketchLayerRef = useRef(createSketchLayer(sketchSourceRef.current));

  const highlightSourceRef = useRef(createHighlightSource());
  const highlightLayerRef = useRef(createHighlightLayer(highlightSourceRef.current));

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("cursor");
  const [currentSketchWkt, setCurrentSketchWkt] = useState("");
  const [lastSavedWkt, setLastSavedWkt] = useState("");
  const [items, setItems] = useState(itemsProp || []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [listOpen, setListOpen] = useState(false);

  const [canSave, setCanSave] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const drawLineRef = useRef(null);
  const TR_BBOX_4326 = [25, 35.6, 45, 42.4];
  const typeMap = { 1: "POINT", 2: "LINESTRING", 3: "POLYGON" };

  // === MAP INIT ===
  useEffect(() => {
    const map = new Map({
      target: slotRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        dataLayerRef.current,
        sketchLayerRef.current,
        highlightLayerRef.current
      ],
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6,
        minZoom: 2,
        maxZoom: 18
      })
    });
    mapRef.current = map;

    const tr = transformExtent(TR_BBOX_4326, "EPSG:4326", MAP_SRID);
    map.getView().fit(tr, { padding: [20, 20, 20, 20], maxZoom: 7 });

    const onResize = () => map.updateSize();
    window.addEventListener("resize", onResize);
    setReady(true);

    return () => {
      window.removeEventListener("resize", onResize);
      map.setTarget(null);
    };
  }, []);

  // dışarıdan items sync et
  useEffect(() => {
    if (Array.isArray(itemsProp)) setItems(itemsProp);
  }, [itemsProp]);

  // items to map
  useEffect(() => {
    const map = mapRef.current;
    const src = dataSourceRef.current;
    if (!map || !src) return;
    src.clear();

    if (Array.isArray(items) && items.length) {
      let displayItems = [];
      if (selectedShapes.length > 0) {
        displayItems = items.filter((it) => {
          const t = typeMap[it.type] || "";
          return selectedShapes.includes(t);
        });
      } else {
        displayItems = [];
      }

      // FEAT'lere item id/name/type bağla (kritik!)
      const feats = displayItems
        .map((g) => {
          if (!g?.wkt) return null;
          const f = readFeatureSmart(g.wkt);
          if (!f) return null;
          try { f.setId?.(g.id); } catch {}
          f.set && f.set("itemId", g.id);
          f.set && f.set("itemName", g.name);
          f.set && f.set("itemType", g.type);
          return f;
        })
        .filter(Boolean);

      if (feats.length) src.addFeatures(feats);

      // (mevcut zoom davranışını bozmadım)
      if (displayItems.length > 0) {
        const extent = src.getExtent();
        if (extent && isFinite(extent[0])) {
          map.getView().fit(extent, {
            padding: [32, 32, 32, 32],
            maxZoom: 12,
            duration: 300
          });
        }
      }
    }
  }, [items, selectedShapes]);

  const handleReset = () => {
    dataSourceRef.current?.clear();
    sketchSourceRef.current?.clear();
    highlightSourceRef.current?.clear();
    setCurrentSketchWkt("");
    setLastSavedWkt("");
    setCanSave(false);
    setHistory([]);
    setSelectedItem(null);
  };

  const handleToggleMode = (newMode) => {
    if (mode === newMode) {
      setMode("cursor");
      setCurrentSketchWkt(lastSavedWkt);
      setCanSave(false);
      setHistory([]);
    } else {
      setMode(newMode || (mode === "cursor" ? "point" : "cursor"));
    }
  };

  // çizim veya move sırasında gelen wkt
  const handleSketchWkt = (wkt) => {
    setCurrentSketchWkt(wkt);
    onSketchWkt?.(wkt);

    if (mode === "move-shape" || mode === "move-vertex") {
      setHistory((prev) => [...prev, currentSketchWkt]);
      setCanSave(true);

      // sadece mevcut seçili item'in wkt'sini güncelle (id'yi koru)
      setSelectedItem((prev) => (prev ? { ...prev, wkt } : prev));
    }
  };

  // SAVE → sadece WKT günceller (name/type değişmeden)
  const handleSave = async () => {
    if (!currentSketchWkt || !selectedItem) {
      console.log("Save iptal → eksik veri", { currentSketchWkt, selectedItem });
      return;
    }

    try {
      const payload = {
        name: selectedItem.name,
        type: selectedItem.type,
        wkt: currentSketchWkt
      };
      console.log("PUT ->", selectedItem.id, payload);

      const updated = await updateGeometry(selectedItem.id, payload);
      console.log("update result:", updated);

      setItems((prev) =>
        prev.map((it) => (it.id === selectedItem.id ? { ...it, ...updated } : it))
      );
      setSelectedItem((prev) =>
        prev && prev.id === selectedItem.id ? { ...prev, ...updated } : prev
      );

      setLastSavedWkt(payload.wkt);
      setCanSave(false);
      setHistory([]);
      setMode("cursor");
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // === OL interaction: Translate & Modify ===
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // eski interactionları temizle
    map.getInteractions().forEach((i) => {
      if (i instanceof Translate || i instanceof Modify) {
        map.removeInteraction(i);
      }
    });

    // ortak WKT yazım fonksiyonu
    const writeWkt = (feat) => {
      const fmt = new WKT();
      return fmt.writeFeature(feat, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection()
      });
    };

    // feature -> item eşle
    const getItemFromFeature = (feat) => {
      const fid = feat?.getId?.();
      const pid = feat?.get?.("itemId");
      const id = fid ?? pid;
      if (id == null) return null;
      const idNum = Number(id);
      const found = items.find((it) => Number(it.id) === idNum);
      return found || null;
    };

    if (mode === "move-shape") {
      const translate = new Translate({
        features: dataLayerRef.current.getSource().getFeaturesCollection()
      });
      map.addInteraction(translate);

      translate.on("translateend", (e) => {
        const feat = e.features.item(0);
        if (!feat) return;
        const newWkt = writeWkt(feat);
        const item = getItemFromFeature(feat);
        // önce doğru item'i seç, sonra wkt'yi işle
        if (item) {
          setSelectedItem({ ...item, wkt: newWkt });
        }
        handleSketchWkt(newWkt);
      });
    }

    if (mode === "move-vertex") {
      const modify = new Modify({
        source: dataLayerRef.current.getSource()
      });
      map.addInteraction(modify);

      modify.on("modifyend", (e) => {
        const feat = e.features.item(0);
        if (!feat) return;
        const newWkt = writeWkt(feat);
        const item = getItemFromFeature(feat);
        if (item) {
          setSelectedItem({ ...item, wkt: newWkt });
        }
        handleSketchWkt(newWkt);
      });
    }
  }, [mode, items]);

  const toggleShape = (shape) => {
    setSelectedShapes((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape]
    );
  };

  const handleZoom = (geom) => {
    const map = mapRef.current;
    if (!map) return;
    const format = new WKT();
    try {
      const feature = format.readFeature(geom.wkt, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection()
      });
      const extent = feature.getGeometry().getExtent();
      map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 800 });
      addHighlight(feature, highlightSourceRef.current);

      setSelectedItem(geom);
      setLastSavedWkt(geom.wkt);
    } catch (e) {
      console.error("zoom error:", e);
    }
  };

  return (
    <div className="map-canvas-wrapper">
      <div className="map-viewport">
        <div ref={slotRef} className="ol-map-slot" />

        <button className="map-fab list" type="button" onClick={() => setListOpen(true)}>
          Get List
        </button>

        <div className="map-fab-group">
          <ShapeMenu
            open={menuOpen}
            selected={selectedShapes}
            onToggle={toggleShape}
          />
          <button
            className="map-fab"
            type="button"
            onClick={() => {
              if (!menuOpen) {
                setMenuOpen(true);
              } else {
                let filtered = [];
                if (selectedShapes.length > 0) {
                  filtered = items.filter((it) => {
                    const t = typeMap[it.type] || "";
                    return selectedShapes.includes(t);
                  });
                }
                onGetAll(filtered);
                setMenuOpen(false);
              }
            }}
          >
            Get All
          </button>
        </div>

        {ready && (
          <DrawControls
            type={type}
            mode={mode}
            map={mapRef.current}
            sketchSource={sketchSourceRef.current}
            onWkt={handleSketchWkt}
            drawLineRef={drawLineRef}
          />
        )}

        {ready && (
          <HoverAndClickPopup
            map={mapRef.current}
            dataSource={dataSourceRef.current}
            items={items}
            setItems={setItems}
            mode={mode}
            highlightSource={highlightSourceRef.current}
          />
        )}

        {listOpen && (
          <GeometryList
            items={items}
            loading={false}
            onZoom={handleZoom}
            onClose={() => setListOpen(false)}
          />
        )}
      </div>

      <MapControls
        className="outside-absolute"
        mode={mode}
        onToggleMode={handleToggleMode}
        onReset={handleReset}
        onSave={handleSave}
        canSave={canSave}
      />
    </div>
  );
}
