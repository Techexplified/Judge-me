/* eslint-disable react/prop-types */
import { Star } from "lucide-react";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function StarRow({ rating, size = 14 }) {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < r ? "#fbbf24" : "none"}
          stroke="#fbbf24"
          aria-hidden
        />
      ))}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SocialShowcasePreview({ config, brandLogoUrl, summary, reviewCandidates, photoCandidates }) {
  const accent = config.accentColor || "#1D9E75";
  const selectedReviews = (config.selectedReviewIds || [])
    .map((id) => reviewCandidates.find((r) => r.id === id))
    .filter(Boolean);
  const selectedPhotos = (config.selectedMediaIds || [])
    .map((id) => photoCandidates.find((p) => p.id === id))
    .filter(Boolean);
  const avg = summary?.average || 0;
  const total = summary?.total || 0;

  return (
    <div
      style={{
        fontFamily: FONT,
        background: "#fff",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "#8c9196",
          padding: "14px 16px 0",
        }}
      >
        VERDICT PRODUCT REVIEWS
      </div>
      <div style={{ padding: "18px 16px 8px", textAlign: "center" }}>
        {brandLogoUrl ? (
          <img
            src={brandLogoUrl}
            alt=""
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 12px",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 12px",
              background: "#eef2ff",
              color: "#4338ca",
              fontWeight: 800,
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {initials(config.storeName)}
          </div>
        )}
        <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#202223" }}>
          {config.storeName || "Your store"}
        </h3>
        {config.tagline ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175", lineHeight: 1.5 }}>{config.tagline}</p>
        ) : null}
      </div>
      <div style={{ textAlign: "center", padding: "12px 16px 6px" }}>
        <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{avg.toFixed(1)}</div>
        <StarRow rating={avg} size={16} />
        <div style={{ marginTop: 6, fontSize: 12, color: "#6d7175", fontWeight: 500 }}>
          {total.toLocaleString()} verified reviews
        </div>
      </div>
      <div style={{ padding: "12px 16px 18px" }}>
        <button
          type="button"
          style={{
            width: "100%",
            border: "none",
            borderRadius: 999,
            padding: "14px 16px",
            background: accent,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "default",
          }}
        >
          {config.shopNowLabel || "Shop Now"}
        </button>
      </div>
      <div style={{ padding: "0 0 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 16px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#6d7175",
          }}
        >
          <span>CUSTOMER PHOTOS</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            padding: "0 16px",
          }}
        >
          {selectedPhotos.length > 0 ? (
            selectedPhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: "relative",
                  flex: "0 0 130px",
                  height: 160,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#eceff1",
                }}
              >
                <img
                  src={photo.url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    background: "rgba(0,0,0,0.72)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 7px",
                    borderRadius: 999,
                  }}
                >
                  ★ {Number(photo.rating || 0).toFixed(1)}
                </span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: "#8c9196", padding: "0 16px" }}>Select photos to preview</div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#6d7175",
          }}
        >
          <span>WHAT CUSTOMERS SAY</span>
          <span style={{ fontWeight: 500, letterSpacing: 0 }}>{total.toLocaleString()} reviews</span>
        </div>
        {selectedReviews.length > 0 ? (
          selectedReviews.map((review) => (
            <div
              key={review.id}
              style={{
                border: "1px solid #e1e3e5",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <strong style={{ fontSize: 14 }}>{review.author}</strong>
                <StarRow rating={review.rating} size={12} />
              </div>
              <span
                style={{
                  display: "inline-block",
                  background: "#e8f5ef",
                  color: accent,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 7px",
                  borderRadius: 999,
                  marginBottom: 8,
                }}
              >
                {config.verifiedBadgeText || "Verified Buyer"}
              </span>
              <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.5, color: "#202223" }}>
                {review.comment}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: "#6d7175" }}>
                {review.productName ? (
                  <span
                    style={{
                      background: "#f1f2f3",
                      color: "#454f5b",
                      padding: "3px 7px",
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {review.productName}
                  </span>
                ) : null}
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: "#8c9196" }}>Select reviews to preview</div>
        )}
      </div>
      <div
        style={{
          background: "#f6f7f8",
          padding: "20px 16px 24px",
          textAlign: "center",
        }}
      >
        <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>
          {config.bottomCtaHeading || "Ready to try it?"}
        </h4>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6d7175", lineHeight: 1.5 }}>
          Join thousands of happy customers who trust {config.storeName || "us"}.
        </p>
        <button
          type="button"
          style={{
            width: "100%",
            border: "none",
            borderRadius: 999,
            padding: "13px 16px",
            background: accent,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "default",
          }}
        >
          {config.shopNowLabel || "Shop Now"}
        </button>
        <div style={{ marginTop: 10, fontSize: 12, color: "#6d7175", fontWeight: 600 }}>
          {avg.toFixed(1)} average across {total.toLocaleString()} reviews
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: "#8c9196" }}>Powered by Verdict Product Reviews</div>
      </div>
    </div>
  );
}
