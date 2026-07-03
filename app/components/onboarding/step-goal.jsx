/* eslint-disable react/prop-types */
import { ONBOARDING_GOAL_OPTIONS } from "../../lib/onboarding.shared.js";
import { OnboardingHeading } from "./onboarding-shell.jsx";
import { OnboardingOptionCard } from "./onboarding-option-card.jsx";

export function StepGoal({ goal, onGoalChange }) {
  return (
    <div>
      <OnboardingHeading
        eyebrow="Question 2 of 5"
        title="What's your main goal with reviews?"
        subtitle="This determines what we set up for you next, and which features we prioritize showing you first."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ONBOARDING_GOAL_OPTIONS.map((option) => (
          <OnboardingOptionCard
            key={option.id}
            title={option.label}
            description={option.description}
            selected={goal === option.id}
            onSelect={() => onGoalChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
