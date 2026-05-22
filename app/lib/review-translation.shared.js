export const AUTO_DETECT = "auto";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "no", label: "Norwegian" },
  { code: "fi", label: "Finnish" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "he", label: "Hebrew" },
  { code: "el", label: "Greek" },
  { code: "cs", label: "Czech" },
  { code: "ro", label: "Romanian" },
  { code: "uk", label: "Ukrainian" },
  { code: "hu", label: "Hungarian" },
  { code: "ms", label: "Malay" },
  { code: "bg", label: "Bulgarian" },
  { code: "hr", label: "Croatian" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "et", label: "Estonian" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "fa", label: "Persian" },
  { code: "ur", label: "Urdu" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "ca", label: "Catalan" },
  { code: "sr", label: "Serbian" },
  { code: "is", label: "Icelandic" },
  { code: "af", label: "Afrikaans" },
  { code: "sw", label: "Swahili" },
  { code: "fil", label: "Filipino" },
];

export const SOURCE_LANGUAGE_OPTIONS = [
  { code: AUTO_DETECT, label: "Auto-detect (recommended)" },
  ...LANGUAGE_OPTIONS,
];

export const DEFAULT_TRANSLATION = {
  enabled: false,
  targetLanguage: "en",
  sourceLanguage: AUTO_DETECT,
  autoTranslateNewReviews: true,
  autoTranslateImport: false,
};

function normalizeLanguageCode(raw, fallback) {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  const code = raw.trim();
  if (code === AUTO_DETECT) return AUTO_DETECT;
  const known = LANGUAGE_OPTIONS.some((l) => l.code === code);
  return known ? code : fallback;
}

export function languageLabel(code) {
  if (code === AUTO_DETECT) return "Auto-detect";
  const opt = LANGUAGE_OPTIONS.find((l) => l.code === code);
  return opt?.label ?? code;
}

export function getTranslationSettings(config) {
  const raw = config?.translation;
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_TRANSLATION };
  }

  return {
    enabled: Boolean(raw.enabled),
    targetLanguage: normalizeLanguageCode(raw.targetLanguage, DEFAULT_TRANSLATION.targetLanguage),
    sourceLanguage: normalizeLanguageCode(raw.sourceLanguage, DEFAULT_TRANSLATION.sourceLanguage),
    autoTranslateNewReviews:
      raw.autoTranslateNewReviews !== undefined
        ? Boolean(raw.autoTranslateNewReviews)
        : DEFAULT_TRANSLATION.autoTranslateNewReviews,
    autoTranslateImport:
      raw.autoTranslateImport !== undefined
        ? Boolean(raw.autoTranslateImport)
        : DEFAULT_TRANSLATION.autoTranslateImport,
  };
}

export function mergeTranslationIntoConfig(config, translationPatch) {
  const base = config && typeof config === "object" ? { ...config } : {};
  const current = getTranslationSettings(base);
  base.translation = { ...current, ...translationPatch };
  return base;
}

export function storefrontReviewText(review, translationActive, targetLanguage) {
  if (!translationActive) {
    return {
      title: review.originalTitle ?? review.title ?? null,
      comment: review.originalComment ?? review.comment,
    };
  }

  if (review.translatedLang === targetLanguage) {
    return {
      title: review.title ?? null,
      comment: review.comment,
    };
  }

  return {
    title: review.originalTitle ?? review.title ?? null,
    comment: review.originalComment ?? review.comment,
  };
}

export function reviewHasTranslation(review) {
  return Boolean(review?.originalComment || review?.translatedLang);
}
