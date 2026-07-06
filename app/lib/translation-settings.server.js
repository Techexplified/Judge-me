import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { invalidateShopSettingsCache } from "./public-cache.server.js";
import { hasProAccess, serializePlanStatus } from "./billing.server.js";
import { getResolvedOpenRouterKey } from "./openrouter.server.js";
import {
  AUTO_DETECT,
  LANGUAGE_OPTIONS,
  SOURCE_LANGUAGE_OPTIONS,
  getTranslationSettings,
  mergeTranslationIntoConfig,
} from "./review-translation.shared.js";
import { authenticate } from "../shopify.server";

export async function loadTranslationSettingsData({ session, admin, billing }) {
  const shop = normalizeShopDomain(session.shop);

  const { getShopPlanStatus } = await import("./billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const premium = hasProAccess(planStatus);

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }

  const translation = getTranslationSettings(config);

  let shopLocale = "en";
  try {
    const resp = await admin.graphql(`#graphql
      query ShopLocale {
        localization {
          availableLocales { locale primary }
        }
      }
    `);
    const json = await resp.json();
    const locales = json?.data?.localization?.availableLocales ?? [];
    const primary = locales.find((l) => l.primary) ?? locales[0];
    if (primary?.locale) {
      shopLocale = String(primary.locale).split("-")[0];
    }
  } catch {
    shopLocale = "en";
  }

  const totalReviews = await db.review.count({ where: { shop } });
  const translatedCount = await db.review.count({
    where: { shop, translatedLang: translation.targetLanguage },
  });

  return {
    shop,
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    premium,
    aiAvailable: premium && Boolean(getResolvedOpenRouterKey()),
    translation,
    shopLocale,
    totalReviews,
    translatedCount,
    languages: LANGUAGE_OPTIONS,
    sourceLanguages: SOURCE_LANGUAGE_OPTIONS,
  };
}

export async function handleTranslationSettingsAction({ request, session }) {
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus } = await import("./billing.server.js");
  const planStatus = await getShopPlanStatus(shop);

  if (!hasProAccess(planStatus)) {
    return {
      error: "Pro plan required. Upgrade in Settings to use review translation.",
    };
  }

  const apiKey = getResolvedOpenRouterKey();
  if (!apiKey) {
    return { error: "Translation service is temporarily unavailable." };
  }

  const fd = await request.formData();
  const intent = fd.get("_intent");

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }

  if (intent === "save") {
    const enabled = fd.get("enabled") === "true";
    const autoTranslateNewReviews = fd.get("autoTranslateNewReviews") === "true";
    const autoTranslateImport = fd.get("autoTranslateImport") === "true";
    const targetLanguage = String(fd.get("targetLanguage") || "en").trim();
    const sourceLanguage = String(fd.get("sourceLanguage") || AUTO_DETECT).trim();

    const validTarget = LANGUAGE_OPTIONS.some((l) => l.code === targetLanguage)
      ? targetLanguage
      : "en";
    const validSource = SOURCE_LANGUAGE_OPTIONS.some((l) => l.code === sourceLanguage)
      ? sourceLanguage
      : AUTO_DETECT;

    const prev = getTranslationSettings(config);
    const nextConfig = mergeTranslationIntoConfig(config, {
      enabled,
      targetLanguage: validTarget,
      sourceLanguage: validSource,
      autoTranslateNewReviews,
      autoTranslateImport,
    });

    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(nextConfig) },
      create: { shop, config: JSON.stringify(nextConfig) },
    });
    invalidateShopSettingsCache(shop);

    const shouldBulk =
      enabled &&
      (!prev.enabled ||
        prev.targetLanguage !== validTarget ||
        prev.sourceLanguage !== validSource);

    return {
      ok: true,
      translation: getTranslationSettings(nextConfig),
      bulkResult: null,
      startBulk: shouldBulk,
      bulkForce: false,
    };
  }

  if (intent === "translate_batch") {
    const translation = getTranslationSettings(config);
    const cursor = Number(fd.get("cursor") || 0);
    const force = fd.get("force") === "true";
    const batchSize = Math.min(50, Math.max(1, Number(fd.get("batchSize") || 20)));

    const { requireFeatureUsage } = await import("./billing.server.js");
    const usageCheck = await requireFeatureUsage(planStatus, "auto_translate", batchSize);
    if (!usageCheck.ok) {
      return { error: usageCheck.message };
    }

    const { bulkTranslateShopReviewsBatch } = await import("./review-translation.server.js");
    const batchResult = await bulkTranslateShopReviewsBatch(
      shop,
      translation.targetLanguage,
      apiKey,
      translation.sourceLanguage,
      { cursor, batchSize, force },
    );

    const translatedCount = await db.review.count({
      where: { shop, translatedLang: translation.targetLanguage },
    });

    return { ok: true, batchResult, translatedCount };
  }

  if (intent === "retranslate") {
    const translation = getTranslationSettings(config);
    if (!translation.enabled) {
      return { error: "Enable storefront translation before retranslating reviews." };
    }

    return {
      ok: true,
      startBulk: true,
      bulkForce: true,
      translation,
    };
  }

  if (intent === "translate_pending") {
    const translation = getTranslationSettings(config);

    return {
      ok: true,
      startBulk: true,
      bulkForce: false,
      translation,
    };
  }

  if (intent === "quick_toggle") {
    const enabled = fd.get("enabled") === "true";
    const nextConfig = mergeTranslationIntoConfig(config, { enabled });

    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(nextConfig) },
      create: { shop, config: JSON.stringify(nextConfig) },
    });
    invalidateShopSettingsCache(shop);

    return { ok: true, translation: getTranslationSettings(nextConfig) };
  }

  return { error: "Unknown action." };
}

export const translationSettingsLoader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  return loadTranslationSettingsData({ session, admin, billing });
};

export const translationSettingsAction = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return handleTranslationSettingsAction({ request, session });
};
