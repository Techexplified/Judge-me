/* eslint-disable react/prop-types */
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

export const FLOW_STEPS = [
  { id: "rating", label: "Rating" },
  { id: "written", label: "Review" },
  { id: "photo", label: "Photos" },
  { id: "video", label: "Video" },
  { id: "submit", label: "Submit" },
  { id: "privacy", label: "Privacy" },
];

export function getVisibleFlowSteps(config) {
  const steps = [{ id: "rating", label: "Rating" }];
  if (config.showWrittenReviews !== false) steps.push({ id: "written", label: "Review" });
  if (config.showPhotos !== false) steps.push({ id: "photo", label: "Photos" });
  if (config.showVideos !== false) steps.push({ id: "video", label: "Video" });
  steps.push({ id: "submit", label: "Submit" });
  steps.push({ id: "privacy", label: "Privacy" });
  return steps;
}

export function FlowStepper({ steps, activeStep, onStepChange }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
        marginTop: 16,
        fontFamily: UI_FONT,
      }}
    >
      {steps.map((step, index) => {
        const active = step.id === activeStep;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(step.id)}
            style={{
              border: `1px solid ${active ? EDITOR_TOKENS.selectedBorder : EDITOR_TOKENS.border}`,
              background: active ? "#ECFDF5" : EDITOR_TOKENS.white,
              color: active ? EDITOR_TOKENS.themeGreen : EDITOR_TOKENS.textMuted,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: UI_FONT,
            }}
          >
            {index + 1}. {step.label}
          </button>
        );
      })}
    </div>
  );
}
