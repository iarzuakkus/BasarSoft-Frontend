// MapCanvas.jsx
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Circle as CircleStyle, Style } from "ol/style";
import { fromLonLat, transformExtent } from "ol/proj";
import { defaults as defaultInteractions } from "ol/interaction";

import DrawPoint from "./map/DrawPoint.jsx";
import DrawLine from "./map/DrawLine.jsx"; // sadece bu var
import DrawPolygon from "./map/DrawPolygon.jsx";
import MapControls from "./map/MapControls.jsx";

import { MAP_SRID, readFeatureSmart } from "./map/WktUtils.js";

export default function MapCanvas({ type, items, onGetAll, onOpenList, onSketchWkt, onFinishSketch }) {
  const slotRef = useRef(null);
  const mapRef = useRef(null);

  const dataSourceRef = useRef(new VectorSource());
  const sketchSourceRef = useRef(new VectorSource());

  const dataLayerRef = useRef(new VectorLayer({
    source: dataSourceRef.current,
    style: new Style({
      stroke: new Stroke({ color: "#0ea5e9", width: 2 }),
      fill: new Fill({ color: "rgba(14,165,233,.15)" }),
      image: new CircleStyle({ radius: 5, fill: new Fill({ color: "#0ea5e9" }) }),
    }),
    zIndex: 5,
  }));

  const sketchLayerRef = useRef(new VectorLayer({
    source: sketchSourceRef.current,
    style: new Style({
      stroke: new Stroke({ color: "#2563eb", width: 3 }),
      fill: new Fill({ color: "rgba(37,99,235,.12)" }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: "#2563eb" }),
        stroke: new Stroke({ color: "#fff", width: 2 }),
      }),
    }),
    zIndex: 10,
  }));

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("cursor");
  const [currentSketchWkt, setCurrentSketchWkt] = useState("");

  const drawLineRef = useRef(null);
  const TR_BBOX_4326 = [25, 35.6, 45, 42.4];

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

  useEffect(() => {
    if (!ready) return;
    try {
      sketchSourceRef.current?.clear();
      setCurrentSketchWkt("");
    } catch {}
  }, [type, mode, ready]);

  useEffect(() => {
    const el = mapRef.current?.getTargetElement?.();
    if (!el) return;
    el.style.cursor = mode === "point" ? "crosshair" : "default";
    return () => { if (el) el.style.cursor = ""; };
  }, [mode]);

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

        {ready && mode === "point" && type === "POINT" && (
          <DrawPoint map={mapRef.current} sketchSource={sketchSourceRef.current} onWkt={handleSketchWkt} />
        )}
        {ready && mode === "point" && type === "LINESTRING" && (
          <DrawLine ref={drawLineRef} map={mapRef.current} sketchSource={sketchSourceRef.current} onWkt={handleSketchWkt} />
        )}
        {ready && mode === "point" && type === "POLYGON" && (
          <DrawPolygon map={mapRef.current} sketchSource={sketchSourceRef.current} onWkt={handleSketchWkt} />
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
