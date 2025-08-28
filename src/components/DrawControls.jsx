// src/components/DrawControls.jsx
import React from "react";
import DrawPoint from "./map/DrawPoint.jsx";
import DrawLine from "./map/DrawLine.jsx";
import DrawPolygon from "./map/DrawPolygon.jsx";

export default function DrawControls({ type, mode, map, sketchSource, onWkt, drawLineRef }) {
  if (mode !== "point") return null;

  if (type === "POINT") {
    return <DrawPoint map={map} sketchSource={sketchSource} onWkt={onWkt} />;
  }

  if (type === "LINESTRING") {
    return <DrawLine ref={drawLineRef} map={map} sketchSource={sketchSource} onWkt={onWkt} />;
  }

  if (type === "POLYGON") {
    return <DrawPolygon map={map} sketchSource={sketchSource} onWkt={onWkt} />;
  }

  return null;
}
