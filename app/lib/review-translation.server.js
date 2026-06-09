import db from "../db.server.js";
import { getResolvedOpenRouterKey } from "./openrouter.server.js";
import { hasProAccess, getShopPlanStatus } from "./billing.server.js";
import {
  AUTO_DETECT,
  languageLabel,
  getTranslationSettings,
} from "./review-translation.shared.js";

export {
  AUTO_DETECT,
  LANGUAGE_OPTIONS,
  SOURCE_LANGUAGE_OPTIONS,
  languageLabel,
  getTranslationSettings,
  mergeTranslationIntoConfig,
  storefrontReviewText,
  reviewHasTranslation,
} from "./review-translation.shared.js";

function extractJsonArray(content) {
  if (!content || typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content.trim());
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function buildTranslationPrompt({ items, targetLanguage, sourceLanguage }) {
  const targetName = languageLabel(targetLanguage);
  const sourceHint =
    sourceLanguage && sourceLanguage !== AUTO_DETECT
      ? `Source language is ${languageLabel(sourceLanguage)} (${sourceLanguage}). Only translate if the text is not already in ${targetName}.`
      : "Detect the source language automatically. Only translate text that is not already in the target language.";

  return `Translate product review text to ${targetName} (language code: ${targetLanguage}).
Return ONLY a JSON array with this shape:
[{"id":"string","title":"string or null","comment":"string"}]

Rules:
- ${sourceHint}
- Preserve meaning, tone, and sentiment.
- Keep product and brand names unchanged.
- If text is already in ${targetName}, return it unchanged.
- Include every id from the input.

Input reviews:
${JSON.stringify(items)}`;
}

async function openRouterTranslate({ apiKey, userContent }) {
  const referer = process.env.SHOPIFY_APP_URL || "https://localhost";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "JudgeMe Reviews Translation",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    return { error: `Translation service error (${res.status})` };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "Invalid translation response" };
  }

  const messageContent = data?.choices?.[0]?.message?.content;
  if (!messageContent || typeof messageContent !== "string") {
    return { error: "Empty translation output" };
  }

  return { content: messageContent };
}

/**
 * @param {{ apiKey: string, items: Array<{ id: string, title?: string|null, comment: string }>, targetLanguage: string, sourceLanguage?: string }} opts
 */
export async function translateReviewTexts({
  apiKey,
  items,
  targetLanguage,
  sourceLanguage = AUTO_DETECT,
}) {
  if (!items.length) return { items: [] };

  const payload = items.map((item) => ({
    id: item.id,
    title: item.title ?? null,
    comment: item.comment,
  }));

  const userContent = buildTranslationPrompt({ items: payload, targetLanguage, sourceLanguage });

  const out = await openRouterTranslate({ apiKey, userContent });
  if (out.error) return { items: [], error: out.error };

  const parsed = extractJsonArray(out.content);
  if (!parsed) return { items: [], error: "Could not parse translation output" };

  const byId = new Map(
    parsed.map((row) => [
      String(row.id),
      {
        title: row.title != null ? String(row.title) : null,
        comment: String(row.comment ?? "").trim(),
      },
    ]),
  );

  const itemsOut = items.map((item) => {
    const hit = byId.get(item.id);
    if (!hit || !hit.comment) {
      return {
        id: item.id,
        title: item.title ?? null,
        comment: item.comment,
      };
    }
    return { id: item.id, title: hit.title, comment: hit.comment };
  });

  return { items: itemsOut };
}

function applyTranslationToRecord(record, hit, targetLanguage) {
  if (!hit?.comment || hit.comment === record.comment) {
    return record;
  }
  return {
    ...record,
    originalComment: record.comment,
    originalTitle: record.title ?? null,
    comment: hit.comment,
    title: hit.title ?? record.title ?? null,
    translatedLang: targetLanguage,
  };
}

/**
 * Apply translations to import/create records (mutates copies).
 * @param {Array<object>} records
 */
export async function translateImportRecords(
  records,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
) {
  if (!records.length || !apiKey) return { records, error: null };

  const CHUNK = 20;
  const translated = [];

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const batch = chunk.map((r, idx) => ({
      id: String(i + idx),
      title: r.title ?? null,
      comment: r.comment,
    }));

    const { items, error } = await translateReviewTexts({
      apiKey,
      items: batch,
      targetLanguage,
      sourceLanguage,
    });
    if (error) return { records, error };

    chunk.forEach((record, idx) => {
      const hit = items.find((t) => t.id === String(i + idx));
      translated.push(applyTranslationToRecord(record, hit, targetLanguage));
    });
  }

  return { records: translated, error: null };
}

