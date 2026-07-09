import db from "../db.server.js";
import { mergeFormConfig } from "./review-form-config.shared.js";
import {
  getCachedShopConfig,
  setCachedShopConfig,
} from "./shop-config-cache.server.js";
import { invalidateShopSettingsCache } from "./public-cache.server.js";

const DEFAULT_ONSITE_WIDGET = {
  timing: "after_fulfillment",
  enabled: true,
  metrics: {
    viewsThisMonth: 0,
    viewsLastMonth: 0,
    lastRotatedAt: null,
  },
};

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeOnsiteWidget(raw) {
  const base = { ...DEFAULT_ONSITE_WIDGET, ...(raw && typeof raw === "object" ? raw : {}) };
  base.metrics = {
    ...DEFAULT_ONSITE_WIDGET.metrics,
    ...(raw?.metrics && typeof raw.metrics === "object" ? raw.metrics : {}),
  };
  if (base.timing !== "after_delivery") {
    base.timing = "after_fulfillment";
  }
  return base;
}

export function rotateOnsiteMetricsIfNeeded(onsiteWidget) {
  const widget = normalizeOnsiteWidget(onsiteWidget);
  const currentMonth = monthKey();
  const lastRotated = widget.metrics.lastRotatedAt
    ? monthKey(new Date(widget.metrics.lastRotatedAt))
    : null;

  if (lastRotated && lastRotated !== currentMonth) {
    widget.metrics.viewsLastMonth = widget.metrics.viewsThisMonth ?? 0;
    widget.metrics.viewsThisMonth = 0;
    widget.metrics.lastRotatedAt = new Date().toISOString();
  } else if (!widget.metrics.lastRotatedAt) {
    widget.metrics.lastRotatedAt = new Date().toISOString();
  }

  return widget;
}

function pctChange(current, previous) {
  if (!previous || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfLastMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export async function loadShopConfig(shop) {
  const cached = getCachedShopConfig(shop);
  if (cached !== undefined) return cached;

  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) {
    setCachedShopConfig(shop, {});
    return {};
  }
  try {
    const { normalizeBrandLogoUrl } = await import("./shop-assets.server.js");
    const config = JSON.parse(row.config);
    if (config?.brandLogoUrl) {
      config.brandLogoUrl = normalizeBrandLogoUrl(config.brandLogoUrl);
    }
    setCachedShopConfig(shop, config);
    return config;
  } catch {
    setCachedShopConfig(shop, {});
    return {};
  }
}

export async function saveShopConfig(shop, config) {
  // Never persist multi-MB data: URLs into Settings — that was the Neon transfer bomb.
  if (typeof config?.brandLogoUrl === "string" && config.brandLogoUrl.startsWith("data:")) {
    const { saveShopBrandLogo } = await import("./shop-assets.server.js");
    config = {
      ...config,
      brandLogoUrl: await saveShopBrandLogo(shop, config.brandLogoUrl),
    };
  }

  await db.settings.upsert({
    where: { shop },
    create: { shop, config: JSON.stringify(config) },
    update: { config: JSON.stringify(config) },
  });
  setCachedShopConfig(shop, config);
  invalidateShopSettingsCache(shop);
}

export async function loadOnsiteWidgetMetrics(shop) {
  const config = await loadShopConfig(shop);
  let onsiteWidget = rotateOnsiteMetricsIfNeeded(config.onsiteWidget);

  const needsPersist =
    JSON.stringify(onsiteWidget) !== JSON.stringify(normalizeOnsiteWidget(config.onsiteWidget));
  if (needsPersist) {
    config.onsiteWidget = onsiteWidget;
    await saveShopConfig(shop, config);
  }

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);

  const [reviewsThisMonth, reviewsLastMonth] = await Promise.all([
    db.review.count({
      where: { shop, createdAt: { gte: thisMonthStart } },
    }),
    db.review.count({
      where: {
        shop,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
  ]);

  const viewsThisMonth = onsiteWidget.metrics.viewsThisMonth ?? 0;
  const viewsLastMonth = onsiteWidget.metrics.viewsLastMonth ?? 0;
  const conversionRate =
    viewsThisMonth > 0 ? Math.round((reviewsThisMonth / viewsThisMonth) * 1000) / 10 : 0;

  const formConfig = mergeFormConfig(
    Object.fromEntries(
      Object.entries(config).filter(([key]) =>
        [
          "primaryColor",
          "accentColor",
          "buttonColor",
          "backgroundColor",
          "starColor",
          "inactiveStarColor",
          "borderRadius",
          "layoutPreset",
        ].includes(key),
      ),
    ),
  );

  return {
    timing: onsiteWidget.timing,
    enabled: onsiteWidget.enabled !== false,
    metrics: {
      widgetViews: viewsThisMonth,
      widgetViewsTrend: pctChange(viewsThisMonth, viewsLastMonth),
      conversionRate,
      conversionTrend: pctChange(conversionRate, viewsLastMonth > 0 ? (reviewsLastMonth / viewsLastMonth) * 100 : 0),
      reviewsCollected: reviewsThisMonth,
      reviewsCollectedTrend: pctChange(reviewsThisMonth, reviewsLastMonth),
    },
    formConfig,
  };
}

export async function saveOnsiteWidgetSettings(shop, { timing }) {
  const config = await loadShopConfig(shop);
  const onsiteWidget = rotateOnsiteMetricsIfNeeded(config.onsiteWidget);
  onsiteWidget.timing = timing === "after_delivery" ? "after_delivery" : "after_fulfillment";
  config.onsiteWidget = onsiteWidget;
  await saveShopConfig(shop, config);
  return { ok: true };
}

/** In-process buffer so storefront page views don't upsert settings JSON every hit. */
const VIEW_FLUSH_MS = 15_000;
const viewBumpState =
  global.__judgemeWidgetViewBumps ??
  {
    pending: new Map(),
    timer: null,
    flushing: false,
  };

global.__judgemeWidgetViewBumps = viewBumpState;

async function flushWidgetViewBumps() {
  if (viewBumpState.flushing) return;
  viewBumpState.flushing = true;
  viewBumpState.timer = null;
  const batch = [...viewBumpState.pending.entries()];
  viewBumpState.pending.clear();
  try {
    for (const [shop, bump] of batch) {
      if (!bump) continue;
      try {
        const config = await loadShopConfig(shop);
        const onsiteWidget = rotateOnsiteMetricsIfNeeded(config.onsiteWidget);
        onsiteWidget.metrics.viewsThisMonth =
          (onsiteWidget.metrics.viewsThisMonth ?? 0) + bump;
        config.onsiteWidget = onsiteWidget;
        await saveShopConfig(shop, config);
      } catch (err) {
        console.error("[widget-views] flush failed for", shop, err);
        viewBumpState.pending.set(
          shop,
          (viewBumpState.pending.get(shop) || 0) + bump,
        );
      }
    }
  } finally {
    viewBumpState.flushing = false;
    if (viewBumpState.pending.size > 0 && !viewBumpState.timer) {
      viewBumpState.timer = setTimeout(() => {
        void flushWidgetViewBumps();
      }, VIEW_FLUSH_MS);
      viewBumpState.timer.unref?.();
    }
  }
}

export async function incrementWidgetView(shop) {
  if (!shop) return { ok: false };
  viewBumpState.pending.set(shop, (viewBumpState.pending.get(shop) || 0) + 1);
  if (!viewBumpState.timer) {
    viewBumpState.timer = setTimeout(() => {
      void flushWidgetViewBumps();
    }, VIEW_FLUSH_MS);
    viewBumpState.timer.unref?.();
  }
  return { ok: true };
}
