import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import { defaults as defaultInteractions } from "ol/interaction";

import { MAP_SRID, readFeatureSmart } from "./map/WktUtils.js";
import DrawControls from "./DrawControls.jsx";
import MapControls from "./map/MapControls.jsx";
import { createDataLayer, createSketchLayer } from "./layers.js";
import HoverAndClickPopup from "./map/HoverAndClickPopup.jsx"; // 🆕 EKLENDİ

export default function MapCanvas({ type, items, onGetAll, onOpenList, onSketchWkt, onFinishSketch }) {
  const slotRef = useRef(null);
  const mapRef = useRef(null);

  const dataSourceRef = useRef(new VectorSource());
  const sketchSourceRef = useRef(new VectorSource());

  const dataLayerRef = useRef(createDataLayer(dataSourceRef.current));
  const sketchLayerRef = useRef(createSketchLayer(sketchSourceRef.current));

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("cursor");
  const [currentSketchWkt, setCurrentSketchWkt] = useState("");

  const drawLineRef = useRef(null);
  const TR_BBOX_4326 = [25, 35.6, 45, 42.4];

  // === MAP INIT ===
  useEffect(() => {
    const map = new Map({
      target: slotRef.current,
      layers: [new TileLayer({ source: new OSM() }), dataLayerRef.current, sketchLayerRef.current],
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6,
        minZoom: 2,
        maxZoom: 18,
      }),
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

  // === ITEMS TO MAP ===
  useEffect(() => {
    const map = mapRef.current;
    const src = dataSourceRef.current;
    if (!map || !src) return;
    src.clear();

    if (Array.isArray(items) && items.length) {
      const feats = items.map(g => (g?.wkt ? readFeatureSmart(g.wkt) : null)).filter(Boolean);
      if (feats.length) src.addFeatures(feats);

      const extent = src.getExtent();
      if (extent && isFinite(extent[0])) {
        map.getView().fit(extent, { padding: [32, 32, 32, 32], maxZoom: 12, duration: 300 });
      }
    }
  }, [items]);

  // === RESET ON TYPE CHANGE ===
  useEffect(() => {
    if (!ready) return;
    sketchSourceRef.current?.clear();
    setCurrentSketchWkt("");
  }, [type, mode, ready]);

  useEffect(() => {
    const el = mapRef.current?.getTargetElement?.();
    if (!el) return;
    el.style.cursor = mode === "point" ? "crosshair" : "default";
    return () => { el.style.cursor = ""; };
  }, [mode]);

  // === HELPERS ===
  const handleReset = () => {
    dataSourceRef.current?.clear();
    sketchSourceRef.current?.clear();
    setCurrentSketchWkt("");
    const map = mapRef.current;
    if (map) {
      const tr = transformExtent(TR_BBOX_4326, "EPSG:4326", MAP_SRID);
      map.getView().fit(tr, { padding: [20, 20, 20, 20], maxZoom: 7, duration: 250 });
    }
  };

  const handleToggleMode = () => setMode(m => (m === "cursor" ? "point" : "cursor"));

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

  return (
    <div className="map-canvas-wrapper">
      <div className="map-viewport">
        <div ref={slotRef} className="ol-map-slot" />
        <button className="map-fab list" type="button" onClick={onOpenList}>Get List</button>
        <button className="map-fab" type="button" onClick={onGetAll}>Get All</button>

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
