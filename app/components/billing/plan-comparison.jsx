/* eslint-disable react/prop-types */
import { FREE_PLAN_BOX, PRO_PLAN_BOX } from "../../lib/plan-features.shared.js";
import { PRO_TRIAL_DAYS } from "../../lib/trial.shared.js";
import { SHOPIFY_GREEN } from "../admin-ui";

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    alignItems: "stretch",
  },
  box: {
    border: "1px solid #e1e3e5",
    borderRadius: 12,
    padding: "20px 22px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
  boxFree: {
    background: "#fafcfb",
    borderColor: "#dfe3e1",
  },
  boxPro: {
    background: "#f6fbf8",
    border: `2px solid ${SHOPIFY_GREEN}`,
  },
  planLabel: {
    margin: "0 0 4px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6d7175",
  },
  planTitle: {
    margin: "0 0 6px",
    fontSize: 22,
    fontWeight: 900,
    color: "#202223",
  },
  price: {
    margin: "0 0 4px",
    fontSize: 28,
    fontWeight: 900,
    color: "#202223",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "0 0 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.45,
    paddingBottom: 16,
    borderBottom: "1px solid #e1e3e5",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#008060",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  item: {
    position: "relative",
    paddingLeft: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#202223",
    lineHeight: 1.5,
  },
  bullet: {
    position: "absolute",
    left: 0,
    top: "0.55em",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#8c9196",
  },
  bulletPro: {
    background: SHOPIFY_GREEN,
  },
  popular: {
    display: "inline-block",
    marginBottom: 10,
    fontSize: 11,
    fontWeight: 800,
    color: "#008060",
    background: "#f1f8f5",
    border: "1px solid #aee9d1",
    borderRadius: 999,
    padding: "4px 10px",
  },
};

function PlanBoxCard({ plan, variant }) {
  const isPro = variant === "pro";

  return (
    <div style={{ ...styles.box, ...(isPro ? styles.boxPro : styles.boxFree) }}>
      {isPro ? <span style={styles.popular}>Most popular</span> : null}
      <p style={styles.planLabel}>{plan.title} Plan</p>
      <h3 style={styles.planTitle}>{plan.title}</h3>
      <p style={styles.price}>{plan.priceLabel}</p>
      <p style={styles.subtitle}>{plan.subtitle}</p>

      {plan.sections.map((section) => (
        <div key={section.title} style={styles.section}>
          <h4 style={styles.sectionTitle}>{section.title}</h4>
          <ul style={styles.list}>
            {section.items.map((item) => (
              <li key={item} style={styles.item}>
                <span style={{ ...styles.bullet, ...(isPro ? styles.bulletPro : {}) }} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PlanComparison({ freePrice, proPrice }) {
  const free = {
    ...FREE_PLAN_BOX,
    priceLabel: freePrice ? `${freePrice} / month` : FREE_PLAN_BOX.priceLabel,
  };
  const pro = {
    ...PRO_PLAN_BOX,
    priceLabel: proPrice ? `${proPrice} / month` : PRO_PLAN_BOX.priceLabel,
    subtitle: `${PRO_TRIAL_DAYS} day free trial · billed via Shopify`,
  };

  return (
    <div style={styles.grid}>
      <PlanBoxCard plan={free} variant="free" />
      <PlanBoxCard plan={pro} variant="pro" />
    </div>
  );
}

/** @deprecated use PlanComparison */
export function PlanHighlights({ variant = "free" }) {
  const plan = variant === "pro" ? PRO_PLAN_BOX : FREE_PLAN_BOX;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}>
      {plan.sections.flatMap((s) => s.items).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
