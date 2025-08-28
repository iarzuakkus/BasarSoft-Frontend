import React, { useEffect, useRef } from "react";
import Overlay from "ol/Overlay";
import { toStringHDMS } from "ol/coordinate";
import { getCenter } from "ol/extent";
import { WKT } from "ol/format";
import { getGeometryById } from "../../api/geometryApi";

const format = new WKT();

function formatArea(polygon) {
  const area = polygon.getArea();
  return area > 10000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toFixed(2)} m²`;
}

function formatLength(line) {
  const length = line.getLength();
  return length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`;
}

export default function HoverAndClickPopup({ map, dataSource, items }) {
  const hoverRef = useRef();
  const clickRef = useRef();
  const hoverOverlayRef = useRef();
  const clickOverlayRef = useRef();

  useEffect(() => {
    if (!map || !dataSource) return;

    hoverOverlayRef.current = new Overlay({
      element: hoverRef.current,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -14],
    });
    map.addOverlay(hoverOverlayRef.current);

    clickOverlayRef.current = new Overlay({
      element: clickRef.current,
      positioning: "bottom-center",
      stopEvent: true,
      autoPan: true,
    });
    map.addOverlay(clickOverlayRef.current);

    const onMove = (evt) => {
      const feat = map.forEachFeatureAtPixel(evt.pixel, f => f);
      if (!feat || !feat.getGeometry) {
        hoverOverlayRef.current.setPosition(undefined);
        return;
      }
      const geom = feat.getGeometry();
      const coord = geom.getType() === "Point" ? geom.getCoordinates() : getCenter(geom.getExtent());
      hoverOverlayRef.current.setPosition(coord);
      hoverRef.current.innerHTML = feat.get("name") ?? "(no name)";
    };

    const onClick = async (evt) => {
      const feat = map.forEachFeatureAtPixel(evt.pixel, f => f);
      if (!feat || !feat.getGeometry) {
        clickOverlayRef.current.setPosition(undefined);
        return;
      }

      const geom = feat.getGeometry();
      const coord = geom.getType() === "Point" ? geom.getCoordinates() : getCenter(geom.getExtent());
      clickOverlayRef.current.setPosition(coord);

      const id = feat.get("id");
      let name = feat.get("name") ?? "(no name)";
      let wkt = feat.get("wkt") ?? "(no wkt)";
      let type = feat.get("type") ?? geom.getType();
      const hdms = toStringHDMS(coord);
      let extra = "";

      if (id) {
        try {
          const detailed = await getGeometryById(id);
          const d = detailed?.data;
          name = d?.name ?? name;
          wkt  = d?.wkt ?? wkt;
          type = d?.type ?? type;
        } catch (err) {
          console.warn("Detay verisi alınamadı:", err);
        }
      }

      if (type === "Polygon") {
        extra += `<br><b>Area:</b> ${formatArea(geom)}`;

        const polyExtent = geom.getExtent();
        const innerItems = (items || []).filter((item) => {
          try {
            const g = format.readGeometry(item.wkt);
            g.transform("EPSG:4326", "EPSG:3857");

            return (
              (item.type === "Point" || item.type === "LineString") &&
              geom.intersectsExtent(g.getExtent()) &&
              geom.intersectsCoordinate(g.getFirstCoordinate())
            );
          } catch {
            return false;
          }
        });

        if (innerItems.length > 0) {
          const innerText = innerItems.map(i => `• ${i.name} (${i.type})`).join("<br>");
          extra += `<br><b>Inside:</b><br>${innerText}`;
        }
      }

      if (type === "LineString") {
        extra += `<br><b>Length:</b> ${formatLength(geom)}`;
      }

      clickRef.current.innerHTML = `
        <div style="max-width:240px;padding:10px">
          <div><b>Name:</b> ${name}</div>
          <div><b>WKT:</b> ${wkt}</div>
          <div><b>Type:</b> ${type}</div>
          <div><b>HDMS:</b> ${hdms}</div>
          ${extra}
        </div>
      `;
    };

    map.on("pointermove", onMove);
    map.on("click", onClick);

    return () => {
      map.un("pointermove", onMove);
      map.un("click", onClick);
      map.removeOverlay(hoverOverlayRef.current);
      map.removeOverlay(clickOverlayRef.current);
    };
  }, [map, dataSource, items]);

  return (
    <>
      <div ref={hoverRef} className="popup-overlay" />
      <div ref={clickRef} className="popup-overlay" />
    </>
  );
}
