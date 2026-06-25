/* eslint-disable react/prop-types */
import { ArrowRight, BarChart3, Gift, Paintbrush, Sparkles, Star, Users, X } from "lucide-react";
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import guideIllustration from "../../../img-guide.jpg";
import {
  backdropStyle,
  guidePanelStyle,
  overlayStyle,
  QS_FONT,
  QS_GREEN,
  QS_GREEN_SOFT,
  QS_GREEN_TINT,
} from "./quick-search-styles.js";

const STEPS = [
  {
    icon: Paintbrush,
    title: "Open your Shopify theme editor",
    description: "Go to the theme editor and access your store's customization settings.",
    path: "/app/widgets",
  },
  {
    icon: Star,
    title: "Add the Product Reviews section",
    description: "Add the Product Reviews section to your product page to showcase customer feedback.",
    path: "/app/widgets",
  },
  {
    icon: Users,
    title: "Shoppers can start leaving reviews",
    description: "Your customers can now easily leave reviews directly on your store.",
  },
  {
    icon: BarChart3,
    title: "Manage reviews and view AI analysis",
    description: "Monitor incoming reviews, reply to customers, and unlock AI-powered insights.",
    path: "/app/manage-reviews",
  },
];

export function GettingStartedGuideModal({ onClose, onCloseAll }) {
  const embedNavigate = useEmbedNavigate();

  const goTo = (path) => {
    if (!path) return;
    embedNavigate(path);
    onCloseAll?.();
  };

  return (
    <div style={overlayStyle} role="presentation">
      <button type="button" aria-label="Close guide" style={backdropStyle} onClick={onClose} />

      <div style={guidePanelStyle} role="dialog" aria-modal="true" aria-label="Getting started guide">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            border: "none",
            background: "#f6f6f7",
            borderRadius: 10,
            padding: 8,
            cursor: "pointer",
            color: "#5c5f62",
            display: "grid",
            placeItems: "center",
            zIndex: 3,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: "42%",
              background: "#f5f9f7",
              borderRight: "1px solid #e5ebe8",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                alignSelf: "flex-start",
                fontSize: 11,
                fontWeight: 800,
                color: QS_GREEN,
                background: QS_GREEN_TINT,
                padding: "5px 10px",
                borderRadius: 999,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              <Sparkles size={13} />
              Get started
            </span>

            <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: "#202223", lineHeight: 1.2 }}>
              Start collecting reviews in 4 simple steps
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#6d7175", lineHeight: 1.55 }}>
              Set up in minutes and start building trust with authentic customer reviews.
            </p>

            <img
              src={guideIllustration}
              alt="Collect reviews on your storefront"
              style={{
                marginTop: "auto",
                width: "100%",
                height: "auto",
                borderRadius: 14,
                display: "block",
              }}
            />
          </div>

          <div style={{ flex: 1, padding: "36px 32px", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 22px", fontSize: 16, fontWeight: 800, color: "#202223" }}>
              Here&apos;s how it works
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const last = index === STEPS.length - 1;
                return (
                  <div key={step.title} style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          borderRadius: 999,
                          border: "1.5px solid #d7e3dd",
                          background: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          color: QS_GREEN,
                        }}
                      >
                        {index + 1}
                      </span>
                      {!last ? (
                        <span style={{ flex: 1, width: 0, borderLeft: "1.5px dashed #d7e3dd", minHeight: 22 }} />
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => goTo(step.path)}
                      disabled={!step.path}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "4px 8px 22px 0",
                        border: "none",
                        background: "transparent",
                        cursor: step.path ? "pointer" : "default",
                        fontFamily: QS_FONT,
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          borderRadius: 9,
                          background: QS_GREEN_TINT,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon size={17} color={QS_GREEN} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "#202223" }}>
                          {step.title}
                        </span>
                        <span style={{ display: "block", fontSize: 13, color: "#6d7175", marginTop: 3, lineHeight: 1.5 }}>
                          {step.description}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 28px",
            borderTop: "1px solid #e5ebe8",
            background: QS_GREEN_SOFT,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 9,
                background: "#d6f3e6",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Gift size={18} color={QS_GREEN} />
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#202223" }}>You&apos;re all set!</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#5c7368" }}>
                Start collecting reviews and turn happy customers into your biggest advocates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseAll}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 18px",
              borderRadius: 8,
              border: "none",
              background: QS_GREEN,
              color: "#fff",
              fontFamily: QS_FONT,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Got it, let&apos;s go!
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
