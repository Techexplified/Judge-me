/* eslint-disable react/prop-types */
import { useState } from "react";
import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

const ZOOM_LEVELS = [0.75, 1, 1.25];

export function BrowserPreviewFrame({
  shopDomain,
  productHandle = "sample-product",
  previewUrl,
  viewport = "desktop",
  children,
}) {
  const [zoomIndex, setZoomIndex] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const zoom = ZOOM_LEVELS[zoomIndex];
  const previewWidth = viewport === "mobile" ? 390 : 920;
  const url =
    previewUrl ||
    `${shopDomain || "your-store.myshopify.com"}/products/${productHandle}/review`;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: EDITOR_TOKENS.previewBg,
        fontFamily: UI_FONT,
        position: fullscreen ? "fixed" : "relative",
        inset: fullscreen ? 0 : undefined,
        zIndex: fullscreen ? 50 : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          padding: "10px 16px",
        }}
      >
        <button
          type="button"
          onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          disabled={zoomIndex === 0}
          style={iconBtnStyle}
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: EDITOR_TOKENS.textMuted, minWidth: 44, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          style={iconBtnStyle}
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          style={iconBtnStyle}
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "8px 24px 32px",
        }}
      >
        <div
          style={{
            width: previewWidth,
            maxWidth: "100%",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          <div
            style={{
              background: EDITOR_TOKENS.white,
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
              overflow: "hidden",
              border: `1px solid ${EDITOR_TOKENS.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderBottom: `1px solid ${EDITOR_TOKENS.borderLight}`,
                background: "#FAFBFB",
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {["#FF5F57", "#FFBD2E", "#28CA41"].map((c) => (
                  <span
                    key={c}
                    style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }}
                  />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 8,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: EDITOR_TOKENS.white,
                  border: `1px solid ${EDITOR_TOKENS.border}`,
                  fontSize: 11,
                  color: EDITOR_TOKENS.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {url}
              </div>
            </div>
            <div
              style={{
                padding: viewport === "mobile" ? 16 : 32,
                background: "#F6F7F8",
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  background: EDITOR_TOKENS.white,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: EDITOR_TOKENS.textMuted,
};
