/** Copy for the order-status review widget (admin preview + extension). */

export const ORDER_STATUS_WIDGET_COPY = {
  after_fulfillment: {
    title: "How was your experience?",
    subtitle: "Tell us about shopping with our store.",
    cta: "Leave a store review",
    timingLabel: "After fulfillment, store experience",
    previewDescription:
      "Preview how your review request will appear to customers after order fulfillment.",
  },
  after_delivery: {
    title: "How was your purchase?",
    subtitle: "Share your experience with this product.",
    cta: "Write a Review",
    timingLabel: "After delivery, product review",
    previewDescription:
      "Customers are invited to review their purchase once the order has been delivered.",
  },
};

export function getOrderStatusWidgetCopy(timing) {
  return timing === "after_delivery"
    ? ORDER_STATUS_WIDGET_COPY.after_delivery
    : ORDER_STATUS_WIDGET_COPY.after_fulfillment;
}

export function storeReviewUrl(shopDomain) {
  const shop = String(shopDomain ?? "").trim();
  if (!shop) return null;
  return `https://${shop}/apps/judgeme-reviews/store-review`;
}
