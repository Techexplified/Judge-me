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

function computeWeeklySnapshot(reviewsAll) {
  const referenceDate = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // 1. Accountability (Last 7 Days)
  const sevenDaysAgo = new Date(referenceDate.getTime() - 7 * oneDay);
  const recentReviews = reviewsAll.filter(r => new Date(r.createdAt) >= sevenDaysAgo);
  
  const pending = recentReviews.filter(r => !r.replyText || r.replyText.trim() === "").length;
  const critical = recentReviews.filter(r => r.rating <= 3).length;

  // 2. Weekly Momentum (4 Rolling Weeks)
const weeklyMomentum = [];
const tempCounts = [];


for (let i = 3; i >= 0; i--) {
  const startOfWeeksAgo = new Date(referenceDate.getTime() - (i + 1) * 7 * oneDay);
  const endOfWeeksAgo = new Date(referenceDate.getTime() - i * 7 * oneDay);
  const count = reviewsAll.filter(r => {
    const d = new Date(r.createdAt);
    return d >= startOfWeeksAgo && d < endOfWeeksAgo;
  }).length;
  tempCounts.push(count);
}


for (let i = 0; i < 4; i++) {
  let label = `${4 - i} Wks Ago`;
  if (i === 2) label = "Last Week";
  if (i === 3) label = "This Week";

  let pctChange = "";
  if (i > 0) {
    const prev = tempCounts[i - 1];
    const curr = tempCounts[i];
    if (prev === 0 && curr > 0) pctChange = `+${curr * 100}%`;
    else if (prev === 0 && curr === 0) pctChange = "0%";
    else {
      const diff = ((curr - prev) / prev) * 100;
      pctChange = diff >= 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
    }
  }

  weeklyMomentum.push({ label, reviews: tempCounts[i], change: pctChange });
}

  return {
    accountability: { pending, critical },
    weeklyMomentum
  };
}

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

  const weeklySnapshots = computeWeeklySnapshot(reviewsAll);

  return {
    shop,
    rangeKey,
    metricsRangeLabel: rangeLabel(rangeKey),
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    hasPremium,
    pageData: {
      ...pageData,
      weeklyMomentum: weeklySnapshots.weeklyMomentum,
      accountability: weeklySnapshots.accountability,
    },
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
