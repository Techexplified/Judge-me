/* eslint-disable react/prop-types */
import { ArrowUpRight, MapPin, Package, Send, Star, TrendingUp } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BG, SURFACE_BORDER } from "../admin-ui";
import { OrderStatusPreview } from "./order-status-preview.jsx";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function formatNumber(n) {
  return Number(n).toLocaleString();
}

function TrendLabel({ value, suffix = "%" }) {
  if (value == null) {
    return (
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
        N/A
      </span>
    );
  }
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
        minWidth: 200,
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#ecfdf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={18} color={SHOPIFY_GREEN} />
      </div>
      <p style={{ margin: "0 0 2px", fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
        {label}
      </p>
      <p style={{ margin: "0 0 10px", fontFamily: FONT, fontSize: 12, fontWeight: 500, color: "#8c9196" }}>
        {sublabel}
      </p>
      <p style={{ margin: "0 0 8px", fontFamily: FONT, fontSize: 28, fontWeight: 700, color: "#202223" }}>
        {value}
      </p>
      <TrendLabel value={trend} suffix={label === "Conversion Rate" ? "%" : "%"} />
      {progressPct != null ? (
        <div
          style={{
            marginTop: 12,
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

function TimingOption({ selected, title, description, icon: Icon, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        textAlign: "left",
        padding: "18px 20px",
        borderRadius: 10,
        border: selected ? `2px solid ${SHOPIFY_GREEN}` : `1px solid ${SURFACE_BORDER}`,
        background: selected ? "#ecfdf5" : "#fff",
        cursor: "pointer",
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: selected ? `6px solid ${SHOPIFY_GREEN}` : "2px solid #c9cccf",
          background: "#fff",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#202223" }}>
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: selected ? SHOPIFY_GREEN : "#6d7175",
            lineHeight: 1.45,
          }}
        >
          {description}
        </p>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: `1px solid ${SURFACE_BORDER}`,
          background: "#f6f8f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color="#6d7175" strokeWidth={1.75} />
      </div>
    </button>
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

      <div style={{ marginBottom: 28 }}>
        <h3
          style={{
            margin: "0 0 4px",
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 600,
            color: "#202223",
          }}
        >
          Widget timing
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: "#6d7175",
          }}
        >
          Control when the review widget appears for customers.
        </p>

        <TimingOption
          selected={timing === "after_fulfillment"}
          title="Show after fulfillment"
          description="When the order ships, ask customers about their store experience."
          icon={Package}
          onSelect={() => onTimingChange("after_fulfillment")}
        />
        <TimingOption
          selected={timing === "after_delivery"}
          title="Show after delivery"
          description="When the order is delivered, ask customers to review the product."
          icon={MapPin}
          onSelect={() => onTimingChange("after_delivery")}
        />
      </div>

      <OrderStatusPreview timing={timing} buttonColor={buttonColor} accentColor={accentColor} />
    </div>
  );
}
