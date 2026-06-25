/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useQuickSearch } from "./quick-search-provider.jsx";
import { QS_FONT, QS_GREEN } from "./quick-search-styles.js";

const TOOLTIP_KEY = "judgeme-quick-search-tooltip";

export function QuickSearchButton() {
  const { openSearch } = useQuickSearch();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(TOOLTIP_KEY) !== "1") {
      setShowTooltip(true);
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOOLTIP_KEY, "1");
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label="Quick search"
        onClick={() => {
          dismissTooltip();
          openSearch();
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "none",
          background: QS_GREEN,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <Search size={18} />
      </button>

      {showTooltip ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 230,
            background: "#202223",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "0 12px 28px rgba(32,34,35,0.28)",
            fontFamily: QS_FONT,
            zIndex: 50,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -6,
              right: 14,
              width: 12,
              height: 12,
              background: "#202223",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>Quick search</span>
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
            Search for features or settings
          </p>
        </div>
      ) : null}
    </div>
  );
}
