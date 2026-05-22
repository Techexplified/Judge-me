import { unauthenticated } from "../shopify.server";
import { normalizeShopifyProductId } from "../utils/product-id.server";

/** Must match `handle` in extensions/review-collected/shopify.extension.toml */
export const FLOW_REVIEW_TRIGGER_HANDLE = "review-collected";

const FLOW_TRIGGER_MUTATION = `#graphql
  mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
    flowTriggerReceive(handle: $handle, payload: $payload) {
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Notify Shopify Flow that a new review was collected.
 * Non-fatal: failures are logged only so review creation is never blocked.
 *
 * @param {string} shop - Normalized myshopify.com domain
 * @param {{ productId: string, rating: number, author?: string | null, comment?: string | null }} review
 * @param {{ admin?: { graphql: Function } }} [options] - Reuse an authenticated admin client when available
 */
export async function emitReviewCollectedFlowTrigger(shop, review, options = {}) {
  try {
    const legacyProductId = normalizeShopifyProductId(review.productId);
    if (!legacyProductId || !/^\d+$/.test(legacyProductId)) {
      return;
    }

    const payload = {
      product_id: Number(legacyProductId),
      Rating: Number(review.rating),
      "Review author": String(review.author ?? "").trim() || "Anonymous",
      "Review comment": String(review.comment ?? "").trim(),
    };

    const admin =
      options.admin ?? (await unauthenticated.admin(shop)).admin;

    const response = await admin.graphql(FLOW_TRIGGER_MUTATION, {
      variables: {
        handle: FLOW_REVIEW_TRIGGER_HANDLE,
        payload,
      },
    });

    const json = await response.json();
    const userErrors = json?.data?.flowTriggerReceive?.userErrors ?? [];
    if (userErrors.length > 0) {
      console.warn(
        "[flow] review-collected userErrors",
        JSON.stringify(userErrors),
      );
    }
  } catch (err) {
    console.warn(
      "[flow] review-collected failed (non-fatal)",
      err?.message ?? err,
    );
  }
}
