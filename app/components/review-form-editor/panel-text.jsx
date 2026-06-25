/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import {
  FONT_WEIGHT_OPTIONS,
  FORM_TEXT_TOKENS,
  TYPOGRAPHY_OPTIONS,
} from "../../lib/review-form-config.shared.js";
import { CollapsibleSection, ColorRow, FieldLabel } from "../review-form/customizer-ui.jsx";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

const RATING_TEXT_SECTIONS = [
  {
    id: "ratingPageTitle",
    label: "Rating page title",
    maxLength: 80,
    hint: "Supports {{item}}, {{store}}, {{order}}",
    tokens: true,
  },
  {
    id: "orderMetaLine",
    label: "Order details line",
    maxLength: 80,
    hint: "Supports {{order}}, {{date}}, {{item}}. Preview uses sample order data",
  },
  {
    id: "verifiedPurchaseLabel",
    label: "Verified purchase badge",
    maxLength: 40,
  },
  {
    id: "starLabelHigh",
    label: "5-star rating text",
    maxLength: 40,
  },
  {
    id: "starLabelLow",
    label: "1-star rating text",
    maxLength: 40,
  },
];

const STYLE_SUFFIXES = ["Color", "FontSize", "Typography", "FontWeight"];

function TokenChips({ onInsert }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
      {FORM_TEXT_TOKENS.map((token) => (
        <button
          key={token}
          type="button"
          onClick={() => onInsert(token)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${EDITOR_TOKENS.border}`,
            background: EDITOR_TOKENS.white,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: UI_FONT,
          }}
        >
          {token}
        </button>
      ))}
    </div>
  );
}

function TextSectionEditor({ section, config, updateConfig, patchConfig }) {
  const { id, label, maxLength = 120, hint, tokens } = section;
  const textValue = config[id] ?? "";

  const colorKey = `${id}Color`;
  const fontSizeKey = `${id}FontSize`;
  const typographyKey = `${id}Typography`;
  const fontWeightKey = `${id}FontWeight`;

  const resetStyles = () => {
    const patch = {};
    for (const suffix of STYLE_SUFFIXES) {
      patch[`${id}${suffix}`] = null;
    }
    patchConfig(patch);
  };

  return (
    <div
      style={{
        marginBottom: 18,
        paddingBottom: 18,
        borderBottom: `1px solid ${EDITOR_TOKENS.borderLight}`,
      }}
    >
      <FieldLabel>{label}</FieldLabel>
      {tokens ? (
        <TokenChips
          onInsert={(token) => updateConfig(id, `${textValue}${token}`.slice(0, maxLength))}
        />
      ) : null}

      <input
        type="text"
        value={textValue}
        maxLength={maxLength}
        onChange={(e) => updateConfig(id, e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: `1px solid ${EDITOR_TOKENS.border}`,
          fontSize: 13,
          fontFamily: UI_FONT,
          boxSizing: "border-box",
          marginBottom: 10,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: EDITOR_TOKENS.textMuted, textTransform: "uppercase" }}>
          Font & color
        </span>
        <button
          type="button"
          onClick={resetStyles}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            background: "transparent",
            color: EDITOR_TOKENS.textMuted,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: UI_FONT,
            padding: 0,
          }}
        >
          <RotateCcw size={12} />
          Reset styles
        </button>
      </div>

      <ColorRow
        label="Text color"
        compact
        value={config[colorKey] || config.textColor || "#202223"}
        onColor={(v) => updateConfig(colorKey, v)}
        onHex={(v) => updateConfig(colorKey, v.startsWith("#") ? v : `#${v}`)}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <div>
          <FieldLabel>Font size</FieldLabel>
          <input
            type="number"
            min={10}
            max={32}
            placeholder="Default"
            value={config[fontSizeKey] ?? ""}
            onChange={(e) => {
              const raw = e.target.value.trim();
              updateConfig(fontSizeKey, raw === "" ? null : Number(raw));
            }}
            style={miniInputStyle}
          />
        </div>
        <div>
          <FieldLabel>Weight</FieldLabel>
          <select
            value={config[fontWeightKey] ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              updateConfig(fontWeightKey, raw === "" ? null : Number(raw));
            }}
            style={miniInputStyle}
          >
            <option value="">Default</option>
            {FONT_WEIGHT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <FieldLabel>Font family</FieldLabel>
        <select
          value={config[typographyKey] ?? ""}
          onChange={(e) => updateConfig(typographyKey, e.target.value || null)}
          style={{ ...miniInputStyle, width: "100%" }}
        >
          <option value="">Use global font ({config.typography || "Inter (System)"})</option>
          {TYPOGRAPHY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {hint ? (
          <span style={{ fontSize: 11, color: EDITOR_TOKENS.textMuted, lineHeight: 1.4 }}>{hint}</span>
        ) : (
          <span />
        )}
        <span style={{ fontSize: 11, color: EDITOR_TOKENS.textMuted, flexShrink: 0, marginLeft: 8 }}>
          {String(textValue).length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

function SimpleTextField({ label, value, onChange, maxLength = 120 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: `1px solid ${EDITOR_TOKENS.border}`,
          fontSize: 13,
          fontFamily: UI_FONT,
          boxSizing: "border-box",
        }}
      />
      <div style={{ textAlign: "right", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: EDITOR_TOKENS.textMuted }}>
          {String(value || "").length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

export function PanelText({
  config,
  updateConfig,
  patchConfig,
  onBack,
  onAutofill,
  autofillLoading,
  autofillError,
}) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  return (
    <div style={{ padding: "16px", fontFamily: UI_FONT }}>
      <button type="button" onClick={onBack} style={backBtnStyle}>
        <ArrowLeft size={16} />
        Text
      </button>

      <p style={{ margin: "0 0 16px", fontSize: 12, color: EDITOR_TOKENS.textMuted, lineHeight: 1.5 }}>
        Edit copy and styling for each rating-step field. Changes preview instantly and apply on your storefront after you save.
      </p>

      {RATING_TEXT_SECTIONS.map((section) => (
        <TextSectionEditor
          key={section.id}
          section={section}
          config={config}
          updateConfig={updateConfig}
          patchConfig={patchConfig}
        />
      ))}

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          border: `2px solid ${EDITOR_TOKENS.themeGreen}`,
          background: "#F0FDF4",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color={EDITOR_TOKENS.themeGreen} />
            <span style={{ fontSize: 13, fontWeight: 700, color: EDITOR_TOKENS.text }}>
              AI Autofill: Generate copy for all fields
            </span>
          </div>
          <button
            type="button"
            onClick={onAutofill}
            disabled={autofillLoading}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${EDITOR_TOKENS.themeGreen}`,
              background: EDITOR_TOKENS.white,
              color: EDITOR_TOKENS.themeGreen,
              fontWeight: 700,
              fontSize: 12,
              cursor: autofillLoading ? "wait" : "pointer",
              fontFamily: UI_FONT,
            }}
          >
            {autofillLoading ? "Generating…" : "Try it"}
          </button>
        </div>
        {autofillError ? (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#DC2626" }}>{autofillError}</p>
        ) : null}
      </div>

      <div style={{ borderTop: `1px solid ${EDITOR_TOKENS.borderLight}`, paddingTop: 8 }}>
        <button
          type="button"
          onClick={() => setVideoOpen((o) => !o)}
          style={accordionHeaderStyle}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>Video Based Review</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: EDITOR_TOKENS.textMuted, fontSize: 12 }}>
            4 fields
            {videoOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {videoOpen ? (
          <div style={{ paddingBottom: 12 }}>
            <SimpleTextField label="Page title" value={config.videoPageTitle} onChange={(v) => updateConfig("videoPageTitle", v)} />
            <SimpleTextField label="Upload title" value={config.videoUploadTitle} onChange={(v) => updateConfig("videoUploadTitle", v)} />
            <SimpleTextField label="Upload hint" value={config.videoUploadHint} onChange={(v) => updateConfig("videoUploadHint", v)} />
            <SimpleTextField label="Skip label" value={config.videoSkipLabel} onChange={(v) => updateConfig("videoSkipLabel", v)} maxLength={40} />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setPhotoOpen((o) => !o)}
          style={accordionHeaderStyle}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>Image Based Review</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: EDITOR_TOKENS.textMuted, fontSize: 12 }}>
            3 fields
            {photoOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {photoOpen ? (
          <div style={{ paddingBottom: 12 }}>
            <SimpleTextField label="Page title" value={config.photoPageTitle} onChange={(v) => updateConfig("photoPageTitle", v)} />
            <SimpleTextField label="Upload title" value={config.photoUploadTitle} onChange={(v) => updateConfig("photoUploadTitle", v)} />
            <SimpleTextField label="Upload hint" value={config.photoUploadHint} onChange={(v) => updateConfig("photoUploadHint", v)} />
          </div>
        ) : null}
      </div>

      <CollapsibleSection title="Form copy" iconType="typography" defaultOpen={false}>
        <SimpleTextField label="Form title" value={config.formTitle} onChange={(v) => updateConfig("formTitle", v)} />
        <SimpleTextField label="Form subtitle" value={config.formSubtitle} onChange={(v) => updateConfig("formSubtitle", v)} maxLength={160} />
        <SimpleTextField label="Name field label" value={config.nameFieldLabel} onChange={(v) => updateConfig("nameFieldLabel", v)} maxLength={40} />
        <SimpleTextField label="Review field label" value={config.reviewFieldLabel} onChange={(v) => updateConfig("reviewFieldLabel", v)} maxLength={40} />
        <SimpleTextField label="Review placeholder" value={config.reviewFieldPlaceholder} onChange={(v) => updateConfig("reviewFieldPlaceholder", v)} maxLength={160} />
        <SimpleTextField label="Submit button" value={config.submitButtonText} onChange={(v) => updateConfig("submitButtonText", v)} maxLength={40} />
        <SimpleTextField label="Privacy footer" value={config.privacyFooterText} onChange={(v) => updateConfig("privacyFooterText", v)} maxLength={120} />
      </CollapsibleSection>
    </div>
  );
}

const miniInputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  fontSize: 12,
  fontFamily: UI_FONT,
  boxSizing: "border-box",
  background: EDITOR_TOKENS.white,
};

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

const accordionHeaderStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "none",
  background: "transparent",
  padding: "12px 0",
  cursor: "pointer",
  fontFamily: UI_FONT,
};
