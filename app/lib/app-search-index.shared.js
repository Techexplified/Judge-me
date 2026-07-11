import {
  BarChart3,
  Download,
  FileText,
  Globe,
  LayoutGrid,
  Palette,
  Settings,
  Sparkles,
  Star,
  Store,
  Tag,
} from "lucide-react";

/**
 * Single source of truth for the quick-search command palette.
 * Every entry must point at a destination that exists in the app today.
 * `recommended: true` items are shown when the search query is empty.
 */
export const APP_SEARCH_ITEMS = [
  {
    id: "performance-overview",
    title: "Performance Overview",
    description: "View your reviews and storefront performance at a glance",
    path: "/app/performance-overview",
    icon: BarChart3,
    keywords: ["home", "dashboard", "performance", "overview", "metrics"],
  },
  {
    id: "manage-reviews",
    title: "Product Reviews",
    description: "Manage and display product reviews",
    path: "/app/manage-reviews",
    icon: Star,
    keywords: ["reviews", "manage", "reply", "ai", "moderate", "product"],
    recommended: true,
  },
  {
    id: "store-reviews",
    title: "Store reviews",
    description: "Manage reviews about your store",
    path: "/app/manage-reviews?tab=store",
    icon: Store,
    keywords: ["store", "reviews", "shop"],
  },
  {
    id: "social-showcase",
    title: "Social Showcase",
    description: "Curate reviews and photos for a shareable landing page",
    path: "/app/manage-reviews?tab=social-showcase",
    icon: Star,
    keywords: ["social", "showcase", "share", "link", "landing", "mobile"],
  },
  {
    id: "store-integration",
    title: "Integrate Reviews from Other Stores",
    description: "Import reviews from other platforms and stores",
    path: "/app/manage-reviews?tab=integration",
    icon: Store,
    keywords: ["integration", "integrate", "linked", "stores", "sync", "other"],
    recommended: true,
  },
  {
    id: "collect-reviews",
    title: "Collect Reviews",
    description: "Set up how you collect new reviews from customers",
    path: "/app/collect-reviews",
    icon: Sparkles,
    keywords: ["collect", "reviews", "request", "gather"],
  },
  {
    id: "storefront-widget",
    title: "Storefront Widget",
    description: "Configure the review widget shown on your storefront",
    path: "/app/collect-reviews?tab=widget",
    icon: LayoutGrid,
    keywords: ["widget", "storefront", "onsite", "display"],
  },
  {
    id: "review-form",
    title: "Review form",
    description: "Configure the form customers use to leave reviews",
    path: "/app/collect-reviews?tab=review-form",
    icon: FileText,
    keywords: ["form", "review form", "fields"],
  },
  {
    id: "import-reviews",
    title: "Import Reviews",
    description: "Import reviews from other platforms and stores",
    path: "/app/collect-reviews?tab=import",
    icon: Download,
    keywords: ["import", "csv", "loox", "migrate", "upload"],
  },
  {
    id: "customize",
    title: "Customize",
    description: "Customize the look and feel of your reviews",
    path: "/app/collect-reviews/customize",
    icon: Palette,
    keywords: ["customize", "design", "appearance", "colors", "theme", "edit form"],
    recommended: true,
  },
  {
    id: "brand-identification",
    title: "Branding",
    description: "Logo, star color, corner style, fonts, and JudgeMe branding",
    path: "/app/settings/branding",
    icon: Tag,
    keywords: ["brand", "logo", "identity", "branding", "font", "star color"],
    recommended: true,
  },
  {
    id: "widgets",
    title: "Widgets",
    description: "Browse and add review widgets to your theme",
    path: "/app/widgets",
    icon: LayoutGrid,
    keywords: ["widgets", "blocks", "showcase", "theme", "customize"],
  },
  {
    id: "widget-review-showcase",
    title: "Review Showcase customization",
    description: "Customize the Review Showcase widget appearance",
    path: "/app/widgets/review-showcase",
    icon: Palette,
    keywords: ["review showcase", "customize", "widget", "product reviews"],
  },
  {
    id: "widget-video-slider",
    title: "Video Reviews Slider customization",
    description: "Customize the video reviews carousel widget",
    path: "/app/widgets/video-reviews-slider",
    icon: Palette,
    keywords: ["video", "slider", "carousel", "customize", "widget"],
  },
  {
    id: "widget-customer-love",
    title: "Customer Love Page customization",
    description: "Customize the Customer Love page widget",
    path: "/app/widgets/customers-love-page",
    icon: Palette,
    keywords: ["customer love", "page", "customize", "widget"],
  },
  {
    id: "widget-testimonials",
    title: "Testimonials widget customization",
    description: "Customize the Testimonials widget",
    path: "/app/widgets/testimonials",
    icon: Palette,
    keywords: ["testimonials", "testimonial", "customize", "widget"],
  },
  {
    id: "widget-qa",
    title: "Question and Answer widget customization",
    description: "Customize the Question and Answer widget",
    path: "/app/widgets/qa",
    icon: Palette,
    keywords: ["question", "answer", "question and answer", "customize", "widget"],
  },
  {
    id: "translation",
    title: "Translate Your Reviews",
    description: "Translate your reviews into multiple languages",
    path: "/app/widgets/translation",
    icon: Globe,
    keywords: ["translate", "translation", "language", "languages", "localize"],
    recommended: true,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View detailed analytics and charts for your reviews",
    path: "/app/analytics",
    icon: BarChart3,
    keywords: ["analytics", "charts", "graphs", "trends", "export", "report"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage your plan and pricing",
    path: "/app/settings",
    icon: Settings,
    keywords: ["settings", "pricing", "plan", "billing", "upgrade"],
  },
];

export function getRecommendedSearchItems(items = APP_SEARCH_ITEMS) {
  return items.filter((item) => item.recommended);
}

/**
 * Case-insensitive substring filter that ranks title matches above keyword and
 * description matches. Returns all items for an empty query.
 */
export function filterAppSearchItems(query, items = APP_SEARCH_ITEMS) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return items;

  const scored = [];
  for (const item of items) {
    const title = item.title.toLowerCase();
    const description = (item.description ?? "").toLowerCase();
    const keywords = (item.keywords ?? []).join(" ").toLowerCase();

    let score = 0;
    if (title.startsWith(q)) score = 4;
    else if (title.includes(q)) score = 3;
    else if (keywords.includes(q)) score = 2;
    else if (description.includes(q)) score = 1;

    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
