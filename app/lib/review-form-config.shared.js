/** @typedef {'minimal'|'modern'|'luxury'|'shopifyNative'} LayoutPreset */
/** @typedef {'filled'|'outline'|'emoji'} StarStyle */
/** @typedef {'low'|'medium'|'high'} ShadowLevel */
/** @typedef {'sharp'|'medium'|'pill'} RadiusPreset */

export const ACCENT = "#059669";

export const TYPOGRAPHY_OPTIONS = [
  { value: "Inter (System)", stack: "'Inter', system-ui, -apple-system, sans-serif" },
  { value: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { value: "System UI", stack: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { value: "Monospace", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

export const SHADOW_LEVELS = ["low", "medium", "high"];
export const LAYOUT_PRESETS = ["minimal", "modern", "luxury", "shopifyNative"];
export const STAR_STYLES = ["filled", "outline", "emoji"];
export const RADIUS_PRESETS = ["sharp", "medium", "pill"];

export const defaultFormConfig = {
  primaryColor: "#059669",
  accentColor: "#10B981",
  secondaryColor: "#64748b",
  textColor: "#0f172a",
  starColor: "#F59E0B",
  inactiveStarColor: "#E5E7EB",
  starStyle: "filled",
  starSize: 20,
  buttonColor: "#059669",
  backgroundColor: "#F8FAFC",
  brandLogoUrl: null,
  showPhotos: true,
  showVideos: true,
  showRatings: true,
  showWrittenReviews: true,
  borderRadius: 12,
  radiusPreset: "medium",
  spacing: 16,
  shadowLevel: "medium",
  fontSize: 14,
  typography: "Inter (System)",
  layoutPreset: "modern",
  trustBadgeEnabled: true,
  trustBadgeText: "Protected by SSL. We never share your info.",
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
    radiusPreset: "sharp",
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
    radiusPreset: "medium",
    spacing: 16,
    shadowLevel: "medium",
    fontSize: 14,
    typography: "Inter (System)",
    starSize: 20,
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
    radiusPreset: "medium",
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

export function migrateLayoutPreset(preset) {
  if (LAYOUT_PRESETS.includes(preset)) return preset;
  return LEGACY_PRESET_MAP[preset] || "modern";
}

export function radiusFromPreset(preset, fallback = 12) {
  if (preset === "sharp") return 4;
  if (preset === "pill") return 999;
  if (preset === "medium") return 12;
  return typeof fallback === "number" ? fallback : 12;
}

export function shadowFromPreset(preset) {
  if (preset === "none") return "low";
  if (preset === "strong") return "high";
  return "medium";
}

export function radiusPresetFromValue(px) {
  if (px <= 6) return "sharp";
  if (px >= 48) return "pill";
  return "medium";
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
  if (!RADIUS_PRESETS.includes(base.radiusPreset)) {
    base.radiusPreset = radiusPresetFromValue(Number(base.borderRadius) || 12);
  }
  if (!Array.isArray(base.flowRules)) base.flowRules = [];

  base.starSize = Math.min(40, Math.max(14, Number(base.starSize) || 20));
  base.fontSize = Math.min(20, Math.max(12, Number(base.fontSize) || 14));
  base.spacing = Math.min(32, Math.max(8, Number(base.spacing) || 16));
  base.borderRadius = radiusFromPreset(base.radiusPreset, Number(base.borderRadius) || 12);

  const hexFields = [
    "primaryColor",
    "accentColor",
    "secondaryColor",
    "textColor",
    "starColor",
    "inactiveStarColor",
    "buttonColor",
    "backgroundColor",
  ];
  for (const key of hexFields) {
    const n = normalizeHex(base[key]);
    if (n) base[key] = n;
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
export function isStarActive(index, rating, config) {
  return index <= rating;
}

/**
 * @param {number} index 1-5
 * @param {number} rating
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function starCharacter(index, rating, config) {
  const active = isStarActive(index, rating, config);
  if (config.starStyle === "emoji") {
    return active ? "⭐" : "☆";
  }
  if (config.starStyle === "outline") {
    return active ? "★" : "☆";
  }
  return active ? "★" : "☆";
}

/**
 * @param {number} rating 0-5
 * @param {ReturnType<typeof mergeFormConfig>} config
 */
export function buildStarsHtml(rating, config) {
  const parts = [];
  for (let i = 1; i <= 5; i++) {
    const active = isStarActive(i, rating, config);
    const color = active ? config.starColor : config.inactiveStarColor;
    const opacity = config.starStyle === "outline" && !active ? 0.5 : 1;
    parts.push(
      `<span style="color:${color};opacity:${opacity};font-size:var(--jd-star-size,20px);line-height:1">${starCharacter(i, rating, config)}</span>`,
    );
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
