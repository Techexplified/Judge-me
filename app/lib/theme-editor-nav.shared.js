/** Theme app extension block handle (`blocks/product-reviews.liquid`). */
export const PRODUCT_REVIEWS_BLOCK_HANDLE = "product-reviews";

export function storeHandleFromShop(shop) {
  const normalized = String(shop || "").trim().toLowerCase();
  return normalized.replace(/\.myshopify\.com$/i, "");
}

/** Deep link: theme editor on the product template with Product Reviews block ready to add. */
export function buildThemeEditorProductBlockUrl(shop, apiKey, themeId) {
  const storeHandle = storeHandleFromShop(shop);
  const params = new URLSearchParams({
    template: "product",
    addAppBlockId: `${apiKey}/${PRODUCT_REVIEWS_BLOCK_HANDLE}`,
    target: "newAppsSection",
  });
  // Use the actual theme ID — 'current' is not reliably supported and causes 404.
  const themeSegment = themeId || "current";
  return `https://admin.shopify.com/store/${encodeURIComponent(storeHandle)}/themes/${themeSegment}/editor?${params.toString()}`;
}
