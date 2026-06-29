import { normalizeHex } from "./review-form-config.shared.js";

export const CUSTOMER_LOVE_CONFIG_KEYS = [
  "heading",
  "limit",
  "primaryColor",
  "starColor",
  "barTrackColor",
  "barFillColor",
  "showDistribution",
  "showFilterPills",
  "showPhotoCollage",
  "cardMinWidth",
  "verifiedBadgeText",
];

export const defaultCustomerLoveConfig = {
  heading: "Customer Love",
  limit: 12,
  primaryColor: "#E11D48",
  starColor: "#F59E0B",
  barTrackColor: "#FCE7F3",
  barFillColor: "#E11D48",
  showDistribution: true,
  showFilterPills: true,
  showPhotoCollage: true,
  cardMinWidth: 260,
  verifiedBadgeText: "Verified Buyer",
};

export function mergeCustomerLoveConfig(saved) {
  const base = {
    ...defaultCustomerLoveConfig,
    ...(saved?.customerLove && typeof saved.customerLove === "object" ? saved.customerLove : {}),
    ...(saved && typeof saved === "object" && !saved.customerLove ? saved : {}),
  };

  base.heading = String(base.heading || defaultCustomerLoveConfig.heading).slice(0, 120);
  base.limit = Math.min(24, Math.max(4, Number(base.limit) || defaultCustomerLoveConfig.limit));
  base.primaryColor = normalizeHex(base.primaryColor) || defaultCustomerLoveConfig.primaryColor;
  base.starColor = normalizeHex(base.starColor) || defaultCustomerLoveConfig.starColor;
  base.barTrackColor = normalizeHex(base.barTrackColor) || defaultCustomerLoveConfig.barTrackColor;
  base.barFillColor = normalizeHex(base.barFillColor) || defaultCustomerLoveConfig.barFillColor;
  base.showDistribution = base.showDistribution !== false;
  base.showFilterPills = base.showFilterPills !== false;
  base.showPhotoCollage = base.showPhotoCollage !== false;
  base.cardMinWidth = Math.min(400, Math.max(200, Number(base.cardMinWidth) || defaultCustomerLoveConfig.cardMinWidth));
  base.verifiedBadgeText = String(base.verifiedBadgeText || defaultCustomerLoveConfig.verifiedBadgeText).slice(0, 40);

  return base;
}

export function pickCustomerLoveConfigForSave(config) {
  const merged = mergeCustomerLoveConfig(config);
  const out = {};
  for (const key of CUSTOMER_LOVE_CONFIG_KEYS) {
    out[key] = merged[key];
  }
  return out;
}

export function serializeCustomerLoveConfig(config) {
  return JSON.stringify(pickCustomerLoveConfigForSave(config));
}

export function parseCustomerLoveConfigPayload(raw) {
  try {
    return mergeCustomerLoveConfig(JSON.parse(raw));
  } catch {
    return mergeCustomerLoveConfig({});
  }
}
