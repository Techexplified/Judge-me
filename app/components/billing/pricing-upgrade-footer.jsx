/* eslint-disable react/prop-types */

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e1e3e5",
    borderRadius: 12,
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  left: {},
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1e40af",
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 8,
  },
  planName: {
    margin: "0 0 4px",
    fontSize: 22,
    fontWeight: 900,
    color: "#202223",
  },
  price: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    color: "#202223",
    letterSpacing: "-0.02em",
  },
  priceUnit: {
    fontSize: 15,
    fontWeight: 600,
    color: "#6d7175",
  },
  right: {
    textAlign: "center",
  },
  cta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 28px",
    borderRadius: 8,
    background: "#2d2d2d",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 8,
  },
  subtext: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
  },
};

export function PricingUpgradeFooter({
  proPrice,
  proTrialDays,
  appPricingUrl,
  isSubmitting,
  onStartTrial,
}) {
  const cta = appPricingUrl ? (
    <a href={appPricingUrl} target="_top" rel="noopener noreferrer" style={styles.cta}>
      Upgrade to Pro
    </a>
  ) : (
    <button
      type="button"
      style={styles.cta}
      disabled={isSubmitting}
      onClick={onStartTrial}
    >
      Upgrade to Pro
    </button>
  );

  return (
    <div style={styles.card}>
      <div style={styles.left}>
        <span style={styles.badge}>Recommended</span>
        <h3 style={styles.planName}>Pro</h3>
        <p style={styles.price}>
          ${proPrice}
          <span style={styles.priceUnit}>/month</span>
        </p>
      </div>
      <div style={styles.right}>
        {cta}
        <p style={styles.subtext}>
          {proTrialDays} day free trial · No extra fees · Cancel anytime
        </p>
      </div>
    </div>
  );
}
