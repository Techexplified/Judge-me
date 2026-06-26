/* eslint-disable react/prop-types */
import { useState } from "react";
import { HandHelping, X } from "lucide-react";
import { useQuickSearch } from "./quick-search-provider.jsx";
import { QS_FONT, QS_GREEN } from "./quick-search-styles.js";
import { getQuickSearchShortcutLabel } from "./quick-search-shortcut.js";

const TOOLTIP_KEY = "judgeme-quick-search-tooltip";

export function QuickSearchButton() {
  const { openSearch } = useQuickSearch();
  const shortcutLabel = getQuickSearchShortcutLabel();
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

      <button
        type="button"
        aria-label="Help and quick search"
        title={`Help and navigation (${shortcutLabel})`}
        onClick={() => {
          dismissTooltip();
          openSearch();
        }}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          border: "none",
          background: QS_GREEN,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,128,96,0.35)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)";
          e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,128,96,0.42)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,128,96,0.35)";
        }}
      >
        <HandHelping size={22} strokeWidth={2.1} />
      </button>
    </div>
  );
}