/**
 * Bulk-translate existing reviews for a shop.
 * @returns {{ translated: number, skipped: number, error?: string }}
 */
async function persistReviewTranslation(review, hit, targetLanguage) {
  if (!hit?.comment) return false;

  const sourceComment = review.originalComment ?? review.comment;
  const sourceTitle = review.originalTitle ?? review.title ?? null;

  if (hit.comment === sourceComment) return false;

  await db.review.update({
    where: { id: review.id },
    data: {
      originalComment: sourceComment,
      originalTitle: sourceTitle,
      comment: hit.comment,
      title: hit.title ?? sourceTitle,
      translatedLang: targetLanguage,
    },
  });
  return true;
}

async function translateAndPersistChunk(chunk, targetLanguage, apiKey, sourceLanguage) {
  const batch = chunk.map((r) => ({
    id: r.id,
    title: r.originalTitle ?? r.title ?? null,
    comment: r.originalComment ?? r.comment,
  }));

  const { items, error } = await translateReviewTexts({
    apiKey,
    items: batch,
    targetLanguage,
    sourceLanguage,
  });
  if (error) return { translated: 0, error };

  let translated = 0;
  for (const r of chunk) {
    const hit = items.find((t) => t.id === r.id);
    if (await persistReviewTranslation(r, hit, targetLanguage)) {
      translated += 1;
    }
  }
  return { translated, error: null };
}

/**
 * Bulk-translate existing reviews for a shop (full run — use batch for large shops).
 * @returns {{ translated: number, skipped: number, error?: string }}
 */
