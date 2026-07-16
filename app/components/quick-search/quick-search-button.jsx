/* eslint-disable react/prop-types */
import { useState } from "react";
import { Hand, X } from "lucide-react";
import { useQuickSearch } from "./quick-search-provider.jsx";
import { QS_FONT, QS_GREEN } from "./quick-search-styles.js";
import { getQuickSearchShortcutLabel } from "./quick-search-shortcut.js";

const TOOLTIP_KEY = "verdict-quick-search-tooltip";

export function QuickSearchButton() {
  const { openSearch } = useQuickSearch();
  const shortcutLabel = getQuickSearchShortcutLabel();
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(TOOLTIP_KEY) !== "1";
  });

  const dismissTooltip = () => {
    setShowTooltip(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOOLTIP_KEY, "1");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 900,
        display: "inline-flex",
      }}
    >
      {showTooltip ? (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            right: 0,
            width: 230,
            background: "#202223",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "0 12px 28px rgba(32,34,35,0.28)",
            fontFamily: QS_FONT,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -6,
              right: 18,
              width: 12,
              height: 12,
              background: "#202223",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>Need help?</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#202223",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "2px 7px",
                }}
              >
                New
              </span>
            </span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissTooltip}
              style={{
                border: "none",
                background: "transparent",
                color: "#c9cccf",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#d7d9db", lineHeight: 1.4 }}>
            Search for features or settings ({shortcutLabel})
          </p>
        </div>
      ) : null}

      <style>{`
        @keyframes verdict-help-wave {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(6deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <button
        type="button"
        aria-label="Help and quick search"
        title={`Help and navigation (${shortcutLabel})`}
        onClick={() => {
          dismissTooltip();
          openSearch();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: `linear-gradient(135deg, ${QS_GREEN} 0%, #00a37a 100%)`,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          boxShadow: hovered
            ? "0 12px 30px rgba(0,128,96,0.45)"
            : "0 8px 22px rgba(0,128,96,0.33)",
          transform: hovered ? "translateY(-2px) scale(1.05)" : "none",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
        }}
      >
        <Hand
          size={24}
          strokeWidth={2.1}
          style={{
            transformOrigin: "70% 80%",
            animation: hovered ? "verdict-help-wave 0.7s ease-in-out" : "none",
          }}
        />
      </button>
    </div>
  );
}
