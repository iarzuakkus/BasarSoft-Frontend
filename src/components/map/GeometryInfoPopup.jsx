import React, { useState } from "react";
import "../../styles/popup.css";

export default function GeometryInfoPopup({ feature, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: feature?.name || "",
    wkt: feature?.wkt || "",
    type: feature?.type || "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await onUpdate({ ...feature, ...form });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(feature.id);
  };

  return (
    <div className="geometry-info">
      {isEditing ? (
        <div className="form-fields">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="popup-input"
          />

          <label>WKT</label>
          <textarea
            name="wkt"
            rows="4"
            value={form.wkt}
            onChange={handleChange}
            className="popup-textarea"
          />

          <label>Type</label>
          <input
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="popup-input"
          />
        </div>
      ) : (
        <table className="info-table">
          <tbody>
            <tr><th>Name</th><td>{form.name}</td></tr>
            <tr><th>WKT</th><td className="wkt-cell">{form.wkt}</td></tr>
            <tr><th>Type</th><td>{form.type}</td></tr>
            {feature?.hdms && <tr><th>HDMS</th><td>{feature.hdms}</td></tr>}
          </tbody>
        </table>
      )}

      {/* ✅ Polygon/Line metrics tekrar eklendi */}
      {feature?.metrics && (
        <div className="info-section">
          {feature.metrics}
        </div>
      )}

      <div className="popup-actions">
        {isEditing ? (
          <>
            <button className="btn save" onClick={handleSave}>Save</button>
            <button className="btn cancel" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn delete" onClick={handleDelete}>
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>
          </>
        ) : (
          <>
            <button className="btn edit" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn delete" onClick={handleDelete}>
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
