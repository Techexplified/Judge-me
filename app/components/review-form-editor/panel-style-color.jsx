/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { ArrowLeft, Check, Pipette, Plus, SlidersHorizontal } from "lucide-react";
import {
  CORNER_PRESET_OPTIONS,
  QUICK_THEME_PALETTES,
  TYPOGRAPHY_OPTIONS,
  radiusFromPreset,
} from "../../lib/review-form-config.shared.js";
import { ColorRow, FieldLabel } from "../review-form/customizer-ui.jsx";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

function SectionHeader({ dotColor, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 22,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: EDITOR_TOKENS.text,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ThemeColorRow({ label, value, onColor, onHex }) {
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0A5C36";

  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          border: `1px solid ${EDITOR_TOKENS.border}`,
          borderRadius: 10,
          background: EDITOR_TOKENS.white,
        }}
      >
        <label
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            overflow: "hidden",
            flexShrink: 0,
            cursor: "pointer",
            border: `1px solid ${EDITOR_TOKENS.border}`,
            display: "block",
          }}
        >
          <input
            type="color"
            value={safeColor}
            onChange={(e) => onColor(e.target.value)}
            style={{
              width: 40,
              height: 40,
              margin: -4,
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          />
        </label>
        <input
          type="text"
          defaultValue={value}
          key={value}
          onBlur={(e) => onHex(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 13,
            fontFamily: UI_FONT,
            fontWeight: 500,
            color: EDITOR_TOKENS.text,
            background: "transparent",
            minWidth: 0,
          }}
        />
        <Pipette size={16} color={EDITOR_TOKENS.textMuted} style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

function CornerPreview({ id, selected }) {
  const common = {
    width: 26,
    height: 26,
    border: `2px solid ${selected ? EDITOR_TOKENS.themeGreen : "#94A3B8"}`,
    background: selected ? "#D1FAE5" : "#F8FAFC",
    boxSizing: "border-box",
  };
  const radiusById = {
    sharp: 0,
    slight: 5,
    default: 8,
    rounded: 999,
    pill: 999,
    custom: 6,
  };

  if (id === "custom") {
    return (
      <span
        style={{
          ...common,
          borderRadius: 6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: selected ? EDITOR_TOKENS.themeGreen : EDITOR_TOKENS.textMuted,
        }}
      >
        <SlidersHorizontal size={14} />
      </span>
    );
  }

  return <span style={{ ...common, borderRadius: radiusById[id] ?? 8 }} />;
}

export function PanelStyleColor({ config, updateConfig, patchConfig, onBack }) {
  const applyThemeColor = (hex) => {
    patchConfig({ primaryColor: hex, buttonColor: hex, accentColor: hex });
  };

  const themeMatches = (hex) =>
    config.primaryColor?.toLowerCase() === hex.toLowerCase();

  return (
    <div style={{ padding: "16px", minWidth: 0, fontFamily: UI_FONT }}>
      <button type="button" onClick={onBack} style={backBtnStyle}>
        <ArrowLeft size={16} />
        Style & Color
      </button>

      <FieldLabel>Quick palettes</FieldLabel>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {QUICK_THEME_PALETTES.map((hex) => {
          const selected = themeMatches(hex);
          return (
            <button
              key={hex}
              type="button"
              title={hex}
              onClick={() => applyThemeColor(hex)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: selected
                  ? `2px solid ${EDITOR_TOKENS.selectedBorder}`
                  : `1px solid ${EDITOR_TOKENS.border}`,
                background: hex,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: selected ? "0 0 0 2px #ecfdf5" : "none",
              }}
            >
              {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
            </button>
          );
        })}
        <button
          type="button"
          title="Use custom color"
          onClick={() => {
            document.getElementById("style-color-theme-picker")?.click();
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: `1px dashed ${EDITOR_TOKENS.border}`,
            background: EDITOR_TOKENS.white,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={14} color={EDITOR_TOKENS.textMuted} />
        </button>
        <input
          id="style-color-theme-picker"
          type="color"
          value={config.primaryColor}
          onChange={(e) => applyThemeColor(e.target.value)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          tabIndex={-1}
        />
      </div>

      <ThemeColorRow
        label="Theme color"
        value={config.primaryColor}
        onColor={applyThemeColor}
        onHex={applyThemeColor}
      />
      <ColorRow
        label="Card background"
        value={config.cardBackgroundColor}
        onColor={(v) => updateConfig("cardBackgroundColor", v)}
        onHex={(v) => updateConfig("cardBackgroundColor", v)}
      />

      <SectionHeader dotColor="#3B82F6" label="Corner style" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        {CORNER_PRESET_OPTIONS.map((opt) => {
          const selected = config.radiusPreset === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === "custom") {
                  patchConfig({ radiusPreset: "custom", borderRadius: config.borderRadius || 12 });
                } else {
                  patchConfig({ radiusPreset: opt.id, borderRadius: radiusFromPreset(opt.id) });
                }
              }}
              style={{
                minHeight: 78,
                padding: "12px 10px",
                borderRadius: 12,
                border: `2px solid ${selected ? EDITOR_TOKENS.selectedBorder : EDITOR_TOKENS.border}`,
                background: selected ? "#ECFDF5" : EDITOR_TOKENS.white,
                cursor: "pointer",
                fontFamily: UI_FONT,
                color: EDITOR_TOKENS.text,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <CornerPreview id={opt.id} selected={selected} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>{opt.label}</span>
              <span style={{ fontSize: 10, color: EDITOR_TOKENS.textMuted }}>
                {opt.id === "custom" ? "Enter value" : `${opt.px}px radius`}
              </span>
            </button>
          );
        })}
      </div>
      {config.radiusPreset === "custom" ? (
        <>
          <FieldLabel>Custom radius (px)</FieldLabel>
          <input
            type="number"
            min={0}
            max={999}
            value={config.borderRadius}
            onChange={(e) => updateConfig("borderRadius", Number(e.target.value) || 0)}
            style={inputStyle}
          />
        </>
      ) : null}

        <SectionHeader dotColor="#F97316" label="Typography" />
        <FieldLabel>Font family</FieldLabel>
        <select
          value={config.typography}
          onChange={(e) => updateConfig("typography", e.target.value)}
          style={{ ...inputStyle, marginBottom: 16 }}
        >
          {TYPOGRAPHY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value}
            </option>
          ))}
        </select>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: EDITOR_TOKENS.tipBg,
            border: `1px solid ${EDITOR_TOKENS.tipBorder}`,
            fontSize: 12,
            lineHeight: 1.5,
            color: EDITOR_TOKENS.tipText,
          }}
        >
          Corner & color changes apply across the product card and review flow controls instantly. Preview each page with the stepper.
        </div>
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

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  fontSize: 13,
  fontFamily: UI_FONT,
  marginBottom: 14,
  boxSizing: "border-box",
};
