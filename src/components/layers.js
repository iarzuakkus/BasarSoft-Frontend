import { Fill, Stroke, Circle as CircleStyle, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";

export const createDataLayer = (source) =>
  new VectorLayer({
    source,
    style: new Style({
      stroke: new Stroke({ color: "#0ea5e9", width: 2 }),
      fill: new Fill({ color: "rgba(14,165,233,.15)" }),
      image: new CircleStyle({ radius: 5, fill: new Fill({ color: "#0ea5e9" }) }),
    }),
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
