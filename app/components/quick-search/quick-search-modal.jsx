/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import {
  APP_SEARCH_ITEMS,
  filterAppSearchItems,
  getRecommendedSearchItems,
} from "../../lib/app-search-index.shared.js";
import {
  backdropStyle,
  overlayStyle,
  QS_FONT,
  QS_GREEN,
  QS_GREEN_SOFT,
  resultIconWellStyle,
  resultRowStyle,
  searchPanelStyle,
  sectionLabelStyle,
} from "./quick-search-styles.js";

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || "");
}

export function QuickSearchModal({ onClose, onOpenGuide }) {
  const embedNavigate = useEmbedNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const hasQuery = query.trim().length > 0;
  const results = useMemo(
    () => (hasQuery ? filterAppSearchItems(query, APP_SEARCH_ITEMS) : getRecommendedSearchItems()),
    [query, hasQuery],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = (item) => {
    if (!item) return;
    embedNavigate(item.path);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  };

  const shortcutHint = isMacPlatform() ? "\u2318 K" : "Ctrl K";

  return (
    <div style={overlayStyle} role="presentation">
      <button type="button" aria-label="Close search" style={backdropStyle} onClick={onClose} />

      <div style={searchPanelStyle} role="dialog" aria-modal="true" aria-label="Quick search">
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #eef2f0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5ebe8",
              background: "#fafcfb",
            }}
          >
            <Search size={18} color="#6d7175" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search for features, settings, and more..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: QS_FONT,
                fontSize: 14,
                color: "#202223",
              }}
            />
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#8c9196",
                background: "#fff",
                border: "1px solid #e5ebe8",
                borderRadius: 6,
                padding: "3px 8px",
              }}
            >
              {shortcutHint}
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 18px", maxHeight: 360, overflowY: "auto" }}>
          <p style={sectionLabelStyle}>{hasQuery ? "Results" : "Recommended"}</p>

          {results.length === 0 ? (
            <p style={{ margin: "16px 4px", fontSize: 13, color: "#6d7175" }}>
              No matching features. Try a different search.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {results.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    style={resultRowStyle(index === activeIndex)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item)}
                  >
                    <span style={resultIconWellStyle}>
                      {Icon ? <Icon size={18} color={QS_GREEN} /> : null}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#202223" }}>
                        {item.title}
                      </span>
                      <span style={{ display: "block", fontSize: 12.5, color: "#6d7175", marginTop: 2 }}>
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight size={18} color="#b5babf" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "0 18px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 18px",
              borderRadius: 12,
              background: QS_GREEN_SOFT,
              border: "1px solid #cdeede",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: "#d6f3e6",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Sparkles size={18} color={QS_GREEN} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#202223" }}>
                  New to collecting reviews?
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#5c7368" }}>
                  Explore our quick setup guides to start collecting reviews.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenGuide}
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 8,
                border: `1px solid ${QS_GREEN}`,
                background: "#fff",
                color: QS_GREEN,
                fontFamily: QS_FONT,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              View Guides
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
