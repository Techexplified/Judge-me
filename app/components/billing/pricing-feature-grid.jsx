/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router";
import {
  Star,
  BarChart3,
  Globe,
  Sparkles,
  Link2,
  Download,
  FileText,
  Palette,
  Search,
  ArrowRight,
} from "lucide-react";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import {
  PRO_PLAN_BOX,
  PRO_TRANSLATIONS_PER_MONTH,
} from "../../lib/plan-features.shared.js";

const MINT = { bg: "#e8f5ee", accent: "#008060", soft: "#ecfdf3" };
const SKY = { bg: "#e8f4fc", accent: "#2563eb", soft: "#eff6ff" };

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  card: (hover) => ({
    border: "1px solid #e1e3e5",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    minHeight: 280,
    boxShadow: hover ? "0 8px 24px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.04)",
    transform: hover ? "translateY(-2px)" : "none",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
  }),
  header: (tone) => {
    const t = tone === "mint" ? MINT : SKY;
    return {
      height: 112,
      background: t.bg,
      backgroundImage:
        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.45) 10px, rgba(255,255,255,0.45) 11px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 24px",
    };
  },
  mockWindow: {
    background: "#fff",
    borderRadius: 10,
    padding: "14px 18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
    minHeight: 52,
  },
  body: {
    padding: "20px 22px 22px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #f1f2f3",
  },
  tag: (tone) => ({
    display: "inline-block",
    marginBottom: 10,
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: tone === "mint" ? MINT.soft : SKY.soft,
    color: tone === "mint" ? MINT.accent : SKY.accent,
    alignSelf: "flex-start",
  }),
  title: {
    margin: "0 0 10px",
    fontSize: 14,
    fontWeight: 800,
    color: "#202223",
    lineHeight: 1.45,
    letterSpacing: "-0.01em",
  },
  desc: {
    margin: "0 0 18px",
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
    lineHeight: 1.55,
    flex: 1,
  },
  btn: (hover) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    borderRadius: 8,
    border: `1px solid ${hover ? "#b5babf" : "#d2d5d8"}`,
    background: hover ? "#fafbfb" : "#fff",
    color: "#202223",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
    alignSelf: "flex-start",
    fontFamily: "inherit",
    transition: "background 0.15s ease, border-color 0.15s ease",
  }),
};

const FEATURE_CARDS = [
  {
    tone: "sky",
    tag: "Analytics",
    Icon: BarChart3,
    title: "Live interactive analytics & graphs",
    desc: "Real time charts for volume, ratings, velocity, and sentiment, not just previews.",
    tab: "/app/analytics",
    cta: "View analytics",
  },
  {
    tone: "mint",
    tag: "Translation",
    Icon: Globe,
    title: "Full translation suite for global stores",
    desc: `Auto translate on reply, dashboard, and import. ${PRO_TRANSLATIONS_PER_MONTH} translations per month on Pro.`,
    tab: "/app/settings/translation",
    cta: "Translation settings",
  },
  {
    tone: "sky",
    tag: "AI",
    Icon: Sparkles,
    title: "AI insights, playbooks & smart replies",
    desc: "AI review replies, urgent prioritization, and actionable playbooks for your team.",
    tab: "/app/reviews",
    cta: "Manage reviews",
  },
  {
    tone: "mint",
    tag: "Integration",
    Icon: Link2,
    title: "Store integrations across your network",
    desc: PRO_PLAN_BOX.sections[0].items[4],
    tab: "/app/settings/integration",
    cta: "Integration settings",
  },
  {
    tone: "sky",
    tag: "Import",
    Icon: Download,
    title: "Unlimited CSV imports from other apps",
    desc: "Import reviews from Judge.me, Loox, Yotpo, and more without monthly caps.",
    tab: "/app/settings/import",
    cta: "Import reviews",
  },
  {
    tone: "mint",
    tag: "Export",
    Icon: FileText,
    title: "PDF & CSV export for reporting",
    desc: "Export review data and AI generated insights for stakeholders and campaigns.",
    tab: "/app/reviews",
    cta: "Export options",
  },
  {
    tone: "sky",
    tag: "Branding",
    Icon: Palette,
    title: "Advanced widget customisation",
    desc: "Layout presets, brand colors, typography, and trust badges, 20 publishes per month.",
    tab: "/app/settings/customizations",
    cta: "Customizations",
  },
];

function FeatureCard({ card, search }) {
  const [cardHover, setCardHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const { Icon } = card;
  const palette = card.tone === "mint" ? MINT : SKY;

  return (
    <div
      style={styles.card(cardHover)}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => setCardHover(false)}
    >
      <div style={styles.header(card.tone)}>
        <div style={styles.mockWindow}>
          <Icon size={22} color={palette.accent} strokeWidth={2.2} />
        </div>
      </div>
      <div style={styles.body}>
        <span style={styles.tag(card.tone)}>{card.tag}</span>
        <h4 style={styles.title}>{card.title}</h4>
        <p style={styles.desc}>{card.desc}</p>
        <Link
          to={mergeShopifyEmbedParams(card.tab, search)}
          style={styles.btn(btnHover)}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {card.cta}
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

export function PricingFeatureGrid({ search = "" }) {
  return (
    <div style={styles.grid}>
      {FEATURE_CARDS.map((card) => (
        <FeatureCard key={card.title} card={card} search={search} />
      ))}
    </div>
  );
}
