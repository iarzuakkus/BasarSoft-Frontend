// src/components/icons/PinRed.jsx
import React from "react";

export default function PinRed({ size = 32, color = "#ef4444" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 384 512"
      width={size}
      height={size}
      fill={color}
    >
      {/* Pin gövdesi */}
      <path d="M172 502c18 31 62 31 80 0 30-51 132-222 132-334C384 75 298 0 192 0S0 75 0 168c0 112 102 283 132 334z" />
      {/* İç yuvarlak */}
      <circle cx="192" cy="168" r="72" fill="#fff" />
    </svg>
  );
}
