/* eslint-disable react/prop-types */

const MOCK_REVIEWS = [
  {
    rating: 5,
    title: "Absolutely love it!",
    comment: "Best purchase I've made this year. Quality exceeded my expectations.",
    author: "Sarah M.",
    hasPhoto: true,
  },
  {
    rating: 5,
    title: "Highly recommend",
    comment: "Fast shipping and the product looks even better in person.",
    author: "James K.",
    hasVideo: true,
  },
  {
    rating: 4,
    comment: "Great value for money. Would buy again.",
    author: "Emily R.",
  },
];

function stars(n, color) {
  const c = Math.min(5, Math.max(0, Number(n) || 0));
  return (
    <span style={{ color, letterSpacing: 1, fontSize: 14 }}>
      {"★".repeat(c)}
      {"☆".repeat(5 - c)}
    </span>
  );
}

function badgeBg(primary) {
  return `${primary}22`;
}

export function WidgetCustomerLovePreview({ config }) {
  const {
    heading,
    limit,
    primaryColor,
    starColor,
    barTrackColor,
    barFillColor,
    showDistribution,
    showFilterPills,
    showPhotoCollage,
    cardMinWidth,
    verifiedBadgeText,
  } = config;

  const reviews = MOCK_REVIEWS.slice(0, Math.min(limit, MOCK_REVIEWS.length));
  const dist = { 5: 42, 4: 18, 3: 6, 2: 2, 1: 1 };
  const maxDist = 42;

  return (
    <section style={{ fontFamily: "system-ui, sans-serif", padding: "32px 20px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 24px" }}>{heading}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          marginBottom: 28,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>4.8</div>
          <div style={{ fontSize: 20, letterSpacing: 2 }}>{stars(5, starColor)}</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>69 Reviews</div>
        </div>

        {showDistribution ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = dist[star] || 0;
              const remainder = Math.max(0, maxDist - count);
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 14 }}>{star}</span>
                  <span style={{ color: starColor }}>★</span>
                  <div
                    style={{
                      flex: "1 1 auto",
                      height: 8,
                      background: barTrackColor,
                      borderRadius: 999,
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div style={{ flex: `${count} 0 0`, background: barFillColor, borderRadius: 999, minWidth: count > 0 ? 4 : 0 }} />
                    <div style={{ flex: `${remainder} 0 0` }} />
                  </div>
                  <span style={{ width: 40, textAlign: "right", color: "#64748b" }}>{count}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {showPhotoCollage ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {showFilterPills ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { id: "all", label: "All Reviews", count: 69, active: true },
            { id: "photo", label: "With Photos", count: 24 },
            { id: "video", label: "With Videos", count: 8 },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${pill.active ? primaryColor : "#e2e8f0"}`,
                background: pill.active ? primaryColor : "#fff",
                color: pill.active ? "#fff" : "#334155",
                fontWeight: 600,
                fontSize: 13,
                cursor: "default",
              }}
            >
              {pill.label} ({pill.count})
            </button>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`,
          gap: 16,
        }}
      >
        {reviews.map((r, i) => (
          <article
            key={i}
            style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, padding: 16 }}
          >
            <div>{stars(r.rating, starColor)}</div>
            {r.title ? <h3 style={{ margin: "8px 0 4px", fontSize: 15 }}>{r.title}</h3> : null}
            <p style={{ margin: "0 0 8px", lineHeight: 1.55, color: "#334155", fontSize: 14 }}>{r.comment}</p>
            {r.hasPhoto || r.hasVideo ? (
              <div
                style={{
                  marginTop: 12,
                  height: 120,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                }}
              />
            ) : null}
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              <strong>{r.author}</strong>
              <span
                style={{
                  background: badgeBg(primaryColor),
                  color: primaryColor,
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {verifiedBadgeText}
              </span>
              <span style={{ color: "#94a3b8" }}>2 days ago</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
