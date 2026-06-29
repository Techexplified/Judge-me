import { normalizeHex } from "./review-form-config.shared.js";

export const VIDEO_SLIDER_CONFIG_KEYS = [
  "heading",
  "limit",
  "starColor",
  "cardWidth",
  "cardHeight",
  "cardBorderRadius",
  "headingFontSize",
  "showStars",
  "sectionPadding",
];

export const defaultVideoSliderConfig = {
  heading: "Video Reviews",
  limit: 8,
  starColor: "#F59E0B",
  cardWidth: 160,
  cardHeight: 220,
  cardBorderRadius: 12,
  headingFontSize: 22,
  showStars: true,
  sectionPadding: 32,
};

export function mergeVideoSliderConfig(saved) {
  const base = {
    ...defaultVideoSliderConfig,
    ...(saved?.videoSlider && typeof saved.videoSlider === "object" ? saved.videoSlider : {}),
    ...(saved && typeof saved === "object" && !saved.videoSlider ? saved : {}),
  };

  base.heading = String(base.heading || defaultVideoSliderConfig.heading).slice(0, 120);
  base.limit = Math.min(12, Math.max(3, Number(base.limit) || defaultVideoSliderConfig.limit));
  base.starColor = normalizeHex(base.starColor) || defaultVideoSliderConfig.starColor;
  base.cardWidth = Math.min(240, Math.max(120, Number(base.cardWidth) || defaultVideoSliderConfig.cardWidth));
  base.cardHeight = Math.min(320, Math.max(160, Number(base.cardHeight) || defaultVideoSliderConfig.cardHeight));
  base.cardBorderRadius = Math.min(24, Math.max(0, Number(base.cardBorderRadius) || defaultVideoSliderConfig.cardBorderRadius));
  base.headingFontSize = Math.min(36, Math.max(16, Number(base.headingFontSize) || defaultVideoSliderConfig.headingFontSize));
  base.showStars = base.showStars !== false;
  base.sectionPadding = Math.min(64, Math.max(16, Number(base.sectionPadding) || defaultVideoSliderConfig.sectionPadding));

  return base;
}

export function pickVideoSliderConfigForSave(config) {
  const merged = mergeVideoSliderConfig(config);
  const out = {};
  for (const key of VIDEO_SLIDER_CONFIG_KEYS) {
    out[key] = merged[key];
  }
  return out;
}

export function serializeVideoSliderConfig(config) {
  return JSON.stringify(pickVideoSliderConfigForSave(config));
}

export function parseVideoSliderConfigPayload(raw) {
  try {
    return mergeVideoSliderConfig(JSON.parse(raw));
  } catch {
    return mergeVideoSliderConfig({});
  }
}
