/* eslint-disable react/prop-types */
import { Check, ArrowRight } from "lucide-react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { SHOPIFY_GREEN } from "../admin-ui";
import { ONBOARDING_LAYOUT_OPTIONS } from "../../lib/onboarding.shared.js";
import { openThemeEditorUrl } from "./theme-editor-guide.jsx";

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: 999,
        background: "#d1fae5",
        color: "#047857",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function Metric({ value, label }) {
  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #e1e3e5",
        borderRadius: 10,
        padding: "16px 18px",
        background: "#fff",
      }}
    >
      <p style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: SHOPIFY_GREEN }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#6d7175" }}>{label}</p>
    </div>
  );
}

function NextStepRow({ label, actionLabel, onAction, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid #e1e3e5",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: "1.5px solid #c9cccf",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#202223" }}>{label}</span>
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            padding: 0,
            color: SHOPIFY_GREEN,
            fontWeight: 700,
            fontSize: 13,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

function BrandingSummary({ storeName, layoutPreset, accentColor, brandLogoUrl }) {
  const layoutLabel =
    ONBOARDING_LAYOUT_OPTIONS.find((o) => o.id === layoutPreset)?.label || "Modern";

  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 24,
        textAlign: "left",
        background: "#fafbfb",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          fontWeight: 700,
          color: "#6d7175",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Your branding
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {brandLogoUrl ? (
          <img
            src={brandLogoUrl}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              objectFit: "contain",
              background: "#fff",
              border: "1px solid #e1e3e5",
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: accentColor || SHOPIFY_GREEN,
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#202223" }}>
            {storeName || "Your store"}
          </p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
            {layoutLabel} layout ·{" "}
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: accentColor || SHOPIFY_GREEN,
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            Accent color applied to widgets & review form
          </p>
        </div>
      </div>
    </div>
  );
}

export function StepComplete({
  storeName,
  layoutPreset,
  accentColor,
  brandLogoUrl,
  onsiteWidgetEnabled,
  photoReviews,
  videoReviews,
  trialActive,
  hasImport,
  themeEditorUrl,
  onStartImport,
  onGoToDashboard,
  goingToDashboard,
}) {
  const shopify = useAppBridge();

  const handleOpenThemeEditor = () => {
    if (!themeEditorUrl) {
      shopify?.toast?.show?.("Could not open the theme editor. Go to Widgets → Product Reviews.", {
        isError: true,
      });
      return;
    }
    openThemeEditorUrl(themeEditorUrl, shopify);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#d1fae5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <Check size={28} color={SHOPIFY_GREEN} strokeWidth={3} />
      </div>

      <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#202223" }}>
        Setup complete
      </h1>
      <p
        style={{
          margin: "0 auto 20px",
          maxWidth: 520,
          fontSize: 14,
          fontWeight: 500,
          color: "#6d7175",
          lineHeight: 1.5,
        }}
      >
        Your review widget style, collection settings, and preferences are saved. Complete the
        steps below to start showing reviews on your storefront.
      </p>

      <BrandingSummary
        storeName={storeName}
        layoutPreset={layoutPreset}
        accentColor={accentColor}
        brandLogoUrl={brandLogoUrl}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          marginBottom: 28,
        }}
      >
        <Pill>Widget style saved</Pill>
        {onsiteWidgetEnabled ? <Pill>Storefront collection on</Pill> : null}
        {photoReviews ? <Pill>Photo reviews on</Pill> : null}
        {videoReviews ? <Pill>Video reviews on</Pill> : null}
        {trialActive ? <Pill>Pro trial active</Pill> : null}
      </div>

      <div
        style={{
          border: "1px solid #e1e3e5",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#6d7175",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Your dashboard, ready to track progress
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <Metric value="0" label="Reviews collected" />
          <Metric value="—" label="Avg rating" />
          <Metric value="0" label="Requests sent" />
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#8c9196" }}>
          Numbers will populate as orders come in and reviews are collected.
        </p>
      </div>

      <div style={{ textAlign: "left", marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#202223" }}>
          Recommended next steps
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <NextStepRow
            label="Add the Product Reviews block to your theme"
            actionLabel="Open theme editor"
            onAction={handleOpenThemeEditor}
          />
          {hasImport ? (
            <NextStepRow
              label="Import your reviews from the source you selected"
              actionLabel="Start import"
              onAction={onStartImport}
            />
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToDashboard}
        disabled={goingToDashboard}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: 10,
          border: "none",
          background: SHOPIFY_GREEN,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: goingToDashboard ? "not-allowed" : "pointer",
          opacity: goingToDashboard ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {goingToDashboard ? "Opening dashboard…" : "Go to Dashboard"}
      </button>
    </div>
  );
}
