/* eslint-disable react/prop-types */
import { Star, Store } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BORDER } from "../admin-ui";
import { getOrderStatusWidgetCopy } from "../../lib/order-status-widget.shared.js";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function OrderStatusPreview({
  timing = "after_fulfillment",
  buttonColor = "#008060",
  accentColor = "#008060",
}) {
  const copy = getOrderStatusWidgetCopy(timing);
  const isStoreReview = timing !== "after_delivery";

  return (
    <div>
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
          margin: "0 0 16px",
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          color: "#6d7175",
        }}
      >
        {copy.timingLabel}. Order status, tracking, and delivery dates are shown by Shopify. Your
        app only adds the review prompt below.
      </p>

      <div
        style={{
          background: "#eef1f0",
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${SURFACE_BORDER}`,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderBottom: `1px dashed ${SURFACE_BORDER}`,
              background: "#fafcfb",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
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
                fontSize: 13,
                fontWeight: 500,
                color: "#6d7175",
                lineHeight: 1.5,
              }}
            >
              Order confirmed · estimated delivery · tracking number & carrier
            </p>
          </div>

          <div style={{ padding: 20, background: "#f6f8f7" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: SHOPIFY_GREEN,
              }}
            >
              Your review widget
            </p>

            <div
              style={{
                maxWidth: 480,
                margin: "0 auto",
                background: "#fff",
                borderRadius: 10,
                border: `1px solid ${accentColor}`,
                padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isStoreReview ? (
                    <Store size={20} color={accentColor} />
                  ) : (
                    <Star size={20} color={accentColor} fill="#ecfdf5" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontFamily: FONT,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#202223",
                    }}
                  >
                    {copy.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#6d7175",
                    }}
                  >
                    {copy.subtitle}
                  </p>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={18} color="#c9cccf" strokeWidth={1.5} />
                    ))}
                  </div>
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#6d7176",
                    }}
                  >
                    Tap to rate
                  </p>
                  <button
                    type="button"
                    style={{
                      padding: "10px 18px",
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
          }}
        >
          i
        </span>
        Preview updates when you change widget timing. Tracking and delivery come from the real
        order, not from JudgeMe.
      </div>
    </div>
  );
}
