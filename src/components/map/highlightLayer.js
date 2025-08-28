// src/components/map/highlightLayer.js
import { Style, Icon } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { getPinRedDataUrl } from "../ui/PinRedIconUtil.jsx"; // 👈 JSX util'den pin alıyoruz

export const createHighlightSource = () => new VectorSource();

export const createHighlightLayer = (source) => {
  // JSX Pin'i SVG data-url'e çeviriyoruz
  const svgUrl = getPinRedDataUrl(64, "#ef4444");

  return new VectorLayer({
    source,
    style: new Style({
      image: new Icon({
        src: svgUrl,
        anchor: [0.5, 1],          // alt orta hizalama
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        scale: 1.0,                // boyut
      }),
    }),
    zIndex: 9999,
  });
};
