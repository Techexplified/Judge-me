/* eslint-disable react/prop-types */
import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Reply,
  Star,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ComposedChart,
  LabelList,
} from "recharts";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { PAGE_BG, SHOPIFY_GREEN, SURFACE_BG, SURFACE_BORDER, APP_FONT } from "../admin-ui";
import { CHART_COLORS, CHART_LEGEND, CHART_TICK, CHART_TICK_SM, CHART_TOOLTIP } from "./analytics-styles.js";
import { ProLockedPanel, ProLockedToolbar, ProLockedToolButton } from "./pro-section-blur.jsx";
import { PremiumTrialBadge } from "../premium-trial-banner";

const GREEN = SHOPIFY_GREEN;
const GREEN_LIGHT = "#ecfdf5";
const GREEN_MID = "#5bb98c";

const PRO_PILL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: 999,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "#f1f8ff",
  color: "#0369a1",
  border: "1px solid #b3d4f0",
};

function formatNumber(n) {
  return Number(n).toLocaleString();
}

function TrendBadge({ value, numeric }) {
  const isPositive = numeric == null ? !String(value).startsWith("-") : numeric >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 999,
        background: isPositive ? GREEN_LIGHT : "#fff4f4",
        color: isPositive ? "#047857" : "#d72c0d",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

function StarRow({ rating, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: 2, marginLeft: 6, verticalAlign: "middle" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= full || (i === full + 1 && half) ? "#fbbf24" : "none"}
          color={i <= full || (i === full + 1 && half) ? "#fbbf24" : "#d1d5db"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function DateRangeSelect({ rangeKey, onRangeChange }) {
  return (
    <div style={{ position: "relative" }}>
      <CalendarDays
        size={14}
        color="#6d7175"
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
      <select
        aria-label="Date range"
        value={rangeKey}
        onChange={(e) => onRangeChange(e.target.value)}
        style={{
          appearance: "none",
          padding: "10px 36px 10px 36px",
          borderRadius: 8,
          border: `1px solid ${SURFACE_BORDER}`,
          background: "#fff",
          fontSize: 13,
          fontWeight: 700,
          color: "#202223",
          cursor: "pointer",
          fontFamily: APP_FONT,
        }}
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All time</option>
      </select>
      <ChevronDown
        size={16}
        color="#6d7175"
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

function KpiCard({ icon: Icon, trend, value, label, sublabel, extra }) {
  return (
    <div
      style={{
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: GREEN_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={GREEN} />
        </div>
        {trend ? <TrendBadge value={trend} /> : null}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#202223", lineHeight: 1.1, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          {value}
          {extra}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#202223", marginTop: 6 }}>{label}</div>
        {sublabel ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", marginTop: 2 }}>{sublabel}</div>
        ) : null}
      </div>
    </div>
  );
}

function CardShell({ title, subtitle, badge, action, children }) {
  return (
    <div
      style={{
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: "20px 24px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#202223" }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", marginTop: 4 }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {badge}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

function RatingDistribution({ distribution, totalReviews, avgRating, positivePct }) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const barColors = {
    5: GREEN,
    4: GREEN_MID,
    3: "#9dd4b8",
    2: "#c8e6d9",
    1: "#e5f5ed",
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {distribution.map((row) => (
          <div key={row.star} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 72, flexShrink: 0 }}>
              <StarRow rating={row.star} size={12} />
            </div>
            <div style={{ flex: 1, height: 10, background: "#eef2f0", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(row.count / maxCount) * 100}%`,
                  height: "100%",
                  background: barColors[row.star] || GREEN_MID,
                  borderRadius: 999,
                  minWidth: row.count > 0 ? 4 : 0,
                }}
              />
            </div>
            <div style={{ width: 90, textAlign: "right", fontSize: 12, fontWeight: 700, color: "#202223", flexShrink: 0 }}>
              {formatNumber(row.count)} ({row.pct}%)
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${SURFACE_BORDER}`,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#202223" }}>
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          {avgRating} average across all reviews
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: GREEN_LIGHT,
            color: "#047857",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <ThumbsUp size={14} />
          {positivePct}% positive
        </span>
      </div>
    </>
  );
}

function SourceBreakdownChart({ breakdown, totalReviews }) {
  const chartData = breakdown.filter((d) => d.count > 0);
  const displayTotal =
    totalReviews >= 1000 ? `${(totalReviews / 1000).toFixed(1)}k` : formatNumber(totalReviews);

  if (!chartData.length) {
    return (
      <div style={{ height: 200, display: "grid", placeItems: "center", color: "#6d7175", fontSize: 13, fontWeight: 600 }}>
        No review source data yet
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(v, _n, p) => [v, p.payload.label]} contentStyle={CHART_TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, color: "#202223" }}>{displayTotal}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6d7175" }}>reviews</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 12 }}>
        {breakdown.map((item) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: item.color,
                border: item.key === "imported" ? `2px solid ${item.color}` : "none",
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#202223" }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#202223" }}>
              {formatNumber(item.count)} ({item.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsOverTimeChart({ data }) {
  if (!data?.length) {
    return (
      <div style={{ height: 280, display: "grid", placeItems: "center", color: "#6d7175", fontSize: 13, fontWeight: 600 }}>
        No review history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.6} />
            <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5ebe8" vertical={false} />
        <XAxis dataKey="label" tick={CHART_TICK_SM} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={CHART_TICK} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={CHART_TOOLTIP} />
        <Legend
          wrapperStyle={CHART_LEGEND}
          formatter={(value) => (
            <span style={{ color: "#202223" }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="reviews"
          name="Reviews received"
          stroke={CHART_COLORS.trend}
          fill="url(#reviewsGradient)"
          strokeWidth={2.5}
        />
        <Line
          type="monotone"
          dataKey="replies"
          name="Replies sent"
          stroke={GREEN_MID}
          strokeWidth={2}
          dot={{ r: 3, fill: GREEN_MID }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TopProductsTable({ products, reviewsHref }) {
  if (!products?.length) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: "#6d7175", fontSize: 13, fontWeight: 600 }}>
        No product reviews yet
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: APP_FONT }}>
        <thead>
          <tr>
            {["Product", "Reviews", "Avg. rating", "Response rate", "Trend"].map((col) => (
              <th
                key={col}
                style={{
                  textAlign: col === "Product" ? "left" : "right",
                  padding: "10px 12px",
                  borderBottom: `1px solid ${SURFACE_BORDER}`,
                  fontWeight: 800,
                  color: "#6d7175",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const trendUp = p.trendPct >= 0;
            return (
              <tr key={`${p.productId}-${p.productName}`}>
                <td style={{ padding: "14px 12px", borderBottom: `1px solid ${SURFACE_BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: p.iconTone,
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.productImage ? (
                        <img
                          src={p.productImage}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Star size={16} color={GREEN} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#202223" }}>{p.productName}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 12px", borderBottom: `1px solid ${SURFACE_BORDER}`, textAlign: "right", fontWeight: 800 }}>
                  {formatNumber(p.reviewCount)}
                </td>
                <td style={{ padding: "14px 12px", borderBottom: `1px solid ${SURFACE_BORDER}`, textAlign: "right", fontWeight: 700 }}>
                  {p.avgRating}
                  <StarRow rating={p.avgRating} size={11} />
                </td>
                <td style={{ padding: "14px 12px", borderBottom: `1px solid ${SURFACE_BORDER}`, textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                    <div style={{ flex: 1, height: 6, background: "#eef2f0", borderRadius: 999, width: 72 }}>
                      <div
                        style={{
                          width: `${p.responseRate}%`,
                          height: "100%",
                          background: GREEN,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{p.responseRate}%</span>
                  </div>
                </td>
                <td style={{ padding: "14px 12px", borderBottom: `1px solid ${SURFACE_BORDER}`, textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 800,
                      color: trendUp ? "#047857" : "#d72c0d",
                      fontSize: 12,
                    }}
                  >
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {p.trendLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Link
          to={reviewsHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            background: "#fff",
            fontSize: 12,
            fontWeight: 700,
            color: "#202223",
            textDecoration: "none",
          }}
        >
          View all products →
        </Link>
      </div>
    </div>
  );
}

async function downloadExport(url, fallbackName) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

function WeeklyMomentumChart({ data = [] }) {
  // Take exactly 4 weeks of data
  const chartData = data.slice(-4).map((item, index) => ({
    name: item.label || `Week ${index + 1}`,
    reviews: Number(item.reviews) || 0, // Force strict numerical fallback
    change: item.change || "",
  }));

  if (!chartData.length) {
    return (
      <div style={{ height: 160, display: "grid", placeItems: "center", color: "#6d7175", fontSize: 13, fontWeight: 600 }}>
        Gathering weekly momentum data...
      </div>
    );
  }

  // Grab values to set a dynamic, clean upper domain bound
  const maxVal = Math.max(...chartData.map(d => d.reviews), 0);
  const yAxisMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : 4;

  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* CHANGED TO ComposedChart TO SUPPORT MIXED GRAPH TYPES NATIVELY */}
        <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5ebe8" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6d7175", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, yAxisMax]}
            tick={{ fill: "#6d7175", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5ebe8", borderRadius: 8 }} />

          {/* Main Volume Bars */}
          <Bar
            dataKey="reviews"
            fill="#005A43"
            radius={[4, 4, 0, 0]}
            barSize={24}
          >
            <LabelList
              dataKey="change"
              position="top"
              // Use a custom function component for rendering the text node directly
              content={(props) => {
                const { x, y, width, value } = props;
                if (!value) return null;

                // Determine the color based on whether it's an increase (+) or decrease (-)
                const isNegative = value.startsWith("-");
                const textColor = isNegative ? "#d72c0d" : "#047857";

                return (
                  <text
                    x={x + width / 2}
                    y={y - 8} // Position it slightly above the top of the bar
                    fill={textColor}
                    textAnchor="middle"
                    style={{ fontSize: "11px", fontWeight: 800 }}
                  >
                    {value}
                  </text>
                );
              }}
            />
          </Bar>

          {/* Trend Connector Line */}
          <Line
            type="monotone"
            dataKey="reviews"
            stroke="#5bb98c"
            strokeWidth={2}
            dot={{ r: 4, fill: "#5bb98c", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function AccountabilityCenter({ pendingCount, criticalCount }) {
  const reviewsHref = mergeShopifyEmbedParams("/app/manage-reviews");
  const completionRate = pendingCount === 0 ? 100 : Math.max(0, 100 - (pendingCount * 15));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, height: "100%", padding: "4px 0" }}>

      {/* Visual Completion Ring */}
      <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="90" height="90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eef2f0" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
            stroke={pendingCount > 0 ? "#b45309" : "#047857"}
            strokeDasharray={`${completionRate}, 100`}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#202223" }}>{completionRate}%</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#6d7175", textTransform: "uppercase" }}>Done</div>
        </div>
      </div>

      {/* Actionable Micro-Cards Grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <Link to={`${reviewsHref}`} style={{ textDecoration: "none", background: pendingCount > 0 ? "#fffaf0" : "#f6f6f7", border: `1px solid ${pendingCount > 0 ? "#fef3c7" : "#e5ebe8"}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, transition: "all 0.2s" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: pendingCount > 0 ? "#b45309" : "#202223", lineHeight: 1 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6d7175" }}>Unanswered</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: pendingCount > 0 ? "#b45309" : "#6d7175", marginTop: 4 }}>Reply Now →</span>
        </Link>

        <Link to={`${reviewsHref}`} style={{ textDecoration: "none", background: criticalCount > 0 ? "#fff4f4" : "#ecfdf5", border: `1px solid ${criticalCount > 0 ? "#fcd4d4" : "#a7f3d0"}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: criticalCount > 0 ? "#d72c0d" : "#047857", lineHeight: 1 }}>{criticalCount}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6d7175" }}>Low Rating (1-2★)</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: criticalCount > 0 ? "#d72c0d" : "#047857", marginTop: 4 }}>Resolve →</span>
        </Link>
      </div>
    </div>
  );
}

export function AnalyticsPageContent({
  pageData,
  rangeKey,
  metricsRangeLabel,
  hasPremium,
  trialStatus,
  exportAccess,
  onRangeChange,
}) {
  const { search } = useLocation();
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState(null);

  const reviewsHref = mergeShopifyEmbedParams("/app/manage-reviews", search);

  const handleExport = useCallback(
    async (type) => {
      if (!hasPremium) {
        setExportError("PDF & CSV export requires a Pro plan.");
        return;
      }
      if (!exportAccess?.ok) {
        setExportError(exportAccess?.message || "Export limit reached for this month.");
        return;
      }

      setExportError(null);
      setExporting(type);
      try {
        const base =
          type === "csv"
            ? `/app/export-reviews-csv?range=${rangeKey}`
            : `/app/export-report?range=${rangeKey}&includePlaybook=1`;
        const url = mergeShopifyEmbedParams(base, search);
        await downloadExport(
          url,
          type === "csv" ? `reviews-export.csv` : `review-report.pdf`,
        );
      } catch (err) {
        setExportError(err.message || "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [hasPremium, exportAccess, rangeKey, search],
  );

  const { kpis, ratingDistribution, positivePct, avgRating, monthlyChart, sourceBreakdown, topProducts, totalReviews } =
    pageData || {
      kpis: {
        totalReviews: "0",
        totalTrend: "+0%",
        avgRating: "0.0",
        avgDelta: "+0",
        reviewsThisMonth: "0",
        reviewsThisMonthTrend: "+0%",
        reviewsThisMonthLabel: "",
        responseRate: "0%",
        responseRateTrend: "+0%",
        mediaReviews: "0",
        mediaTrend: "+0%",
      },
      ratingDistribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, pct: 0 })),
      positivePct: 0,
      avgRating: "0.0",
      monthlyChart: [],
      sourceBreakdown: [],
      topProducts: [],
      totalReviews: 0,
    };

  return (
    <div
      style={{
        background: PAGE_BG,
        minHeight: "100vh",
        padding: "20px 24px 32px",
        boxSizing: "border-box",
        fontFamily: APP_FONT,
        fontSize: 14,
        color: "#202223",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#202223" }}>Analytics</h1>
            {!hasPremium ? <PremiumTrialBadge trialStatus={trialStatus} /> : null}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175", maxWidth: 480 }}>
            Track review performance, trends, and conversion impact across your store.
          </p>
        </div>
        {hasPremium ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleExport("csv")}
              disabled={!!exporting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${SURFACE_BORDER}`,
                background: "#fff",
                fontSize: 13,
                fontWeight: 700,
                color: "#202223",
                cursor: exporting ? "wait" : "pointer",
                fontFamily: APP_FONT,
              }}
            >
              <Download size={16} />
              {exporting === "csv" ? "Exporting…" : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${SURFACE_BORDER}`,
                background: "#fff",
                fontSize: 13,
                fontWeight: 700,
                color: "#202223",
                cursor: exporting ? "wait" : "pointer",
                fontFamily: APP_FONT,
              }}
            >
              <FileText size={16} />
              {exporting === "pdf" ? "Generating…" : "Export PDF"}
            </button>
            <DateRangeSelect rangeKey={rangeKey} onRangeChange={onRangeChange} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <ProLockedToolbar locked>
              <ProLockedToolButton icon={Download} label="Export CSV" />
              <ProLockedToolButton icon={FileText} label="Export PDF" />
            </ProLockedToolbar>
            <DateRangeSelect rangeKey={rangeKey} onRangeChange={onRangeChange} />
          </div>
        )}
      </div>

      {exportError ? (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fff4f4",
            border: "1px solid #fcd4d4",
            color: "#8a1f1f",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {exportError}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KpiCard
          icon={MessageSquare}
          trend={kpis.totalTrend}
          value={formatNumber(kpis.totalReviews)}
          label="Total reviews"
          sublabel="vs. prior period"
        />
        <KpiCard
          icon={Star}
          trend={kpis.avgDelta}
          value={kpis.avgRating}
          label="Average rating"
          sublabel="Across all reviews"
          extra={<StarRow rating={parseFloat(kpis.avgRating)} size={14} />}
        />
        <KpiCard
          icon={CalendarDays}
          trend={kpis.reviewsThisMonthTrend}
          value={formatNumber(kpis.reviewsThisMonth)}
          label="Reviews this month"
          sublabel={kpis.reviewsThisMonthLabel}
        />
        <KpiCard
          icon={Reply}
          trend={kpis.responseRateTrend}
          value={kpis.responseRate}
          label="Response rate"
          sublabel="Replied to reviews"
        />
        <KpiCard
          icon={ImageIcon}
          trend={kpis.mediaTrend}
          value={formatNumber(kpis.mediaReviews)}
          label="Photo / video reviews"
          sublabel="With media attached"
        />
      </div>

      <CardShell
        title="Reviews over time"
        subtitle="Monthly review volume across all sources"
        badge={!hasPremium ? <span style={{ ...PRO_PILL_STYLE, fontSize: 10 }}>Pro</span> : null}
      >
        <ProLockedPanel locked={!hasPremium} skeleton="area" minHeight={280}>
          <ReviewsOverTimeChart data={monthlyChart} />
        </ProLockedPanel>
      </CardShell>

            <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginTop: 20,
        }}
      >
        <CardShell
          title="Weekly Momentum"
          subtitle="Review velocity tracking over a rolling 4-week timeline"
        >
          <ProLockedPanel locked={!hasPremium} skeleton="bars" minHeight={260}>
          <WeeklyMomentumChart data={pageData?.weeklyMomentum || []} />
          </ProLockedPanel>
        </CardShell>

        <CardShell
          title="Accountability Center"
          subtitle="Action items for incoming reviews this week"
        >
          <ProLockedPanel locked={!hasPremium} skeleton="bars" minHeight={260}>
          <AccountabilityCenter
            pendingCount={pageData?.accountability?.pending || 0}
            criticalCount={pageData?.accountability?.critical || 0}
            reviewsHref={reviewsHref}
          />
          </ProLockedPanel>
        </CardShell>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginTop: 20,
        }}
      >
        <CardShell
          title="Rating distribution"
          subtitle="Breakdown of 1–5 star ratings"
          badge={
            hasPremium ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#f6f6f7",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#6d7175",
                  }}
                >
                  {formatNumber(totalReviews)} total
                </span>
                {exportAccess?.remaining != null ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6d7175",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exportAccess.remaining} PDF/CSV export{exportAccess.remaining === 1 ? "" : "s"} remaining
                  </span>
                ) : null}
              </div>
            ) : (
              <span style={{ ...PRO_PILL_STYLE, fontSize: 10 }}>Pro</span>
            )
          }
        >
          <ProLockedPanel locked={!hasPremium} skeleton="bars" minHeight={260}>
            <RatingDistribution
              distribution={ratingDistribution}
              totalReviews={totalReviews}
              avgRating={avgRating}
              positivePct={positivePct}
            />
          </ProLockedPanel>
        </CardShell>

        <CardShell title="Source breakdown" subtitle="Where reviews came from">
          <SourceBreakdownChart breakdown={sourceBreakdown} totalReviews={totalReviews} />
        </CardShell>
      </div>

      <div style={{ marginTop: 20 }}>
        <CardShell
          title="Top reviewed products"
          subtitle="Products ranked by total review count"
          badge={!hasPremium ? <span style={{ ...PRO_PILL_STYLE, fontSize: 10 }}>Pro</span> : null}
        >
          <ProLockedPanel locked={!hasPremium} skeleton="table" minHeight={220}>
            <TopProductsTable products={topProducts} reviewsHref={reviewsHref} />
          </ProLockedPanel>
        </CardShell>
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
        Showing data for {metricsRangeLabel.toLowerCase()}.
      </p>
    </div>
  );
}
