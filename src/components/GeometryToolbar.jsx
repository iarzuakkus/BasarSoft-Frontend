import React from "react";
import DropdownPill from "./ui/DropdownPill.jsx";

const OPTIONS = [
  { label: "Point", value: "POINT" },
  { label: "Linestring", value: "LINESTRING" },
  { label: "Polygon", value: "POLYGON" },
];

export default function GeometryToolbar({ type, onChangeType, onOpenCreate }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button type="button" className="pill pill-orange" onClick={onOpenCreate}>
          Add
        </button>

        <DropdownPill
          value={type}
          options={OPTIONS}
          onChange={onChangeType}
        />
      </div>
    </div>
  );
}
