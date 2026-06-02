export const TRIAL_DAYS = 7;
export const PREMIUM_FEATURE_LABELS = [
  "Interactive analytics",
  "AI insights & playbooks",
  "CSV review import",
  "Review translation",
];

/** Whether premium features (AI, CSV import, translation) are unlocked. */
export function hasPremiumAccess(trialStatus) {
  if (!trialStatus) return false;
  return trialStatus.isActive || trialStatus.planStatus === "active";
}

/** Serialize trial status for the client (dates as ISO strings). */
export function serializeTrialStatus(trialStatus) {
  if (!trialStatus) return null;
  return {
    isActive: trialStatus.isActive,
    daysRemaining:
      trialStatus.daysRemaining === Infinity ? null : trialStatus.daysRemaining,
    planStatus: trialStatus.planStatus,
    trialEndsAt: trialStatus.trialEndsAt.toISOString(),
    hasPremium: hasPremiumAccess(trialStatus),
  };
}
