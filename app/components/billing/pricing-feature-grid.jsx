/* eslint-disable react/prop-types */
import { Link } from "react-router";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { PRO_PLAN_BOX } from "../../lib/plan-features.shared.js";

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  card: {
    border: "1px solid #e1e3e5",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  header: (tone) => ({
    height: 100,
    background: tone === "mint" ? "#e8f5ee" : "#e8f4fc",
    backgroundImage:
      "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.35) 8px, rgba(255,255,255,0.35) 9px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  }),
  iconBox: {
    background: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    fontSize: 20,
  },
  body: {
    padding: "18px 20px 20px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 15,
    fontWeight: 800,
    color: "#202223",
    lineHeight: 1.35,
  },
  desc: {
    margin: "0 0 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.5,
    flex: 1,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #c9cccf",
    background: "#fff",
    color: "#202223",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
    alignSelf: "flex-start",
    fontFamily: "inherit",
  },
};

const FEATURE_CARDS = [
  {
    tone: "mint",
    icon: "★",
    title: "Get reviews faster with customized review request emails",
    desc: "Collect more reviews with branded forms, photo uploads, and video support on Pro.",
    tab: "/app/settings/customizations",
    cta: "Customize widget",
  },
  {
    tone: "sky",
    icon: "📊",
    title: "Live interactive analytics & graphs",
    desc: "Real-time charts for volume, ratings, velocity, and sentiment — not just previews.",
    tab: "/app/analytics",
    cta: "View analytics",
  },
  {
    tone: "mint",
    icon: "🌐",
    title: "Full translation suite for global stores",
    desc: "Auto-translate on reply, dashboard, and import. 100 translations per month on Pro.",
    tab: "/app/settings/translation",
    cta: "Translation settings",
  },
  {
    tone: "sky",
    icon: "🤖",
    title: "AI insights, playbooks & smart replies",
    desc: "AI review replies, urgent prioritization, and actionable playbooks for your team.",
    tab: "/app/reviews",
    cta: "Manage reviews",
  },
  {
    tone: "mint",
    icon: "🔗",
    title: "Store integrations across your network",
    desc: PRO_PLAN_BOX.sections[0].items[4],
    tab: "/app/settings/integration",
    cta: "Integration settings",
  },
  {
    tone: "sky",
    icon: "📥",
    title: "Unlimited CSV imports from other apps",
    desc: "Import reviews from Judge.me, Loox, Yotpo, and more without monthly caps.",
    tab: "/app/settings/import",
    cta: "Import reviews",
  },
  {
    tone: "mint",
    icon: "📄",
    title: "PDF & CSV export for reporting",
    desc: "Export review data and AI-generated insights for stakeholders and campaigns.",
    tab: "/app/reviews",
    cta: "Export options",
  },
  {
    tone: "sky",
    icon: "🎨",
    title: "Advanced widget customisation",
    desc: "Layout presets, brand colors, typography, and trust badges — 20 publishes per month.",
    tab: "/app/settings/customizations",
    cta: "Customizations",
  },
  {
    tone: "mint",
    icon: "🔍",
    title: "Google and SEO-friendly review widgets",
    desc: "Product review pages and structured data to help shoppers find and trust your store.",
    tab: "/app/settings/customizations",
    cta: "Storefront settings",
  },
];

export function PricingFeatureGrid({ search = "" }) {
  return (
    <div style={styles.grid}>
      {FEATURE_CARDS.map((card) => (
        <div key={card.title} style={styles.card}>
          <div style={styles.header(card.tone)}>
            <div style={styles.iconBox}>{card.icon}</div>
          </div>
          <div style={styles.body}>
            <h4 style={styles.title}>{card.title}</h4>
            <p style={styles.desc}>{card.desc}</p>
            <Link
              to={mergeShopifyEmbedParams(card.tab, search)}
              style={styles.btn}
            >
              {card.cta}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
