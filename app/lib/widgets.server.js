import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { hasProAccess, getShopPlanStatus, serializePlanStatus } from "./billing.server.js";
import {
  buildThemeEditorBlockUrl,
  buildThemeEditorCoreEmbedUrl,
  WIDGET_THEME_TARGETS,
} from "./theme-editor-nav.shared.js";
import {
  detectThemeInstalledWidgets,
  mergeThemeInstalledState,
  persistThemeInstalledConfirmations,
} from "./theme-widgets.server.js";

const STORE_REVIEW_PRODUCT_IDS = new Set(["store", "shop", "store-review"]);

export function getWidgetSettings(config) {
  const widgets = config?.widgets && typeof config.widgets === "object" ? config.widgets : {};
  return {
    coreEmbedAcknowledged: Boolean(widgets.coreEmbedAcknowledged),
    installed: widgets.installed && typeof widgets.installed === "object" ? widgets.installed : {},
  };
}

export function mergeWidgetSettings(config, patch) {
  const current = getWidgetSettings(config);
  return {
    ...config,
    widgets: {
      ...current,
      ...patch,
      installed: {
        ...current.installed,
        ...(patch.installed || {}),
      },
    },
  };
}

export async function markCoreEmbedAcknowledged(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = {};
    }
  }
  const next = mergeWidgetSettings(config, { coreEmbedAcknowledged: true });
  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(next) },
    create: { shop, config: JSON.stringify(next) },
  });
}

export async function markWidgetInstallIntent(shop, widgetId) {
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = {};
    }
  }
  const next = mergeWidgetSettings(config, {
    installed: { [widgetId]: { clickedAt: new Date().toISOString() } },
  });
  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(next) },
    create: { shop, config: JSON.stringify(next) },
  });
}

export async function loadWidgetsPageData({ session, admin, billing }) {
  const shop = normalizeShopDomain(session.shop);
  const apiKey = globalThis.process?.env?.SHOPIFY_API_KEY || "";

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
  const widgetSettings = getWidgetSettings(config);

  let themeName = "Live theme";
  try {
    const resp = await admin.graphql(`#graphql
      query WidgetsTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes { name }
        }
      }
    `);
    const json = await resp.json();
    themeName = json?.data?.themes?.nodes?.[0]?.name || themeName;
  } catch {
    /* keep default */
  }

  const themeEditorUrls = {};
  for (const widgetId of Object.keys(WIDGET_THEME_TARGETS)) {
    themeEditorUrls[widgetId] = buildThemeEditorBlockUrl(shop, apiKey, widgetId);
  }

  const themeInstalledRaw = await detectThemeInstalledWidgets(admin);
  await persistThemeInstalledConfirmations(shop, themeInstalledRaw);
  const themeInstalled = mergeThemeInstalledState(themeInstalledRaw, widgetSettings);

  const reviewCounts = await db.review.groupBy({
    by: ["productId"],
    where: { shop, status: { in: ["PUBLISHED", "APPROVED"] } },
    _count: { id: true },
  });

  let productReviewCount = 0;
  let storeReviewCount = 0;
  for (const row of reviewCounts) {
    const pid = String(row.productId ?? "").trim().toLowerCase();
    if (STORE_REVIEW_PRODUCT_IDS.has(pid)) {
      storeReviewCount += row._count.id;
    } else {
      productReviewCount += row._count.id;
    }
  }

  return {
    shop,
    apiKey,
    themeName,
    premium,
    planStatus: serializePlanStatus(planStatus),
    widgetSettings,
    themeInstalled,
    themeEditorUrls,
    coreEmbedUrl: buildThemeEditorCoreEmbedUrl(shop, apiKey),
    reviewCounts: {
      product: productReviewCount,
      store: storeReviewCount,
      total: productReviewCount + storeReviewCount,
    },
  };
}
