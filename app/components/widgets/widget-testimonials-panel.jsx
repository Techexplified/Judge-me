/* eslint-disable react/prop-types */
import { QUICK_THEME_PALETTES } from "../../lib/review-form-config.shared.js";
import { ToggleSwitch } from "../import-wizard-ui";
import {
    WidgetCustomizeSection,
    WidgetCustomizeField,
    inputStyle,
    rangeRowStyle,
} from "./widget-customize-shell.jsx";
import { WidgetTestimonialsPreview } from "./widget-testimonials-preview.jsx";

export function WidgetTestimonialsPanel({ config, updateConfig }) {
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
                <WidgetCustomizeField label={`Maximum reviews (${config.limit})`}>
                    <div style={rangeRowStyle}>
                        <input
                            type="range"
                            min={4}
                            max={20}
                            value={config.limit}
                            onChange={(e) => updateConfig("limit", Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24 }}>{config.limit}</span>
                    </div>
                </WidgetCustomizeField>
                {config.showVerifiedBadge ? (
                    <WidgetCustomizeField label="Verified badge text">
                        <input
                            type="text"
                            value={config.verifiedBadgeText}
                            onChange={(e) => updateConfig("verifiedBadgeText", e.target.value)}
                            style={inputStyle}
                            maxLength={40}
                        />
                    </WidgetCustomizeField>
                ) : null}
                <WidgetCustomizeField >
                    <ToggleSwitch
                        label="Show verified badge"
                        checked={config.showVerifiedBadge}
                        onChange={(v) => updateConfig("showVerifiedBadge", v)}
                    />
                </WidgetCustomizeField>
                <WidgetCustomizeField >
                    <ToggleSwitch
                        label="Show navigation arrows"
                        checked={config.showNavigationArrows}
                        onChange={(v) => updateConfig("showNavigationArrows", v)}
                    />
                </WidgetCustomizeField>
                <WidgetCustomizeField >
                    <ToggleSwitch
                        label="Show pagination dots"
                        checked={config.showDots}
                        onChange={(v) => updateConfig("showDots", v)}
                    />
                </WidgetCustomizeField>
                <WidgetCustomizeField label="Font family">
                    <select
                        value={config.fontFamily}
                        onChange={(e) => updateConfig("fontFamily", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="inherit">Use global font</option>
                        <option value="'Inter', sans-serif">Inter (System)</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="system-ui, sans-serif">System UI</option>
                        <option value="'Courier New', monospace">Monospace</option>
                    </select>
                </WidgetCustomizeField>
            </WidgetCustomizeSection>

            <WidgetCustomizeSection title="Colors">
                <WidgetCustomizeField label="Accent color (quote mark, active dot)">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {QUICK_THEME_PALETTES.slice(0, 6).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => updateConfig("accentColor", c)}
                                aria-label={`Accent color ${c}`}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: config.accentColor === c ? "2px solid #202223" : "1px solid #c9cccf",
                                    background: c,
                                    cursor: "pointer",
                                }}
                            />
                        ))}
                        <input
                            type="color"
                            value={config.accentColor}
                            onChange={(e) => updateConfig("accentColor", e.target.value)}
                            style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
                        />
                    </div>
                </WidgetCustomizeField>
                <WidgetCustomizeField label="Star color">
                    <input
                        type="color"
                        value={config.starColor}
                        onChange={(e) => updateConfig("starColor", e.target.value)}
                        style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
                    />
                </WidgetCustomizeField>
                <WidgetCustomizeField label="Text color (heading + reviewer name)">
                    <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => updateConfig("textColor", e.target.value)}
                        style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
                    />
                </WidgetCustomizeField>
            </WidgetCustomizeSection>

            <WidgetCustomizeSection title="Layout">
                <WidgetCustomizeField label={`Card min width (${config.cardMinWidth}px)`}>
                    <div style={rangeRowStyle}>
                        <input
                            type="range"
                            min={200}
                            max={360}
                            step={10}
                            value={config.cardMinWidth}
                            onChange={(e) => updateConfig("cardMinWidth", Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                    </div>
                </WidgetCustomizeField>
                <WidgetCustomizeField label={`Corner radius (${config.borderRadius}px)`}>
                    <div style={rangeRowStyle}>
                        <input
                            type="range"
                            min={0}
                            max={24}
                            value={config.borderRadius}
                            onChange={(e) => updateConfig("borderRadius", Number(e.target.value))}
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
                {/* <WidgetCustomizeField label={`Section padding (${config.sectionPadding}px)`}>
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
                </WidgetCustomizeField> */}
            </WidgetCustomizeSection>
        </>
    );
}

export { WidgetTestimonialsPreview };