/** @typedef {'minimal'|'modern'|'luxury'|'shopifyNative'} LayoutPreset */
/** @typedef {'filled'|'outline'|'emoji'} StarStyle */
/** @typedef {'low'|'medium'|'high'} ShadowLevel */
/** @typedef {'sharp'|'slight'|'default'|'rounded'|'pill'|'custom'} RadiusPreset */

export const ACCENT = "#059669";

/** One-click theme colors for the Style & Color panel. */
export const QUICK_THEME_PALETTES = [
  "#0A5C36",
  "#2563EB",
  "#7C3AED",
  "#DC2626",
  "#EA580C",
  "#0D9488",
  "#DB2777",
  "#1E3A5F",
];

export const TYPOGRAPHY_OPTIONS = [
  { value: "Inter (System)", stack: "'Inter', system-ui, -apple-system, sans-serif" },
  { value: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { value: "System UI", stack: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { value: "Monospace", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

export const SHADOW_LEVELS = ["low", "medium", "high"];
export const LAYOUT_PRESETS = ["minimal", "modern", "luxury", "shopifyNative"];
export const STAR_STYLES = ["filled", "outline", "emoji"];
export const RADIUS_PRESETS = ["sharp", "slight", "default", "rounded", "pill", "custom"];

/** @type {Array<{ id: RadiusPreset, label: string, px: number | null }>} */
export const CORNER_PRESET_OPTIONS = [
  { id: "sharp", label: "Sharp", px: 0 },
  { id: "slight", label: "Slight", px: 6 },
  { id: "default", label: "Default", px: 12 },
  { id: "rounded", label: "Rounded", px: 18 },
  { id: "pill", label: "Pill", px: 999 },
  { id: "custom", label: "Custom", px: null },
];

export const FORM_TEXT_TOKENS = ["{{item}}", "{{store}}", "{{order}}", "{{date}}"];

/** Per-field typography on the rating step (null = use section default). */
export const RATING_TEXT_STYLE_SECTIONS = {
  ratingPageTitle: { fontSize: 16, fontWeight: 600, colorFrom: "textColor" },
  orderMetaLine: { fontSize: 13, fontWeight: 500, color: "#6d7175" },
  verifiedPurchaseLabel: { fontSize: 11, fontWeight: 700, colorFrom: "primaryColor" },
  starLabelHigh: { fontSize: 11, fontWeight: 500, color: "#6d7175" },
  starLabelLow: { fontSize: 11, fontWeight: 500, color: "#6d7175" },
};

export const RATING_TEXT_STYLE_SECTION_IDS = Object.keys(RATING_TEXT_STYLE_SECTIONS);

export const FONT_WEIGHT_OPTIONS = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra bold" },
];

export const FORM_TEXT_KEYS = [
  "ratingPageTitle",
  "starLabelHigh",
  "starLabelLow",
  "formTitle",
  "formSubtitle",
  "nameFieldLabel",
  "reviewFieldLabel",
  "reviewFieldPlaceholder",
  "photoPageTitle",
  "photoUploadTitle",
  "photoUploadHint",
  "videoPageTitle",
  "videoUploadTitle",
  "videoUploadHint",
  "videoSkipLabel",
  "submitButtonText",
  "verifiedPurchaseLabel",
  "orderMetaLine",
  "privacyFooterText",
];

export const defaultFormConfig = {
  primaryColor: "#059669",
  accentColor: "#10B981",
  secondaryColor: "#64748b",
  textColor: "#0f172a",
  starColor: "#F59E0B",
  inactiveStarColor: "#E5E7EB",
  starStyle: "outline",
  starSize: 32,
  buttonColor: "#059669",
  backgroundColor: "#F8FAFC",
  cardBackgroundColor: "#FFFFFF",
  brandLogoUrl: null,
  showPhotos: true,
  showVideos: true,
  showRatings: true,
  showWrittenReviews: true,
  borderRadius: 12,
  radiusPreset: "default",
  ratingPageTitle: "How would you rate this product?",
  starLabelHigh: "Love it!",
  starLabelLow: "Dislike it",
  formTitle: "Write a Review",
  formSubtitle: "Share your experience with this product. Your feedback helps other shoppers decide.",
  nameFieldLabel: "Your Name",
  reviewFieldLabel: "Your Review",
  reviewFieldPlaceholder: "What did you love about this product? How has it helped you? Any tips for others?",
  photoPageTitle: "Add photos to your review",
  photoUploadTitle: "Add Photos",
  photoUploadHint: "Drag & drop or click to upload · PNG, JPG up to 5MB",
  videoPageTitle: "Add a video to your review",
  videoUploadTitle: "Add Video",
  videoUploadHint: "Drag & drop or click to upload · MP4, WebM up to 50MB",
  videoSkipLabel: "Skip for now",
  submitButtonText: "Post Review",
  verifiedPurchaseLabel: "Verified Purchase",
  orderMetaLine: "Order #{{order}} · Purchased {{date}}",
  privacyFooterText: "Your data is secure and never shared.",
  ratingPageTitleColor: null,
  ratingPageTitleFontSize: null,
  ratingPageTitleTypography: null,
  ratingPageTitleFontWeight: null,
  orderMetaLineColor: null,
  orderMetaLineFontSize: null,
  orderMetaLineTypography: null,
  orderMetaLineFontWeight: null,
  verifiedPurchaseLabelColor: null,
  verifiedPurchaseLabelFontSize: null,
  verifiedPurchaseLabelTypography: null,
  verifiedPurchaseLabelFontWeight: null,
  starLabelHighColor: null,
  starLabelHighFontSize: null,
  starLabelHighTypography: null,
  starLabelHighFontWeight: null,
  starLabelLowColor: null,
  starLabelLowFontSize: null,
  starLabelLowTypography: null,
  starLabelLowFontWeight: null,
  spacing: 16,
  shadowLevel: "medium",
  fontSize: 14,
  typography: "Inter (System)",
  layoutPreset: "modern",
  trustBadgeEnabled: true,
  trustBadgeText: "Protected by SSL. We never share your info.",
  /** When true, storefront widgets omit "Powered by JudgeMe Reviews". */
  hideJudgeMeBranding: false,
  flowRules: [],
};

/** @type {Record<LayoutPreset, Partial<typeof defaultFormConfig>>} */
export const PRESET_BUNDLES = {
  minimal: {
    layoutPreset: "minimal",
    primaryColor: "#334155",
    accentColor: "#64748b",
    buttonColor: "#334155",
    backgroundColor: "#ffffff",
    starColor: "#F59E0B",
    inactiveStarColor: "#E5E7EB",
    borderRadius: 8,
    radiusPreset: "slight",
    spacing: 12,
    shadowLevel: "low",
    fontSize: 14,
    typography: "System UI",
    starSize: 18,
  },
  modern: {
    layoutPreset: "modern",
    primaryColor: "#059669",
    accentColor: "#10B981",
    buttonColor: "#059669",
    backgroundColor: "#F8FAFC",
    starColor: "#F59E0B",
    inactiveStarColor: "#E5E7EB",
    borderRadius: 12,
    radiusPreset: "default",
    spacing: 16,
    shadowLevel: "medium",
    fontSize: 14,
    typography: "Inter (System)",
    starSize: 32,
  },
  luxury: {
    layoutPreset: "luxury",
    primaryColor: "#1e293b",
    accentColor: "#b45309",
    buttonColor: "#1e293b",
    backgroundColor: "#fafaf9",
    starColor: "#d97706",
    inactiveStarColor: "#d6d3d1",
    borderRadius: 16,
    radiusPreset: "rounded",
    spacing: 20,
    shadowLevel: "high",
    fontSize: 15,
    typography: "Georgia",
    starSize: 22,
  },
  shopifyNative: {
    layoutPreset: "shopifyNative",
    primaryColor: "#008060",
    accentColor: "#008060",
    buttonColor: "#008060",
    backgroundColor: "#ffffff",
    starColor: "#008060",
    inactiveStarColor: "#e3e3e3",
    borderRadius: 4,
    radiusPreset: "sharp",
    spacing: 14,
    shadowLevel: "low",
    fontSize: 14,
    typography: "System UI",
    starSize: 18,
  },
};

const LEGACY_PRESET_MAP = {
  compact: "modern",
  brandLed: "luxury",
  premium: "modern",
};

export function normalizeHex(input) {
  let s = String(input || "").trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  return null;
}

/**
 * Muted inactive star color derived from the active star color (filled/emoji modes).
 * @param {string} starColor
 */
export function deriveInactiveStarColor(starColor) {
  const hex = normalizeHex(starColor);
  if (!hex) return defaultFormConfig.inactiveStarColor;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = 0.4;
  const lr = 232;
  const lg = 232;
  const lb = 232;
  const nr = Math.round(r * mix + lr * (1 - mix));
  const ng = Math.round(g * mix + lg * (1 - mix));
  const nb = Math.round(b * mix + lb * (1 - mix));
  return `#${[nr, ng, nb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function migrateLayoutPreset(preset) {
  if (LAYOUT_PRESETS.includes(preset)) return preset;
  return LEGACY_PRESET_MAP[preset] || "modern";
}

export function migrateRadiusPreset(preset) {
  if (preset === "medium") return "default";
  if (RADIUS_PRESETS.includes(preset)) return preset;
  return "default";
}

export function radiusFromPreset(preset, fallback = 12) {
  const mapped = migrateRadiusPreset(preset);
  const match = CORNER_PRESET_OPTIONS.find((o) => o.id === mapped);
  if (match && match.px != null) return match.px;
  if (mapped === "custom") return typeof fallback === "number" ? fallback : 12;
  return typeof fallback === "number" ? fallback : 12;
}

export function shadowFromPreset(preset) {
  if (preset === "none") return "low";
  if (preset === "strong") return "high";
  return "medium";
}

export function radiusPresetFromValue(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return "default";
  if (n <= 0) return "sharp";
  if (n <= 6) return "slight";
  if (n <= 12) return "default";
  if (n <= 18) return "rounded";
  if (n >= 48) return "pill";
  return "custom";
}

/**
 * @param {string} template
 * @param {{ item?: string, store?: string, order?: string, date?: string }} context
 */
export function resolveFormText(template, context = {}) {
  const item = context.item?.trim() || "";
  const store = context.store?.trim() || "";
  const order = context.order?.trim() || "";
  const date = context.date?.trim() || "";
  return String(template || "")
    .replace(/\{\{item\}\}/gi, item)
    .replace(/\{\{store\}\}/gi, store)
    .replace(/\{\{order\}\}/gi, order)
    .replace(/\{\{date\}\}/gi, date)
    .trim();
}

/**
 * @param {ReturnType<typeof mergeFormConfig>} config
 * @param {{ item?: string, store?: string, order?: string }} context
 */
export function resolveRatingPageTitle(config, context = {}) {
  const item = context.item?.trim() || "";
  const ctx = item ? context : { ...context, item: "this product" };
  const title = resolveFormText(config.ratingPageTitle, ctx);
  return title || defaultFormConfig.ratingPageTitle;
}

/** @returns {{ text: string, styleSection: keyof typeof RATING_TEXT_STYLE_SECTIONS }} */
export function resolveRatingPageTitleDisplay(config, context = {}) {
  const item = context.item?.trim() || "";
  const ctx = item ? context : { ...context, item: "this product" };
  return {
    text: resolveFormText(config.ratingPageTitle, ctx) || defaultFormConfig.ratingPageTitle,
    styleSection: "ratingPageTitle",
  };
}

/**
 * @param {Record<string, unknown>} saved
 */
export function mergeFormConfig(saved) {
  const base = {
    ...defaultFormConfig,
    ...(saved && typeof saved === "object" ? saved : {}),
  };

  base.layoutPreset = migrateLayoutPreset(base.layoutPreset);
  if (!SHADOW_LEVELS.includes(base.shadowLevel)) base.shadowLevel = "medium";
  if (!STAR_STYLES.includes(base.starStyle)) base.starStyle = "filled";
  base.radiusPreset = migrateRadiusPreset(base.radiusPreset);
  if (!RADIUS_PRESETS.includes(base.radiusPreset)) {
    base.radiusPreset = radiusPresetFromValue(Number(base.borderRadius) || 12);
  }
  if (!Array.isArray(base.flowRules)) base.flowRules = [];
  base.hideJudgeMeBranding = base.hideJudgeMeBranding === true;
  base.trustBadgeEnabled = base.trustBadgeEnabled !== false;

  if (base.ratingPageTitle === "How would you rate {{item}} ?") {
    base.ratingPageTitle = defaultFormConfig.ratingPageTitle;
  }

  base.starSize = Math.min(40, Math.max(14, Number(base.starSize) || 20));
  base.fontSize = Math.min(20, Math.max(12, Number(base.fontSize) || 14));
  base.spacing = Math.min(32, Math.max(8, Number(base.spacing) || 16));
  if (base.radiusPreset === "custom") {
    base.borderRadius = Math.min(999, Math.max(0, Number(base.borderRadius) || 12));
  } else {
    base.borderRadius = radiusFromPreset(base.radiusPreset, Number(base.borderRadius) || 12);
  }

  const hexFields = [
    "primaryColor",
    "accentColor",
    "secondaryColor",
    "textColor",
    "starColor",
    "inactiveStarColor",
    "buttonColor",
    "backgroundColor",
    "cardBackgroundColor",
  ];
  for (const key of hexFields) {
    const n = normalizeHex(base[key]);
    if (n) base[key] = n;
  }

  if (
    base.inactiveStarColor === defaultFormConfig.inactiveStarColor &&
    base.starColor !== defaultFormConfig.starColor
  ) {
    base.inactiveStarColor = deriveInactiveStarColor(base.starColor);
  }

  for (const sectionId of RATING_TEXT_STYLE_SECTION_IDS) {
    const colorKey = `${sectionId}Color`;
    const sizeKey = `${sectionId}FontSize`;
    const weightKey = `${sectionId}FontWeight`;
    const typoKey = `${sectionId}Typography`;

    const normalizedColor = normalizeHex(base[colorKey]);
    base[colorKey] = normalizedColor || null;

    const sizeRaw = Number(base[sizeKey]);
    base[sizeKey] =
      Number.isFinite(sizeRaw) && sizeRaw > 0
        ? Math.min(32, Math.max(10, Math.round(sizeRaw)))
        : null;

    const weightRaw = Number(base[weightKey]);
    base[weightKey] =
      Number.isFinite(weightRaw) && weightRaw >= 100 ? Math.round(weightRaw) : null;

    if (base[typoKey] && !TYPOGRAPHY_OPTIONS.some((o) => o.value === base[typoKey])) {
      base[typoKey] = null;
    }
    if (!base[typoKey]) base[typoKey] = null;
  }

  for (const key of FORM_TEXT_KEYS) {
    if (base[key] != null) base[key] = String(base[key]);
  }

  if (base.accentColor && !saved?.buttonColor) {
    base.buttonColor = base.accentColor;
  }

  return base;
}

/**
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function applyLayoutPreset(presetId, current = {}) {
  const bundle = PRESET_BUNDLES[presetId];
  if (!bundle) return mergeFormConfig({ ...current, layoutPreset: "modern" });
  return mergeFormConfig({ ...current, ...bundle });
}

export function shadowCss(level) {
  if (level === "low") return "0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)";
  if (level === "high") return "0 16px 48px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.08)";
  return "0 8px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)";
}

export function fontStack(typographyLabel) {
  const opt = TYPOGRAPHY_OPTIONS.find((o) => o.value === typographyLabel);
  return opt?.stack ?? TYPOGRAPHY_OPTIONS[0].stack;
}

/**
 * Resolved inline styles for one rating-step text field.
 * @param {ReturnType<typeof mergeFormConfig>} config
 * @param {keyof typeof RATING_TEXT_STYLE_SECTIONS} sectionId
 */
export function resolveTextStyle(config, sectionId) {
  const defaults = RATING_TEXT_STYLE_SECTIONS[sectionId] || {};
  const defaultColor =
    defaults.color ||
    (defaults.colorFrom ? config[defaults.colorFrom] : config.textColor) ||
    defaultFormConfig.textColor;

  const color = normalizeHex(config[`${sectionId}Color`]) || defaultColor;

  const fontSizeRaw = Number(config[`${sectionId}FontSize`]);
  const fontSize =
    Number.isFinite(fontSizeRaw) && fontSizeRaw > 0
      ? Math.min(32, Math.max(10, fontSizeRaw))
      : defaults.fontSize || config.fontSize;

  const typography = config[`${sectionId}Typography`] || config.typography;
  const fontWeightRaw = Number(config[`${sectionId}FontWeight`]);
  const fontWeight =
    Number.isFinite(fontWeightRaw) && fontWeightRaw >= 100
      ? fontWeightRaw
      : defaults.fontWeight || 400;

  return {
    color,
    fontSize,
    fontFamily: fontStack(typography),
    fontWeight,
  };
}

/** @param {ReturnType<typeof resolveTextStyle>} style */
export function textStyleToCss(style) {
  return {
    color: style.color,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
  };
}

/**
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function presetLayout(config) {
  const p = config.layoutPreset;
  if (p === "luxury" || p === "brandLed") {
    return { titleSize: 28, gapScale: 1.1, hideSubtitle: false };
  }
  if (p === "minimal") {
    return { titleSize: 22, gapScale: 0.92, hideSubtitle: true };
  }
  if (p === "shopifyNative") {
    return { titleSize: 24, gapScale: 1, hideSubtitle: false };
  }
  return { titleSize: 24, gapScale: 1, hideSubtitle: false };
}

/**
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function buildFormCssVars(config) {
  const pl = presetLayout(config);
  const gap = Math.round(config.spacing * pl.gapScale);
  return {
    "--jd-primary": config.primaryColor,
    "--jd-accent": config.accentColor,
    "--jd-button": config.buttonColor,
    "--jd-bg": config.backgroundColor,
    "--jd-card-bg": config.cardBackgroundColor || "#FFFFFF",
    "--jd-text": config.textColor,
    "--jd-star": config.starColor,
    "--jd-star-inactive": config.inactiveStarColor,
    "--jd-radius": `${config.borderRadius}px`,
    "--jd-font-size": `${config.fontSize}px`,
    "--jd-font-family": fontStack(config.typography),
    "--jd-shadow": shadowCss(config.shadowLevel),
    "--jd-gap": `${gap}px`,
    "--jd-star-size": `${config.starSize}px`,
  };
}

/**
 * @param {number} rating - 1-5 display value
 * @param {number} index - star index 1-5
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function isStarActive(index, rating) {
  return index <= rating;
}

/** Sharp, symmetric 5-point star path (24×24 viewBox) — used by filled & outline. */
export const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

/** Rounded, puffy star path (24×24 viewBox) — used by the emoji style. */
export const STAR_PATH_ROUNDED =
  "M11.48 3.5a.6.6 0 0 1 1.04 0l2.34 4.74a.6.6 0 0 0 .45.33l5.23.76a.6.6 0 0 1 .33 1.02l-3.78 3.69a.6.6 0 0 0-.17.53l.89 5.21a.6.6 0 0 1-.87.63l-4.68-2.46a.6.6 0 0 0-.56 0l-4.68 2.46a.6.6 0 0 1-.87-.63l.89-5.21a.6.6 0 0 0-.17-.53L3.36 10.35a.6.6 0 0 1 .33-1.02l5.23-.76a.6.6 0 0 0 .45-.33z";

/**
 * Inline SVG star — reliable custom colors for filled, outline, and emoji styles.
 * @param {ReturnType<typeof resolveStarDisplay>} star
 * @param {number} size
 */
export function buildStarSvgMarkup(star, size) {
  const path = star.path || STAR_PATH;
  const fill = star.svgFill ?? star.color ?? "currentColor";
  const stroke = star.svgStroke ?? "none";
  const strokeWidth = star.svgStrokeWidth ?? 0;
  const opacity = star.opacity ?? 1;
  const filter = star.svgFilter ? `filter:${star.svgFilter};` : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;opacity:${opacity};${filter}"><path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

/**
 * Single source of truth for star glyph + colors across editor preview and storefront.
 * @param {number} index 1-5
 * @param {number} rating
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function resolveStarDisplay(index, rating, config) {
  const active = isStarActive(index, rating);
  const style = config.starStyle;

  if (style === "outline") {
    // Always hollow; rating is shown via stroke color (full vs muted), never filled.
    return {
      path: STAR_PATH,
      glyph: active ? "★" : "☆",
      color: config.starColor,
      opacity: 1,
      svgFill: "none",
      svgStroke: active ? config.starColor : config.inactiveStarColor,
      svgStrokeWidth: 2,
      fontSizeScale: 1,
    };
  }

  if (style === "emoji") {
    // Rounded, glossy star shape with a soft shadow for an emoji-like feel.
    const fill = active ? config.starColor : config.inactiveStarColor;
    return {
      path: STAR_PATH_ROUNDED,
      glyph: "★",
      color: fill,
      opacity: 1,
      svgFill: fill,
      svgStroke: "none",
      svgStrokeWidth: 0,
      fontSizeScale: 1.18,
      svgFilter: "drop-shadow(0 1.5px 1px rgba(0,0,0,0.28))",
    };
  }

  // filled — flat, sharp-edged solid star.
  const fill = active ? config.starColor : config.inactiveStarColor;
  return {
    path: STAR_PATH,
    glyph: "★",
    color: fill,
    opacity: 1,
    svgFill: fill,
    svgStroke: "none",
    svgStrokeWidth: 0,
    fontSizeScale: 1,
  };
}

/**
 * @param {number} index 1-5
 * @param {number} rating
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function starCharacter(index, rating, config) {
  return resolveStarDisplay(index, rating, config).glyph;
}

/**
 * @param {number} rating 0-5
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function buildStarsHtml(rating, config) {
  const parts = [];
  for (let i = 1; i <= 5; i++) {
    const star = resolveStarDisplay(i, rating, config);
    const size = Math.round(config.starSize * (star.fontSizeScale || 1));
    parts.push(buildStarSvgMarkup(star, size));
  }
  return parts.join("");
}

/** Keys owned by the review form customizer (safe to merge on publish). */
export const FORM_CONFIG_KEYS = Object.keys(defaultFormConfig);

/**
 * @param {Record<string, unknown>} config
 */
export function pickFormConfigForSave(config) {
  const picked = {};
  for (const key of FORM_CONFIG_KEYS) {
    if (config != null && Object.prototype.hasOwnProperty.call(config, key)) {
      picked[key] = config[key];
    }
  }
  return picked;
}

/**
 * Serialize only form keys for save (preserves translation/onboarding keys in DB).
 * @param {Record<string, unknown>} config
 */
export function serializeFormConfig(config) {
  return JSON.stringify(pickFormConfigForSave(config));
}

/**
 * @param {string} configRaw
 */
export function parseFormConfigPayload(configRaw) {
  try {
    const parsed = JSON.parse(configRaw);
    return mergeFormConfig(parsed);
  } catch {
    return mergeFormConfig({});
  }
}
