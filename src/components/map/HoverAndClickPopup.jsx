// src/components/map/HoverAndClickPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import { toStringHDMS } from "ol/coordinate";
import { WKT } from "ol/format";
import Overlay from "ol/Overlay";
import { getGeometryById, updateGeometry, deleteGeometry } from "../../api/geometryApi";
import PopupOverlay from "./PopupOverlay";
import GeometryInfoPopup from "./GeometryInfoPopup";
import "../../styles/popup.css";
import EyeIcon from "../ui/EyeIcon"; // 👁️ icon import

const wktFormat = new WKT();
const PIXEL_TOLERANCE = 10; // px
const muDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function safeFormatArea(geom) {
  try {
    const a = geom.getArea();
    return a > 10000 ? `${(a / 1_000_000).toFixed(2)} km²` : `${a.toFixed(2)} m²`;
  } catch {
    return "-";
  }
}
function safeFormatLength(geom) {
  try {
    const L = geom.getLength();
    return L > 1000 ? `${(L / 1000).toFixed(2)} km` : `${L.toFixed(2)} m`;
  } catch {
    return "-";
  }
}

export default function HoverAndClickPopup({ map, items, setItems, mode }) {
  const hoverRef = useRef(null);
  const hoverOverlayRef = useRef(null);
  const [hoverText, setHoverText] = useState(null);
  const [hoverCoord, setHoverCoord] = useState(null);

  const [popupContent, setPopupContent] = useState(null);
  const [popupCoord, setPopupCoord] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!map) return;
    hoverOverlayRef.current = new Overlay({
      element: hoverRef.current,
      positioning: "top-center",
      stopEvent: false,
      offset: [0, -16],
    });
    map.addOverlay(hoverOverlayRef.current);
    return () => {
      try {
        map.removeOverlay(hoverOverlayRef.current);
      } catch {}
      hoverOverlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!hoverOverlayRef.current) return;
    if (!popupOpen && hoverText && hoverCoord) {
      hoverOverlayRef.current.setPosition(hoverCoord);
    } else {
      hoverOverlayRef.current.setPosition(undefined);
    }
  }, [hoverText, hoverCoord, popupOpen]);

  useEffect(() => {
    if (!map || !items) return;

    const geometries = items
      .map((it) => {
        try {
          const g = wktFormat.readGeometry(it.wkt, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          return { ...it, geometry: g };
        } catch (err) {
          console.warn("WKT parse error:", it, err);
          return null;
        }
      })
      .filter(Boolean);

    const findGeometryAt = (evt) => {
      try {
        const mouseCoord = evt.coordinate;
        const res = map.getView().getResolution() || 1;
        const tolMU = PIXEL_TOLERANCE * res;

        // 1. Önce Point
        for (const it of geometries.filter((g) => g.geometry.getType() === "Point")) {
          const p = it.geometry.getCoordinates();
          if (muDist(p, mouseCoord) <= tolMU) return { item: it, hitCoord: p };
        }

        // 2. Sonra LineString
        for (const it of geometries.filter((g) => g.geometry.getType() === "LineString")) {
          const cp = it.geometry.getClosestPoint(mouseCoord);
          if (muDist(cp, mouseCoord) <= tolMU) return { item: it, hitCoord: cp };
        }

        // 3. En son Polygon → küçükten büyüğe sırala
        const polys = geometries
          .filter((g) => g.geometry.getType() === "Polygon")
          .sort((a, b) => a.geometry.getArea() - b.geometry.getArea());

        for (const it of polys) {
          const geom = it.geometry;
          if (geom.intersectsCoordinate(mouseCoord)) {
            return { item: it, hitCoord: mouseCoord };
          }
          const cp = geom.getClosestPoint(mouseCoord);
          if (muDist(cp, mouseCoord) <= tolMU) {
            return { item: it, hitCoord: cp };
          }
        }

        return null;
      } catch (e) {
        console.warn("findGeometryAt:", e);
        return null;
      }
    };

    const onMove = (evt) => {
      if (popupOpen || mode !== "cursor") return; // sadece cursor modunda hover çalışsın
      const found = findGeometryAt(evt);
      if (found) {
        setHoverText(found.item.name ?? "(no name)");
        setHoverCoord(found.hitCoord);
      } else {
        setHoverText(null);
        setHoverCoord(null);
      }
    };

    const onClick = async (evt) => {
      if (mode !== "cursor") return; // çizim modunda click çalışmasın

      if (popupOpen) {
        const hit = findGeometryAt(evt);
        if (!hit) {
          setPopupContent(null);
          setPopupCoord(null);
          setPopupOpen(false);
          return;
        }
      }

      const found = findGeometryAt(evt);
      if (!found) return;

      setHoverText(null);
      setHoverCoord(null);

      try {
        const it = found.item;
        const geom = it.geometry;
        const type = geom.getType();

        const coord = [found.hitCoord[0], found.hitCoord[1]];
        setPopupCoord(coord);

        let name = it.name ?? "(no name)";
        let wkt = it.wkt ?? "(no wkt)";
        let typeName = it.type ?? type;
        const hdms = toStringHDMS(coord);

        if (it.id) {
          try {
            const detailed = await getGeometryById(it.id);
            const d = detailed?.data;
            if (d) {
              name = d.name ?? name;
              wkt = d.wkt ?? wkt;
              typeName = d.type ?? typeName;
            }
          } catch (e) {
            console.warn("getGeometryById failed:", e);
          }
        }

        let polygonSection = null;
        if (type === "Polygon") {
          const insidePoints = [];
          const intersectingLines = [];

          for (const other of geometries) {
            if (other === it) continue;
            const g = other.geometry;
            const t = g.getType();

            if (t === "Point") {
              if (geom.intersectsCoordinate(g.getCoordinates())) {
                insidePoints.push(other);
              }
            } else if (t === "LineString") {
              const cp = g.getClosestPoint(coord);
              if (geom.intersectsExtent(g.getExtent()) || geom.intersectsCoordinate(cp)) {
                intersectingLines.push(other);
              }
            }
          }

          polygonSection = (
            <div className="info-section">
              <h5>
                Polygon Metrics
                <span className="badge">Area: {safeFormatArea(geom)}</span>
              </h5>

              {insidePoints.length > 0 && (
                <>
                  <h5>
                    Contains Points <span className="badge">{insidePoints.length}</span>
                  </h5>
                  <ul className="info-list">
                    {insidePoints.map((p) => (
                      <li
                        key={`pt-${p.id || p.name}`}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span>
                          {p.name} <span className="badge">Point</span>
                        </span>
                        <button
                          className="eye-btn"
                          onClick={() => {
                            map.getView().fit(p.geometry.getExtent(), { maxZoom: 14, duration: 500 });
                          }}
                        >
                          <EyeIcon size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {intersectingLines.length > 0 && (
                <>
                  <h5>
                    Intersecting LineStrings{" "}
                    <span className="badge">{intersectingLines.length}</span>
                  </h5>
                  <ul className="info-list">
                    {intersectingLines.map((l) => (
                      <li
                        key={`ln-${l.id || l.name}`}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span>
                          {l.name} <span className="badge">LineString</span>
                        </span>
                        <button
                          className="eye-btn"
                          onClick={() => {
                            map.getView().fit(l.geometry.getExtent(), { maxZoom: 14, duration: 500 });
                          }}
                        >
                          <EyeIcon size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {insidePoints.length === 0 && intersectingLines.length === 0 && (
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  No related points or lines found for this polygon.
                </div>
              )}
            </div>
          );
        }

        let lineSection = null;
        if (type === "LineString") {
          lineSection = (
            <div className="info-section">
              <h5>
                LineString Metrics{" "}
                <span className="badge">Length: {safeFormatLength(geom)}</span>
              </h5>
            </div>
          );
        }

        setPopupContent(
          <GeometryInfoPopup
            feature={{
              id: it.id,
              name,
              wkt,
              type: typeName,
              hdms,
              metrics: polygonSection || lineSection,
            }}
            onClose={() => {
              setPopupContent(null);
              setPopupCoord(null);
              setPopupOpen(false);
            }}
            onUpdate={async (updated) => {
              await updateGeometry(updated.id, updated);
              if (typeof setItems === "function") {
                setItems((prev) =>
                  prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
                );
              }
            }}
            onDelete={async (id) => {
              await deleteGeometry(id);
              if (typeof setItems === "function") {
                setItems((prev) => prev.filter((g) => g.id !== id));
              }
              setPopupContent(null);
              setPopupCoord(null);
              setPopupOpen(false);
            }}
          />
        );
        setPopupOpen(true);
      } catch (err) {
        console.error("popup build error:", err);
      }
    };

    map.on("pointermove", onMove);
    map.on("click", onClick);
    return () => {
      map.un("pointermove", onMove);
      map.un("click", onClick);
    };
  }, [map, items, popupOpen, setItems, mode]);

  return (
    <>
      <div
        ref={hoverRef}
        style={{
          background: "#111827",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          whiteSpace: "nowrap",
          boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
          pointerEvents: "none",
          display: popupOpen || !hoverText ? "none" : "block",
        }}
      >
        {hoverText}
      </div>

      <PopupOverlay
        map={map}
        content={popupContent}
        coordinate={popupCoord}
        onClose={() => {
          setPopupContent(null);
          setPopupCoord(null);
          setPopupOpen(false);
        }}
      />
    </>
  );
}
