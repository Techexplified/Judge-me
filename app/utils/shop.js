/**
 * Shared shop domain helpers (safe for client and server).
 */
export function normalizeShopDomain(shop) {
  if (shop == null || shop === "") return "";
  let s = String(shop).trim().replace(/\/$/, "");
  if (!s) return "";
  if (!s.includes(".")) {
    s = `${s}.myshopify.com`;
  }
  return s.toLowerCase();
}