export async function bulkTranslateShopReviews(
  shop,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
  { force = false } = {},
) {
  const reviews = await db.review.findMany({
    where: { shop },
    select: {
      id: true,
      title: true,
      comment: true,
      originalComment: true,
      originalTitle: true,
      translatedLang: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const pending = force
    ? reviews
    : reviews.filter((r) => r.translatedLang !== targetLanguage);
  if (pending.length === 0) {
    return { translated: 0, skipped: reviews.length };
  }

  const CHUNK = 20;
  let translated = 0;

  for (let i = 0; i < pending.length; i += CHUNK) {
    const chunk = pending.slice(i, i + CHUNK);
    const result = await translateAndPersistChunk(
      chunk,
      targetLanguage,
      apiKey,
      sourceLanguage,
    );
    if (result.error) {
      return { translated, skipped: reviews.length - translated, error: result.error };
    }
    translated += result.translated;
  }

  return { translated, skipped: reviews.length - translated };
}

/**
 * Translate one batch of pending reviews (client-driven progress loop).
 */
export async function bulkTranslateShopReviewsBatch(
  shop,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
  { cursor = 0, batchSize = 20, force = false } = {},
) {
  const reviews = await db.review.findMany({
    where: { shop },
    select: {
      id: true,
      title: true,
      comment: true,
      originalComment: true,
      originalTitle: true,
      translatedLang: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const pending = force
    ? reviews
    : reviews.filter((r) => r.translatedLang !== targetLanguage);

  const slice = pending.slice(cursor, cursor + batchSize);
  if (slice.length === 0) {
    return {
      translated: 0,
      skipped: 0,
      done: true,
      nextCursor: cursor,
      totalPending: pending.length,
    };
  }

  const result = await translateAndPersistChunk(
    slice,
    targetLanguage,
    apiKey,
    sourceLanguage,
  );
  if (result.error) {
    return {
      translated: 0,
      skipped: 0,
      done: false,
      nextCursor: cursor,
      totalPending: pending.length,
      error: result.error,
    };
  }

  const nextCursor = cursor + slice.length;
  return {
    translated: result.translated,
    skipped: slice.length - result.translated,
    done: nextCursor >= pending.length,
    nextCursor,
    totalPending: pending.length,
  };
}

/** Translate specific reviews by ID (manual bulk from admin). */
export async function translateReviewIds(
  shop,
  reviewIds,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
  { force = false } = {},
) {
  if (!reviewIds.length) {
    return { translated: 0, skipped: 0, errors: [] };
  }

  const reviews = await db.review.findMany({
    where: { shop, id: { in: reviewIds } },
    select: {
      id: true,
      title: true,
      comment: true,
      originalComment: true,
      originalTitle: true,
      translatedLang: true,
    },
  });

  const toTranslate = force
    ? reviews
    : reviews.filter((r) => r.translatedLang !== targetLanguage);

  if (toTranslate.length === 0) {
    return { translated: 0, skipped: reviews.length, errors: [] };
  }

  const CHUNK = 20;
  let translated = 0;
  const errors = [];

  for (let i = 0; i < toTranslate.length; i += CHUNK) {
    const chunk = toTranslate.slice(i, i + CHUNK);
    const result = await translateAndPersistChunk(
      chunk,
      targetLanguage,
      apiKey,
      sourceLanguage,
    );
    if (result.error) {
      errors.push(result.error);
      break;
    }
    translated += result.translated;
  }

  return {
    translated,
    skipped: reviews.length - translated,
    errors,
  };
}

/** Translate a single existing review and persist. */
export async function translateSingleReview(
  reviewId,
  shop,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
) {
  const review = await db.review.findFirst({
    where: { id: reviewId, shop },
    select: {
      id: true,
      title: true,
      comment: true,
      originalComment: true,
      originalTitle: true,
      translatedLang: true,
    },
  });

  if (!review) {
    return { ok: false, error: "Review not found." };
  }

  const sourceComment = review.originalComment ?? review.comment;
  const sourceTitle = review.originalTitle ?? review.title ?? null;

  const { items, error } = await translateReviewTexts({
    apiKey,
    items: [{ id: review.id, title: sourceTitle, comment: sourceComment }],
    targetLanguage,
    sourceLanguage,
  });

  if (error) {
    return { ok: false, error };
  }

  const hit = items[0];
  if (!hit?.comment || hit.comment === sourceComment) {
    return {
      ok: true,
      unchanged: true,
      review: {
        ...review,
        title: sourceTitle,
        comment: sourceComment,
        originalComment: review.originalComment,
        originalTitle: review.originalTitle,
        translatedLang: review.translatedLang,
      },
    };
  }

  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      originalComment: sourceComment,
      originalTitle: sourceTitle,
      comment: hit.comment,
      title: hit.title ?? sourceTitle,
      translatedLang: targetLanguage,
    },
  });

  return { ok: true, unchanged: false, review: updated };
}

/** Translate a single new review before save (returns data patch). */
export async function translateNewReviewData(
  data,
  targetLanguage,
  apiKey,
  sourceLanguage = AUTO_DETECT,
) {
  const { items, error } = await translateReviewTexts({
    apiKey,
    items: [{ id: "new", title: data.title ?? null, comment: data.comment }],
    targetLanguage,
    sourceLanguage,
  });
  if (error || !items[0]?.comment) return { data, error };

  const hit = items[0];
  if (hit.comment === data.comment) return { data, error: null };

  return {
    data: {
      ...data,
      originalComment: data.comment,
      originalTitle: data.title ?? null,
      comment: hit.comment,
      title: hit.title ?? data.title ?? null,
      translatedLang: targetLanguage,
    },
    error: null,
  };
}

/** Apply auto-translation to review create payload when settings allow. */
export async function maybeAutoTranslateReviewData(shop, reviewData) {
  try {
    const ctx = await getActiveTranslationContext(shop);
    if (
      !ctx.premium ||
      !ctx.apiKey ||
      !ctx.translation.enabled ||
      !ctx.translation.autoTranslateNewReviews
    ) {
      return { data: reviewData, error: null };
    }

    const { requireFeatureUsage } = await import("./usage.server.js");
    const usageCheck = await requireFeatureUsage(ctx.planStatus, "auto_translate");
    if (!usageCheck.ok) {
      return { data: reviewData, error: usageCheck.message };
    }

    const { data, error } = await translateNewReviewData(
      reviewData,
      ctx.translation.targetLanguage,
      ctx.apiKey,
      ctx.translation.sourceLanguage,
    );
    return { data, error };
  } catch (err) {
    console.error("[translation] auto-translate new review failed (non-fatal):", err);
    return { data: reviewData, error: err?.message ?? "Translation error" };
  }
}

/** Load settings + verify premium for translation features. */
export async function getActiveTranslationContext(shop) {
  const planStatus = await getShopPlanStatus(shop);
  const premium = hasProAccess(planStatus);
  const apiKey = premium ? getResolvedOpenRouterKey() : null;

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }

  const translation = getTranslationSettings(config);
  const active = premium && translation.enabled && Boolean(apiKey);
  const canTranslate = premium && Boolean(apiKey);

  return {
    trialStatus: planStatus,
    planStatus,
    premium,
    apiKey,
    translation,
    active,
    canTranslate,
    config,
  };
}
