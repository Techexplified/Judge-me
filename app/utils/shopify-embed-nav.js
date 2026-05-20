/**
 * Shopify Admin loads embedded apps with extra query params (e.g. host, shop, embedded).
 * Client-side `<Link to="...">` navigations replace the query string unless we merge.
 */
export function mergeShopifyEmbedParams(to, currentSearch) {
  const curQs =
    typeof currentSearch === "string"
      ? currentSearch.replace(/^\?/, "")
      : "";
  if (!curQs.trim()) return to;

  const current = new URLSearchParams(curQs);

  const hashIdx = to.indexOf("#");
  const pathPart = hashIdx >= 0 ? to.slice(0, hashIdx) : to;
  const hash = hashIdx >= 0 ? to.slice(hashIdx) : "";

  const qIdx = pathPart.indexOf("?");
  const pathname = qIdx >= 0 ? pathPart.slice(0, qIdx) : pathPart;
  const existingQs = qIdx >= 0 ? pathPart.slice(qIdx + 1) : "";

  const merged = new URLSearchParams(existingQs);

  current.forEach((value, key) => {
    if (!merged.has(key)) merged.set(key, value);
  });

  const qs = merged.toString();
  return qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`;
}

export function isStoreProfileComplete(storeProfile) {
  if (!storeProfile) return false;
  return Boolean(
    storeProfile.industry?.trim() &&
      storeProfile.primaryGoal?.trim() &&
      storeProfile.hasMultipleStores?.trim(),
  );
}
