/** Theme app extension block handles (match `blocks/*.liquid` filenames). */
export const PRODUCT_REVIEWS_BLOCK_HANDLE = "product-reviews";
export const VIDEO_REVIEWS_SLIDER_HANDLE = "video-reviews-slider";
export const CUSTOMER_LOVE_PAGE_HANDLE = "customer-love-page";
export const CORE_EMBED_HANDLE = "verdict-core";
export const TESTIMONIALS_BLOCK_HANDLE = "testimonials";
export const QUESTION_AND_ANSWER_HANDLE = "question-and-answer";

export const WIDGET_THEME_TARGETS = {
  "review-showcase": {
    template: "product",
    handle: PRODUCT_REVIEWS_BLOCK_HANDLE,
    target: "newAppsSection",
  },
  "video-reviews-slider": {
    template: "index",
    handle: VIDEO_REVIEWS_SLIDER_HANDLE,
    target: "newAppsSection",
  },
  "customers-love-page": {
    template: "page",
    handle: CUSTOMER_LOVE_PAGE_HANDLE,
    target: "newAppsSection",
  },
  "testimonials": {
    template: "index",
    handle: TESTIMONIALS_BLOCK_HANDLE,
    target: "newAppsSection",
  },
  "question-and-answer": {
    template: "product",
    handle: QUESTION_AND_ANSWER_HANDLE,
    target: "newAppsSection",
  },
};

export function storeHandleFromShop(shop) {
  const normalized = String(shop || "").trim().toLowerCase();
  return normalized.replace(/\.myshopify\.com$/i, "");
}

function themeEditorBase() {
  // Use shopify://admin so embedded apps don't double-prefix /store/{handle}/.
  return "shopify://admin/themes/current/editor";
}

/** Deep link: add an app block to a JSON template (new Apps section). */
export function buildThemeEditorBlockUrl(_shop, apiKey, widgetId) {
  const target = WIDGET_THEME_TARGETS[widgetId];
  if (!target || !apiKey) return null;
  const params = new URLSearchParams({
    template: target.template,
    addAppBlockId: `${apiKey}/${target.handle}`,
    target: target.target,
  });
  return `${themeEditorBase()}?${params.toString()}`;
}

/** Deep link: theme editor on the product template with Product Reviews block ready to add. */
export function buildThemeEditorProductBlockUrl(shop, apiKey) {
  return buildThemeEditorBlockUrl(shop, apiKey, "review-showcase");
}

/** Deep link: activate Verdict Core app embed in Theme Settings → App embeds. */
export function buildThemeEditorCoreEmbedUrl(shop, apiKey, template = "product") {
  if (!apiKey) return null;
  const params = new URLSearchParams({
    context: "apps",
    template,
    activateAppId: `${apiKey}/${CORE_EMBED_HANDLE}`,
  });
  return `${themeEditorBase()}?${params.toString()}`;
}

export function getWidgetCtaLabel(widgetId) {
  if (widgetId === "review-translation-hub") return "Configure translation";
  return "Add to theme";
}

export function getWidgetCustomizePath(widgetId) {
  const paths = {
    "review-showcase": "/app/widgets/review-showcase",
    "video-reviews-slider": "/app/widgets/video-reviews-slider",
    "customers-love-page": "/app/widgets/customers-love-page",
    "testimonials": "/app/widgets/testimonials",
    "question-and-answer": "/app/widgets/qa",
  };
  return paths[widgetId] || null;
}

export function isWidgetCustomizable(widgetId) {
  return Boolean(getWidgetCustomizePath(widgetId));
}
