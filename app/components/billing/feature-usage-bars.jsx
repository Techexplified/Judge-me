/* eslint-disable react/prop-types */
import { SHOPIFY_GREEN, SHOPIFY_GREEN_DARK } from "../admin-ui";
import { FEATURE_LABELS } from "../../lib/usage.shared.js";

const BAR_TRACK = "#e8ebe9";

function usagePercent(used, limit) {
  if (limit == null || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function FeatureUsageRow({ label, row }) {
  const unlimited = row.limit == null;
  const percent = unlimited ? 100 : usagePercent(row.used, row.limit);

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#6d7175" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#202223", flexShrink: 0 }}>
          {unlimited ? (
            <>{row.used.toLocaleString()} · Unlimited</>
          ) : (
            <>
              {row.used.toLocaleString()} / {row.limit.toLocaleString()}
              <span style={{ color: "#8c9196", fontWeight: 600, marginLeft: 6 }}>{percent}%</span>
            </>
          )}
        </span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: BAR_TRACK,
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          unlimited
            ? `${label}: unlimited`
            : `${label}: ${percent}% used`
        }
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${SHOPIFY_GREEN} 0%, ${SHOPIFY_GREEN_DARK} 100%)`,
            borderRadius: 999,
            transition: "width 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}

export function FeatureUsageBars({ featureUsage }) {
  if (!featureUsage || Object.keys(featureUsage).length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {Object.entries(featureUsage).map(([key, row], index, arr) => (
        <div
          key={key}
          style={
            index < arr.length - 1
              ? { borderBottom: "1px solid #f1f2f3", paddingBottom: 2 }
              : undefined
          }
        >
          <FeatureUsageRow label={FEATURE_LABELS[key] || key} row={row} />
        </div>
      ))}
    </div>
  );
}
