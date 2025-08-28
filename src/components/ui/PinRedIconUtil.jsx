// src/components/ui/PinRedIconUtil.jsx
import React from "react";
import ReactDOMServer from "react-dom/server";
import PinRed from "../../assets/icons/PinRed.jsx"; // JSX pin bileşenin

// JSX → SVG string → data-uri
export const getPinRedDataUrl = (size = 64, color = "#ef4444") => {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    <PinRed size={size} color={color} />
  );
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
};
