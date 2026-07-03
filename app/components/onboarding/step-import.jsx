/* eslint-disable react/prop-types */
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { SourceLogo } from "../import-wizard-ui.jsx";
import { SHOPIFY_GREEN } from "../admin-ui";
import {
  ONBOARDING_IMPORT_KEYS,
  ONBOARDING_IMPORT_SOURCES,
} from "../../lib/onboarding.shared.js";
import { SOURCE_PRESETS } from "../../lib/csv-import.shared.js";

const IMPORT_CARDS = ONBOARDING_IMPORT_KEYS.map((key) => {
  const preset = SOURCE_PRESETS[ONBOARDING_IMPORT_SOURCES[key]];
  return {
    choice: key,
    id: preset.id,
    name: preset.name,
    category: preset.category,
    logo: preset.logo,
  };
});

function cardStyle(selected) {
  return {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "16px 16px",
    borderRadius: 10,
    border: selected ? `2px solid ${SHOPIFY_GREEN}` : "1px solid #e1e3e5",
    background: selected ? "#ecfdf5" : "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
}

const CARD_NAME = {
  display: "block",
  fontWeight: 800,
  fontSize: 14,
  color: "#202223",
};

const CARD_CATEGORY = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#8c9196",
  marginTop: 2,
};

export function StepImport({ importChoice, onImportChoiceChange }) {
  return (
    <div>
      <OnboardingHeading
        eyebrow="Question 3 of 5"
        title="Where do you want to import your reviews from?"
        subtitle="Select a source and we'll have the import ready for you right after setup. Skip this if you're starting fresh."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {IMPORT_CARDS.map((card) => {
          const selected = importChoice === card.choice;
          return (
            <button
              key={card.choice}
              type="button"
              onClick={() => onImportChoiceChange(card.choice)}
              style={cardStyle(selected)}
            >
              <SourceLogo source={{ id: card.id, name: card.name, logo: card.logo }} />
              <span>
                <span style={CARD_NAME}>{card.name}</span>
                <span style={CARD_CATEGORY}>{card.category}</span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onImportChoiceChange("skip")}
          style={cardStyle(importChoice === "skip")}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#6d7175",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
            }}
            aria-hidden
          >
            N/A
          </span>
          <span>
            <span style={CARD_NAME}>Starting fresh</span>
            <span style={CARD_CATEGORY}>No import needed</span>
          </span>
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px solid #bfdbfe",
          background: "#eff6ff",
        }}
      >
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1.4 }}>
          &#9432;
        </span>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1e40af", lineHeight: 1.5 }}>
          We'll walk you through the actual import right after this setup. No need to upload
          anything now. Just tell us where your reviews live.
        </p>
      </div>
    </div>
  );
}
