/* eslint-disable react/prop-types */
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SHOPIFY_GREEN } from "./analytics-styles.js";

const styles = {
  wrap: (interactive, hovered) => ({
    position: "relative",
    minWidth: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    cursor: interactive ? "pointer" : "default",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    transform: interactive && hovered ? "translateY(-2px)" : "none",
    borderRadius: 8,
  }),
  inner: {
    width: "100%",
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    minHeight: "min-content",
    paddingBottom: 22,
    boxSizing: "border-box",
  },
  proBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    pointerEvents: "none",
  },
  hint: {
    position: "absolute",
    bottom: 8,
    right: 10,
    fontSize: 10,
    fontWeight: 700,
    color: SHOPIFY_GREEN,
    opacity: 0.85,
    pointerEvents: "none",
  },
};

/** Clickable KPI card wrapper with premium/locked handling. */
export function KpiCard({ premium, proBadge, onOpen, onLocked, children, ariaLabel }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (premium) onOpen?.();
    else onLocked?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      style={styles.wrap(true, hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      {proBadge ? (
        <span style={styles.proBadge}>
          <Sparkles size={10} />
          Pro
        </span>
      ) : null}
      <div style={styles.inner}>{children}</div>
      {premium && hovered ? <span style={styles.hint}>Click to explore</span> : null}
    </div>
  );
}
