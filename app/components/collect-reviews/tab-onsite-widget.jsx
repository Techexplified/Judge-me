/* eslint-disable react/prop-types */
import { ArrowUpRight, Send, Star, TrendingUp } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BG, SURFACE_BORDER } from "../admin-ui";
import { OrderStatusPreview } from "./order-status-preview.jsx";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function formatNumber(n) {
  return Number(n).toLocaleString();
}

function TrendLabel({ value, suffix = "%" }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 600,
        color: positive ? SHOPIFY_GREEN : "#d72c0d",
      }}
    >
      <ArrowUpRight
        size={14}
        style={{ transform: positive ? "none" : "rotate(90deg)" }}
      />
      {positive ? "+" : ""}
      {value}
      {suffix}
      {suffix === "%" ? " vs last month" : ""}
    </span>
  );
}

function StatCard({ icon: Icon, label, sublabel, value, trend, progressPct }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} color={SHOPIFY_GREEN} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
              {label}
            </p>
            <p style={{ margin: 0, fontFamily: FONT, fontSize: 12, fontWeight: 500, color: "#8c9196" }}>
              {sublabel}
            </p>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 700,
            color: "#202223",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            flexShrink: 0,
            textAlign: "right",
          }}
        >
          {value}
        </p>
      </div>
      <TrendLabel value={trend} suffix={label === "Conversion rate" ? "%" : "%"} />
      {progressPct != null ? (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "#e1e3e5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, progressPct)}%`,
              height: "100%",
              background: SHOPIFY_GREEN,
              borderRadius: 2,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function TabOnsiteWidget({ metrics, timing, formConfig, onTimingChange }) {
  const buttonColor = formConfig?.buttonColor || formConfig?.primaryColor || SHOPIFY_GREEN;
  const accentColor = formConfig?.accentColor || buttonColor;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={Send}
          label="Widget views"
          sublabel="This month"
          value={formatNumber(metrics.widgetViews)}
          trend={metrics.widgetViewsTrend}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion rate"
          sublabel="Reviews per view"
          value={`${metrics.conversionRate}%`}
          trend={metrics.conversionTrend}
          progressPct={metrics.conversionRate}
        />
        <StatCard
          icon={Star}
          label="Reviews collected"
          sublabel="Total this month"
          value={formatNumber(metrics.reviewsCollected)}
          trend={metrics.reviewsCollectedTrend}
        />
      </div>

      <OrderStatusPreview
        timing={timing}
        buttonColor={buttonColor}
        accentColor={accentColor}
        onTimingChange={onTimingChange}
      />
    </div>
  );
}
