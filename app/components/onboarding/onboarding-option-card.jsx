/* eslint-disable react/prop-types */
import { SHOPIFY_GREEN } from "../admin-ui";

const SELECTED_BG = "#ecfdf5";
const SELECTED_BORDER = SHOPIFY_GREEN;

export function OnboardingOptionCard({
  title,
  description,
  selected,
  onSelect,
  badge,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 14,
        width: "100%",
        padding: "16px 18px",
        borderRadius: 10,
        border: selected ? `2px solid ${SELECTED_BORDER}` : "1px solid #e1e3e5",
        background: selected ? SELECTED_BG : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: description ? 4 : 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#202223" }}>{title}</span>
          {badge ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#d1fae5",
                color: "#047857",
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#6d7175", lineHeight: 1.5 }}>
            {description}
          </p>
        ) : null}
      </div>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: selected ? `6px solid ${SELECTED_BORDER}` : "2px solid #c9cccf",
          flexShrink: 0,
          marginTop: 2,
          boxSizing: "border-box",
        }}
      />
    </button>
  );
}
