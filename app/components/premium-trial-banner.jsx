/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { SHOPIFY_GREEN } from "./admin-ui";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { FEATURE_LABELS } from "../lib/usage.shared.js";
import { PRO_PRICE_USD } from "../lib/trial.shared.js";

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
  upgradeLink: {
    display: "inline-block",
    marginTop: 8,
    fontSize: 12,
    fontWeight: 800,
    color: SHOPIFY_GREEN,
    textDecoration: "none",
  },
  endingBanner: {
    background: "#fff8e6",
    border: "1px solid #f9d891",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 16,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  endingDismiss: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    color: "#6d7175",
    flexShrink: 0,
  },
};

function daysLabel(days) {
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function useSettingsHref() {
  const location = useLocation();
  return mergeShopifyEmbedParams("/app/settings", location.search);
}

function trialEndLabel(status) {
  const endIso = status.isGraceTrial
    ? status.graceTrialEndsAt
    : status.billingTrialEndsAt;
  if (!endIso) return null;
  return new Date(endIso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Compact pill for page header (import, translation, etc.) */
export function PremiumTrialBadge({ trialStatus, planStatus }) {
  const status = planStatus ?? trialStatus;
  if (!status) return null;

  const hasPro = status.hasPro ?? status.hasPremium;
  const inTrial = status.isInTrial === true;
  const isGraceTrial = status.isGraceTrial === true;
  const days = inTrial ? (status.trialDaysRemaining ?? status.daysRemaining ?? 0) : 0;

  if (hasPro) {
    return (
      <span style={{ ...styles.pill, ...(inTrial ? styles.pillActive : styles.pillPro) }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: SHOPIFY_GREEN,
            flexShrink: 0,
          }}
        />
        {inTrial && days > 0
          ? isGraceTrial
            ? `Complimentary Pro · ${days}d`
            : `Pro trial · ${days}d`
          : "Pro active"}
      </span>
    );
  }

  return (
    <span style={{ ...styles.pill, ...styles.pillExpired }}>
      <AlertTriangle size={14} />
      Free plan
    </span>
  );
}

/** Dashboard sidebar card */
export function PremiumTrialBanner({ trialStatus, planStatus }) {
  const settingsHref = useSettingsHref();
  const status = planStatus ?? trialStatus;
  if (!status) return null;

  const hasPro = status.hasPro ?? status.hasPremium;
  const inTrial = status.isInTrial === true;
  const isGraceTrial = status.isGraceTrial === true;
  const days = inTrial ? (status.trialDaysRemaining ?? status.daysRemaining ?? 0) : 0;
  const reviewsRemaining = status.reviewsRemaining;
  const trialEndsLabel = inTrial ? trialEndLabel(status) : null;

  if (hasPro) {
    const usage = status.featureUsage ?? {};
    const lowQuota = Object.entries(usage).filter(
      ([, v]) => v && v.limit > 0 && v.remaining <= Math.max(1, Math.ceil(v.limit * 0.2)),
    );
    const endingSoon = isGraceTrial && inTrial && days <= 3;

    return (
      <div style={inTrial ? styles.activeCard : styles.proCard}>
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
          <span style={styles.headText}>
            {inTrial
              ? isGraceTrial
                ? "Pro — Complimentary trial"
                : "Pro — Free trial"
              : "Pro — Active"}
          </span>
          {inTrial && days > 0 ? (
            <span style={styles.badge}>{daysLabel(days)}</span>
          ) : null}
        </div>
        <p style={styles.subtext}>
          {inTrial && isGraceTrial
            ? `Full Pro access at no charge${trialEndsLabel ? ` until ${trialEndsLabel}` : ""}. No billing during this period.`
            : inTrial
              ? `No charge until${trialEndsLabel ? ` ${trialEndsLabel}` : " your trial ends"}. Then $${PRO_PRICE_USD}/month via Shopify.`
              : `Billed $${PRO_PRICE_USD}/month via Shopify.`}{" "}
          Metered AI features reset on the 1st of each month. Unlimited reviews included.
        </p>
        {endingSoon ? (
          <p style={{ ...styles.subtext, marginTop: 8, color: "#92400e" }}>
            Your complimentary access ends soon. Go to Settings to stay on Free or start the
            14-day Shopify Pro trial.
          </p>
        ) : null}
        {lowQuota.length > 0 ? (
          <p style={{ ...styles.subtext, marginTop: 8, color: "#92400e" }}>
            Low quota:{" "}
            {lowQuota
              .slice(0, 3)
              .map(([key, v]) => `${FEATURE_LABELS[key] || key} (${v.remaining}/${v.limit})`)
              .join(" · ")}
          </p>
        ) : null}
        <Link to={settingsHref} style={styles.upgradeLink}>
          {endingSoon ? "Choose your plan in Settings →" : "View usage in Settings →"}
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.expiredCard}>
      <div style={styles.head}>
        <AlertTriangle size={16} color={CRITICAL_RED} />
        <span style={{ ...styles.headText, color: "#8e1f0b" }}>Free plan</span>
      </div>
      <p style={{ ...styles.subtext, color: "#8e1f0b" }}>
        {reviewsRemaining != null
          ? `${reviewsRemaining} reviews left this month. `
          : ""}
        Upgrade to Pro for unlimited reviews, photo/video, AI & analytics.
      </p>
      <Link to={settingsHref} style={styles.upgradeLink}>
        Upgrade to Pro →
      </Link>
    </div>
  );
}

/** Dashboard top banner when complimentary Pro trial is ending soon */
export function GraceTrialEndingBanner({ trialStatus, planStatus }) {
  const settingsHref = useSettingsHref();
  const status = planStatus ?? trialStatus;
  const dismissKey = status?.graceTrialEndsAt
    ? `grace-trial-ending-${status.graceTrialEndsAt}`
    : "grace-trial-ending";
  const [dismissed, setDismissed] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(dismissKey) === "1";
  });

  if (!status?.isGraceTrial || !status?.isInTrial) return null;

  const days = status.trialDaysRemaining ?? 0;
  if (days > 3) return null;
  if (dismissed) return null;

  const endLabel = trialEndLabel(status);

  return (
    <div style={styles.endingBanner}>
      <Sparkles size={18} color="#b98900" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ ...styles.headText, marginBottom: 4 }}>
          {days === 0
            ? "Complimentary Pro ends today"
            : `Complimentary Pro ends in ${days} day${days === 1 ? "" : "s"}`}
        </p>
        <p style={styles.subtext}>
          {endLabel ? `Your complimentary access ends ${endLabel}. ` : ""}
          Open Settings to stay on the Free plan or start the 14-day Shopify Pro trial — your
          choice.
        </p>
        <Link to={settingsHref} style={styles.upgradeLink}>
          Go to Settings →
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        style={styles.endingDismiss}
        onClick={() => {
          sessionStorage.setItem(dismissKey, "1");
          setDismissed(true);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function PremiumGateBanner({ feature = "feature" }) {
  const settingsHref = useSettingsHref();
  const label =
    feature === "import"
      ? "CSV import"
      : feature === "translation"
        ? "Review translation"
        : feature === "analytics"
          ? "Interactive analytics"
          : feature === "media"
            ? "Photo & video reviews"
            : "This feature";

  return (
    <div style={styles.expiredCard}>
      <div style={styles.head}>
        <AlertTriangle size={16} color={CRITICAL_RED} />
        <span style={{ ...styles.headText, color: "#8e1f0b" }}>Pro feature</span>
      </div>
      <p style={{ ...styles.subtext, color: "#8e1f0b" }}>
        {label} requires a Pro plan. Core review tools remain available on Free.
      </p>
      <Link to={settingsHref} style={styles.upgradeLink}>
        Start 14-day free trial →
      </Link>
    </div>
  );
}
