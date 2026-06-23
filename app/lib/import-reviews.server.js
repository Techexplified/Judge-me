import { data } from "react-router";
import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { hasProAccess, serializePlanStatus } from "../lib/billing.server.js";
import {
  syncProductIndex,
  hasRunProductIndexSync,
  markProductIndexSyncDone,
} from "../lib/product-index.server.js";
import {
  validateMapping,
  IMPORT_LIMITS,
  DEFAULT_SETTINGS,
} from "../lib/csv-import.shared.js";
import { getTranslationSettings, languageLabel } from "../lib/review-translation.shared.js";

export async function importReviewsLoader({ request, session, admin, billing }) {
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);

  const templateSource = url.searchParams.get("template");
  if (templateSource) {
    const { generateTemplateCsv } = await import("../lib/csv-import.server.js");
    const csv = generateTemplateCsv(templateSource);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="review-import-template-${templateSource}.csv"`,
      },
    });
  }

  if (!(await hasRunProductIndexSync(shop))) {
    syncProductIndex(admin, shop)
      .then(() => markProductIndexSyncDone(shop))
      .catch((err) => console.error("[product-index] import loader sync failed:", err));
  }

  const productIndexRows = await db.productIndex.findMany({
    where: { shop },
    select: { handle: true, productId: true, sku: true, title: true },
  });

  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const hasPremium = hasProAccess(planStatus);
  const fingerprintCount = await db.review.count({ where: { shop } });

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

  return {
    shop,
    productIndexCount: productIndexRows.length,
    hasPremium,
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    fingerprintCount,
    defaultAutoTranslateImport: translation.autoTranslateImport,
    translationTargetLabel: languageLabel(translation.targetLanguage),
  };
}

export async function importReviewsAction({ request, session, admin, billing, formData: formDataIn }) {
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus, requireFeatureUsage, checkFeatureAccess, consumeFeatureUsage } =
    await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const hasPremium = hasProAccess(planStatus);

  const {
    validateRows,
    rowsToReviewRecords,
    buildProductLookup,
  } = await import("../lib/csv-import.server.js");
  const { getExistingFingerprints, batchInsertReviews } = await import(
    "../lib/review-dedup.server.js"
  );
  const { getResolvedOpenRouterKey } = await import("../lib/openrouter.server.js");

  const formData = formDataIn ?? (await request.formData());
  const intent = formData.get("_intent");
  const payloadRaw = formData.get("payload");

  if (!payloadRaw || typeof payloadRaw !== "string") {
    return data({ error: "Missing import payload." }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return data({ error: "Invalid import payload." }, { status: 400 });
  }

  const { mapping, settings, rows } = payload;
  if (!mapping || !settings || !Array.isArray(rows)) {
    return data({ error: "Incomplete import payload." }, { status: 400 });
  }

  if (rows.length > IMPORT_LIMITS.maxRows) {
    return data(
      { error: `Too many rows. Maximum is ${IMPORT_LIMITS.maxRows.toLocaleString()}.` },
      { status: 400 },
    );
  }

  const mappingCheck = validateMapping(mapping);
  if (!mappingCheck.valid) {
    return data({ error: mappingCheck.errors }, { status: 400 });
  }

  const productIndexRows = await db.productIndex.findMany({
    where: { shop },
    select: { handle: true, productId: true, sku: true, title: true },
  });

  const lookup = buildProductLookup(productIndexRows);
  const existingFingerprints = await getExistingFingerprints(shop);
  const importSettings = { ...DEFAULT_SETTINGS, ...settings };

  const { validated, summary } = validateRows(
    rows,
    mapping,
    lookup,
    existingFingerprints,
    importSettings,
    shop,
  );

  if (intent === "preview") {
    return data({
      previewRows: validated.slice(0, 5),
      summary,
      ok: true,
    });
  }

  if (intent === "import") {
    const readyCount = validated.filter((r) => r.importable && r.productId).length;
    const importCheck = await checkFeatureAccess(planStatus, "review_imports", readyCount);
    if (!importCheck.ok) {
      return data({ error: importCheck.message }, { status: 403 });
    }

    let records = rowsToReviewRecords(validated, shop, importSettings);

    if (importSettings.autoTranslate) {
      if (!hasPremium) {
        return data(
          { error: "Auto translate requires a Pro plan. Upgrade in Settings." },
          { status: 403 },
        );
      }
      const apiKey = getResolvedOpenRouterKey();
      if (!apiKey) {
        return data({ error: "Translation service is temporarily unavailable." }, { status: 503 });
      }

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
      const targetLanguage = translation.targetLanguage;

      const translateUsage = await requireFeatureUsage(planStatus, "auto_translate", records.length);
      if (!translateUsage.ok) {
        return data({ error: translateUsage.message }, { status: 403 });
      }

      const { translateImportRecords } = await import("../lib/review-translation.server.js");
      const { records: translatedRecords, error: translateError } = await translateImportRecords(
        records,
        targetLanguage,
        apiKey,
        translation.sourceLanguage,
      );
      if (translateError) {
        return data({ error: `Translation failed: ${translateError}` }, { status: 502 });
      }
      records = translatedRecords;
    }

    const { imported, skipped: batchSkipped } = await batchInsertReviews(
      shop,
      records,
      existingFingerprints,
    );

    if (imported > 0) {
      await consumeFeatureUsage(shop, "review_imports", imported);
    }

    const totalSkipped = summary.total - imported;

    const published = records.filter((r) => r.status === "PUBLISHED");
    const { emitReviewCollectedFlowTrigger } = await import("../lib/flow-review-trigger.server.js");
    for (const r of published.slice(0, 50)) {
      await emitReviewCollectedFlowTrigger(shop, r, { admin });
    }

    const skipped = Math.max(totalSkipped, batchSkipped);
    const duplicates = summary.duplicate ?? 0;
    const invalid = summary.invalid ?? 0;
    const productNotFound = summary.productNotFound ?? 0;

    return data({
      ok: true,
      imported,
      skipped,
      summary: {
        total: summary.total,
        ready: summary.ready,
        duplicate: duplicates,
        invalid,
        productNotFound,
        lowRating: summary.lowRating ?? 0,
      },
      // Only navigate away on real success so the user can see duplicate / error
      // breakdowns inline when nothing was actually imported.
      redirectTo:
        imported > 0
          ? `/app/manage-reviews?imported=${imported}&skipped=${skipped}`
          : null,
    });
  }

  return data({ error: "Unknown action." }, { status: 400 });
}
