/* eslint-disable react/prop-types */
import { ONBOARDING_INDUSTRY_OPTIONS } from "../../lib/onboarding.shared.js";
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { OnboardingOptionCard } from "./onboarding-option-card.jsx";

const FIELD_LABEL = {
  margin: "0 0 8px",
  fontSize: 13,
  fontWeight: 700,
  color: "#202223",
};

export function StepStoreProfile({ storeName, industry, onStoreNameChange, onIndustryChange }) {
  return (
    <div>
      <OnboardingHeading
        eyebrow="Question 1 of 5"
        title="Tell us about your store"
        subtitle="This helps us personalize your widgets, emails, and review form with the right name and tone."
      />

      <p style={FIELD_LABEL}>What is your store name?</p>
      <input
        type="text"
        value={storeName}
        onChange={(e) => onStoreNameChange(e.target.value)}
        placeholder="e.g. Blue Tokai Coffee"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid #c9cccf",
          fontSize: 14,
          fontFamily: "inherit",
          color: "#202223",
          boxSizing: "border-box",
        }}
      />
      <p style={{ margin: "8px 0 24px", fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
        This will appear on your review request emails and widget headers.
      </p>

      <p style={FIELD_LABEL}>What industry are you in?</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {ONBOARDING_INDUSTRY_OPTIONS.map((option) => (
          <OnboardingOptionCard
            key={option.id}
            title={option.label}
            description={option.description}
            selected={industry === option.id}
            onSelect={() => onIndustryChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
