/**
 * Official Free vs Pro feature lists (Settings plan boxes + enforcement constants).
 */

export const FREE_LINKED_STORES = 2;
export const PRO_LINKED_STORES = 10;
export const FREE_REVIEWS_PER_MONTH = 500;
export const PRO_TRANSLATIONS_PER_MONTH = 500;
export const FREE_IMPORTS_PER_MONTH = 50;
export const FREE_WIDGET_PUBLISHES_PER_MONTH = 3;
export const FREE_AUTO_TRANSLATE_PER_MONTH = 10;

/** Must match Partner Dashboard internal plan handles (cannot change there later). */
export const MANAGED_FREE_PLAN_HANDLE = "free";
export const MANAGED_PRO_PLAN_HANDLE = "pro";

/** @typedef {{ title: string, items: string[] }} PlanFeatureSection */
/** @typedef {{ title: string, priceLabel: string, subtitle: string, sections: PlanFeatureSection[] }} PlanBox */

/** @type {PlanBox} */
export const FREE_PLAN_BOX = {
  title: "Free",
  priceLabel: "$0 / month",
  subtitle: "Lifetime free · core review tools",
  sections: [
    {
      title: "Dashboard & onboarding",
      items: [
        "Manual reply to reviews",
        "Manage reviews from other merchant stores",
        `Import reviews from Shopify apps & 3rd party, ${FREE_IMPORTS_PER_MONTH} per month`,
        "Graphs & charts (preview only)",
        `Store integrations up to ${FREE_LINKED_STORES} stores`,
        `Up to ${FREE_REVIEWS_PER_MONTH} new reviews per month`,
      ],
    },
    {
      title: "Translation",
      items: [
        `Auto translate while replying, ${FREE_AUTO_TRANSLATE_PER_MONTH} per month`,
      ],
    },
    {
      title: "Review form & storefront",
      items: [
        "Post images with review",
        `Basic widget customisation, ${FREE_WIDGET_PUBLISHES_PER_MONTH} publishes per month`,
        "Product review page on your storefront",
        "Basic branding controls",
      ],
    },
  ],
};

/** @type {PlanBox} */
export const PRO_PLAN_BOX = {
  title: "Pro",
  priceLabel: "$9 / month",
  subtitle: "14 day free trial · billed via Shopify",
  sections: [
    {
      title: "Dashboard & onboarding",
      items: [
        "Everything in Free, plus:",
        "Unlimited reviews per month",
        "Unlimited CSV imports",
        "Live graphs & charts (real time analytics)",
        `Store integrations up to ${PRO_LINKED_STORES} stores`,
      ],
    },
    {
      title: "AI features",
      items: [
        "PDF & CSV export, 10 per month",
        "AI suggested replies, 200 per month",
        "Unlimited widget customization",
      ],
    },
    {
      title: "Translation",
      items: [
        "Auto translate while replying",
        "Auto translate at the dashboard",
        "Auto translate during import",
        "Admin manual control of translation",
        "View translation status (total / pending)",
        `${PRO_TRANSLATIONS_PER_MONTH} translations per month (all sources)`,
      ],
    },
    {
      title: "Review form & storefront",
      items: [
        "Post images with review",
        "Video reviews",
        "Advanced widget customisation",
        "Advanced branding controls",
        "Product review page on your storefront",
      ],
    },
  ],
};

/** Flat highlights for banners / onboarding copy */
export const FREE_PLAN_HIGHLIGHTS = FREE_PLAN_BOX.sections.flatMap((s) => s.items);

export const PRO_PLAN_HIGHLIGHTS = [
  "Unlimited reviews & imports",
  "Live interactive analytics",
  "Photo & video reviews",
  "AI suggested replies",
  "PDF & CSV export",
  `Full translation suite (${PRO_TRANSLATIONS_PER_MONTH} / month)`,
  `${PRO_LINKED_STORES}+ store integrations`,
  "14 day free trial · then $9/month via Shopify",
];
