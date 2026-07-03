/* eslint-disable react/prop-types */
import { OrderStatusPreview } from "../collect-reviews/order-status-preview.jsx";
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { OnboardingOptionCard } from "./onboarding-option-card.jsx";

function SettingToggle({ label, description, checked, onChange, proBadge, disabled }) {
  const accent = "#008060";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "18px 20px",
        borderRadius: 10,
        border: "1px solid #e1e3e5",
        background: "#fff",
        marginBottom: 12,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#202223" }}>{label}</span>
          {proBadge ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#e0f2fe",
                color: "#0369a1",
              }}
            >
              Pro
            </span>
          ) : null}
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#6d7175", lineHeight: 1.45 }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked && !disabled ? accent : "#e1e3e5",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

export function StepCollect({
  onsiteWidgetEnabled,
  photoReviews,
  videoReviews,
  onOnsiteWidgetChange,
  onPhotoReviewsChange,
  onVideoReviewsChange,
  hasPro,
  accentColor = "#008060",
}) {
  return (
    <div>
      <OnboardingHeading
        eyebrow="Question 5 of 5"
        title="One last thing: start collecting reviews"
        subtitle="Turn on storefront collection so reviews come in automatically after each order."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <OnboardingOptionCard
          title="Yes, show the storefront review widget"
          description="Recommended. Customers who are asked right after delivery are far more likely to leave a review."
          selected={onsiteWidgetEnabled}
          onSelect={() => onOnsiteWidgetChange(true)}
        />
        <OnboardingOptionCard
          title="No, I'll set this up later"
          description="You can turn this on anytime from Settings."
          selected={!onsiteWidgetEnabled}
          onSelect={() => onOnsiteWidgetChange(false)}
        />
      </div>

      <SettingToggle
        label="Photo reviews"
        description="Let customers upload images with their review"
        checked={photoReviews}
        onChange={onPhotoReviewsChange}
      />

      <SettingToggle
        label="Video reviews"
        description="Let customers upload video with their review"
        checked={videoReviews}
        onChange={onVideoReviewsChange}
        proBadge
        disabled={!hasPro}
      />

      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px solid #fde68a",
          background: "#fffbeb",
        }}
      >
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1.4 }}>
          &#9432;
        </span>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#92400e", lineHeight: 1.5 }}>
          <strong>Why we ask:</strong> The storefront widget prompts customers to review from the
          order status page after their order arrives. This is the single biggest driver of new reviews.
        </p>
      </div>

      {onsiteWidgetEnabled ? (
        <div style={{ marginTop: 20 }}>
          <OrderStatusPreview
            timing="after_fulfillment"
            buttonColor={accentColor}
            accentColor={accentColor}
          />
        </div>
      ) : null}
    </div>
  );
}
