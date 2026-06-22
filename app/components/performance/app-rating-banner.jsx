/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Sparkles, Star, X } from "lucide-react";
import { SHOPIFY_GREEN, SHOPIFY_GREEN_DARK, SURFACE_BORDER } from "../admin-ui";

const BANNER_DELAY_MS = 3500;

export function AppRatingBanner({ showWhenReady, onDismissed }) {
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const location = useLocation();
  const actionPath = `${location.pathname}${location.search}`;
  const [visible, setVisible] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!showWhenReady) return undefined;
    const timer = window.setTimeout(() => setVisible(true), BANNER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [showWhenReady]);

  const dismiss = useCallback(() => {
    setVisible(false);
    fetcher.submit({ intent: "dismissAppRating" }, { method: "post", action: actionPath });
    onDismissed?.();
  }, [actionPath, fetcher, onDismissed]);

  const requestReview = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const reviewsApi = shopify?.reviews;
      if (reviewsApi && typeof reviewsApi.request === "function") {
        const result = await reviewsApi.request();
        if (result?.success) {
          fetcher.submit({ intent: "markAppRated" }, { method: "post", action: actionPath });
          setVisible(false);
          onDismissed?.();
          if (typeof shopify?.toast?.show === "function") {
            shopify.toast.show("Thanks for your feedback!");
          }
          return;
        }
      }

      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Review prompt is not available right now. Try again later.");
      }
    } catch {
      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Could not open the review prompt.");
      }
    } finally {
      setRequesting(false);
    }
  }, [actionPath, fetcher, onDismissed, requesting, shopify]);

  if (!visible) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "18px 20px",
        background: "#fff",
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        animation: "fadeSlideIn 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#ecfdf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Sparkles size={20} color={SHOPIFY_GREEN} />
      </div>

      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#202223", marginBottom: 4 }}>
          We value your feedback!
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6d7175", lineHeight: 1.5 }}>
          Your experience matters to us. Please take a moment to share your thoughts.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          border: `1px solid ${SURFACE_BORDER}`,
          borderRadius: 10,
          background: "#fafcfb",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#202223" }}>Rate us</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= hoveredStar;
            return (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} stars`}
                disabled={requesting}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => requestReview()}
                style={{
                  background: "none",
                  border: "none",
                  padding: 2,
                  cursor: requesting ? "wait" : "pointer",
                  lineHeight: 0,
                }}
              >
                <Star
                  size={18}
                  fill={filled ? "#fbbf24" : "transparent"}
                  color="#fbbf24"
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
        <div
          style={{
            width: 1,
            height: 24,
            background: SURFACE_BORDER,
            margin: "0 4px",
          }}
        />
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "#6d7175",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export { SHOPIFY_GREEN, SHOPIFY_GREEN_DARK };
