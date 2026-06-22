/* eslint-disable react/prop-types */
import { useLoaderData, useSearchParams } from "react-router";
import { UPGRADE_NOTICE } from "../components/admin-ui";
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
import { PremiumGateBanner, PremiumTrialBadge } from "../components/premium-trial-banner";
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
      "live_graphs_charts",
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

  let chartsBlocked = null;
  let pageData = null;
  let exportAccess = null;

  if (hasPremium) {
    const chartAccess = await checkFeatureAccess(planStatus, "live_graphs_charts");
    if (!chartAccess.ok) {
      chartsBlocked = chartAccess.message;
    }
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

  if (hasPremium && !chartsBlocked) {
    pageData = computeAnalyticsPageMetrics({
      shop,
      scopedReviews,
      reviewsAll,
      now,
      rangeKey,
      rangeStart,
    });
  }

  return {
    shop,
    rangeKey,
    metricsRangeLabel: rangeLabel(rangeKey),
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    hasPremium,
    pageData,
    chartsBlocked,
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
    chartsBlocked,
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

  if (!hasPremium) {
    return (
      <div style={{ padding: "20px 24px 32px", background: "#f3f7f5", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900 }}>Analytics</h1>
          <PremiumTrialBadge trialStatus={trialStatus} />
        </div>
        <PremiumGateBanner feature="analytics" />
      </div>
    );
  }

  if (chartsBlocked) {
    return (
      <div style={{ padding: "20px 24px 32px", background: "#f3f7f5", minHeight: "100vh" }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 30, fontWeight: 900 }}>Analytics</h1>
        <div
          style={{
            background: UPGRADE_NOTICE.bg,
            border: `1px solid ${UPGRADE_NOTICE.bd}`,
            borderRadius: 8,
            padding: "16px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: UPGRADE_NOTICE.fgMuted,
          }}
        >
          {chartsBlocked}
        </div>
      </div>
    );
  }

  return (
    <AnalyticsPageContent
      pageData={pageData}
      rangeKey={rangeKey}
      metricsRangeLabel={metricsRangeLabel}
      hasPremium={hasPremium}
      exportAccess={exportAccess}
      onRangeChange={setRange}
    />
  );
}
