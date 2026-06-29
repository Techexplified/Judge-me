/* eslint-disable react/prop-types */
import { QUICK_THEME_PALETTES } from "../../lib/review-form-config.shared.js";
import { ToggleSwitch } from "../import-wizard-ui";
import {
  WidgetCustomizeSection,
  WidgetCustomizeField,
  inputStyle,
  rangeRowStyle,
} from "./widget-customize-shell.jsx";
import { WidgetVideoSliderPreview } from "./widget-video-slider-preview.jsx";

export function WidgetVideoSliderPanel({ config, updateConfig }) {
  return (
    <>
      <WidgetCustomizeSection title="Content">
        <WidgetCustomizeField label="Heading">
          <input
            type="text"
            value={config.heading}
            onChange={(e) => updateConfig("heading", e.target.value)}
            style={inputStyle}
            maxLength={120}
          />
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Maximum videos (${config.limit})`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={3}
              max={12}
              value={config.limit}
              onChange={(e) => updateConfig("limit", Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24 }}>{config.limit}</span>
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label="Show star ratings">
          <ToggleSwitch
            label="Show star ratings"
            checked={config.showStars}
            onChange={(v) => updateConfig("showStars", v)}
          />
        </WidgetCustomizeField>
      </WidgetCustomizeSection>

      <WidgetCustomizeSection title="Colors">
        <WidgetCustomizeField label="Star color">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {QUICK_THEME_PALETTES.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateConfig("starColor", c)}
                aria-label={`Star color ${c}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: config.starColor === c ? "2px solid #202223" : "1px solid #c9cccf",
                  background: c,
                  cursor: "pointer",
                }}
              />
            ))}
            <input
              type="color"
              value={config.starColor}
              onChange={(e) => updateConfig("starColor", e.target.value)}
              style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
            />
          </div>
        </WidgetCustomizeField>
      </WidgetCustomizeSection>

      <WidgetCustomizeSection title="Layout">
        <WidgetCustomizeField label={`Card width (${config.cardWidth}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={120}
              max={240}
              step={10}
              value={config.cardWidth}
              onChange={(e) => updateConfig("cardWidth", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Card height (${config.cardHeight}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={160}
              max={320}
              step={10}
              value={config.cardHeight}
              onChange={(e) => updateConfig("cardHeight", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Corner radius (${config.cardBorderRadius}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={0}
              max={24}
              value={config.cardBorderRadius}
              onChange={(e) => updateConfig("cardBorderRadius", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Heading size (${config.headingFontSize}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={16}
              max={36}
              value={config.headingFontSize}
              onChange={(e) => updateConfig("headingFontSize", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
        <WidgetCustomizeField label={`Section padding (${config.sectionPadding}px)`}>
          <div style={rangeRowStyle}>
            <input
              type="range"
              min={16}
              max={64}
              step={4}
              value={config.sectionPadding}
              onChange={(e) => updateConfig("sectionPadding", Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </WidgetCustomizeField>
      </WidgetCustomizeSection>
    </>
  );
}

export { WidgetVideoSliderPreview };
