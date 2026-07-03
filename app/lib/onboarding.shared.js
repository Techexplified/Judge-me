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

export const ONBOARDING_INDUSTRY_OPTIONS = [
  { id: "beauty", label: "Beauty & Skincare", description: "Cosmetics, skincare, personal care" },
  { id: "fashion", label: "Fashion & Apparel", description: "Clothing, shoes, accessories" },
  { id: "food", label: "Food & Beverage", description: "Coffee, snacks, specialty foods" },
  { id: "home", label: "Home & Living", description: "Furniture, decor, kitchenware" },
  { id: "electronics", label: "Electronics & Tech", description: "Gadgets, accessories, devices" },
  { id: "other", label: "Other", description: "Something else entirely" },
];

export const ONBOARDING_GOAL_OPTIONS = [
  {
    id: "collect",
    label: "Collect more reviews",
    description:
      "I have orders coming in but not enough reviews yet. I want to start collecting them automatically.",
  },
  {
    id: "display",
    label: "Display reviews I already have",
    description:
      "I have reviews on another platform or on Google. I want to bring them onto my store.",
  },
  {
    id: "both",
    label: "Both: grow and display",
    description:
      "Import what I have now, and also set up automatic collection going forward.",
  },
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
export const ONBOARDING_VERSION = 4;

export const ONBOARDING_TOTAL_STEPS = 5;
export const ONBOARDING_COMPLETION_STEP = 6;

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

export function isOnboardingStoreInfoComplete(storeProfile) {
  return Boolean(storeProfile?.storeName?.trim() && storeProfile?.industry?.trim());
}

export function isOnboardingGoalComplete(storeProfile) {
  return Boolean(storeProfile?.primaryGoal?.trim());
}

export function isOnboardingImportComplete(onboarding) {
  return Boolean(onboarding?.importConfiguredAt);
}

/** Resolved import preset id (e.g. loox, judgeme, custom) or empty when skipped. */
export function resolveOnboardingImportSource(storeProfile, onboarding) {
  const importChoice = onboarding?.importChoice;
  const skippedImport =
    importChoice === "skip" ||
    !importChoice ||
    storeProfile?.importingFromOtherApp === "no";
  if (skippedImport) return "";
  return (
    storeProfile?.importSource ||
    (importChoice && ONBOARDING_IMPORT_SOURCES[importChoice]) ||
    ""
  );
}

export function isOnboardingAppearanceComplete(appearance) {
  return Boolean(
    appearance?.layoutPreset &&
      ONBOARDING_LAYOUT_OPTIONS.some((o) => o.id === appearance.layoutPreset) &&
      appearance?.accentColor,
  );
}

export function resolveOnboardingStep(requestedStep, { onboarding, storeProfile } = {}) {
  if (isNewOnboardingComplete(onboarding)) {
    const capped = Math.min(
      Math.max(1, requestedStep),
      ONBOARDING_COMPLETION_STEP,
    );
    return capped;
  }

  if (requestedStep >= ONBOARDING_COMPLETION_STEP) {
    return 5;
  }

  if (requestedStep <= 1) return 1;
  if (!isOnboardingStoreInfoComplete(storeProfile)) return 1;
  if (requestedStep <= 2) return 2;
  if (!isOnboardingGoalComplete(storeProfile)) return 2;
  if (requestedStep <= 3) return 3;
  if (!isOnboardingImportComplete(onboarding)) return 3;
  if (requestedStep <= 4) return 4;
  if (!isOnboardingAppearanceComplete(onboarding?.appearance)) return 4;
  return 5;
}
