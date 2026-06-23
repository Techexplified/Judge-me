/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router";
import { Sparkles } from "lucide-react";
import { UPGRADE_NOTICE } from "../admin-ui";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";

const styles = {
  root: {
    position: "relative",
  },
  content: {
    filter: "blur(4px)",
    pointerEvents: "none",
    userSelect: "none",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(1px)",
    borderRadius: 12,
    zIndex: 2,
    padding: 16,
    textAlign: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: UPGRADE_NOTICE.bg,
    border: `1px solid ${UPGRADE_NOTICE.bd}`,
    display: "grid",
    placeItems: "center",
  },
  label: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#202223",
  },
  sub: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
    maxWidth: 280,
    lineHeight: 1.45,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    background: UPGRADE_NOTICE.fg,
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "none",
    marginTop: 4,
  },
};

export function ProSectionBlur({ locked, label = "Pro feature", children }) {
  if (!locked) {
    return children;
  }

  const location = useLocation();
  const settingsHref = mergeShopifyEmbedParams("/app/settings", location.search);

  return (
    <div style={styles.root}>
      <div style={styles.content} aria-hidden="true">
        {children}
      </div>
      <div style={styles.overlay}>
        <div style={styles.iconWrap}>
          <Sparkles size={18} color={UPGRADE_NOTICE.icon} />
        </div>
        <p style={styles.label}>{label}</p>
        <p style={styles.sub}>Upgrade to Pro to unlock this section. Start with a 14 day free trial.</p>
        <Link to={settingsHref} style={styles.link}>
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
