/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router";
import {
  BarChart3,
  Globe,
  Sparkles,
  Link2,
  Download,
  FileText,
  ArrowRight,
  Play,
  Video,
} from "lucide-react";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import {
  FREE_IMPORTS_PER_MONTH,
  FREE_LINKED_STORES,
  PRO_LINKED_STORES,
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
    id: "analytics",
    tone: "sky",
    tag: "Analytics",
    Icon: BarChart3,
    title: "Live analytics and graphs",
    desc: "Charts for volume, ratings, and trends. Preview on Free.",
    tab: "/app/analytics",
    cta: "Open analytics",
  },
  {
    id: "translation",
    tone: "mint",
    tag: "Translation",
    Icon: Globe,
    title: "Review translation hub",
    desc: `Auto translate reviews. Pick shopper language. Pro: ${PRO_TRANSLATIONS_PER_MONTH}/month.`,
    tab: "/app/widgets/translation",
    cta: "Translation settings",
  },
  {
    id: "stores",
    tone: "mint",
    tag: "Stores",
    Icon: Link2,
    title: "Multi store integration",
    desc: `Sync reviews across stores. ${FREE_LINKED_STORES} on Free, ${PRO_LINKED_STORES} on Pro.`,
    tab: "/app/manage-reviews?tab=integration",
    cta: "Store integration",
  },
  {
    id: "import",
    tone: "sky",
    tag: "Import",
    Icon: Download,
    title: "Import reviews",
    desc: `Judge.me, Loox, Amazon, Flipkart, and more. ${FREE_IMPORTS_PER_MONTH}/month on Free.`,
    tab: "/app/collect-reviews?tab=import",
    cta: "Import reviews",
  },
  {
    id: "video",
    tone: "sky",
    tag: "Video",
    Icon: Video,
    title: "Video based reviews",
    desc: "Shoppers upload video with their review. Pro feature.",
    tab: "/app/collect-reviews/customize",
    cta: "Review form",
  },
  {
    id: "widgets",
    tone: "mint",
    tag: "Widgets",
    Icon: Play,
    title: "Storefront widgets & customization",
    desc: "Video slider, customer love page, layout, colors, typography, and branding. Advanced customization on Pro.",
    tab: "/app/widgets",
    cta: "Open widgets",
  },
  {
    id: "ai",
    tone: "mint",
    tag: "AI",
    Icon: Sparkles,
    title: "AI replies and insights",
    desc: "Smart suggested replies and review management tools.",
    tab: "/app/manage-reviews",
    cta: "Manage reviews",
  },
  {
    id: "export",
    tone: "sky",
    tag: "Export",
    Icon: FileText,
    title: "PDF and CSV export",
    desc: "Export review data and AI insights. 10/month on Pro.",
    tab: "/app/analytics",
    cta: "Open analytics",
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
        <FeatureCard key={card.id} card={card} search={search} />
      ))}
    </div>
  );
}
