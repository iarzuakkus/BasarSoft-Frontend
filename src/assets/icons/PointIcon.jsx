import React from "react";

export default function PointIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="6" fill={color} /> {/* ✅ içi dolu */}
    </svg>
  );
}
