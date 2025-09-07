import { getDistance } from "ol/sphere";
import { toLonLat } from "ol/proj";
import { useEffect, useState } from "react";

export default function DistanceMeasure({ map, selectedPoint }) {
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!map || !selectedPoint) return;

    const handleMove = (evt) => {
      const coord = toLonLat(evt.coordinate);       // imlec konumu (lon, lat)
      const pointCoord = toLonLat(selectedPoint);   // seçilen nokta
      const dist = getDistance(coord, pointCoord);  // metre cinsinden
      setDistance(dist);
      console.log("Mesafe:", dist.toFixed(2), "m");
    };

    map.on("pointermove", handleMove);

    return () => {
      map.un("pointermove", handleMove);
    };
  }, [map, selectedPoint]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "14px"
      }}
    >
      {distance !== null && (
        <span>Mesafe: {distance.toFixed(2)} m</span>
      )}
    </div>
  );
}
