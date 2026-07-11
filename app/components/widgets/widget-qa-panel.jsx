/* eslint-disable react/prop-types */
import { QUICK_THEME_PALETTES } from "../../lib/review-form-config.shared.js";
import { ToggleSwitch } from "../import-wizard-ui";
import {
    WidgetCustomizeSection,
    WidgetCustomizeField,
    inputStyle,
    rangeRowStyle,
} from "./widget-customize-shell.jsx";
import { WidgetQAPreview } from "./widget-qa-preview.jsx";

export function WidgetQAPanel({ config, updateConfig }) {
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
                <WidgetCustomizeField label="Store owner label">
                    <input
                        type="text"
                        value={config.storeOwnerLabel}
                        onChange={(e) => updateConfig("storeOwnerLabel", e.target.value)}
                        style={inputStyle}
                        maxLength={40}
                    />
                </WidgetCustomizeField>
                <WidgetCustomizeField label={`Questions per page (${config.questionsPerPage})`}>
                    <div style={rangeRowStyle}>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            value={config.questionsPerPage}
                            onChange={(e) => updateConfig("questionsPerPage", Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24 }}>{config.questionsPerPage}</span>
                    </div>
                </WidgetCustomizeField>
                <WidgetCustomizeField>
                    <ToggleSwitch
                        label="Show question count in header"
                        checked={config.showQuestionCount}
                        onChange={(v) => updateConfig("showQuestionCount", v)}
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
                <WidgetCustomizeField label="Accent color (buttons, active states)">
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
                <WidgetCustomizeField label="Card background color">
                    <input
                        type="color"
                        value={config.cardBackgroundColor}
                        onChange={(e) => updateConfig("cardBackgroundColor", e.target.value)}
                        style={{ width: 36, height: 28, padding: 0, border: "none", cursor: "pointer" }}
                    />
                </WidgetCustomizeField>
            </WidgetCustomizeSection>

            <WidgetCustomizeSection title="Layout">
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
            </WidgetCustomizeSection>
        </>
    );
}

export { WidgetQAPreview };