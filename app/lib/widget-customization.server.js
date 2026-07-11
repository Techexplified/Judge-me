import db from "../db.server.js";
import { invalidateShopSettingsCache } from "./public-cache.server.js";
import {
  mergeVideoSliderConfig,
  pickVideoSliderConfigForSave,
  parseVideoSliderConfigPayload,
} from "./video-slider-config.shared.js";
import {
  mergeCustomerLoveConfig,
  pickCustomerLoveConfigForSave,
  parseCustomerLoveConfigPayload,
} from "./customer-love-config.shared.js";
import {
  mergeTestimonialsConfig,
  pickTestimonialsConfigForSave,
  parseTestimonialsConfigPayload,
} from "./testimonials-config.shared.js";
import {
  mergeQAConfig,
  pickQAConfigForSave,
  parseQAConfigPayload,
} from "./qa-config.shared.js";

const WIDGET_CONFIG_KEY = {
  "video-reviews-slider": "videoSlider",
  "customers-love-page": "customerLove",
  "testimonials": "testimonials",
  "qa": "qa",
};

function parseStoredConfig(row) {
  if (!row?.config) return {};
  try {
    return JSON.parse(row.config);
  } catch {
    return {};
  }
}

export function getWidgetCustomizationFromConfig(config, widgetId) {
  const key = WIDGET_CONFIG_KEY[widgetId];
  if (!key) return null;
  if (key === "videoSlider") return mergeVideoSliderConfig(config);
  if (key === "customerLove") return mergeCustomerLoveConfig(config);
  if (key === "testimonials") return mergeTestimonialsConfig(config);
  if (key === "qa") return mergeQAConfig(config);
  return null;
}

export async function loadWidgetCustomization(shop, widgetId) {
  const row = await db.settings.findUnique({ where: { shop } });
  const config = parseStoredConfig(row);
  return getWidgetCustomizationFromConfig(config, widgetId);
}

export async function saveWidgetCustomization(shop, widgetId, payload) {
  const key = WIDGET_CONFIG_KEY[widgetId];
  if (!key) return { ok: false, error: "Unknown widget" };

  const row = await db.settings.findUnique({ where: { shop } });
  const stored = parseStoredConfig(row);

  let normalized;
  if (key === "videoSlider") {
    normalized = pickVideoSliderConfigForSave(payload);
  } else if (key === "customerLove") {
    normalized = pickCustomerLoveConfigForSave(payload);
  } else if (key === "testimonials") {
    normalized = pickTestimonialsConfigForSave(payload);
  } else if (key === "qa") {
    normalized = pickQAConfigForSave(payload);
  } else {
    return { ok: false, error: "Unknown widget" };
  }

  const merged = {
    ...stored,
    [key]: normalized,
    [`${key}PublishedAt`]: new Date().toISOString(),
  };

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(merged) },
    create: { shop, config: JSON.stringify(merged) },
  });
  invalidateShopSettingsCache(shop);

  return { ok: true, publishedAt: merged[`${key}PublishedAt`] };
}

export function parseWidgetCustomizationPayload(widgetId, raw) {
  if (widgetId === "video-reviews-slider") return parseVideoSliderConfigPayload(raw);
  if (widgetId === "customers-love-page") return parseCustomerLoveConfigPayload(raw);
  if (widgetId === "testimonials") return parseTestimonialsConfigPayload(raw);
  if (widgetId === "qa") return parseQAConfigPayload(raw);
  return null;
}