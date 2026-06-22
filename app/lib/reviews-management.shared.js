const STORE_REVIEW_PRODUCT_IDS = new Set(["store", "shop", "store-review"]);

export function normalizeProductLookup(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isStoreReviewRecord(review) {
  const pid = String(review?.productId ?? "").trim().toLowerCase();
  if (STORE_REVIEW_PRODUCT_IDS.has(pid)) return true;
  const name = String(review?.productName ?? "").trim().toLowerCase();
  return name === "store review" || name === "store reviews";
}

export function isStoreReviewProduct(product) {
  if (!product) return false;
  if (product.reviews?.some((r) => isStoreReviewRecord(r))) return true;
  const name = String(product.productName ?? "").trim().toLowerCase();
  return name === "store review" || name === "store reviews";
}

/** Match deep links (`product`, optional `pid`) to loader products. */
export function resolveProductFromUrlParams(products, productNameRaw, pidRaw) {
  const name = typeof productNameRaw === "string" ? productNameRaw.trim() : "";
  const pid = typeof pidRaw === "string" ? pidRaw.trim() : "";

  if (pid) {
    const byPid = products.find((p) =>
      (p.reviews || []).some((r) => String(r.productId ?? "") === pid),
    );
    if (byPid) return byPid;
  }

  if (name) {
    const exact = products.find((p) => String(p.productName ?? "") === name);
    if (exact) return exact;

    const key = normalizeProductLookup(name);
    const normalized = products.find((p) => normalizeProductLookup(p.productName) === key);
    if (normalized) return normalized;

    return (
      products.find((p) => {
        const pn = normalizeProductLookup(p.productName);
        return pn && (pn.startsWith(key) || key.startsWith(pn));
      }) ?? null
    );
  }

  return null;
}

/** Skip full loader revalidation after translate/AI intents and inline reply saves. */
export function reviewsManagementShouldRevalidate({ formData, defaultShouldRevalidate }) {
  const intent = formData?.get("_intent");
  if (
    intent === "translateReview" ||
    intent === "translateReviews" ||
    intent === "suggestReply"
  ) {
    return false;
  }
  if (formData?.get("reviewId") && formData?.has("reply") && !intent) {
    return false;
  }
  return defaultShouldRevalidate;
}
