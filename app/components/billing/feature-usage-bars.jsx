/* eslint-disable react/prop-types */
import { FEATURE_LABELS } from "../../lib/usage.shared.js";

const BAR_TRACK = "#e4e5e7";
const BAR_FILL = "#2563eb";
const BAR_WARN = "#b98900";
const BAR_FULL = "#d72c0d";

function usagePercent(used, limit) {
  if (limit == null || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function barColor(percent) {
  if (percent >= 100) return BAR_FULL;
  if (percent >= 80) return BAR_WARN;
  return BAR_FILL;
}

function FeatureUsageRow({ label, row }) {
  const unlimited = row.limit == null;
  const percent = unlimited ? 0 : usagePercent(row.used, row.limit);

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: "#fafbfb",
        border: "1px solid #eceeef",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#6d7175" }}>{label}</span>
        {!unlimited ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6d7175", flexShrink: 0 }}>
            {percent}%
          </span>
        ) : null}
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#202223", lineHeight: 1.2 }}>
        {unlimited ? (
          <>
            {row.used.toLocaleString()} used · Unlimited
          </>
        ) : (
          <>
            {row.used.toLocaleString()} / {row.limit.toLocaleString()}
          </>
        )}
      </p>
      {!unlimited ? (
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: BAR_TRACK,
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${percent}% used`}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: barColor(percent),
              borderRadius: 999,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${BAR_FILL} 0%, #60a5fa 100%)`,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

export function FeatureUsageBars({ featureUsage }) {
  if (!featureUsage || Object.keys(featureUsage).length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(featureUsage).map(([key, row]) => (
        <FeatureUsageRow
          key={key}
          label={FEATURE_LABELS[key] || key}
          row={row}
        />
      ))}
    </div>
  );
}
