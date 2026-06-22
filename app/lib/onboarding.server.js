import db from "../db.server.js";
import { mergeFormConfig, normalizeHex } from "./review-form-config.shared.js";
import {
  ONBOARDING_IMPORT_SOURCES,
  ONBOARDING_VERSION,
  buildOnboardingFormConfig,
  isNewOnboardingComplete,
} from "./onboarding.shared.js";

export {
  ONBOARDING_LAYOUT_OPTIONS,
  ONBOARDING_ACCENT_COLORS,
  ONBOARDING_IMPORT_SOURCES,
  ONBOARDING_IMPORT_KEYS,
  ONBOARDING_VERSION,
  buildOnboardingFormConfig,
  isNewOnboardingComplete,
  isOnboardingAppearanceComplete,
  isOnboardingImportComplete,
  resolveOnboardingStep,
} from "./onboarding.shared.js";

async function readConfig(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) return {};
  try {
    return JSON.parse(row.config);
  } catch {
    return {};
  }
}

async function writeConfig(shop, config) {
  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(config) },
    create: { shop, config: JSON.stringify(config) },
  });
}

export async function getOnboardingState(shop) {
  const config = await readConfig(shop);
  return {
    completed: isNewOnboardingComplete(config.onboarding),
    onboarding: config.onboarding ?? null,
    storeProfile: config.storeProfile ?? null,
    questionnaire: config.onboarding?.questionnaire ?? null,
    planChoice: config.onboarding?.planChoice ?? null,
    appearance: config.onboarding?.appearance ?? null,
    collection: config.onboarding?.collection ?? config.reviewRequests ?? null,
    formConfig: mergeFormConfig(config),
  };
}

export function isQuestionnaireComplete(questionnaire) {
  return Boolean(
    questionnaire?.judgemeGoal?.trim() && questionnaire?.discoverySource?.trim(),
  );
}

export async function saveOnboardingBrandLogo(shop, dataUrl) {
  const config = await readConfig(shop);
  const merged = mergeFormConfig({ ...config, brandLogoUrl: dataUrl });
  await writeConfig(shop, { ...config, ...merged, brandLogoUrl: dataUrl });
  return dataUrl;
}

export async function removeOnboardingBrandLogo(shop) {
  const config = await readConfig(shop);
  const merged = mergeFormConfig({ ...config, brandLogoUrl: null });
  await writeConfig(shop, { ...config, ...merged, brandLogoUrl: null });
  return null;
}

export async function saveOnboardingAppearance(shop, { layoutPreset, accentColor }) {
  const config = await readConfig(shop);
  const appearance = {
    layoutPreset: String(layoutPreset ?? "modern").trim(),
    accentColor: normalizeHex(accentColor) || "#0d9488",
    savedAt: new Date().toISOString(),
  };
  const formConfig = buildOnboardingFormConfig(appearance.layoutPreset, appearance.accentColor);
  if (config.brandLogoUrl) {
    formConfig.brandLogoUrl = config.brandLogoUrl;
  }
  config.onboarding = {
    ...(config.onboarding ?? {}),
    appearance,
  };
  Object.assign(config, formConfig);
  await writeConfig(shop, config);
  return appearance;
}

export async function saveOnboardingImportChoice(shop, { importKey, skipImport }) {
  const config = await readConfig(shop);
  const skipped = Boolean(skipImport);
  const channel = skipped ? "" : String(importKey ?? "").trim();
  const importSource = skipped
    ? ""
    : String(ONBOARDING_IMPORT_SOURCES[channel] ?? channel ?? "").trim();

  config.storeProfile = {
    ...(config.storeProfile ?? {}),
    importingFromOtherApp: skipped ? "no" : "yes",
    importSource: skipped ? "" : importSource,
    importChannel: channel,
  };
  config.onboarding = {
    ...(config.onboarding ?? {}),
    importChoice: skipped ? "skip" : channel,
    importConfiguredAt: new Date().toISOString(),
  };
  await writeConfig(shop, config);
  return config.storeProfile;
}

