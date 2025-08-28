// src/components/map/highlightUtils.js
import { Feature } from "ol";
import Point from "ol/geom/Point";
import { fromExtent } from "ol/geom/Polygon";
import { Style, Icon } from "ol/style";
import React from "react";
import ReactDOMServer from "react-dom/server";
import PinRed from "../../assets/icons/PinRed.jsx"; // JSX pin bileşeni

// JSX → SVG string → data-uri
function getPinSvg(size = 48, color = "#ef4444") {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(PinRed, { size, color })   // ✅ JSX yerine createElement
  );
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
}

/**
 * Feature’a göre highlight noktası ekler
 */
export function addHighlight(feature, highlightSource) {
  if (!feature) return;
  const geomType = feature.getGeometry().getType();

  // önce temizle
  highlightSource.clear();

  if (geomType === "Point") {
    const coords = feature.getGeometry().getCoordinates();
    const f = new Feature(new Point(coords));
    f.setStyle(
      new Style({
        image: new Icon({
          src: getPinSvg(48, "#ef4444"),
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          scale: 1,
        }),
      })
    );
    highlightSource.addFeature(f);
  }

  if (geomType === "LineString") {
    const coords = feature.getGeometry().getCoordinates();
    if (coords.length >= 2) {
      const start = new Feature(new Point(coords[0]));
      start.setStyle(
        new Style({
          image: new Icon({
            src: getPinSvg(40, "#3b82f6"),
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            scale: 1,
          }),
        })
      );

      const end = new Feature(new Point(coords[coords.length - 1]));
      end.setStyle(
        new Style({
          image: new Icon({
            src: getPinSvg(40, "#3b82f6"),
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            scale: 1,
          }),
        })
      );

      highlightSource.addFeatures([start, end]);
    }
  }

  if (geomType === "Polygon") {
    const extent = feature.getGeometry().getExtent();
    const polyCenter = fromExtent(extent).getInteriorPoint().getCoordinates();

    const f = new Feature(new Point(polyCenter));
    f.setStyle(
      new Style({
        image: new Icon({
          src: getPinSvg(48, "#a855f7"),
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          scale: 1,
        }),
      })
    );
    highlightSource.addFeature(f);
  }
}
