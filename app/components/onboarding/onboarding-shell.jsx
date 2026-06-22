/* eslint-disable react/prop-types */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SHOPIFY_GREEN } from "../admin-ui";

export const ONBOARDING_PAGE_BG = "#f1f1f1";
export const ONBOARDING_PROGRESS_ACTIVE = "#2563eb";
export const ONBOARDING_CARD_RADIUS = 12;

export function OnboardingShell({
  step,
  totalSteps = 3,
  wide = false,
  children,
  continueLabel = "Continue",
  onContinue,
  onBack,
  showBack = false,
  backDisabled = false,
  continueDisabled = false,
  continueLoading = false,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: ONBOARDING_PAGE_BG,
        padding: "32px 24px 48px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: wide ? 920 : 720, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 280 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i < step ? ONBOARDING_PROGRESS_ACTIVE : "#e1e3e5",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#6d7175",
              whiteSpace: "nowrap",
            }}
          >
            Step {step} of {totalSteps}
          </span>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: ONBOARDING_CARD_RADIUS,
            border: "1px solid #e5ebe8",
            padding: wide ? "32px 36px" : "32px 28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            gap: 12,
          }}
        >
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                borderRadius: ONBOARDING_CARD_RADIUS,
                border: "1px solid #c9cccf",
                background: "#fff",
                color: "#202223",
                fontWeight: 700,
                fontSize: 14,
                cursor: backDisabled ? "not-allowed" : "pointer",
                opacity: backDisabled ? 0.55 : 1,
                fontFamily: "inherit",
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || continueLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: ONBOARDING_CARD_RADIUS,
              border: "none",
              background: SHOPIFY_GREEN,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: continueDisabled || continueLoading ? "not-allowed" : "pointer",
              opacity: continueDisabled || continueLoading ? 0.55 : 1,
              fontFamily: "inherit",
            }}
          >
            {continueLoading ? "Saving…" : continueLabel}
            {!continueLoading ? <ArrowRight size={16} /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 24,
          fontWeight: 800,
          color: "#202223",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: "#6d7175",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
