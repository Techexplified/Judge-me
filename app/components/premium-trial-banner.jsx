/* eslint-disable react/prop-types */
import { AlertTriangle, Sparkles } from "lucide-react";
import { SHOPIFY_GREEN } from "./admin-ui";

const CRITICAL_RED = "#d72c0d";

const styles = {
  activeCard: {
    background: "#f1f8f5",
    border: "1px solid #aee9d1",
    borderRadius: 8,
    padding: "14px 16px",
  },
  expiredCard: {
    background: "#fff4f4",
    border: "1px solid #fed3d1",
    borderRadius: 8,
    padding: "14px 16px",
  },
  proCard: {
    background: "#fafcfb",
    border: "1px solid #e5ebe8",
    borderRadius: 8,
    padding: "14px 16px",
  },
  head: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#202223",
  },
  badge: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: 999,
    background: "#008060",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  subtext: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.5,
  },
  barTrack: {
    marginTop: 10,
    height: 4,
    borderRadius: 2,
    background: "#d1fae5",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: SHOPIFY_GREEN,
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 800,
    padding: "6px 12px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  pillActive: {
    background: "#f1f8f5",
    border: "1px solid #aee9d1",
    color: "#008060",
  },
  pillPro: {
    background: "#fafcfb",
    border: "1px solid #e5ebe8",
    color: "#202223",
  },
  pillExpired: {
    background: "#fff4f4",
    border: "1px solid #fed3d1",
    color: "#8e1f0b",
  },
};

function daysLabel(days) {
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/** Compact pill for page header (import, translation, etc.) */
export function PremiumTrialBadge({ trialStatus }) {
  if (!trialStatus) return null;

  const { isActive, daysRemaining, planStatus, hasPremium } = trialStatus;
  const days = daysRemaining ?? 0;

  if (planStatus === "active") {
    return (
      <span style={{ ...styles.pill, ...styles.pillPro }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: SHOPIFY_GREEN,
            flexShrink: 0,
          }}
        />
        Premium active
      </span>
    );
  }

  if (!hasPremium && !isActive) {
    return (
      <span style={{ ...styles.pill, ...styles.pillExpired }}>
        <AlertTriangle size={14} />
        Trial ended
      </span>
    );
  }

  return (
    <span style={{ ...styles.pill, ...styles.pillActive }}>
      <Sparkles size={14} />
      {daysLabel(days)}
    </span>
  );
}

/** Dashboard sidebar card — AI features only */
export function PremiumTrialBanner({ trialStatus }) {
  if (!trialStatus) return null;

  const { isActive, daysRemaining, planStatus, hasPremium } = trialStatus;
  const days = daysRemaining ?? 0;

  if (planStatus === "active") {
    return (
      <div style={styles.proCard}>
        <div style={styles.head}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: SHOPIFY_GREEN,
              flexShrink: 0,
            }}
          />
          <span style={styles.headText}>AI Pro — Active</span>
        </div>
        <p style={styles.subtext}>AI insights, playbooks & analysis are enabled.</p>
      </div>
    );
  }

  if (!hasPremium && !isActive) {
    return (
      <div style={styles.expiredCard}>
        <div style={styles.head}>
          <AlertTriangle size={16} color={CRITICAL_RED} />
          <span style={{ ...styles.headText, color: "#8e1f0b" }}>AI trial ended</span>
        </div>
        <p style={{ ...styles.subtext, color: "#8e1f0b" }}>
          Your 7-day trial has ended. Reviews, widgets & moderation stay free — only AI insights &
          playbooks require an upgrade.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.activeCard}>
      <div style={styles.head}>
        <Sparkles size={16} color={SHOPIFY_GREEN} />
        <span style={styles.headText}>AI trial</span>
        <span style={styles.badge}>{daysLabel(days)}</span>
      </div>
      <p style={styles.subtext}>
        AI insights, playbooks & analysis are active. Core review features remain free after the
        trial.
      </p>
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${Math.max(5, (days / 7) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

export function PremiumGateBanner({ feature = "feature" }) {
  const label =
    feature === "import"
      ? "CSV import"
      : feature === "translation"
        ? "Review translation"
        : "This feature";

  return (
    <div style={styles.expiredCard}>
      <div style={styles.head}>
        <AlertTriangle size={16} color={CRITICAL_RED} />
        <span style={{ ...styles.headText, color: "#8e1f0b" }}>Premium feature</span>
      </div>
      <p style={{ ...styles.subtext, color: "#8e1f0b" }}>
        {label} requires an active premium trial or paid plan. Your core review tools remain
        available.
      </p>
    </div>
  );
}
