/* eslint-disable react/prop-types */
import {
  ONBOARDING_LAYOUT_OPTIONS,
  ONBOARDING_ACCENT_COLORS,
  buildOnboardingFormConfig,
} from "../../lib/onboarding.shared.js";
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { OnboardingPreview } from "./onboarding-preview.jsx";

export function StepAppearance({
  layoutPreset,
  accentColor,
  brandLogoUrl,
  onLayoutChange,
  onAccentChange,
  onLogoFile,
  onLogoRemove,
  logoError,
  logoUploading,
}) {
  const previewConfig = {
    ...buildOnboardingFormConfig(layoutPreset, accentColor),
    brandLogoUrl: brandLogoUrl || null,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 32,
        alignItems: "start",
      }}
    >
      <div>
        <OnboardingHeading
          title="Make it look like your store"
          subtitle="Pick a style for your Review widget. You can change this anytime in settings."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {ONBOARDING_LAYOUT_OPTIONS.map((option) => {
            const selected = layoutPreset === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onLayoutChange(option.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: selected ? "2px solid #2563eb" : "1px solid #e1e3e5",
                  background: selected ? "#f8faff" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: selected ? "5px solid #2563eb" : "2px solid #c9cccf",
                    flexShrink: 0,
                    marginTop: 2,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#202223",
                      marginBottom: 2,
                    }}
                  >
                    {option.label}
                  </span>
                  <span style={{ fontSize: 13, color: "#6d7175", fontWeight: 500 }}>
                    {option.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            fontWeight: 700,
            color: "#202223",
          }}
        >
          Accent color
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {ONBOARDING_ACCENT_COLORS.map((swatch) => {
            const selected = accentColor === swatch.value;
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
                  border: selected ? "3px solid #2563eb" : "2px solid transparent",
                  outline: selected ? "2px solid #fff" : "none",
                  boxShadow: selected ? "0 0 0 2px #2563eb" : "0 1px 3px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ position: "sticky", top: 24 }}>
        <OnboardingPreview
          config={previewConfig}
          brandLogoUrl={brandLogoUrl}
          onLogoFile={onLogoFile}
          onLogoRemove={onLogoRemove}
          logoError={logoError}
          logoUploading={logoUploading}
        />
      </div>
    </div>
  );
}
