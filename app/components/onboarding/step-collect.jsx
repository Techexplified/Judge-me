/* eslint-disable react/prop-types */
import { OnboardingHeading } from "./onboarding-shell.jsx";

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
  emailReviewRequests,
  photoVideoReviews,
  onEmailChange,
  onPhotoVideoChange,
  hasPro,
  accentColor = "#008060",
}) {
  return (
    <div>
      <OnboardingHeading
        title="Start collecting reviews"
        subtitle="Automate requests so reviews come in without manual work."
      />

      <SettingToggle
        label="Email review requests"
        description="Sent automatically 7 days after delivery"
        checked={emailReviewRequests}
        onChange={onEmailChange}
      />

      <SettingToggle
        label="Photo & video reviews"
        description="Let customers upload images and videos with their review"
        checked={photoVideoReviews}
        onChange={onPhotoVideoChange}
        proBadge
        disabled={!hasPro}
      />

      <div
        style={{
          marginTop: 20,
          background: "#faf8f5",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "#6d7175",
            letterSpacing: "0.06em",
          }}
        >
          EMAIL PREVIEW
        </p>
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            padding: "24px 28px",
            border: "1px solid #e5ebe8",
          }}
        >
          <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#202223" }}>
            How was your order, Maya?
          </h4>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6d7175", fontWeight: 500 }}>
            Tell us what you think. It only takes a minute.
          </p>
          <button
            type="button"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: accentColor,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              cursor: "default",
            }}
          >
            Write a review
          </button>
        </div>
      </div>
    </div>
  );
}
