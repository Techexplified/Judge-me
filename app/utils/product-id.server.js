/**
 * Normalize Shopify product ids so theme (numeric) and Admin API (GID) map to the same review rows.
 */
export function normalizeShopifyProductId(productId) {
  if (productId == null || productId === "") return "";
  const s = String(productId).trim();
  const m = /^gid:\/\/shopify\/Product\/(\d+)$/i.exec(s);
  if (m) return m[1];
  if (/^\d+$/.test(s)) return s;
  return s;
}

/** Prisma `in` list: numeric id, raw input, and GID form when applicable. */
export function productIdMatchList(productId) {
  const raw = String(productId ?? "").trim();
  const nid = normalizeShopifyProductId(productId);
  const set = new Set();
  if (raw) set.add(raw);
  if (nid) set.add(nid);
  if (nid && /^\d+$/.test(nid)) {
    set.add(`gid://shopify/Product/${nid}`);
  }
  return [...set];
}
