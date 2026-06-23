export const PRO_TRIAL_DAYS = 14;
export const PRO_PRICE_USD = 9;

export {
  FREE_REVIEWS_PER_MONTH,
  PRO_TRANSLATIONS_PER_MONTH,
  FREE_PLAN_HIGHLIGHTS,
  PRO_PLAN_HIGHLIGHTS,
  FREE_IMPORTS_PER_MONTH,
  FREE_LINKED_STORES,
  PRO_LINKED_STORES,
} from "./plan-features.shared.js";

import {
  FREE_REVIEWS_PER_MONTH,
  PRO_TRANSLATIONS_PER_MONTH,
  FREE_IMPORTS_PER_MONTH,
} from "./plan-features.shared.js";

/** @deprecated use FREE_PLAN_HIGHLIGHTS / plan comparison table */
export const FREE_FEATURE_LABELS = [
  `Up to ${FREE_REVIEWS_PER_MONTH} reviews per month`,
  "Manual review replies",
  "50 CSV imports / month",
  "2 store integrations",
  "Graph previews & image reviews",
  "3 widget publishes / month",
  "10 reply translations / month",
];

/** @deprecated use PRO_PLAN_HIGHLIGHTS / plan comparison table */
export const PRO_FEATURE_LABELS = [
  "Unlimited reviews & imports",
  "Live graphs & analytics",
  "Photo & video reviews",
  "AI suggested replies",
  "PDF & CSV export",
  `Full translation suite (${PRO_TRANSLATIONS_PER_MONTH} / month)`,
  "10+ store integrations",
  "14 day free trial",
];

/** @deprecated use PRO_TRIAL_DAYS */
export const TRIAL_DAYS = PRO_TRIAL_DAYS;

/** @deprecated use PRO_FEATURE_LABELS */
export const PREMIUM_FEATURE_LABELS = PRO_FEATURE_LABELS;

/** Whether Pro features are unlocked (active Shopify subscription). */
export function hasProAccess(planStatus) {
  if (!planStatus) return false;
  return planStatus.hasPro === true;
}

/** @deprecated use hasProAccess */
export function hasPremiumAccess(planStatus) {
  return hasProAccess(planStatus);
}

/** Serialize plan status for the client (dates as ISO strings). */
export function serializePlanStatus(planStatus) {
  if (!planStatus) return null;
  return {
    plan: planStatus.plan,
    hasPro: planStatus.hasPro,
    hasPremium: planStatus.hasPro,
    subscriptionStatus: planStatus.subscriptionStatus,
    billingTrialEndsAt: planStatus.billingTrialEndsAt
      ? planStatus.billingTrialEndsAt.toISOString()
      : null,
    graceTrialEndsAt: planStatus.graceTrialEndsAt
      ? planStatus.graceTrialEndsAt.toISOString()
      : null,
    isGraceTrial: planStatus.isGraceTrial === true,
    trialDaysRemaining: planStatus.trialDaysRemaining,
    isInTrial: planStatus.isInTrial === true,
    reviewsThisMonth: planStatus.reviewsThisMonth,
    reviewsRemaining: planStatus.reviewsRemaining,
    freeReviewCap: planStatus.freeReviewCap,
    featureUsage: planStatus.featureUsage ?? null,
  };
}

/** @deprecated use serializePlanStatus */
export function serializeTrialStatus(planStatus) {
  const serialized = serializePlanStatus(planStatus);
  if (!serialized) return null;
  return {
    ...serialized,
    isActive: serialized.hasPro,
    isInTrial: serialized.isInTrial === true,
    daysRemaining: serialized.trialDaysRemaining,
    planStatus: serialized.hasPro ? "active" : serialized.plan === "free" ? "free" : "expired",
    trialEndsAt: serialized.billingTrialEndsAt,
    hasPremium: serialized.hasPro,
  };
}
