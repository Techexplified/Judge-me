/* eslint-disable react/prop-types */
import { useState } from "react";
import { Crown } from "lucide-react";
import { SHOPIFY_GREEN } from "./analytics-styles.js";

const styles = {
  wrap: (interactive, hovered, locked) => ({
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
    boxSizing: "border-box",
    ...(locked
      ? {
          outline: "1px solid #c8e6dc",
          outlineOffset: -1,
          background: "linear-gradient(180deg, #fafcfb 0%, #f6fbf8 100%)",
        }
      : {}),
  }),
  inner: {
    width: "100%",
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    minHeight: "min-content",
    boxSizing: "border-box",
  },
  proBadge: {
    position: "absolute",
    bottom: 10,
    left: 12,
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    fontWeight: 800,
    padding: "5px 10px",
    borderRadius: 6,
    background: SHOPIFY_GREEN,
    color: "#fff",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    boxShadow: "0 1px 3px rgba(0, 100, 72, 0.22)",
    pointerEvents: "none",
  },
  hint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    fontSize: 10,
    fontWeight: 700,
    color: SHOPIFY_GREEN,
    opacity: 0.9,
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

  const locked = Boolean(proBadge && !premium);

  return (
    <div
      style={styles.wrap(true, hovered, locked)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      <div style={{ ...styles.inner, paddingBottom: locked ? 36 : 22 }}>{children}</div>
      {proBadge ? (
        <span style={styles.proBadge}>
          <Crown size={11} strokeWidth={2.5} />
          Pro
        </span>
      ) : null}
      {hovered ? (
        <span style={styles.hint}>
          {premium ? "Click to explore" : "Upgrade to unlock"}
        </span>
      ) : null}
    </div>
  );
}
