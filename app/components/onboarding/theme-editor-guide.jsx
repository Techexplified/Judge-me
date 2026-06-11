/* eslint-disable react/prop-types */
import { ExternalLink, LayoutTemplate, Monitor } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../admin-ui";

const GREEN = "#008060";

export function StorefrontSetupBadge() {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 800,
        color: GREEN,
        background: "#ecfdf3",
        padding: "5px 10px",
        borderRadius: 999,
        marginBottom: 12,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      Storefront setup
    </span>
  );
}

export function ThemeStatusCard({ themeName }) {
  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: 10,
        padding: "14px 16px",
        background: "#fafbfb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#ecfdf3",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Monitor size={18} color={GREEN} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#202223" }}>
            {themeName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6d7175", fontWeight: 600 }}>
            Your live Shopify theme
          </p>
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: GREEN,
          background: "#ecfdf3",
          padding: "4px 8px",
          borderRadius: 6,
          flexShrink: 0,
          letterSpacing: "0.04em",
        }}
      >
        Active
      </span>
    </div>
  );
}

export function ThemeEditorSteps() {
  const steps = [
    "Click Open theme editor below — Shopify opens in a new tab.",
    "On the product page template, click Add block, then choose Apps.",
    "Select Product Reviews, turn on Enable reviews, and click Save.",
  ];

  return (
    <ol
      style={{
        margin: "0 0 16px",
        paddingLeft: 20,
        fontSize: 13,
        fontWeight: 600,
        color: "#44474a",
        lineHeight: 1.55,
      }}
    >
      {steps.map((text) => (
        <li key={text} style={{ marginBottom: 8 }}>
          {text}
        </li>
      ))}
    </ol>
  );
}

export function ThemeEditorPreviewHint() {
  return (
    <div
      style={{
        border: "1px dashed #c9cccf",
        borderRadius: 10,
        padding: "20px 16px",
        background: "#f6f6f7",
        textAlign: "center",
        marginBottom: 16,
      }}
    >
      <LayoutTemplate size={28} color={GREEN} style={{ marginBottom: 8 }} />
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6d7175" }}>
        Product Reviews block on your storefront
      </p>
    </div>
  );
}

export function OpenThemeEditorButton({ onClick, label = "Open theme editor" }) {
  return (
    <div style={{ width: "100%" }}>
      <PrimaryButton onClick={onClick}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ExternalLink size={16} />
          {label}
        </span>
      </PrimaryButton>
    </div>
  );
}

export function openThemeEditorUrl(url, shopify) {
  try {
    // In embedded Shopify apps, use App Bridge's open() to escape the iframe sandbox.
    // Falls back to window.open for non-embedded contexts.
    if (shopify?.open) {
      shopify.open(url, "_blank");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    shopify?.toast?.show?.("Opening theme editor in a new tab…");
  } catch {
    shopify?.toast?.show?.("Could not open the theme editor. Try Online Store → Themes → Customize.", {
      isError: true,
    });
  }
}

export function ThemeStepActions({
  onBack,
  onContinue,
  onOpenEditor,
  backDisabled,
  continueDisabled,
  continueLabel = "Continue",
}) {
  return (
    <>
      <SecondaryButton onClick={onBack} disabled={backDisabled}>
        Back
      </SecondaryButton>
      <SecondaryButton onClick={onOpenEditor}>Open theme editor</SecondaryButton>
      <PrimaryButton onClick={onContinue} disabled={continueDisabled}>
        {continueLabel}
      </PrimaryButton>
    </>
  );
}
