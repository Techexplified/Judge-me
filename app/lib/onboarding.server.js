import db from "../db.server.js";

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
    completed: Boolean(config.onboarding?.completedAt),
    onboarding: config.onboarding ?? null,
    storeProfile: config.storeProfile ?? null,
    planChoice: config.onboarding?.planChoice ?? null,
  };
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
  const { completed } = await getOnboardingState(shop);
  return completed;
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

/** Record syndication choice before the completion screen (step 4). */
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
    skippedSyndication: Boolean(skipped),
  };
  await writeConfig(shop, config);
  return config.onboarding;
}
