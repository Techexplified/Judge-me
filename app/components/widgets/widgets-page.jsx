/* eslint-disable react/prop-types */
import { useState } from "react";
import { ImageIcon, AlertTriangle } from "lucide-react";
import {
  PAGE_BG,
  SHOPIFY_GREEN,
  SURFACE_BG,
  SURFACE_BORDER,
} from "../admin-ui";
import { getWidgetCtaLabel } from "../../lib/theme-editor-nav.shared.js";
import reviewShowcaseImg from "./reviewshowcase.png";
import reviewTranslationImg from "./reviewtranslation.png";
import videoSliderImg from "./video-slider.png";
import customerLovePageImg from "./customerlove-page.png";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const WIDGET_CATALOG = [
  {
    id: "review-showcase",
    title: "Review Showcase",
    description: "Display reviews in a beautiful, customizable layout.",
    previewImage: reviewShowcaseImg,
    badge: {
      label: "Active",
      bg: "#ecfdf5",
      fg: "#047857",
      dot: SHOPIFY_GREEN,
    },
  },
  {
    id: "review-translation-hub",
    title: "Review Translation Hub",
    description: "Auto-translate reviews into any language for shoppers.",
    previewImage: reviewTranslationImg,
    badge: {
      label: "New",
      bg: "#f3e8ff",
      fg: "#7c3aed",
    },
  },
  {
    id: "video-reviews-slider",
    title: "Video Reviews Slider",
    description: "Highlight video reviews in an engaging carousel.",
    previewImage: videoSliderImg,
    badge: {
      label: "Premium",
      bg: "#fff7ed",
      fg: "#c2410c",
    },
  },
  {
    id: "customers-love-page",
    title: "Customer's Love Page",
    description: "A dedicated page for all reviews, photos, and videos.",
    previewImage: customerLovePageImg,
    badge: {
      label: "Popular",
      bg: "#fdf2f8",
      fg: "#be185d",
    },
  },
];

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 600,
    color: "#202223",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
    lineHeight: 1.5,
  },
  countBadge: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
    background: "#f1f2f3",
    padding: "4px 10px",
    borderRadius: 999,
  },
  cardTitle: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 600,
    color: "#202223",
    margin: 0,
  },
  cardDesc: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
    lineHeight: 1.5,
    margin: "5px 0 0",
  },
};

function WidgetBadge({ badge }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        background: badge.bg,
        color: badge.fg,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {badge.dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: badge.dot,
            flexShrink: 0,
          }}
        />
      ) : null}
      {badge.label}
    </span>
  );
}

function WidgetPreview({ previewImage, title }) {
  if (previewImage) {
    return (
      <img
        src={previewImage}
        alt={`${title} preview`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "#f6f6f7",
        color: "#8c9196",
      }}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600 }}>
        Preview image
      </span>
    </div>
  );
}

function WidgetCard({ widget, onAddToTheme, installedAt }) {
  const [hover, setHover] = useState(false);
  const ctaLabel = getWidgetCtaLabel(widget.id);
  const isInstalled = Boolean(installedAt);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${SURFACE_BORDER}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: hover ? 2 : 1,
        boxShadow: hover
          ? "0 14px 32px rgba(0,0,0,0.12)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hover ? "translateY(-4px) scale(1.015)" : "none",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
    >
      <div
        className="widget-preview"
        style={{
          width: "100%",
          height: hover ? "clamp(220px, 28vw, 260px)" : "clamp(160px, 20vw, 196px)",
          background: SURFACE_BG,
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: hover ? "4px 6px" : "8px 10px",
          boxSizing: "border-box",
          transition: "height 0.22s ease, padding 0.22s ease",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
          <WidgetBadge
            badge={
              isInstalled && widget.id !== "review-translation-hub"
                ? { label: "Added", bg: "#ecfdf5", fg: "#047857", dot: SHOPIFY_GREEN }
                : widget.badge
            }
          />
        </div>
        <WidgetPreview previewImage={widget.previewImage} title={widget.title} />
      </div>

      <div
        style={{
          padding: "16px 18px 18px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h2 style={type.cardTitle}>{widget.title}</h2>
        <p style={type.cardDesc}>{widget.description}</p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: "auto",
            paddingTop: 14,
          }}
        >
          <button
            type="button"
            onClick={() => onAddToTheme?.(widget)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: SHOPIFY_GREEN,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function WidgetsPage({
  onAddToTheme,
  onEnableCore,
  themeName,
  widgetSettings,
  reviewCounts,
}) {
  const showCoreBanner = !widgetSettings?.coreEmbedAcknowledged;

  return (
    <div
      style={{
        padding: "20px 24px 32px",
        background: PAGE_BG,
        minHeight: "100vh",
        fontFamily: FONT,
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, ...type.pageTitle }}>Widgets</h1>
          <span style={type.countBadge}>{WIDGET_CATALOG.length} available</span>
          {themeName ? (
            <span style={{ ...type.countBadge, background: "#ecfdf5", color: "#047857" }}>
              {themeName}
            </span>
          ) : null}
        </div>
        <p style={{ margin: "8px 0 0", ...type.subtitle }}>
          Add one or more widgets to your theme — each installs independently on its own page or
          section. You are not limited to a single widget.
        </p>
        {reviewCounts?.total != null ? (
          <p style={{ margin: "6px 0 0", ...type.subtitle }}>
            {reviewCounts.total} published review{reviewCounts.total === 1 ? "" : "s"} ready to display.
          </p>
        ) : null}
      </header>

      {showCoreBanner ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 16px",
            marginBottom: 18,
            borderRadius: 10,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            color: "#92400e",
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>
              Complete setup to activate widgets
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Enable <strong>JudgeMe Core</strong> in Theme Settings → App embeds so review widgets,
              translation, and analytics work on your storefront.
            </p>
            <button
              type="button"
              onClick={onEnableCore}
              style={{
                marginTop: 12,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: SHOPIFY_GREEN,
                color: "#fff",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Enable JudgeMe Core
            </button>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
          width: "100%",
        }}
        className="widgets-grid"
      >
        {WIDGET_CATALOG.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onAddToTheme={onAddToTheme}
            installedAt={widgetSettings?.installed?.[widget.id]?.clickedAt}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .widgets-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
