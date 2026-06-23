/* eslint-disable react/prop-types */
import { useLoaderData, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { getGroupShopList } from "../lib/store-group.server";
import { REVIEW_LIST_SELECT } from "../lib/review-query.shared.js";
import {
  hasProAccess,
  serializePlanStatus,
  checkFeatureAccess,
} from "../lib/billing.server.js";
import { resetFeatureUsageKeys } from "../lib/usage.server.js";
import {
  computeAnalyticsPageMetrics,
  filterReviewsByRangeStart,
  parseDashboardRange,
  rangeLabel,
  rangeStartFromKey,
} from "../utils/dashboard-metrics.server.js";
import { AnalyticsPageContent } from "../components/analytics/analytics-page.jsx";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);

  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const hasPremium = hasProAccess(planStatus);

  // One-time reset of analytics-related usage counters (fixes prior per-page-view consumption).
  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let storedConfig = {};
  if (settingsRow?.config) {
    try {
      storedConfig = JSON.parse(settingsRow.config);
    } catch {
      storedConfig = {};
    }
  }
  if (!storedConfig.analyticsV2UsageReset) {
    await resetFeatureUsageKeys(shop, [
      "export_pdf_csv",
      "ai_insights_playbook",
      "ai_dashboard_overview",
    ]);
    const newConfig = { ...storedConfig, analyticsV2UsageReset: true };
    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(newConfig) },
      create: { shop, config: JSON.stringify(newConfig) },
    });
  }

  let exportAccess = null;
  if (hasPremium) {
    exportAccess = await checkFeatureAccess(planStatus, "export_pdf_csv");
  }

  const targetShops = await getGroupShopList(shop);
  const reviewsAll = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
    select: REVIEW_LIST_SELECT,
  });

  const now = new Date();
  const rangeStart = rangeStartFromKey(now, rangeKey);
  const scopedReviews = filterReviewsByRangeStart(reviewsAll, rangeStart);

  const pageData = computeAnalyticsPageMetrics({
    shop,
    scopedReviews,
    reviewsAll,
    now,
    rangeKey,
    rangeStart,
  });

  return {
    shop,
    rangeKey,
    metricsRangeLabel: rangeLabel(rangeKey),
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    hasPremium,
    pageData,
    exportAccess: exportAccess
      ? {
          ok: exportAccess.ok,
          message: exportAccess.message,
          remaining: exportAccess.remaining,
        }
      : null,
  };
};

export default function AnalyticsPage() {
  const {
    rangeKey,
    metricsRangeLabel,
    trialStatus,
    hasPremium,
    pageData,
    exportAccess,
  } = useLoaderData();
  const [, setSearchParams] = useSearchParams();

  const setRange = (nextRange) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextRange === "all") next.set("range", "all");
        else next.set("range", nextRange);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <AnalyticsPageContent
      pageData={pageData}
      rangeKey={rangeKey}
      metricsRangeLabel={metricsRangeLabel}
      hasPremium={hasPremium}
      trialStatus={trialStatus}
      exportAccess={exportAccess}
      onRangeChange={setRange}
    />
  );
}