export async function saveOnboardingCollectionSettings(
  shop,
  { onsiteWidgetEnabled, photoVideoReviews },
) {
  const config = await readConfig(shop);
  const enabled = Boolean(onsiteWidgetEnabled);
  const collection = {
    onsiteWidgetEnabled: enabled,
    photoVideoReviews: Boolean(photoVideoReviews),
    savedAt: new Date().toISOString(),
  };

  config.onsiteWidget = {
    ...(config.onsiteWidget ?? {}),
    enabled,
    timing: config.onsiteWidget?.timing === "after_delivery" ? "after_delivery" : "after_fulfillment",
  };
  config.onboarding = {
    ...(config.onboarding ?? {}),
    collection,
  };
  config.showPhotos = collection.photoVideoReviews;
  config.showVideos = collection.photoVideoReviews;

  await writeConfig(shop, config);
  return collection;
}

export async function savePlanChoice(shop, choice) {
  const normalized = choice === "pro" ? "pro" : "free";
  const config = await readConfig(shop);
  config.onboarding = {
    ...(config.onboarding ?? {}),
    planChoice: normalized,
  };
  await writeConfig(shop, config);
  return normalized;
}

export async function getPlanChoice(shop) {
  const config = await readConfig(shop);
  return config.onboarding?.planChoice ?? null;
}

export async function isOnboardingComplete(shop) {
  const config = await readConfig(shop);
  return isNewOnboardingComplete(config.onboarding);
}

export async function saveStoreProfile(shop, profile) {
  const config = await readConfig(shop);
  const importingFromOtherApp = String(profile.importingFromOtherApp ?? "").trim();
  const importSource =
    importingFromOtherApp === "yes"
      ? String(profile.importSource ?? "").trim()
      : "";
  config.storeProfile = {
    industry: String(profile.industry ?? "").trim(),
    primaryGoal: String(profile.primaryGoal ?? "").trim(),
    hasMultipleStores: String(profile.hasMultipleStores ?? "").trim(),
    importingFromOtherApp,
    importSource,
  };
  await writeConfig(shop, config);
  return config.storeProfile;
}

export async function saveQuestionnaire(shop, answers) {
  const config = await readConfig(shop);
  config.onboarding = {
    ...(config.onboarding ?? {}),
    questionnaire: {
      judgemeGoal: String(answers.judgemeGoal ?? "").trim(),
      discoverySource: String(answers.discoverySource ?? "").trim(),
    },
  };
  await writeConfig(shop, config);
  return config.onboarding.questionnaire;
}

/** Record syndication choice before the questionnaire (legacy step 4). */
export async function saveSyndicationChoice(shop, skippedSyndication) {
  const config = await readConfig(shop);
  config.onboarding = {
    ...(config.onboarding ?? {}),
    skippedSyndication: Boolean(skippedSyndication),
  };
  await writeConfig(shop, config);
  return config.onboarding;
}

export async function completeOnboarding(shop, { skippedSyndication = false } = {}) {
  const config = await readConfig(shop);
  const skipped =
    config.onboarding?.skippedSyndication ?? skippedSyndication;
  config.onboarding = {
    ...(config.onboarding ?? {}),
    completedAt: new Date().toISOString(),
    version: ONBOARDING_VERSION,
    skippedSyndication: Boolean(skipped),
  };
  await writeConfig(shop, config);
  return config.onboarding;
}

/** Clear onboarding progress so reinstall shows the wizard again. Keeps widget/translation settings. */
export async function resetOnboardingState(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) return;

  let config;
  try {
    config = JSON.parse(row.config);
  } catch {
    return;
  }

  delete config.onboarding;
  delete config.storeProfile;

  const hasOtherSettings = Object.keys(config).some((key) => {
    const value = config[key];
    if (value == null) return false;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }
    return String(value).trim() !== "";
  });

  if (!hasOtherSettings) {
    await db.settings.delete({ where: { shop } }).catch(() => {});
    return;
  }

  await writeConfig(shop, config);
}
