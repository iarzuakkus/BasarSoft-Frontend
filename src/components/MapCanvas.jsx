import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import { defaults as defaultInteractions } from "ol/interaction";
import WKT from "ol/format/WKT";   // ✅ eklendi

import { MAP_SRID, readFeatureSmart } from "./map/WktUtils.js";
import DrawControls from "./DrawControls.jsx";
import MapControls from "./map/MapControls.jsx";
import { createDataLayer, createSketchLayer } from "./layers.js";
import HoverAndClickPopup from "./map/HoverAndClickPopup.jsx";
import ShapeMenu from "./ui/ShapeMenu.jsx";
import GeometryList from "./GeometryList.jsx";   // ✅ eklendi

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

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("cursor");
  const [currentSketchWkt, setCurrentSketchWkt] = useState("");
  const [items, setItems] = useState(itemsProp || []);

  // ShapeMenu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedShapes, setSelectedShapes] = useState([]);

  const drawLineRef = useRef(null);
  const TR_BBOX_4326 = [25, 35.6, 45, 42.4];

  // ✅ liste modal state
  const [listOpen, setListOpen] = useState(false);

  // ✅ int -> string map
  const typeMap = {
    1: "POINT",
    2: "LINESTRING",
    3: "POLYGON"
  };

  // === MAP INIT ===
  useEffect(() => {
    const map = new Map({
      target: slotRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        dataLayerRef.current,
        sketchLayerRef.current
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

  // dışarıdan items geldiyse sync et
  useEffect(() => {
    if (Array.isArray(itemsProp)) {
      setItems(itemsProp);
    }
  }, [itemsProp]);

  // items to map (✅ sadece seçili şekiller görünsün)
  useEffect(() => {
    const map = mapRef.current;
    const src = dataSourceRef.current;
    if (!map || !src) return;
    src.clear();

    if (Array.isArray(items) && items.length) {
      let displayItems = [];
      if (selectedShapes.length > 0) {
        displayItems = items.filter(it => {
          const t = typeMap[it.type] || "";
          return selectedShapes.includes(t);
        });
      } else {
        displayItems = items;
      }

      const feats = displayItems
        .map((g) => (g?.wkt ? readFeatureSmart(g.wkt) : null))
        .filter(Boolean);

      if (feats.length) src.addFeatures(feats);

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

  // reset on type change
  useEffect(() => {
    if (!ready) return;
    sketchSourceRef.current?.clear();
    setCurrentSketchWkt("");
  }, [type, mode, ready]);

  useEffect(() => {
    const el = mapRef.current?.getTargetElement?.();
    if (!el) return;
    el.style.cursor = mode === "point" ? "crosshair" : "default";
    return () => {
      el.style.cursor = "";
    };
  }, [mode]);

  // helpers
  const handleReset = () => {
    dataSourceRef.current?.clear();
    sketchSourceRef.current?.clear();
    setCurrentSketchWkt("");
    const map = mapRef.current;
    if (map) {
      const tr = transformExtent(TR_BBOX_4326, "EPSG:4326", MAP_SRID);
      map
        .getView()
        .fit(tr, { padding: [20, 20, 20, 20], maxZoom: 7, duration: 250 });
    }
  };

  const handleToggleMode = () =>
    setMode((m) => (m === "cursor" ? "point" : "cursor"));

  const handleSketchWkt = (wkt) => {
    setCurrentSketchWkt(wkt);
    onSketchWkt?.(wkt);
  };

  useEffect(() => {
    if (typeof onFinishSketch === "function") {
      onFinishSketch(() => {
        drawLineRef.current?.finish?.();
      });
    }
  }, [onFinishSketch]);

  // shape seçme toggle
  const toggleShape = (shape) => {
    setSelectedShapes((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape]
    );
  };

  // ✅ göz ikonundan zoom için
  const handleZoom = (geom) => {
    const map = mapRef.current;
    if (!map) return;
    const format = new WKT();
    try {
      const feature = format.readFeature(geom.wkt, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection(),
      });
      const extent = feature.getGeometry().getExtent();
      map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 800 });
    } catch (e) {
      console.error("zoom error:", e);
    }
  };

  return (
    <div className="map-canvas-wrapper">
      <div className="map-viewport">
        <div ref={slotRef} className="ol-map-slot" />

        {/* Sol alt: Get List */}
        <button
          className="map-fab list"
          type="button"
          onClick={() => setListOpen(true)}   // ✅ liste açılır
        >
          Get List
        </button>

        {/* Sağ alt: Get All */}
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
                let filtered = items;
                if (selectedShapes.length > 0) {
                  filtered = items.filter(it => {
                    const t = typeMap[it.type] || "";
                    return selectedShapes.includes(t);
                  });
                } else {
                  filtered = [];
                }
                console.log("Get All with filtered:", filtered);
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
          />
        )}

        {/* ✅ liste modalı */}
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
      />
    </div>
  );
}
