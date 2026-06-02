/* eslint-disable react/prop-types */
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { modalStyles, VIEW_LABELS } from "./analytics-styles.js";

const styles = {
  preview: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #e1e3e5",
    background: "linear-gradient(135deg, #ecfdf3 0%, #f6f6f7 50%, #fff4f4 100%)",
    height: 180,
    filter: "blur(3px)",
    opacity: 0.7,
    pointerEvents: "none",
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(1px)",
  },
  previewInner: {
    textAlign: "center",
    padding: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#fff4f4",
    border: "1px solid #fed3d1",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 12px",
  },
  copy: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#8e1f0b",
    lineHeight: 1.5,
    maxWidth: 420,
  },
  sub: {
    margin: "8px 0 0",
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.45,
  },
  featureList: {
    margin: "12px 0 0",
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#5c5f62",
  },
};

export function AnalyticsUpgradeTeaser({ view, onClose }) {
  const label = VIEW_LABELS[view] || "Interactive analytics";

  return (
    <div style={modalStyles.root} role="dialog" aria-modal="true" aria-labelledby="upgrade-teaser-title">
      <button type="button" style={modalStyles.backdrop} aria-label="Close" onClick={onClose} />
      <div style={{ ...modalStyles.panel, width: "min(520px, 100%)" }}>
        <div style={modalStyles.head}>
          <h2 id="upgrade-teaser-title" style={modalStyles.title}>
            Unlock {label} analytics
          </h2>
          <button type="button" style={modalStyles.close} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={styles.preview} aria-hidden />
          <div style={styles.previewOverlay}>
            <div style={styles.previewInner}>
              <div style={styles.iconWrap}>
                <Sparkles size={22} color="#4338ca" />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#202223" }}>Premium analytics preview</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <AlertTriangle size={18} color="#d72c0d" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={styles.copy}>
            Your 7-day trial has ended. Upgrade to unlock interactive charts, drill-down insights, and
            product-level analytics.
          </p>
        </div>
        <p style={styles.sub}>Pricing is coming soon — core reviews, widgets & moderation stay free.</p>
        <ul style={styles.featureList}>
          <li>• Daily volume & rating breakdowns</li>
          <li>• Velocity trends & sentiment over time</li>
          <li>• Complaint themes from negative reviews</li>
        </ul>
        <div style={modalStyles.footer}>
          <button type="button" style={modalStyles.btnPrimary} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
