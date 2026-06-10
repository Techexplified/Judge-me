/* eslint-disable react/prop-types */

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e1e3e5",
    borderRadius: 12,
    padding: "28px 32px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 20,
    fontWeight: 900,
    color: "#202223",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  previewCard: {
    border: "1px solid #e1e3e5",
    borderRadius: 10,
    overflow: "hidden",
  },
  previewHeader: (tone) => ({
    height: 120,
    background: tone === "mint" ? "#e8f5ee" : "#e8f4fc",
    backgroundImage:
      "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.4) 8px, rgba(255,255,255,0.4) 9px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  }),
  mockWindow: {
    background: "#fff",
    borderRadius: 8,
    padding: "12px 14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "85%",
    maxWidth: 160,
    fontSize: 11,
    fontWeight: 700,
    color: "#202223",
    textAlign: "center",
  },
  stars: {
    color: "#F59E0B",
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 6,
  },
  previewBody: {
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#202223",
  },
};

const PREVIEWS = [
  {
    tone: "mint",
    label: "Review form",
    mock: (
      <div style={styles.mockWindow}>
        <div style={styles.stars}>★★★★★</div>
        Let us know what you think
      </div>
    ),
    caption: "Custom review forms",
  },
  {
    tone: "sky",
    label: "Analytics",
    mock: (
      <div style={styles.mockWindow}>
        <div style={{ fontSize: 10, color: "#6d7175", marginBottom: 4 }}>4.8 avg</div>
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {[40, 60, 80, 50, 30].map((h, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: h / 4,
                background: "#008060",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>
    ),
    caption: "Live graphs & charts",
  },
  {
    tone: "mint",
    label: "Translation",
    mock: (
      <div style={styles.mockWindow}>
        <div style={{ fontSize: 10, color: "#6d7175" }}>EN → FR</div>
        Auto translate reviews
      </div>
    ),
    caption: "Full translation suite",
  },
];

export function PricingWhyUpgrade() {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Why you should upgrade to Pro</h3>
      <p style={styles.subtitle}>
        After upgrading you&apos;ll have access to all Free features, plus all the locked features:
      </p>
      <div style={styles.grid}>
        {PREVIEWS.map((p) => (
          <div key={p.caption} style={styles.previewCard}>
            <div style={styles.previewHeader(p.tone)}>{p.mock}</div>
            <div style={styles.previewBody}>{p.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
