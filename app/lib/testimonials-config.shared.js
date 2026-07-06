import { normalizeHex } from "./review-form-config.shared.js";

export const TESTIMONIALS_CONFIG_KEYS = [
    "heading",
    "limit",
    "verifiedBadgeText",
    "showVerifiedBadge",
    "accentColor",
    "starColor",
    "textColor",
    "fontFamily",
    "borderRadius",
    "sectionPadding",
    "headingFontSize",
    "cardMinWidth",
    "showNavigationArrows",
    "showDots",
];

export const defaultTestimonialsConfig = {
    heading: "Testimonials",
    limit: 20,
    verifiedBadgeText: "Verified Buyer",
    showVerifiedBadge: true,
    accentColor: "#0D9488",
    starColor: "#F59E0B",
    textColor: "#0F172A",
    fontFamily: "inherit",
    borderRadius: 12,
    sectionPadding: 32,
    headingFontSize: 22,
    cardMinWidth: 270,
    showNavigationArrows: true,
    showDots: true,
};

export function mergeTestimonialsConfig(saved) {
    const base = {
        ...defaultTestimonialsConfig,
        ...(saved?.testimonials && typeof saved.testimonials === "object" ? saved.testimonials : {}),
        ...(saved && typeof saved === "object" && !saved.testimonials ? saved : {})
    };

    base.heading = String(base.heading || defaultTestimonialsConfig.heading).slice(0, 120);
    base.limit = Math.min(20, Math.max(4, Number(base.limit) || defaultTestimonialsConfig.limit));
    base.verifiedBadgeText = String(base.verifiedBadgeText || defaultTestimonialsConfig.verifiedBadgeText).slice(0, 40);
    base.showVerifiedBadge = base.showVerifiedBadge !== false;
    base.accentColor = normalizeHex(base.accentColor) || defaultTestimonialsConfig.accentColor;
    base.starColor = normalizeHex(base.starColor) || defaultTestimonialsConfig.starColor;
    base.textColor = normalizeHex(base.textColor) || defaultTestimonialsConfig.textColor;
    base.fontFamily = String(base.fontFamily || defaultTestimonialsConfig.fontFamily).slice(0, 60);
    base.borderRadius = Math.min(24, Math.max(0, Number(base.borderRadius) || defaultTestimonialsConfig.borderRadius));
    base.sectionPadding = Math.min(64, Math.max(16, Number(base.sectionPadding) || defaultTestimonialsConfig.sectionPadding));
    base.headingFontSize = Math.min(36, Math.max(16, Number(base.headingFontSize) || defaultTestimonialsConfig.headingFontSize));
    base.cardMinWidth = Math.min(360, Math.max(200, Number(base.cardMinWidth) || defaultTestimonialsConfig.cardMinWidth));
    base.showNavigationArrows = base.showNavigationArrows !== false;
    base.showDots = base.showDots !== false;

    return base;
}

export function pickTestimonialsConfigForSave(config){
    const merged = mergeTestimonialsConfig(config);
    const out = {};
    for(const key of TESTIMONIALS_CONFIG_KEYS){
        out[key] = merged[key];
    }
    return out;
}

export function serializeTestimonialsConfig(config) {
    return JSON.stringify(pickTestimonialsConfigForSave(config));
}

export function parseTestimonialsConfigPayload(raw){
    try{
        return mergeTestimonialsConfig(JSON.parse(raw));
    }catch {
        return mergeTestimonialsConfig({});
    }
}