/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import {
  KeywordBarChart,
  ProductListTable,
  RatingDistributionChart,
  RatingTrendChart,
  SentimentDonutChart,
  SentimentTrendChart,
  VelocityAreaChart,
  VolumeStackedChart,
} from "./analytics-charts.jsx";
import { modalStyles, VIEW_LABELS } from "./analytics-styles.js";

function reviewsHref(extras = {}) {
  const q = new URLSearchParams();
  if (extras.rating) q.set("rating", extras.rating);
  if (extras.product) q.set("product", extras.product);
  if (extras.pid) q.set("pid", extras.pid);
  const qs = q.toString();
  return qs ? `/app/reviews?${qs}` : "/app/reviews";
}

function InsightBullets({ items }) {
  if (!items?.length) return null;
  return (
    <ul style={modalStyles.insightList}>
      {items.map((text) => (
        <li key={text} style={modalStyles.insightItem}>
          {text}
        </li>
      ))}
    </ul>
  );
}

function VolumeView({ data }) {
  if (!data) return null;
  return (
    <>
      <div style={modalStyles.insightRow}>
        <span style={modalStyles.bigMetric}>{data.comparison.currentCount}</span>
        <span style={modalStyles.badge(data.comparison.changePct >= 0 ? "green" : "red")}>
          <ArrowUpRight size={12} />
          {data.comparison.changeLabel} vs prior period
        </span>
      </div>
      <InsightBullets items={data.insights} />
      <VolumeStackedChart data={data.daily} />
      <ProductListTable title="Top products by review volume" items={data.topMovers} />
    </>
  );
}

function RatingView({ data }) {
  if (!data) return null;
  return (
    <>
      <div style={modalStyles.insightRow}>
        <span style={modalStyles.bigMetric}>{data.avgRating}★</span>
        <span style={modalStyles.badge(undefined)}>Average in range</span>
      </div>
      <InsightBullets items={data.insights} />
      <RatingDistributionChart data={data.distribution} />
      <RatingTrendChart data={data.trend} />
      <ProductListTable title="Highest rated products" items={data.topRated} valueKey="avgRating" valueLabel="Avg rating" />
      <ProductListTable title="Lowest rated products" items={data.bottomRated} valueKey="avgRating" valueLabel="Avg rating" />
    </>
  );
}

function VelocityView({ data }) {
  if (!data) return null;
  return (
    <>
      <div style={modalStyles.insightRow}>
        <span style={modalStyles.bigMetric}>+{data.last7Count} / week</span>
        <span style={modalStyles.badge(data.badgeTone)}>
          {data.label}
        </span>
        <span style={modalStyles.badge(data.wowPct >= 0 ? "green" : "red")}>
          {data.wowLabel} WoW
        </span>
      </div>
      <InsightBullets items={data.insights} />
      <VelocityAreaChart data={data.weekly} />
      <ProductListTable title="Fastest products (last 7 days)" items={data.productVelocity} />
    </>
  );
}

function SentimentView({ data, activeSegment, onSegmentChange }) {
  if (!data) return null;
  return (
    <>
      <div style={modalStyles.insightRow}>
        <span style={modalStyles.bigMetric}>{data.positivePct}% Positive</span>
        <span style={modalStyles.badge("red")}>{data.negativePct}% Negative</span>
      </div>
      <InsightBullets items={data.insights} />
      <SentimentDonutChart
        positivePct={data.positivePct}
        neutralPct={data.neutralPct}
        negativePct={data.negativePct}
        activeSegment={activeSegment}
        onSegmentClick={onSegmentChange}
      />
      <SentimentTrendChart data={data.weekly} />
      <KeywordBarChart data={data.keywords} />
    </>
  );
}

export function AnalyticsViewContent({ view, analyticsDetail, sentimentFilter, onSentimentFilterChange }) {
  if (!analyticsDetail) {
    return <div style={modalStyles.emptyChart}>No analytics data available.</div>;
  }

  switch (view) {
    case "volume":
      return <VolumeView data={analyticsDetail.volume} />;
    case "rating":
      return <RatingView data={analyticsDetail.rating} />;
    case "velocity":
      return <VelocityView data={analyticsDetail.velocity} />;
    case "sentiment":
      return (
        <SentimentView
          data={analyticsDetail.sentiment}
          activeSegment={sentimentFilter}
          onSegmentChange={onSentimentFilterChange}
        />
      );
    default:
      return null;
  }
}

export function AnalyticsDrilldownModal({
  view,
  analyticsDetail,
  rangeKey,
  sentimentFilter: initialSentimentFilter,
  onClose,
  expandHref,
}) {
  const { search } = useLocation();
  const [sentimentFilter, setSentimentFilter] = useState(initialSentimentFilter || null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!view) return null;

  const reviewLink = (() => {
    if (view === "sentiment" && sentimentFilter === "negative") {
      return mergeShopifyEmbedParams(reviewsHref({ rating: "1,2" }), search);
    }
    if (view === "rating") {
      return mergeShopifyEmbedParams(reviewsHref(), search);
    }
    return mergeShopifyEmbedParams(reviewsHref(), search);
  })();

  const fullAnalyticsHref =
    expandHref ||
    mergeShopifyEmbedParams(`/app/analytics?view=${view}&range=${rangeKey}`, search);

  return (
    <div style={modalStyles.root} role="dialog" aria-modal="true" aria-labelledby="analytics-modal-title">
      <button type="button" style={modalStyles.backdrop} aria-label="Close" onClick={onClose} />
      <div style={modalStyles.panel}>
        <div style={modalStyles.head}>
          <h2 id="analytics-modal-title" style={modalStyles.title}>
            {VIEW_LABELS[view]}
          </h2>
          <button type="button" style={modalStyles.close} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <AnalyticsViewContent
          view={view}
          analyticsDetail={analyticsDetail}
          sentimentFilter={sentimentFilter}
          onSentimentFilterChange={setSentimentFilter}
        />

        <div style={modalStyles.footer}>
          <Link to={reviewLink} style={modalStyles.btn} onClick={onClose}>
            View reviews
          </Link>
          <Link to={fullAnalyticsHref} style={modalStyles.btnPrimary} onClick={onClose}>
            <ExternalLink size={14} />
            Open full analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
