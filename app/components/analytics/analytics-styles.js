import { APP_FONT } from "../admin-ui.jsx";

export const ANALYTICS_FONT = APP_FONT;

export const CHART_TICK = { fontSize: 11, fontFamily: ANALYTICS_FONT };
export const CHART_TICK_SM = { fontSize: 12, fontWeight: 600, fontFamily: ANALYTICS_FONT };
export const CHART_LEGEND = { fontSize: 12, fontFamily: ANALYTICS_FONT };
export const CHART_TOOLTIP = { fontFamily: ANALYTICS_FONT, fontSize: 12 };

export const SHOPIFY_GREEN = "#008060";
export const NEUTRAL_SEGMENT = "#d89b00";
export const CRITICAL_RED = "#d72c0d";
export const CHART_COLORS = {
  r1: CRITICAL_RED,
  r2: "#e85d4c",
  r3: NEUTRAL_SEGMENT,
  r4: "#5bb98c",
  r5: SHOPIFY_GREEN,
  positive: SHOPIFY_GREEN,
  neutral: NEUTRAL_SEGMENT,
  negative: CRITICAL_RED,
  trend: "#006e52",
  area: "#00806033",
};

export const modalStyles = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    padding: 0,
    margin: 0,
    background: "rgba(32,34,35,0.45)",
    cursor: "pointer",
  },
  panel: {
    position: "relative",
    width: "min(920px, 100%)",
    maxHeight: "min(90vh, 860px)",
    overflow: "auto",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 24px 48px rgba(32,34,35,0.18)",
    border: "1px solid #e1e3e5",
    padding: "24px 28px",
    zIndex: 1,
    fontFamily: ANALYTICS_FONT,
    fontSize: 14,
    color: "#202223",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 950, color: "#202223", margin: 0, lineHeight: 1.2 },
  close: {
    border: "none",
    background: "#f6f6f7",
    borderRadius: 10,
    padding: 8,
    cursor: "pointer",
    color: "#5c5f62",
    display: "grid",
    placeItems: "center",
  },
  insightRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  bigMetric: { fontSize: 28, fontWeight: 900, color: "#202223", lineHeight: 1 },
  badge: (tone) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    background: tone === "green" ? "#ecfdf3" : tone === "red" ? "#fff4f4" : "#f6f6f7",
    color: tone === "green" ? SHOPIFY_GREEN : tone === "red" ? CRITICAL_RED : "#5c5f62",
  }),
  insightList: { margin: "0 0 16px", padding: 0, listStyle: "none", display: "grid", gap: 6 },
  insightItem: { fontSize: 13, fontWeight: 600, color: "#5c5f62", lineHeight: 1.45 },
  chartBlock: { marginBottom: 20, width: "100%", minHeight: 0 },
  chartSurface: (height) => ({
    width: "100%",
    height,
    minHeight: height,
    position: "relative",
  }),
  chartTitle: { fontSize: 13, fontWeight: 800, color: "#202223", margin: "0 0 10px" },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTop: "1px solid #e1e3e5",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #c9cccf",
    background: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: ANALYTICS_FONT,
    textDecoration: "none",
    color: "#202223",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: SHOPIFY_GREEN,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: ANALYTICS_FONT,
    textDecoration: "none",
    color: "#fff",
  },
  emptyChart: {
    height: 220,
    display: "grid",
    placeItems: "center",
    background: "#f6f6f7",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
  },
};

export const VIEW_LABELS = {
  volume: "Total Reviews",
  rating: "Average Rating",
  velocity: "Review Velocity",
  sentiment: "Sentiment Split",
};
