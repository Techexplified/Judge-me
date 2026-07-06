/* eslint-disable react/prop-types */

const MOCK_REVIEWS = [
  { rating: 5, comment: "Amazing quality and super fast delivery! Will definetly buy again", author: "Sarah" },
  { rating: 5, comment: "The material is soft and design is even better in person. Highly recommend!", author: "David" },
  { rating: 5, comment: "Excellent product and great customer service", author: "Olivia" },
];

function stars(n, color) {
  const c = Math.min(5, Math.max(0, Number(n) || 0));
  return (
    <span style={{ color, letterSpacing: 2, fontSize: 16 }}>
      {"★".repeat(c)}
      {"☆".repeat(5 - c)}
    </span>
  );
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function WidgetTestimonialsPreview({ config }) {
  const {
    heading,
    limit,
    accentColor,
    starColor,
    textColor,
    fontFamily,
    borderRadius,
    sectionPadding,
    headingFontSize,
    cardMinWidth,
    showNavigationArrows,
    showDots,
    showVerifiedBadge,
    verifiedBadgeText,
  } = config;

  const reviews = MOCK_REVIEWS.slice(0, Math.min(limit, MOCK_REVIEWS.length));

  return (
    <section
      style={{
        fontFamily: fontFamily === "inherit" ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : fontFamily,
        padding: `${sectionPadding}px 24px`,
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .preview-carousel-wrap { display: flex; align-items: center; gap: 12px; width: 100%; overflow: hidden; }
        .preview-track { display: flex; gap: 24px; overflow: hidden; flex: 1; width: 100%; padding: 10px 4px; }
        .preview-card { flex: 0 0 calc((100% - 48px) / 3); box-sizing: border-box; background: #fff; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02); padding: 28px; display: flex; flex-direction: column; position: relative; }
        
        @media (max-width: 1023px) {
          .preview-card { flex: 0 0 calc((100% - 24px) / 2) !important; }
        }
        
        @media (max-width: 639px) {
          .preview-card { flex: 0 0 100% !important; min-width: 100% !important; }
        }
        
        [data-preview-device="mobile"] .preview-card,
        .is-mobile .preview-card,
        .mobile-preview .preview-card { 
          flex: 0 0 100% !important; 
          min-width: 100% !important; 
        }
      `}</style>

      <h1 style={{ fontSize: headingFontSize, fontWeight: 700, margin: "0 0 32px", color: textColor, textAlign: "left" }}>
        {heading}
      </h1>

      <div className="preview-carousel-wrap">
        <div className="preview-track">
          {reviews.map((r, i) => (
            <article
              key={i}
              className="preview-card"
              style={{
                minWidth: Math.max(250, cardMinWidth || 0),
                borderRadius: borderRadius || 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                {stars(r.rating, starColor)}
                {showVerifiedBadge ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#f0fdf4",
                      color: "#16a34a",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ {verifiedBadgeText}
                  </span>
                ) : null}
              </div>

              <div 
                style={{ 
                  position: "absolute", 
                  left: 28, 
                  top: 72, 
                  fontSize: 48, 
                  fontFamily: "Georgia, serif", 
                  color: accentColor, 
                  lineHeight: 1, 
                  fontWeight: "bold" 
                }}
              >
                &ldquo;
              </div>

              <p style={{ margin: "44px 0 24px 0", lineHeight: 1.6, color: "#334155", fontSize: 15, textAlign: "left", flex: 1 }}>
                {r.comment}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #f8fafc", paddingTop: 20 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#475569",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(r.author)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: textColor, marginBottom: 2 }}>{r.author}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>Verified Buyer</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showNavigationArrows ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            style={{
              position: "absolute",
              left: 4,
              top: "55%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              zIndex: 10,
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            style={{
              position: "absolute",
              right: 4,
              top: "55%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              zIndex: 10,
            }}
          >
            ›
          </button>
        </>
      ) : null}

      {showDots ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          {[0, 1, 2, 3].map((d) => (
            <span
              key={d}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: d === 0 ? accentColor : "#cbd5e1",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}