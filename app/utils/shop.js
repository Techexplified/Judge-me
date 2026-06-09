/**
 * Shared shop domain helpers (safe for client and server).
 */
export function normalizeShopDomain(shop) {
  if (shop == null || shop === "") return "";
  let s = String(shop).trim();

  // 1. Handle admin.shopify.com/store/xyz
  const adminMatch = s.match(/admin\.shopify\.com\/store\/([^/?#\s]+)/i);
  if (adminMatch) {
    return `${adminMatch[1].toLowerCase()}.myshopify.com`;
  }

  // 2. Strip protocols if present
  s = s.replace(/^https?:\/\//i, "");

  // 3. Extract just the hostname (ignore paths/query params/hashes)
  const hostMatch = s.match(/^([^/?#\s]+)/);
  if (hostMatch) {
    s = hostMatch[1];
  }

  s = s.toLowerCase();

  // 4. If it doesn't contain a dot, assume it's just the shop handle
  if (!s.includes(".")) {
    s = `${s}.myshopify.com`;
  }

  return s;
}
