import { normalizeHex, QUICK_THEME_PALETTES } from "./review-form-config.shared.js";

export const MAX_SHOWCASE_REVIEWS = 5;
export const MAX_SHOWCASE_PHOTOS = 6;

export const SOCIAL_SHOWCASE_CONFIG_KEYS = [
  "storeName",
  "tagline",
  "bottomCtaHeading",
  "accentColor",
  "selectedReviewIds",
  "selectedMediaIds",
  "verifiedBadgeText",
  "shopNowLabel",
];

export const defaultSocialShowcaseConfig = {
  storeName: "",
  tagline: "",
  bottomCtaHeading: "Ready to try it?",
  accentColor: "#1D9E75",
  selectedReviewIds: [],
  selectedMediaIds: [],
  verifiedBadgeText: "Verified Buyer",
  shopNowLabel: "Shop Now",
};

export { QUICK_THEME_PALETTES as SOCIAL_SHOWCASE_ACCENT_PRESETS };

function normalizeIdList(value, max) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * @param {Record<string, unknown>} saved
 * @param {{ storeName?: string, accentColor?: string, brandLogoUrl?: string | null }} [defaults]
 */
export function mergeSocialShowcaseConfig(saved, defaults = {}) {
  const raw =
    saved?.socialShowcase && typeof saved.socialShowcase === "object"
      ? saved.socialShowcase
      : saved && typeof saved === "object" && !saved.socialShowcase
        ? saved
        : {};

  const base = {
    ...defaultSocialShowcaseConfig,
    ...raw,
  };

  base.storeName = String(
    base.storeName || defaults.storeName || defaultSocialShowcaseConfig.storeName,
  ).slice(0, 120);
  base.tagline = String(base.tagline || "").slice(0, 200);
  base.bottomCtaHeading = String(
    base.bottomCtaHeading || defaultSocialShowcaseConfig.bottomCtaHeading,
  ).slice(0, 120);
  base.accentColor =
    normalizeHex(base.accentColor) ||
    normalizeHex(defaults.accentColor) ||
    defaultSocialShowcaseConfig.accentColor;
  base.selectedReviewIds = normalizeIdList(base.selectedReviewIds, MAX_SHOWCASE_REVIEWS);
  base.selectedMediaIds = normalizeIdList(base.selectedMediaIds, MAX_SHOWCASE_PHOTOS);
  base.verifiedBadgeText = String(
    base.verifiedBadgeText || defaultSocialShowcaseConfig.verifiedBadgeText,
  ).slice(0, 40);
  base.shopNowLabel = String(
    base.shopNowLabel || defaultSocialShowcaseConfig.shopNowLabel,
  ).slice(0, 40);

  return base;
}

export function pickSocialShowcaseConfigForSave(config) {
  const merged = mergeSocialShowcaseConfig(config);
  const out = {};
  for (const key of SOCIAL_SHOWCASE_CONFIG_KEYS) {
    out[key] = merged[key];
  }
  return out;
}

export function serializeSocialShowcaseConfig(config) {
  return JSON.stringify(pickSocialShowcaseConfigForSave(config));
}

export function parseSocialShowcaseConfigPayload(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return mergeSocialShowcaseConfig(parsed);
  } catch {
    return mergeSocialShowcaseConfig({});
  }
}

export function pruneSocialShowcaseSelections(config, { validReviewIds, validMediaIds }) {
  const reviewSet = new Set(validReviewIds || []);
  const mediaSet = new Set(validMediaIds || []);
  return {
    ...config,
    selectedReviewIds: config.selectedReviewIds.filter((id) => reviewSet.has(id)),
    selectedMediaIds: config.selectedMediaIds.filter((id) => mediaSet.has(id)),
  };
}
