// src/components/icons/PinRed.jsx
import React from "react";

export default function PinRed({ size = 32, color = "#ef4444" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 384 512"
      width={size}
      height={size}
    >
      {/* Pin gövdesi (sivri uçlu) */}
      <path
        d="M192 0C86 0 0 86 0 192c0 77.4 55 142.6 104 210.9 34.8 47.9 66.4 91.6 80 109.1 13.6-17.5 45.2-61.2 80-109.1C329 334.6 384 269.4 384 192 384 86 298 0 192 0z"
        fill={color}
      />
      {/* İç beyaz daire */}
      <circle cx="192" cy="192" r="72" fill="#fff" />
    </svg>
  );
}
