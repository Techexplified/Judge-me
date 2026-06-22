import { authenticate } from "../shopify.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { normalizeProductLookup, reviewsManagementShouldRevalidate } from "../lib/reviews-management.shared.js";

/** Legacy route — all review moderation lives under Manage Reviews. */
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const target = new URL("/app/manage-reviews", url.origin);

  for (const [key, value] of url.searchParams.entries()) {
    if (key === "tab") continue;
    target.searchParams.set(key, value);
  }

  const product = url.searchParams.get("product");
  const pid = url.searchParams.get("pid");
  const productKey = normalizeProductLookup(product);
  const isStoreDeepLink =
    productKey === "store review" ||
    productKey === "store reviews" ||
    String(pid ?? "").trim().toLowerCase() === "store";

  if (isStoreDeepLink) {
    target.searchParams.set("tab", "store");
    target.searchParams.delete("product");
    target.searchParams.delete("pid");
  } else if (url.searchParams.get("tab") === "store") {
    target.searchParams.set("tab", "store");
  }

  throw embedRedirect(`${target.pathname}${target.search}`, request);
};

export const action = async ({ request }) => {
  const { handleReviewsManagementAction } = await import("../lib/reviews-management.server.js");
  return handleReviewsManagementAction(request);
};

export function shouldRevalidate(args) {
  return reviewsManagementShouldRevalidate(args);
}

export default function ReviewsRedirect() {
  return null;
}
