/* eslint-disable react/prop-types */
import { useCallback, useState } from "react";
import {
  Link,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
  Mail,
  Percent,
  Send,
  Star,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import {
  dismissAppRatingBanner,
  loadPerformanceOverviewData,
  markAppRatingSubmitted,
} from "../utils/performance-metrics.server.js";
import { AppRatingBanner, SHOPIFY_GREEN, SHOPIFY_GREEN_DARK } from "../components/performance/app-rating-banner.jsx";
import { PAGE_BG, SURFACE_BG, SURFACE_BORDER } from "../components/admin-ui";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  return loadPerformanceOverviewData({ request, session, admin });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  if (intent === "dismissAppRating") {
    await dismissAppRatingBanner(shop);
    return { ok: true };
  }
  if (intent === "markAppRated") {
    await markAppRatingSubmitted(shop);
    return { ok: true };
  }

  return { ok: false };
};

function formatNumber(n) {
  return Number(n).toLocaleString();
}

function StatusBadge({ label, tone = "success" }) {
  const colors =
    tone === "warning"
      ? { bg: "#fff8e6", fg: "#8a6116", dot: "#b98900" }
      : { bg: "#ecfdf5", fg: "#047857", dot: SHOPIFY_GREEN };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: colors.bg,
        color: colors.fg,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: colors.dot,
        }}
      />
      {label}
    </span>
  );
}

function MetricRow({ icon: Icon, label, value, badge }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        borderTop: `1px solid ${SURFACE_BORDER}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Icon size={16} color="#6d7175" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#202223" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#202223" }}>{value}</span>
        {badge}
      </div>
    </div>
  );
}

function PerformanceCard({ icon: Icon, title, subtitle, status, children, footer }) {
  return (
    <div
      style={{
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} color={SHOPIFY_GREEN} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#202223" }}>{title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>
        {status}
      </div>

      <div style={{ marginTop: 24, flex: 1 }}>{children}</div>
      {footer}
    </div>
  );
}

export default function PerformanceOverview() {
  const data = useLoaderData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const rangeKey = searchParams.get("range") || "30";
  const showBanner = data.showRatingBanner && !bannerDismissed;

  const setRange = useCallback(
    (nextRange) => {
      const next = new URLSearchParams(searchParams);
      if (nextRange === "30") next.delete("range");
      else next.set("range", nextRange);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const manageHref = mergeShopifyEmbedParams("/app/manage-reviews", location.search);
  const reviewsHref = mergeShopifyEmbedParams("/app/reviews", location.search);
  const settingsHref = mergeShopifyEmbedParams("/app/collect-reviews/customize", location.search);

  const rangeOptions = [
    { value: "30", label: "This month" },
    { value: "7", label: "Last 7 days" },
    { value: "90", label: "Last 90 days" },
    { value: "all", label: "All time" },
  ];

  return (
    <div style={{ ...pageStyle, background: PAGE_BG }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={headingStyle}>Performance Overview</h1>
          <p style={subheadingStyle}>
            Updated just now · {data.monthLabel}
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <select
            value={rangeKey === "all" ? "all" : rangeKey}
            onChange={(e) => setRange(e.target.value)}
            style={{
              appearance: "none",
              padding: "10px 36px 10px 14px",
              borderRadius: 8,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "#fff",
              fontSize: 13,
              fontWeight: 700,
              color: "#202223",
              cursor: "pointer",
            }}
          >
            {rangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            color="#6d7175"
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
        </div>
      </div>

      <AppRatingBanner
        showWhenReady={showBanner}
        onDismissed={() => setBannerDismissed(true)}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        <PerformanceCard
          icon={Star}
          title="Reviews"
          subtitle="All time performance"
          status={<StatusBadge label={data.reviews.active ? "Active" : "Getting started"} />}
          footer={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SURFACE_BORDER}` }}>
              <Link
                to={manageHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: SHOPIFY_GREEN,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Manage Reviews
                <ArrowUpRight size={16} />
              </Link>
              <Link
                to={reviewsHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6d7175",
                  textDecoration: "none",
                }}
              >
                View all reviews
                <ExternalLink size={14} />
              </Link>
            </div>
          }
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6d7175", marginBottom: 8 }}>
            Total Reviews
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "#202223", lineHeight: 1 }}>
              {formatNumber(data.reviews.totalReviews)}
            </span>
            {data.reviews.totalTrend ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#ecfdf5",
                  color: "#047857",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {data.reviews.totalTrend} vs last month
              </span>
            ) : null}
          </div>

          <MetricRow
            icon={CalendarDays}
            label="Collected this month"
            value={formatNumber(data.reviews.collectedThisMonth)}
            badge={
              data.reviews.collectedThisWeek > 0 ? (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  +{formatNumber(data.reviews.collectedThisWeek)} this week
                </span>
              ) : null
            }
          />
          <MetricRow icon={Star} label="Average rating" value={data.reviews.avgRating} />
        </PerformanceCard>

        <PerformanceCard
          icon={Send}
          title="Review Requests"
          subtitle="Automated collection"
          status={
            <StatusBadge
              label={data.reviewRequests.statusLabel}
              tone={data.reviewRequests.enabled ? "success" : "warning"}
            />
          }
          footer={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SURFACE_BORDER}` }}>
              <Link
                to={settingsHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: SHOPIFY_GREEN,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Send Requests
                <Send size={15} />
              </Link>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6d7175",
                }}
              >
                View request history
                <ExternalLink size={14} />
              </span>
            </div>
          }
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6d7175", marginBottom: 8 }}>
            Pending Requests
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "#202223", lineHeight: 1 }}>
              {formatNumber(data.reviewRequests.pendingRequests)}
            </span>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#fff8e6",
                  color: "#8a6116",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <Clock size={12} />
                Awaiting response
              </span>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6d7175", marginTop: 6 }}>
                Sent in the last 30 days
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 0", borderTop: `1px solid ${SURFACE_BORDER}`, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Percent size={16} color="#6d7175" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#202223" }}>
                  Request success rate
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#202223" }}>
                {data.reviewRequests.successRate}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#e5ebe8",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, data.reviewRequests.successRate)}%`,
                  height: "100%",
                  background: SHOPIFY_GREEN,
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6d7175", marginTop: 6 }}>
              {data.reviewRequests.successRate}% conversion
            </div>
          </div>

          <MetricRow
            icon={Mail}
            label="Reviews via requests"
            value={formatNumber(data.reviewRequests.reviewsViaRequests)}
            badge={
              data.reviewRequests.viaRequestsPct > 0 ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: SHOPIFY_GREEN }}>
                  {data.reviewRequests.viaRequestsPct}% of total
                </span>
              ) : null
            }
          />
        </PerformanceCard>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "20px 24px 32px",
  minHeight: "100vh",
  fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
  fontSize: 14,
  color: "#202223",
  boxSizing: "border-box",
};

const headingStyle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
  color: "#202223",
};

const subheadingStyle = {
  margin: "8px 0 0",
  fontSize: 13,
  fontWeight: 600,
  color: "#6d7175",
};
