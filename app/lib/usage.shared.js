import {
  FREE_AUTO_TRANSLATE_PER_MONTH,
  FREE_IMPORTS_PER_MONTH,
  FREE_WIDGET_PUBLISHES_PER_MONTH,
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
  auto_translate: 100,
  live_graphs_charts: 20,
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
  "live_graphs_charts",
]);

export const FEATURE_LABELS = {
  review_imports: "Review imports",
  ai_dashboard_overview: "AI Dashboard Overview",
  ai_insights_playbook: "AI Insights (PDF playbook)",
  export_pdf_csv: "PDF & CSV Export",
  ai_review_replies: "AI Review Replies",
  urgent_reply_prioritization: "Urgent Reply Prioritisation",
  ai_widget_customization: "Widget publish",
  auto_translate: "Auto-Translate",
  live_graphs_charts: "Live Graphs & Charts",
};

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
