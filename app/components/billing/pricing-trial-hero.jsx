/* eslint-disable react/prop-types */
import { CheckCircle2 } from "lucide-react";
import { PRO_PLAN_HIGHLIGHTS } from "../../lib/plan-features.shared.js";
import { PrimaryButton } from "../admin-ui";

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e1e3e5",
    borderRadius: 12,
    padding: "28px 32px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#202223",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    background: "#c6f6d5",
    color: "#1a4731",
    fontSize: 11,
    fontWeight: 800,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#6d7175",
  },
  statusBox: {
    textAlign: "right",
    minWidth: 180,
  },
  statusLabel: {
    margin: "0 0 10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
  },
  ctaDark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 22px",
    borderRadius: 8,
    background: "#2d2d2d",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, auto) 1fr",
    gap: 32,
    alignItems: "start",
  },
  price: {
    margin: 0,
    fontSize: 36,
    fontWeight: 900,
    color: "#202223",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: 600,
    color: "#6d7175",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  item: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    fontWeight: 600,
    color: "#202223",
    lineHeight: 1.45,
  },
  itemTitle: {
    fontWeight: 800,
  },
};

const HERO_FEATURES = [
  {
    title: "Get reviews faster",
    desc: "Unlimited reviews and CSV imports to grow social proof quickly.",
  },
  {
    title: "Build your brand",
    desc: "Advanced widget customisation, photo & video reviews, and branding controls.",
  },
  {
    title: "Grow store visits",
    desc: "Live analytics and SEO friendly review widgets on your storefront.",
  },
  {
    title: "Increase sales",
    desc: "AI suggested replies and tools to convert more shoppers.",
  },
  {
    title: "Unlimited essentials",
    desc: PRO_PLAN_HIGHLIGHTS[0],
  },
  {
    title: "Fair value",
    desc: "14 day free trial, then billed monthly via Shopify. Cancel anytime.",
  },
];

export function PricingTrialHero({
  hasPro,
  inTrial,
  trialDays,
  trialEndsLabel,
  proPrice,
  proTrialDays,
  appPricingUrl,
  isSubmitting,
  onStartTrial,
  onCancel,
}) {
  const trialCta = appPricingUrl ? (
    <a href={appPricingUrl} target="_top" rel="noopener noreferrer" style={styles.ctaDark}>
      {hasPro ? "Manage Plan" : `Start your free trial`}
    </a>
  ) : (
    <button
      type="button"
      style={styles.ctaDark}
      disabled={isSubmitting}
      onClick={hasPro ? onCancel : onStartTrial}
    >
      {hasPro ? "Cancel subscription" : `Start your free trial`}
    </button>
  );

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.titleRow}>
            <h2 style={styles.title}>
              {hasPro ? "Your Pro Plan" : `Start your free Pro trial`}
            </h2>
            {!hasPro ? <span style={styles.badge}>Special offer</span> : null}
          </div>
          <p style={styles.subtitle}>
            {hasPro
              ? inTrial && trialDays != null && trialDays > 0
                ? `${trialDays} day${trialDays === 1 ? "" : "s"} left in trial${
                    trialEndsLabel ? ` · ends ${trialEndsLabel}` : ""
                  }`
                : `Active · $${proPrice}/month via Shopify`
              : `Free for ${proTrialDays} days. Cancel anytime.`}
          </p>
        </div>
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>
            You are on the <strong>{hasPro ? "Pro" : "Free"}</strong> Plan.
          </p>
          {!hasPro ? trialCta : (
            <PrimaryButton loading={isSubmitting} disabled={isSubmitting} onClick={onCancel}>
              Cancel subscription
            </PrimaryButton>
          )}
        </div>
      </div>

      {!hasPro ? (
        <div style={styles.body}>
          <div>
            <p style={styles.price}>
              ${proPrice}
              <span style={styles.priceUnit}>/month</span>
            </p>
          </div>
          <ul style={styles.list}>
            {HERO_FEATURES.map((f) => (
              <li key={f.title} style={styles.item}>
                <CheckCircle2 size={18} color="#008060" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <span style={styles.itemTitle}>{f.title}: </span>
                  {f.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
