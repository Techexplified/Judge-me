/* eslint-disable react/prop-types */
import { MapPin, Package, Star, Store } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BORDER } from "../admin-ui";
import { getOrderStatusWidgetCopy } from "../../lib/order-status-widget.shared.js";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const TIMING_OPTIONS = [
  { value: "after_fulfillment", label: "After fulfillment", icon: Package },
  { value: "after_delivery", label: "After delivery", icon: MapPin },
];

function TimingToggle({ timing, onChange }) {
  return (
    <div
      role="group"
      aria-label="Widget timing"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: "#eef1f0",
        border: `1px solid ${SURFACE_BORDER}`,
        flexShrink: 0,
      }}
    >
      {TIMING_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = timing === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 7,
              border: "none",
              background: selected ? "#fff" : "transparent",
              boxShadow: selected ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: selected ? 700 : 600,
              color: selected ? "#202223" : "#6d7175",
              cursor: "pointer",
              transition: "background 0.15s, box-shadow 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} strokeWidth={selected ? 2.25 : 2} color={selected ? SHOPIFY_GREEN : "#8c9196"} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function OrderStatusPreview({
  timing = "after_fulfillment",
  buttonColor = "#008060",
  accentColor = "#008060",
  onTimingChange,
}) {
  const copy = getOrderStatusWidgetCopy(timing);
  const isStoreReview = timing !== "after_delivery";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3
            style={{
              margin: "0 0 4px",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 600,
              color: "#202223",
            }}
          >
            Live preview
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 500,
              color: "#6d7175",
              lineHeight: 1.5,
            }}
          >
            {copy.timingLabel}. Order status and tracking come from Shopify — your app adds the
            review prompt below.
          </p>
        </div>
        {onTimingChange ? (
          <TimingToggle timing={timing} onChange={onTimingChange} />
        ) : null}
      </div>

      <div
        style={{
          background: "#eef1f0",
          borderRadius: 12,
          padding: "28px 24px 32px",
          border: `1px solid ${SURFACE_BORDER}`,
          display: "flex",
          justifyContent: "center",
          minHeight: 480,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${SURFACE_BORDER}`,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px dashed ${SURFACE_BORDER}`,
              background: "#fafcfb",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#8c9196",
              }}
            >
              Provided by Shopify
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 500,
                color: "#6d7175",
                lineHeight: 1.45,
              }}
            >
              Order confirmed · estimated delivery · tracking
            </p>
          </div>

          <div style={{ padding: "24px 20px 28px", background: "#f6f8f7" }}>
            <p
              style={{
                margin: "0 0 16px",
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: SHOPIFY_GREEN,
                textAlign: "center",
              }}
            >
              Your review widget
            </p>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${accentColor}`,
                padding: "24px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {isStoreReview ? (
                  <Store size={24} color={accentColor} />
                ) : (
                  <Star size={24} color={accentColor} fill="#ecfdf5" />
                )}
              </div>

              <p
                style={{
                  margin: "0 0 6px",
                  fontFamily: FONT,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#202223",
                  lineHeight: 1.3,
                }}
              >
                {copy.title}
              </p>
              <p
                style={{
                  margin: "0 0 16px",
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#6d7175",
                  lineHeight: 1.45,
                  maxWidth: 280,
                }}
              >
                {copy.subtitle}
              </p>

              <div style={{ display: "flex", gap: 6, marginBottom: 8, justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={22} color="#c9cccf" strokeWidth={1.5} />
                ))}
              </div>
              <p
                style={{
                  margin: "0 0 16px",
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#8c9196",
                }}
              >
                Tap to rate
              </p>
              <button
                type="button"
                style={{
                  width: "100%",
                  maxWidth: 260,
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: buttonColor,
                  color: "#fff",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                {copy.cta}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
          padding: "10px 0",
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 500,
          color: "#6d7175",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: `1px solid ${SURFACE_BORDER}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          i
        </span>
        Switch timing above to preview each mode, then click Save. Tracking and delivery come from
        the real order, not JudgeMe.
      </div>
    </div>
  );
}
