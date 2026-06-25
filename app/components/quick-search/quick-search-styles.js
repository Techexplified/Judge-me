import { APP_FONT, SHOPIFY_GREEN } from "../admin-ui.jsx";

export const QS_FONT = APP_FONT;
export const QS_GREEN = SHOPIFY_GREEN;
export const QS_GREEN_TINT = "#ecfdf3";
export const QS_GREEN_SOFT = "#ecfdf5";

export const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "grid",
  placeItems: "start center",
  padding: "72px 24px 24px",
  overflowY: "auto",
};

export const backdropStyle = {
  position: "absolute",
  inset: 0,
  border: "none",
  padding: 0,
  margin: 0,
  background: "rgba(32,34,35,0.45)",
  cursor: "pointer",
};

export const searchPanelStyle = {
  position: "relative",
  width: "min(560px, 100%)",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(32,34,35,0.18)",
  border: "1px solid #e5ebe8",
  zIndex: 1,
  fontFamily: QS_FONT,
  color: "#202223",
  overflow: "hidden",
};

export const guidePanelStyle = {
  position: "relative",
  width: "min(960px, 100%)",
  maxHeight: "min(90vh, 640px)",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(32,34,35,0.22)",
  border: "1px solid #e5ebe8",
  zIndex: 2,
  fontFamily: QS_FONT,
  color: "#202223",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export const sectionLabelStyle = {
  margin: "0 0 8px",
  padding: "0 4px",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#8c9196",
};

export function resultRowStyle(active) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid transparent",
    background: active ? "#f5f9f7" : "transparent",
    cursor: "pointer",
    fontFamily: QS_FONT,
    transition: "background 0.12s ease",
  };
}

export const resultIconWellStyle = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 10,
  background: QS_GREEN_TINT,
  display: "grid",
  placeItems: "center",
};
