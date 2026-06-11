/** Theme app extension block handle (`blocks/product-reviews.liquid`). */
export const PRODUCT_REVIEWS_BLOCK_HANDLE = "product-reviews";

export function storeHandleFromShop(shop) {
  const normalized = String(shop || "").trim().toLowerCase();
  return normalized.replace(/\.myshopify\.com$/i, "");
}

/** Deep link: theme editor on the product template with Product Reviews block ready to add. */
export function buildThemeEditorProductBlockUrl(shop, apiKey) {
  const storeHandle = storeHandleFromShop(shop);
  const params = new URLSearchParams({
    template: "product",
    addAppBlockId: `${apiKey}/${PRODUCT_REVIEWS_BLOCK_HANDLE}`,
    target: "newAppsSection",
  });
  return `https://admin.shopify.com/store/${encodeURIComponent(storeHandle)}/themes/current/editor?${params.toString()}`;
}
