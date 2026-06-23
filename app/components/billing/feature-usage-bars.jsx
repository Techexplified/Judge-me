/* eslint-disable react/prop-types */
import { FEATURE_LABELS } from "../../lib/usage.shared.js";

const BAR_TRACK = "#eaeaea";
const FILL_DEFAULT = "#171717";
const FILL_WARNING = "#f5a623";
const FILL_CRITICAL = "#e5484d";

function usagePercent(used, limit) {
  if (limit == null || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function barFillColor(percent, unlimited) {
  if (unlimited) return "#c4c4c4";
  if (percent >= 95) return FILL_CRITICAL;
  if (percent >= 80) return FILL_WARNING;
  return FILL_DEFAULT;
}

function FeatureUsageCard({ label, row }) {
  const unlimited = row.limit == null;
  const percent = unlimited ? 0 : usagePercent(row.used, row.limit);
  const fillColor = barFillColor(percent, unlimited);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eaeaea",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#666", lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#171717", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {unlimited ? (
            <>{row.used.toLocaleString()} · Unlimited</>
          ) : (
            <>
              {row.used.toLocaleString()} / {row.limit.toLocaleString()}
            </>
          )}
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: BAR_TRACK,
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuenow={unlimited ? row.used : percent}
        aria-valuemin={0}
        aria-valuemax={unlimited ? row.used || 100 : 100}
        aria-label={
          unlimited
            ? `${label}: ${row.used.toLocaleString()} used, unlimited`
            : `${label}: ${percent}% used`
        }
      >
        <div
          style={{
            height: "100%",
            width: unlimited ? "100%" : `${percent}%`,
            background: fillColor,
            borderRadius: 2,
            opacity: unlimited ? 0.35 : 1,
            transition: "width 0.25s ease, background 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}

export function FeatureUsageGrid({ featureUsage }) {
  if (!featureUsage || Object.keys(featureUsage).length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {Object.entries(featureUsage).map(([key, row]) => (
        <FeatureUsageCard key={key} label={FEATURE_LABELS[key] || key} row={row} />
      ))}
    </div>
  );
}

/** @deprecated Use FeatureUsageGrid */
export function FeatureUsageBars(props) {
  return <FeatureUsageGrid {...props} />;
}
