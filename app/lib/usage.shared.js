import {
  FREE_AUTO_TRANSLATE_PER_MONTH,
  FREE_IMPORTS_PER_MONTH,
  FREE_WIDGET_PUBLISHES_PER_MONTH,
  PRO_TRANSLATIONS_PER_MONTH,
} from "./plan-features.shared.js";

/** Pro monthly quotas (enforced in usage.server.js). */
export const PRO_FEATURE_LIMITS = {
  review_imports: null,
  ai_dashboard_overview: 30,
  ai_insights_playbook: 10,
  export_pdf_csv: 10,
  ai_review_replies: 200,
  urgent_reply_prioritization: 50,
  ai_widget_customization: 20,
  auto_translate: PRO_TRANSLATIONS_PER_MONTH,
};

/** Free monthly quotas (null = not available on Free). */
export const FREE_FEATURE_LIMITS = {
  review_imports: FREE_IMPORTS_PER_MONTH,
  ai_widget_customization: FREE_WIDGET_PUBLISHES_PER_MONTH,
  auto_translate: FREE_AUTO_TRANSLATE_PER_MONTH,
};

/** Features entirely blocked on Free (Pro required). */
export const PRO_ONLY_FEATURES = new Set([
  "ai_dashboard_overview",
  "ai_insights_playbook",
  "export_pdf_csv",
  "ai_review_replies",
  "urgent_reply_prioritization",
]);

export const FEATURE_LABELS = {
  review_imports: "Review imports",
  ai_dashboard_overview: "AI dashboard overview",
  ai_insights_playbook: "AI insights playbook",
  export_pdf_csv: "PDF exports",
  ai_review_replies: "Suggested replies",
  urgent_reply_prioritization: "Urgent reply summary",
  ai_widget_customization: "Widget customization",
  auto_translate: "Translations",
};

/** Usage meters shown on the Free plan settings page (Pro-only rows appear locked). */
export const FREE_USAGE_DISPLAY_KEYS = [
  "review_imports",
  "auto_translate",
  "ai_review_replies",
  "export_pdf_csv",
  "ai_widget_customization",
];

/** Usage meters shown on the Pro plan settings page. */
export const PRO_USAGE_DISPLAY_KEYS = [
  "review_imports",
  "auto_translate",
  "ai_review_replies",
  "export_pdf_csv",
  "ai_widget_customization",
  "ai_dashboard_overview",
  "ai_insights_playbook",
  "urgent_reply_prioritization",
];

/** On Free, show these meters as Pro-locked previews (Pro limits, not Free quotas). */
export const FREE_PRO_LOCKED_USAGE_KEYS = new Set([
  "ai_review_replies",
  "export_pdf_csv",
  "ai_widget_customization",
]);

/** Metered keys tracked in FeatureUsage table. */
export const FEATURE_KEYS = [
  "review_imports",
  ...Object.keys(PRO_FEATURE_LIMITS).filter((k) => k !== "review_imports"),
];

export function getFeatureLimit(planStatus, featureKey) {
  const hasPro = planStatus?.hasPro === true;
  if (hasPro) {
    const proLimit = PRO_FEATURE_LIMITS[featureKey];
    return proLimit == null ? Infinity : proLimit;
  }
  if (PRO_ONLY_FEATURES.has(featureKey)) return 0;
  return FREE_FEATURE_LIMITS[featureKey] ?? 0;
}
