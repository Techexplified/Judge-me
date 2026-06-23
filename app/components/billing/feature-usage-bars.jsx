/* eslint-disable react/prop-types */
import { Lock } from "lucide-react";
import { FEATURE_LABELS } from "../../lib/usage.shared.js";

const BAR_TRACK = "#eaeaea";
const FILL_DEFAULT = "#171717";
const FILL_WARNING = "#f5a623";
const FILL_CRITICAL = "#e5484d";
const PRO_LOCKED_FILL = "#c4c4c4";

function usagePercent(used, limit) {
  if (limit == null || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function barFillColor(percent, unlimited, proLocked) {
  if (proLocked) return PRO_LOCKED_FILL;
  if (unlimited) return "#c4c4c4";
  if (percent >= 95) return FILL_CRITICAL;
  if (percent >= 80) return FILL_WARNING;
  return FILL_DEFAULT;
}

function FeatureUsageCard({ label, row }) {
  const proLocked = row.proLocked === true;
  const unlimited = !proLocked && row.limit == null;
  const percent = unlimited || proLocked ? 0 : usagePercent(row.used, row.limit);
  const fillColor = barFillColor(percent, unlimited, proLocked);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eaeaea",
        borderRadius: 8,
        padding: "14px 16px",
        opacity: proLocked ? 0.92 : 1,
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
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: proLocked ? "#8c9196" : "#666",
            lineHeight: 1.3,
          }}
        >
          {label}
          {proLocked ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 7px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                background: "#f1f8ff",
                color: "#0369a1",
                border: "1px solid #b3d4f0",
              }}
            >
              Pro
            </span>
          ) : null}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: proLocked ? "#8c9196" : "#171717",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {proLocked ? (
            <>
              <Lock size={12} aria-hidden />
              {row.limit != null ? `0 / ${row.limit.toLocaleString()}` : "Pro only"}
            </>
          ) : unlimited ? (
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
        aria-valuenow={proLocked ? 0 : unlimited ? row.used : percent}
        aria-valuemin={0}
        aria-valuemax={proLocked ? 100 : unlimited ? row.used || 100 : 100}
        aria-label={
          proLocked
            ? `${label}: Pro feature`
            : unlimited
              ? `${label}: ${row.used.toLocaleString()} used, unlimited`
              : `${label}: ${percent}% used`
        }
      >
        <div
          style={{
            height: "100%",
            width: proLocked ? "0%" : unlimited ? "100%" : `${percent}%`,
            background: fillColor,
            borderRadius: 2,
            opacity: unlimited && !proLocked ? 0.35 : 1,
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
