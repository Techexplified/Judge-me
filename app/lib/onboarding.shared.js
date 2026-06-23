import {
  applyLayoutPreset,
  mergeFormConfig,
  normalizeHex,
} from "./review-form-config.shared.js";

export const ONBOARDING_LAYOUT_OPTIONS = [
  { id: "minimal", label: "Minimal", description: "Clean lines, no fills" },
  { id: "modern", label: "Modern", description: "Bold accent, rounded cards" },
  { id: "luxury", label: "Luxury", description: "Serif accents, gold stars" },
];

export const ONBOARDING_ACCENT_COLORS = [
  { id: "teal", value: "#0d9488" },
  { id: "blue", value: "#2563eb" },
  { id: "pink", value: "#ec4899" },
  { id: "gold", value: "#b45309" },
  { id: "black", value: "#1e293b" },
];

export const ONBOARDING_IMPORT_SOURCES = {
  loox: "loox",
  judgeme: "judgeme",
  amazon: "amazon",
  flipkart: "flipkart",
  csv: "custom",
};

export const ONBOARDING_IMPORT_KEYS = ["loox", "judgeme", "amazon", "flipkart", "csv"];

/** Bump when the onboarding wizard changes so existing installs re-run the flow. */
export const ONBOARDING_VERSION = 3;

export function isNewOnboardingComplete(onboarding) {
  return Boolean(
    onboarding?.completedAt &&
      Number(onboarding?.version) >= ONBOARDING_VERSION,
  );
}

export function buildOnboardingFormConfig(layoutPreset, accentColor) {
  const preset = ONBOARDING_LAYOUT_OPTIONS.some((o) => o.id === layoutPreset)
    ? layoutPreset
    : "modern";
  const accent =
    normalizeHex(accentColor) ||
    ONBOARDING_ACCENT_COLORS.find((c) => c.id === "teal")?.value ||
    "#0d9488";
  const bundled = applyLayoutPreset(preset, {});
  return mergeFormConfig({
    ...bundled,
    primaryColor: accent,
    accentColor: accent,
    buttonColor: accent,
  });
}

export function isOnboardingAppearanceComplete(appearance) {
  return Boolean(
    appearance?.layoutPreset &&
      ONBOARDING_LAYOUT_OPTIONS.some((o) => o.id === appearance.layoutPreset) &&
      appearance?.accentColor,
  );
}

export function isOnboardingImportComplete(onboarding) {
  return Boolean(onboarding?.importConfiguredAt);
}

export function resolveOnboardingStep(requestedStep, onboarding) {
  if (requestedStep <= 1) return 1;
  if (!isOnboardingAppearanceComplete(onboarding?.appearance)) return 1;
  if (requestedStep <= 2) return 2;
  if (!isOnboardingImportComplete(onboarding)) return 2;
  return 3;
}
