import { Fill, Stroke, Circle as CircleStyle, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import { MultiPoint } from "ol/geom";

// OL geometry type -> renk
const shapeColors = {
  Point: "#f97316",      // turuncu
  LineString: "#3b82f6", // mavi
  Polygon: "#a855f7"     // mor
};

function styleByGeometry(feature) {
  const type = feature.getGeometry().getType(); // "Point" | "LineString" | "Polygon"
  const color = shapeColors[type] || "#0ea5e9";

  if (type === "Point") {
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: "#fff", width: 2 })
      })
    });
  }

  if (type === "LineString") {
    return [
      new Style({
        stroke: new Stroke({ color, width: 3 })
      }),
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#fff", width: 1.5 })
        }),
        geometry: f => new MultiPoint(f.getGeometry().getCoordinates())
      })
    ];
  }

  if (type === "Polygon") {
    return [
      new Style({
        stroke: new Stroke({ color, width: 2 }),
        fill: new Fill({ color: color + "55" }) // yarı şeffaf iç dolgu
      }),
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#fff", width: 1.5 })
        }),
        geometry: f => new MultiPoint(f.getGeometry().getCoordinates()[0])
      })
    ];
  }

  return new Style({
    stroke: new Stroke({ color: "#0ea5e9", width: 2 }),
    fill: new Fill({ color: "rgba(14,165,233,.15)" })
  });
}

export const createDataLayer = (source) =>
  new VectorLayer({
    source,
    style: styleByGeometry,
    zIndex: 5,
  });

export const createSketchLayer = (source) =>
  new VectorLayer({
    source,
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
  });
