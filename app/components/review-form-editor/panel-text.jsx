/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { FORM_TEXT_TOKENS } from "../../lib/review-form-config.shared.js";
import { CollapsibleSection, FieldLabel } from "../review-form/customizer-ui.jsx";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

function TextField({ label, value, onChange, maxLength = 120, hint }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: EDITOR_TOKENS.textMuted }}>{hint}</span>
        <span style={{ fontSize: 11, color: EDITOR_TOKENS.textMuted }}>
          {String(value || "").length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

function TokenChips({ onInsert }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
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

export function PanelText({
  config,
  updateConfig,
  onBack,
  onAutofill,
  autofillLoading,
  autofillError,
}) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const insertToken = (token) => {
    const current = config.ratingPageTitle || "";
    updateConfig("ratingPageTitle", `${current}${token}`.slice(0, 80));
  };

  return (
    <div style={{ padding: "16px", fontFamily: UI_FONT }}>
      <button type="button" onClick={onBack} style={backBtnStyle}>
        <ArrowLeft size={16} />
        Text
      </button>

      <FieldLabel>Rating page title</FieldLabel>
      <TokenChips onInsert={insertToken} />
      <TextField
        label=""
        value={config.ratingPageTitle}
        onChange={(v) => updateConfig("ratingPageTitle", v)}
        maxLength={80}
        hint="Supports {{item}}, {{store}}, {{order}}"
      />

      <TextField
        label="Order details line"
        value={config.orderMetaLine}
        onChange={(v) => updateConfig("orderMetaLine", v)}
        maxLength={80}
        hint="Supports {{order}}, {{date}}, {{item}} · preview uses sample order data"
      />

      <TextField
        label="Verified purchase badge"
        value={config.verifiedPurchaseLabel}
        onChange={(v) => updateConfig("verifiedPurchaseLabel", v)}
        maxLength={40}
      />

      <TextField
        label="Fallback title"
        value={config.ratingPageTitleFallback}
        onChange={(v) => updateConfig("ratingPageTitleFallback", v)}
        maxLength={80}
        hint="Used when no product information is available"
      />

      <TextField
        label="5-star rating text"
        value={config.starLabelHigh}
        onChange={(v) => updateConfig("starLabelHigh", v)}
        maxLength={40}
      />
      <TextField
        label="1-star rating text"
        value={config.starLabelLow}
        onChange={(v) => updateConfig("starLabelLow", v)}
        maxLength={40}
      />

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
            <TextField label="Page title" value={config.videoPageTitle} onChange={(v) => updateConfig("videoPageTitle", v)} />
            <TextField label="Upload title" value={config.videoUploadTitle} onChange={(v) => updateConfig("videoUploadTitle", v)} />
            <TextField label="Upload hint" value={config.videoUploadHint} onChange={(v) => updateConfig("videoUploadHint", v)} />
            <TextField label="Skip label" value={config.videoSkipLabel} onChange={(v) => updateConfig("videoSkipLabel", v)} maxLength={40} />
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
            <TextField label="Page title" value={config.photoPageTitle} onChange={(v) => updateConfig("photoPageTitle", v)} />
            <TextField label="Upload title" value={config.photoUploadTitle} onChange={(v) => updateConfig("photoUploadTitle", v)} />
            <TextField label="Upload hint" value={config.photoUploadHint} onChange={(v) => updateConfig("photoUploadHint", v)} />
          </div>
        ) : null}
      </div>

      <CollapsibleSection title="Form copy" iconType="typography" defaultOpen={false}>
        <TextField label="Form title" value={config.formTitle} onChange={(v) => updateConfig("formTitle", v)} />
        <TextField label="Form subtitle" value={config.formSubtitle} onChange={(v) => updateConfig("formSubtitle", v)} maxLength={160} />
        <TextField label="Name field label" value={config.nameFieldLabel} onChange={(v) => updateConfig("nameFieldLabel", v)} maxLength={40} />
        <TextField label="Review field label" value={config.reviewFieldLabel} onChange={(v) => updateConfig("reviewFieldLabel", v)} maxLength={40} />
        <TextField label="Review placeholder" value={config.reviewFieldPlaceholder} onChange={(v) => updateConfig("reviewFieldPlaceholder", v)} maxLength={160} />
        <TextField label="Submit button" value={config.submitButtonText} onChange={(v) => updateConfig("submitButtonText", v)} maxLength={40} />
        <TextField label="Privacy footer" value={config.privacyFooterText} onChange={(v) => updateConfig("privacyFooterText", v)} maxLength={120} />
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
