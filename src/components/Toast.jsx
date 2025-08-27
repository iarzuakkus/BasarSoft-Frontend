import React from "react";

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Error</h3>
        <div className="row">
          <div className="hint" style={{ color: "#b91c1c" }}>{message}</div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={onClose} type="button">Close</button>
        </div>
      </div>
    </div>
  );
}
