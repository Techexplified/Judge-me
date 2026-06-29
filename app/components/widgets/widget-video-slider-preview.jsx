/* eslint-disable react/prop-types */

const MOCK_REVIEWS = [
  { rating: 5, author: "Sarah M.", duration: "0:42" },
  { rating: 5, author: "James K.", duration: "1:05" },
  { rating: 4, author: "Emily R.", duration: "0:28" },
  { rating: 5, author: "Alex T.", duration: "0:55" },
];

function stars(n, color) {
  const c = Math.min(5, Math.max(0, Number(n) || 0));
  return (
    <span style={{ color, letterSpacing: 1 }}>
      {"★".repeat(c)}
      {"☆".repeat(5 - c)}
    </span>
  );
}

export function WidgetVideoSliderPreview({ config }) {
  const {
    heading,
    limit,
    starColor,
    cardWidth,
    cardHeight,
    cardBorderRadius,
    headingFontSize,
    showStars,
    sectionPadding,
  } = config;

  const items = MOCK_REVIEWS.slice(0, Math.min(limit, MOCK_REVIEWS.length));

  return (
    <section style={{ fontFamily: "system-ui, sans-serif", padding: `${sectionPadding}px 20px` }}>
      <h2 style={{ fontSize: headingFontSize, fontWeight: 700, margin: "0 0 20px" }}>{heading}</h2>
      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            padding: "4px 8px",
            scrollbarWidth: "none",
          }}
        >
          {items.map((r, i) => (
            <article
              key={i}
              style={{
                flex: `0 0 ${cardWidth}px`,
                borderRadius: cardBorderRadius,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.92)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  ▶
                </span>
              </div>
              <div style={{ padding: 10, fontSize: 12 }}>
                {showStars ? <div>{stars(r.rating, starColor)}</div> : null}
                <div style={{ marginTop: 4, color: "#64748b" }}>{r.duration}</div>
                <div style={{ marginTop: 4, fontWeight: 600, color: "#334155" }}>{r.author}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
