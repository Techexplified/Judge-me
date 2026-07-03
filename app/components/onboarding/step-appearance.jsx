/* eslint-disable react/prop-types */
import {
  ONBOARDING_LAYOUT_OPTIONS,
  ONBOARDING_ACCENT_COLORS,
  buildOnboardingFormConfig,
} from "../../lib/onboarding.shared.js";
import { normalizeHex } from "../../lib/review-form-config.shared.js";
import { SHOPIFY_GREEN } from "../admin-ui";
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { OnboardingOptionCard } from "./onboarding-option-card.jsx";
import { OnboardingPreview } from "./onboarding-preview.jsx";

const LAYOUT_DISPLAY_ORDER = ["modern", "minimal", "luxury"];
const POPULAR_LAYOUT = "modern";

const SECTION_LABEL = {
  margin: "0 0 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#202223",
};

export function StepAppearance({
  layoutPreset,
  accentColor,
  brandLogoUrl,
  storeName,
  onLayoutChange,
  onAccentChange,
  onLogoFile,
  onLogoRemove,
  logoError,
  logoUploading,
}) {
  const normalizedAccent = normalizeHex(accentColor) || accentColor;
  const previewConfig = {
    ...buildOnboardingFormConfig(layoutPreset, accentColor),
    brandLogoUrl: brandLogoUrl || null,
  };

  const layoutOptions = LAYOUT_DISPLAY_ORDER.map((id) =>
    ONBOARDING_LAYOUT_OPTIONS.find((o) => o.id === id),
  ).filter(Boolean);

  return (
    <div>
      <OnboardingHeading
        eyebrow="Question 4 of 5"
        title="Customize your review widget"
        subtitle="Pick a style and color that match your store. You'll see the preview update live below."
      />

      <p style={SECTION_LABEL}>Layout style</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {layoutOptions.map((option) => (
          <OnboardingOptionCard
            key={option.id}
            title={option.label}
            description={option.description}
            selected={layoutPreset === option.id}
            onSelect={() => onLayoutChange(option.id)}
            badge={option.id === POPULAR_LAYOUT ? "Popular" : undefined}
          />
        ))}
      </div>

      <p style={SECTION_LABEL}>Accent color</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {ONBOARDING_ACCENT_COLORS.map((swatch) => {
          const selected =
            normalizedAccent?.toLowerCase() === swatch.value.toLowerCase();
          return (
            <button
              key={swatch.id}
              type="button"
              aria-label={`Accent color ${swatch.id}`}
              onClick={() => onAccentChange(swatch.value)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: swatch.value,
                border: selected ? `3px solid ${SHOPIFY_GREEN}` : "2px solid transparent",
                outline: selected ? "2px solid #fff" : "none",
                boxShadow: selected ? `0 0 0 2px ${SHOPIFY_GREEN}` : "0 1px 3px rgba(0,0,0,0.15)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          );
        })}
      </div>

      <OnboardingPreview
        config={previewConfig}
        brandLogoUrl={brandLogoUrl}
        storeName={storeName}
        onLogoFile={onLogoFile}
        onLogoRemove={onLogoRemove}
        logoError={logoError}
        logoUploading={logoUploading}
      />
    </div>
  );
}
