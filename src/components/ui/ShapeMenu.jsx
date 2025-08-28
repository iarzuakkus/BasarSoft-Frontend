// src/components/ui/ShapeMenu.jsx
import React from "react";
import "../../styles/shapemenu.css";
import PointIcon from "../../assets/icons/PointIcon.jsx";
import LineIcon from "../../assets/icons/LineIcon.jsx";
import PolygonIcon from "../../assets/icons/PolygonIcon.jsx";

export default function ShapeMenu({ open, selected = [], onToggle }) {
  if (!open) return null;

  const shapes = [
    { key: "POINT", Icon: PointIcon, color: "#f97316" },     // turuncu
    { key: "LINESTRING", Icon: LineIcon, color: "#3b82f6" }, // mavi
    { key: "POLYGON", Icon: PolygonIcon, color: "#a855f7" }, // mor
  ];

  return (
    <div className="shape-menu">
      {shapes.map(({ key, Icon, color }) => (
        <button
          key={key}
          className={`shape-btn ${selected.includes(key) ? "selected" : ""}`}
          style={{
            borderColor: color,
            background: selected.includes(key) ? color + "22" : "white",
          }}
          onClick={() => onToggle(key)}
        >
          <Icon size={20} color={color} />
        </button>
      ))}
    </div>
  );
}
