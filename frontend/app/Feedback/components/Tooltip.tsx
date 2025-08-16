import React from "react";
import ReactDOM from "react-dom";

interface TooltipProps {
  text: string;
  x: number;
  y: number;
}

const tooltipStyle: React.CSSProperties = {
  position: "fixed",
  background: "rgba(0,0,0,0.95)",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "0.8rem",
  zIndex: 9999,
  pointerEvents: "none",
  maxWidth: 260,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

const Tooltip: React.FC<TooltipProps> = ({ text, x, y }) => {
  return ReactDOM.createPortal(
    <div style={{ ...tooltipStyle, left: x, top: y }}>{text}</div>,
    document.body
  );
};

export default Tooltip; 