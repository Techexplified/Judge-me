/**
 * Shared shop domain helpers (safe for client and server).
 */
export function normalizeShopDomain(shop) {
  if (shop == null || shop === "") return "";
  let s = String(shop).trim().replace(/\/$/, "");
  // Strip http:// or https:// protocol if present
  s = s.replace(/^https?:\/\//i, "");
  if (!s) return "";
  if (!s.includes(".")) {
    s = `${s}.myshopify.com`;
  }
  return s.toLowerCase();
}
