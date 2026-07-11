import { normalizeHex } from "./review-form-config.shared.js";

export const QA_CONFIG_KEYS = [
    "heading",
    "showQuestionCount",
    "questionsPerPage",
    "storeOwnerLabel",
    "accentColor",
    "fontFamily",
    "cardBackgroundColor",
    "borderRadius",
    "pinnedQuestionIds",
];

export const defaultQAConfig = {
    heading: "Questions & Answers",
    showQuestionCount: true,
    questionsPerPage: 5,
    storeOwnerLabel: "Store Owner",
    accentColor: "#0D9488",
    fontFamily: "inherit",
    cardBackgroundColor: "#0F172A",
    borderRadius: 12,
    pinnedQuestionIds: [],
};

export function mergeQAConfig(saved) {
    const base = {
        ...defaultQAConfig,
        ...(saved?.qa && typeof saved.qa === "object" ? saved.qa : {}),
        ...(saved && typeof saved === "object" && !saved.qa ? saved : {})
    };

    base.heading = String(base.heading || defaultQAConfig.heading).slice(0, 120);
    base.showQuestionCount = base.showQuestionCount !== false;
    base.questionsPerPage = Math.min(20, Math.max(3, Number(base.questionsPerPage) || defaultQAConfig.questionsPerPage));
    base.storeOwnerLabel = String(base.storeOwnerLabel || defaultQAConfig.storeOwnerLabel).slice(0, 40);
    base.accentColor = normalizeHex(base.accentColor) || defaultQAConfig.accentColor;
    base.fontFamily = String(base.fontFamily || defaultQAConfig.fontFamily).slice(0, 60);
    base.cardBackgroundColor = normalizeHex(base.cardBackgroundColor) || defaultQAConfig.cardBackgroundColor;
    base.borderRadius = Math.min(24, Math.max(0, Number(base.borderRadius) || defaultQAConfig.borderRadius));
    base.pinnedQuestionIds = Array.isArray(base.pinnedQuestionIds)
        ? base.pinnedQuestionIds.filter(id => typeof id === "string").slice(0, 20)
        : [];

    return base;
}

export function pickQAConfigForSave(config){
    const merged = mergeQAConfig(config);
    const out = {};
    for(const key of QA_CONFIG_KEYS){
        out[key] = merged[key];
    }
    return out;
}

export function serializeQAConfig(config) {
    return JSON.stringify(pickQAConfigForSave(config));
}

export function parseQAConfigPayload(raw){
    try{
        return mergeQAConfig(JSON.parse(raw));
    }catch {
        return mergeQAConfig({});
    }
}