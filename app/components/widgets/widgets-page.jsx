/* eslint-disable react/prop-types */
import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import {
  PAGE_BG,
  SHOPIFY_GREEN,
  SURFACE_BG,
  SURFACE_BORDER,
} from "../admin-ui";
import { getWidgetCtaLabel } from "../../lib/theme-editor-nav.shared.js";
import reviewShowcaseImg from "./reviewshowcase-2.png";
import reviewTranslationImg from "./reviewtranslation.png";
import videoSliderImg from "./video-slider.png";
import customerLovePageImg from "./customerlove-page-1.png";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const WIDGET_CATALOG = [
  {
    id: "review-showcase",
    title: "Review Showcase",
    description: "Display reviews in a beautiful, customizable layout.",
    previewImage: reviewShowcaseImg,
  },
  {
    id: "review-translation-hub",
    title: "Review Translation Hub",
    description: "Auto-translate reviews into any language for shoppers.",
    previewImage: reviewTranslationImg,
  },
  {
    id: "video-reviews-slider",
    title: "Video Reviews Slider",
    description: "Highlight video reviews in an engaging carousel.",
    previewImage: videoSliderImg,
  },
  {
    id: "customers-love-page",
    title: "Customer's Love Page",
    description: "A dedicated page for all reviews, photos, and videos.",
    previewImage: customerLovePageImg,
  },
];

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 30,
    fontWeight: 900,
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

const modalStyles = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(2px)",
    cursor: "pointer",
  },
  panel: {
    position: "relative",
    width: "min(560px, 100%)",
    maxHeight: "min(90vh, 720px)",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
  },
  preview: {
    width: "100%",
    aspectRatio: "16/10",
    background: SURFACE_BG,
    borderBottom: `1px solid ${SURFACE_BORDER}`,
    overflow: "hidden",
  },
  body: {
    padding: "20px 22px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
};

