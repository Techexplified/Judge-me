/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ColorRow,
  CollapsibleSection,
  FieldLabel,
  GeomSlider,
  LogoDropzone,
  SegmentControl,
  SegmentField,
  StarStyleIcon,
  ToggleRow,
} from "../review-form/customizer-ui.jsx";
import { deriveInactiveStarColor } from "../../lib/review-form-config.shared.js";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

const SHADOW_LABELS = { low: "None", medium: "Soft", high: "Strong" };

export function PanelPreferences({ config, updateConfig, patchConfig, onBack, onLogoUpload }) {
  const logoInputRef = useRef(null);
  const [logoError, setLogoError] = useState("");

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
    onLogoUpload(file);
  };

  return (
    <div style={{ padding: "16px", fontFamily: UI_FONT }}>
      <button type="button" onClick={onBack} style={backBtnStyle}>
        <ArrowLeft size={16} />
        Preferences
      </button>

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
        {logoError ? <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 10px" }}>{logoError}</p> : null}
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
        <ColorRow
          label="Star color"
          value={config.starColor}
          onColor={(v) =>
            patchConfig({ starColor: v, inactiveStarColor: deriveInactiveStarColor(v) })
          }
          onHex={(v) =>
            patchConfig({ starColor: v, inactiveStarColor: deriveInactiveStarColor(v) })
          }
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

      <CollapsibleSection title="Review cards" iconType="cards" defaultOpen={false}>
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

      <CollapsibleSection title="Photo & video reviews" iconType="media" defaultOpen>
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
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${EDITOR_TOKENS.border}`,
                fontSize: 12,
                fontFamily: UI_FONT,
                boxSizing: "border-box",
              }}
            />
          </>
        ) : null}
      </CollapsibleSection>
    </div>
  );
}

const backBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  background: "transparent",
  padding: "0 0 16px",
  cursor: "pointer",
  fontFamily: UI_FONT,
  fontSize: 15,
  fontWeight: 700,
  color: EDITOR_TOKENS.text,
};
