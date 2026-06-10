/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router";
import { Sparkles, X } from "lucide-react";
import { UPGRADE_NOTICE } from "../admin-ui";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { modalStyles, VIEW_LABELS } from "./analytics-styles.js";

const styles = {
  preview: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #e1e3e5",
    background: "linear-gradient(135deg, #ecfdf3 0%, #f6f6f7 50%, #fffbea 100%)",
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
    background: UPGRADE_NOTICE.bg,
    border: `1px solid ${UPGRADE_NOTICE.bd}`,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 12px",
  },
  copy: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: UPGRADE_NOTICE.fgMuted,
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
  const location = useLocation();
  const settingsHref = mergeShopifyEmbedParams("/app/settings", location.search);
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
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#202223" }}>Pro analytics preview</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <Sparkles size={18} color={UPGRADE_NOTICE.icon} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={styles.copy}>
            Upgrade to Pro to unlock interactive charts, drill down insights, and product level analytics.
            Start with a 14 day free trial. Billing handled securely by Shopify.
          </p>
        </div>
        <p style={styles.sub}>Core reviews, widgets & moderation stay free.</p>
        <ul style={styles.featureList}>
          <li>• Daily volume & rating breakdowns</li>
          <li>• Velocity trends & sentiment over time</li>
          <li>• Complaint themes from negative reviews</li>
        </ul>
        <div style={modalStyles.footer}>
          <Link to={settingsHref} style={modalStyles.btnPrimary} onClick={onClose}>
            Upgrade to Pro
          </Link>
          <button type="button" style={modalStyles.btn} onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
