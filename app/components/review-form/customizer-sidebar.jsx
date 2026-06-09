/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useRef, useState } from "react";
import {
  TYPOGRAPHY_OPTIONS,
  applyLayoutPreset,
  radiusFromPreset,
} from "../../lib/review-form-config.shared.js";
import { TOKENS, UI_FONT } from "./customizer-styles.js";
import {
  CollapsibleSection,
  ColorPairRow,
  ToggleRow,
  GeomSlider,
  PresetCard,
  SegmentControl,
  SegmentField,
  ResetButton,
  LogoDropzone,
  LayoutPresetsHeader,
  FieldLabel,
  StarStyleIcon,
} from "./customizer-ui.jsx";

const LAYOUT_PRESETS = [
  { id: "minimal", label: "Minimal" },
  { id: "modern", label: "Modern" },
  { id: "luxury", label: "Luxury" },
  { id: "shopifyNative", label: "Shopify Native" },
];

const SHADOW_LABELS = { low: "None", medium: "Soft", high: "Strong" };
const RADIUS_LABELS = { sharp: "Sharp", medium: "Medium", pill: "Pill" };

export function CustomizerSidebar({
  config,
  getConfig,
  updateConfig,
  patchConfig: patchConfigProp,
  replaceConfig,
  onReset,
}) {
  const patchConfig =
    patchConfigProp ||
    ((partial) => {
      Object.entries(partial).forEach(([k, v]) => updateConfig(k, v));
    });
  const logoInputRef = useRef(null);

  const [logoError, setLogoError] = useState("");

  const applyPreset = (presetId) => {
    const current = getConfig ? getConfig() : config;
    replaceConfig(applyLayoutPreset(presetId, current));
  };

  const onLogoFile = (file) => {
    setLogoError("");
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be 2MB or less.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      setLogoError("Use PNG, JPG, SVG, or WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateConfig("brandLogoUrl", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const radiusPx = config.borderRadius;

  return (
    <div style={{ padding: "20px 18px", fontFamily: UI_FONT }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: TOKENS.text,
            letterSpacing: "-0.02em",
          }}
        >
          Customize
        </h2>
        <ResetButton onClick={onReset} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <LayoutPresetsHeader />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {LAYOUT_PRESETS.map((item) => (
            <PresetCard
              key={item.id}
              presetId={item.id}
              label={item.label}
              selected={config.layoutPreset === item.id}
              onClick={() => applyPreset(item.id)}
            />
          ))}
        </div>
      </div>

      <CollapsibleSection title="Brand identity" iconType="brand" defaultOpen>
        <FieldLabel>Brand logo</FieldLabel>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            onLogoFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <LogoDropzone
          logoUrl={config.brandLogoUrl}
          onClick={() => logoInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            onLogoFile(e.dataTransfer.files?.[0]);
          }}
        />
        {logoError ? (
          <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>{logoError}</p>
        ) : null}
        {config.brandLogoUrl ? (
          <button
            type="button"
            onClick={() => updateConfig("brandLogoUrl", null)}
            style={{
              marginTop: -8,
              marginBottom: 14,
              fontSize: 11,
              color: "#dc2626",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: UI_FONT,
            }}
          >
            Remove logo
          </button>
        ) : null}

      </CollapsibleSection>

      <CollapsibleSection title="Stars & ratings" iconType="stars" defaultOpen>
        <FieldLabel>Star style</FieldLabel>
        <SegmentControl
          showIcons
          options={[
            { value: "filled", label: "Filled", icon: <StarStyleIcon type="filled" /> },
            { value: "outline", label: "Outline", icon: <StarStyleIcon type="outline" /> },
            { value: "emoji", label: "Emoji", icon: <StarStyleIcon type="emoji" /> },
          ]}
          value={config.starStyle}
          onChange={(v) => updateConfig("starStyle", v)}
        />
        <ColorPairRow
          left={{
            label: "Active star",
            value: config.starColor,
            onColor: (v) => updateConfig("starColor", v),
            onHex: (v) => updateConfig("starColor", v),
          }}
          right={{
            label: "Inactive",
            value: config.inactiveStarColor,
            onColor: (v) => updateConfig("inactiveStarColor", v),
            onHex: (v) => updateConfig("inactiveStarColor", v),
          }}
        />
        <GeomSlider
          label="Star size"
          min={14}
          max={40}
          value={config.starSize}
          display={`${config.starSize}px`}
          onChange={(v) => updateConfig("starSize", v)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Typography" iconType="typography" defaultOpen={false}>
        <FieldLabel>Font family</FieldLabel>
        <select
          value={config.typography}
          onChange={(e) => updateConfig("typography", e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${TOKENS.border}`,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 14,
            fontFamily: UI_FONT,
            color: TOKENS.text,
            background: TOKENS.white,
          }}
        >
          {TYPOGRAPHY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value}
            </option>
          ))}
        </select>
        <GeomSlider
          label="Base font size"
          min={12}
          max={20}
          value={config.fontSize}
          display={`${config.fontSize}px`}
          onChange={(v) => updateConfig("fontSize", v)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Review cards" iconType="cards" defaultOpen>
        <SegmentField
          label="Corner radius"
          valueLabel={`${radiusPx}px`}
          options={[
            { value: "sharp", label: "Sharp" },
            { value: "medium", label: "Medium" },
            { value: "pill", label: "Pill" },
          ]}
          value={config.radiusPreset}
          onChange={(v) => patchConfig({ radiusPreset: v, borderRadius: radiusFromPreset(v) })}
        />
        <SegmentField
          label="Card shadow"
          valueLabel={SHADOW_LABELS[config.shadowLevel] || "Soft"}
          options={[
            { value: "low", label: "None" },
            { value: "medium", label: "Soft" },
            { value: "high", label: "Strong" },
          ]}
          value={config.shadowLevel}
          onChange={(v) => updateConfig("shadowLevel", v)}
        />
        <GeomSlider
          label="Spacing"
          min={8}
          max={32}
          value={config.spacing}
          display={`${config.spacing}px`}
          onChange={(v) => updateConfig("spacing", v)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Photo & video reviews" iconType="media" defaultOpen={false}>
        <ToggleRow
          label="Allow photo uploads"
          active={config.showPhotos !== false}
          onToggle={() => updateConfig("showPhotos", !config.showPhotos)}
        />
        <ToggleRow
          label="Allow video uploads"
          active={config.showVideos !== false}
          onToggle={() => updateConfig("showVideos", !config.showVideos)}
        />
        <ToggleRow
          label="Show star ratings"
          active={config.showRatings !== false}
          onToggle={() => updateConfig("showRatings", !config.showRatings)}
        />
        <ToggleRow
          label="Show written reviews"
          active={config.showWrittenReviews !== false}
          onToggle={() => updateConfig("showWrittenReviews", !config.showWrittenReviews)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Trust badges" iconType="trust" defaultOpen={false}>
        <ToggleRow
          label="Show trust footer"
          active={config.trustBadgeEnabled !== false}
          onToggle={() => updateConfig("trustBadgeEnabled", !config.trustBadgeEnabled)}
        />
        {config.trustBadgeEnabled !== false ? (
          <>
            <FieldLabel>Footer text</FieldLabel>
            <input
              type="text"
              value={config.trustBadgeText}
              onChange={(e) => updateConfig("trustBadgeText", e.target.value)}
              placeholder="Protected by SSL..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${TOKENS.border}`,
                fontSize: 12,
                fontFamily: UI_FONT,
                color: TOKENS.text,
                boxSizing: "border-box",
              }}
            />
          </>
        ) : null}
      </CollapsibleSection>
    </div>
  );
}
