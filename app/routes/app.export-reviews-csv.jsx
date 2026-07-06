import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import {
  filterReviewsByRangeStart,
  parseDashboardRange,
  rangeStartFromKey,
} from "../utils/dashboard-metrics.server.js";
import {
  getShopPlanStatus,
  hasProAccess,
  requireFeatureUsage,
  formatProRequiredMessage,
} from "../lib/billing.server.js";
import { getGroupShopList } from "../lib/store-group.server";

const CSV_REVIEW_SELECT = {
  id: true,
  shop: true,
  productId: true,
  productName: true,
  rating: true,
  title: true,
  comment: true,
  author: true,
  email: true,
  status: true,
  reply: true,
  replyDate: true,
  createdAt: true,
};

function escapeCsvCell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);

  const planStatus = await getShopPlanStatus(shop);
  if (!hasProAccess(planStatus)) {
    return new Response(formatProRequiredMessage("export_pdf_csv"), { status: 403 });
  }

  const exportUsage = await requireFeatureUsage(planStatus, "export_pdf_csv");
  if (!exportUsage.ok) {
    return new Response(exportUsage.message, { status: 403 });
  }

  const targetShops = await getGroupShopList(shop);
  const now = new Date();
  const rangeStart = rangeStartFromKey(now, rangeKey);
  const reviewsAll = await db.review.findMany({
    where: {
      shop: { in: targetShops },
      ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: CSV_REVIEW_SELECT,
  });
  const scopedReviews = filterReviewsByRangeStart(reviewsAll, rangeStart);

  const headers = [
    "id",
    "shop",
    "productId",
    "productName",
    "rating",
    "title",
    "comment",
    "author",
    "email",
    "status",
    "reply",
    "replyDate",
    "createdAt",
  ];

  const rows = scopedReviews.map((r) =>
    [
      r.id,
      r.shop,
      r.productId,
      r.productName,
      r.rating,
      r.title,
      r.comment,
      r.author,
      r.email,
      r.status,
      r.reply,
      r.replyDate ? r.replyDate.toISOString() : "",
      r.createdAt ? r.createdAt.toISOString() : "",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  const csv = ["\uFEFF", headers.join(","), ...rows].join("\n");
  const safeShop = shop.replace(/[^a-z0-9.-]+/gi, "_");
  const filename = `reviews-export-${safeShop}-${rangeKey}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};
