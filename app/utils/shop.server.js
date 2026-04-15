export function normalizeShopDomain(shop) {
  if (shop == null || shop === "") return "";
  return String(shop).trim().replace(/\/$/, "");
}
