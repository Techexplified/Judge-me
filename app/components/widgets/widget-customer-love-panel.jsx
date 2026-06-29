/* eslint-disable react/prop-types */
import { QUICK_THEME_PALETTES } from "../../lib/review-form-config.shared.js";
import { ToggleSwitch } from "../import-wizard-ui";
import {
  WidgetCustomizeSection,
  WidgetCustomizeField,
  inputStyle,
  rangeRowStyle,
} from "./widget-customize-shell.jsx";
import { WidgetCustomerLovePreview } from "./widget-customer-love-preview.jsx";

export function WidgetCustomerLovePanel({ config, updateConfig }) {
  return (
    <>
      <WidgetCustomizeSection title="Content">
        <WidgetCustomizeField label="Page heading">
          <input
            type="text"
            value={config.heading}
            onChange={(e) => updateConfig("heading", e.target.value)}
            style={inputStyle}
            maxLength={120}
          />
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Reviews shown (${config.limit})`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={4}
              max={24}
              step={4}
              value={config.limit}
              onChange={(e) => updateConfig("limit", Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24 }}>{config.limit}</span>
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Verified badge text">
          <input
            type="text"
            value={config.verifiedBadgeText}
            onChange={(e) => updateConfig("verifiedBadgeText", e.target.value)}
            style={inputStyle}
            maxLength={40}
          />
        </WidgetCustomizeField>
      </WidgetCustomizeSection>

      <WidgetCustomizeSection title="Display">
        <WidgetCustomizeField label="Rating distribution bars">
          <ToggleSwitch
            label="Rating distribution bars"
            checked={config.showDistribution}
            onChange={(v) => updateConfig("showDistribution", v)}
          />
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Filter pills (All / Photos / Videos)">
          <ToggleSwitch
            label="Filter pills"
            checked={config.showFilterPills}
            onChange={(v) => updateConfig("showFilterPills", v)}
          />
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Photo collage in header">
          <ToggleSwitch
            label="Photo collage in header"
            checked={config.showPhotoCollage}
            onChange={(v) => updateConfig("showPhotoCollage", v)}
          />
        </WidgetCustomizeField>
      </WidgetCustomizeSection>

      <WidgetCustomizeSection title="Colors">
        <WidgetCustomizeField label="Primary accent">
          <ColorPicker value={config.primaryColor} onChange={(c) => updateConfig("primaryColor", c)} />
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Star color">
          <ColorPicker value={config.starColor} onChange={(c) => updateConfig("starColor", c)} />
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Bar track color">
          <ColorPicker value={config.barTrackColor} onChange={(c) => updateConfig("barTrackColor", c)} />
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Bar fill color">
          <ColorPicker value={config.barFillColor} onChange={(c) => updateConfig("barFillColor", c)} />
        </WidgetCustomizeField>
      </WidgetCustomizeSection>

      <WidgetCustomizeSection title="Layout">
        <WidgetCustomizeField label={`Card min width (${config.cardMinWidth}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={200}
              max={400}
              step={20}
              value={config.cardMinWidth}
              onChange={(e) => updateConfig("cardMinWidth", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
      </WidgetCustomizeSection>
    </>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {QUICK_THEME_PALETTES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: value === c ? "2px solid #202223" : "1px solid #c9cccf",
            background: c,
            cursor: "pointer",
          }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
      />
    </div>
  );
}

export { WidgetCustomerLovePreview };
