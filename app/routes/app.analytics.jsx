/* eslint-disable react/prop-types */
import { Link, useLoaderData, useLocation, useSearchParams } from "react-router";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { getGroupShopList } from "../lib/store-group.server";
import { REVIEW_LIST_SELECT } from "../lib/review-query.shared.js";
import {
  hasProAccess,
  serializePlanStatus,
  requireFeatureUsage,
} from "../lib/billing.server.js";
import {
  computeAnalyticsDetail,
  computeDashboardMetrics,
  filterReviewsByRangeStart,
  parseDashboardRange,
  rangeLabel,
  rangeStartFromKey,
} from "../utils/dashboard-metrics.server.js";
import { PremiumGateBanner, PremiumTrialBadge } from "../components/premium-trial-banner";
import { AnalyticsViewContent } from "../components/analytics/analytics-drilldown-modal.jsx";
import { VIEW_LABELS } from "../components/analytics/analytics-styles.js";

const ANALYTICS_VIEWS = ["volume", "rating", "velocity", "sentiment"];

function parseAnalyticsView(searchParams) {
  const v = searchParams.get("view");
  return ANALYTICS_VIEWS.includes(v) ? v : "volume";
}

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);
  const view = parseAnalyticsView(url.searchParams);

  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const hasPremium = hasProAccess(planStatus);

  let chartsBlocked = null;
  if (hasPremium) {
    const chartUsage = await requireFeatureUsage(planStatus, "live_graphs_charts");
    if (!chartUsage.ok) {
      chartsBlocked = chartUsage.message;
    }
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

  const { rangeStart: metricsRangeStart } = computeDashboardMetrics({
    shop,
    scopedReviews,
    reviewsAll,
    now,
    rangeKey,
  });

  const analyticsDetail =
    hasPremium && !chartsBlocked
      ? computeAnalyticsDetail({
          scopedReviews,
          reviewsAll,
          now,
          rangeKey,
          rangeStart: metricsRangeStart,
        })
      : null;

  return {
    shop,
    rangeKey,
    view,
    metricsRangeLabel: rangeLabel(rangeKey),
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    hasPremium,
    analyticsDetail,
    chartsBlocked,
    totalReviews: scopedReviews.length,
  };
};

const pageStyles = {
  page: {
    padding: "20px 24px 32px",
    background: "#f3f7f5",
    minHeight: "100vh",
    fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    fontSize: 14,
    color: "#202223",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#008060",
    textDecoration: "none",
    marginBottom: 8,
  },
  h1: { margin: 0, fontSize: 28, fontWeight: 900, color: "#202223" },
  hint: { margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175" },
  rangeWrap: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid #c9cccf",
    background: "#fff",
    cursor: "pointer",
  },
  rangeSelect: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontWeight: 700,
    fontSize: 13,
    color: "#202223",
    cursor: "pointer",
    fontFamily: "inherit",
    maxWidth: 140,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tab: (active) => ({
    padding: "8px 14px",
    borderRadius: 999,
    border: active ? "1px solid #008060" : "1px solid #c9cccf",
    background: active ? "#ecfdf3" : "#fff",
    color: active ? "#008060" : "#202223",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "none",
  }),
  panel: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5ebe8",
    padding: "24px 28px",
  },
  footerLink: {
    display: "inline-flex",
    marginTop: 20,
    fontSize: 13,
    fontWeight: 700,
    color: "#008060",
    textDecoration: "none",
  },
};

export default function AnalyticsPage() {
  const {
    rangeKey,
    view,
    metricsRangeLabel,
    trialStatus,
    hasPremium,
    analyticsDetail,
    chartsBlocked,
    totalReviews,
  } = useLoaderData();
  const { search } = useLocation();
  const [, setSearchParams] = useSearchParams();

  const setView = (nextView) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", nextView);
        return next;
      },
      { replace: true },
    );
  };

  const setRange = (nextRange) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("range", nextRange);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div style={pageStyles.page}>
      <Link to={mergeShopifyEmbedParams("/app", search)} style={pageStyles.back}>
        <ChevronLeft size={16} />
        Back to dashboard
      </Link>

      <div style={pageStyles.header}>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <h1 style={pageStyles.h1}>Analytics</h1>
            <PremiumTrialBadge trialStatus={trialStatus} />
          </div>
          <p style={pageStyles.hint}>
            {VIEW_LABELS[view]} · {metricsRangeLabel}
            {totalReviews > 0 ? ` · ${totalReviews} reviews` : ""}
          </p>
        </div>
        <label style={pageStyles.rangeWrap}>
          <CalendarDays size={14} aria-hidden />
          <select
            aria-label="Report date range"
            value={rangeKey}
            onChange={(e) => setRange(e.target.value)}
            style={pageStyles.rangeSelect}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>

      {!hasPremium ? (
        <PremiumGateBanner feature="analytics" />
      ) : chartsBlocked ? (
        <div
          style={{
            background: "#fff4f4",
            border: "1px solid #fed3d1",
            borderRadius: 8,
            padding: "16px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: "#8e1f0b",
          }}
        >
          {chartsBlocked}
        </div>
      ) : (
        <>
          <div style={pageStyles.tabs} role="tablist" aria-label="Analytics views">
            {ANALYTICS_VIEWS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                style={pageStyles.tab(view === key)}
                onClick={() => setView(key)}
              >
                {VIEW_LABELS[key]}
              </button>
            ))}
          </div>

          <div style={pageStyles.panel}>
            <AnalyticsViewContent view={view} analyticsDetail={analyticsDetail} />
            <Link
              to={
                view === "sentiment"
                  ? "/app/reviews?rating=1,2"
                  : "/app/reviews"
              }
              style={pageStyles.footerLink}
            >
              View related reviews →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