function WidgetPreview({ previewImage, title }) {
  if (previewImage) {
    return (
      <img
        src={previewImage}
        alt={`${title} preview`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
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

function AlreadyAddedDialog({ widget, onClose }) {
  return (
    <div style={modalStyles.root} role="dialog" aria-modal="true" aria-labelledby="widget-already-added-title">
      <button type="button" style={modalStyles.backdrop} aria-label="Close" onClick={onClose} />
      <div style={{ ...modalStyles.panel, width: "min(420px, 100%)" }}>
        <div style={{ ...modalStyles.body, padding: "22px 24px 24px" }}>
          <h2 id="widget-already-added-title" style={{ ...type.cardTitle, fontSize: 18, marginBottom: 8 }}>
            Already added to theme
          </h2>
          <p style={{ ...type.cardDesc, margin: 0 }}>
            <strong style={{ color: "#202223" }}>{widget.title}</strong> is already on your live theme.
            Open the theme editor if you want to move or customize it.
          </p>
          <div style={{ ...modalStyles.footer, paddingTop: 18 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
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
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetDetailModal({ widget, isInstalled, onClose, onAddToTheme, onAlreadyAdded }) {
  const ctaLabel = getWidgetCtaLabel(widget.id);
  const installedLabel = widget.id === "review-translation-hub" ? ctaLabel : "Already in theme";

  const handleAddClick = () => {
    if (isInstalled) {
      onAlreadyAdded?.(widget);
      return;
    }
    onAddToTheme?.(widget);
    onClose?.();
  };

  return (
    <div style={modalStyles.root} role="dialog" aria-modal="true" aria-labelledby="widget-detail-title">
      <button type="button" style={modalStyles.backdrop} aria-label="Close" onClick={onClose} />
      <div style={modalStyles.panel}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#6d7175",
          }}
        >
          <X size={16} />
        </button>
        <div style={modalStyles.preview}>
          <WidgetPreview previewImage={widget.previewImage} title={widget.title} />
        </div>
        <div style={modalStyles.body}>
          <h2 id="widget-detail-title" style={{ ...type.cardTitle, fontSize: 20 }}>
            {widget.title}
          </h2>
          <p style={{ ...type.cardDesc, margin: 0 }}>{widget.description}</p>
          {isInstalled ? (
            <p style={{ ...type.cardDesc, margin: "4px 0 0", color: "#008060", fontWeight: 600 }}>
              This widget is already added to your theme.
            </p>
          ) : null}
          <div style={modalStyles.footer}>
            <button
              type="button"
              onClick={handleAddClick}
              aria-disabled={isInstalled}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: isInstalled ? "#e4e5e7" : SHOPIFY_GREEN,
                color: isInstalled ? "#6d7175" : "#fff",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                cursor: isInstalled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isInstalled ? installedLabel : ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetCard({ widget, isInstalled, onOpen, onAddToTheme, onAlreadyAdded }) {
  const [hover, setHover] = useState(false);
  const ctaLabel = getWidgetCtaLabel(widget.id);
  const installedLabel = widget.id === "review-translation-hub" ? ctaLabel : "Already in theme";

  const handleAddClick = (event) => {
    event.stopPropagation();
    if (isInstalled) {
      onAlreadyAdded?.(widget);
      return;
    }
    onAddToTheme?.(widget);
  };

  return (
    <article
      onClick={() => onOpen?.(widget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(widget);
        }
      }}
      role="button"
      tabIndex={0}
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
        cursor: "pointer",
      }}
    >
      <div
        className="widget-preview"
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: SURFACE_BG,
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          overflow: "hidden",
          position: "relative",
          transition: "transform 0.2s ease",
        }}
      >
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
            onClick={handleAddClick}
            aria-disabled={isInstalled}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: isInstalled ? "#e4e5e7" : SHOPIFY_GREEN,
              color: isInstalled ? "#6d7175" : "#fff",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              cursor: isInstalled ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isInstalled ? installedLabel : ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export function WidgetsPage({
  onAddToTheme,
  onEnableCore,
  onRefreshStatus,
  widgetSettings,
  themeInstalled,
  reviewCounts,
}) {
  const showCoreBanner = !widgetSettings?.coreEmbedAcknowledged;
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [alreadyAddedWidget, setAlreadyAddedWidget] = useState(null);

  const isWidgetInstalled = (widgetId) =>
    widgetId !== "review-translation-hub" && Boolean(themeInstalled?.[widgetId]);

  const handleAlreadyAdded = (widget) => {
    setAlreadyAddedWidget(widget);
  };

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
        </div>
        <p style={{ margin: "8px 0 0", ...type.subtitle }}>
          Choose from multiple review widgets and place them anywhere in your theme
        </p>
        {reviewCounts?.total != null ? (
          <p style={{ margin: "6px 0 0", ...type.subtitle }}>
            {reviewCounts.total} published review{reviewCounts.total === 1 ? "" : "s"} ready to display.
          </p>
        ) : null}
        {onRefreshStatus ? (
          <button
            type="button"
            onClick={onRefreshStatus}
            style={{
              marginTop: 10,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "#fff",
              color: "#202223",
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh widget status
          </button>
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
            border: `1px solid ${SURFACE_BORDER}`,
            background: SURFACE_BG,
            color: "#202223",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#202223" }}>
              Enable JudgeMe Core to access widgets
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#6d7175", fontWeight: 500 }}>
              Turn on <strong style={{ color: "#202223" }}>JudgeMe Core</strong> under Theme settings →
              App embeds so your review widgets work on the storefront.
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
            isInstalled={isWidgetInstalled(widget.id)}
            onOpen={setSelectedWidget}
            onAddToTheme={onAddToTheme}
            onAlreadyAdded={handleAlreadyAdded}
          />
        ))}
      </div>

      {selectedWidget ? (
        <WidgetDetailModal
          widget={selectedWidget}
          isInstalled={isWidgetInstalled(selectedWidget.id)}
          onClose={() => setSelectedWidget(null)}
          onAddToTheme={onAddToTheme}
          onAlreadyAdded={handleAlreadyAdded}
        />
      ) : null}

      {alreadyAddedWidget ? (
        <AlreadyAddedDialog
          widget={alreadyAddedWidget}
          onClose={() => setAlreadyAddedWidget(null)}
        />
      ) : null}

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
