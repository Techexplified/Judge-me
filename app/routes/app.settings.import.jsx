/* eslint-disable react/prop-types, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  data,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import Papa from "papaparse";
import { ChevronLeft } from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { hasProAccess, serializePlanStatus } from "../lib/billing.server.js";
import {
  syncProductIndex,
  hasRunProductIndexSync,
  markProductIndexSyncDone,
} from "../lib/product-index.server.js";
import {
  SOURCE_LIST,
  SOURCE_PRESETS,
  TARGET_FIELDS,
  autoMapColumns,
  validateMapping,
  IMPORT_LIMITS,
  DEFAULT_SETTINGS,
  downloadTemplateCsv,
  getExportInstructions,
  supportsImportTemplate,
} from "../lib/csv-import.shared.js";
import {
  getTranslationSettings,
  languageLabel,
} from "../lib/review-translation.shared.js";
import {
  Card,
  Stack,
  PrimaryButton,
  SecondaryButton,
  Banner,
} from "../components/admin-ui";
import { PremiumTrialBadge } from "../components/premium-trial-banner";
import {
  ImportStepper,
  SourceGrid,
  FileDropZone,
  ColumnMappingRow,
  ToggleSwitch,
  PreviewTable,
  PreviewSummary,
  PreviewStats,
  StepBadge,
  TemplateDownloadBar,
  ExportInstructions,
} from "../components/import-wizard-ui";

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
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
    await syncProductIndex(admin, shop);
    await markProductIndexSyncDone(shop);
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
};

export const action = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
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

  const formData = await request.formData();
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
    return data({ error: mappingCheck.errors.join(" ") }, { status: 400 });
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
    const readyCount = validated.filter((r) => r.ready).length;
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

    throw embedRedirect(
      `/app/reviews?imported=${imported}&skipped=${Math.max(totalSkipped, batchSkipped)}`,
      request,
    );
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

const initialWizard = {
  source: "loox",
  file: null,
  headers: [],
  rows: [],
  mapping: {},
  matchedFields: new Set(),
  settings: { ...DEFAULT_SETTINGS },
  parseError: null,
};

function createInitialWizard(defaultAutoTranslateImport) {
  return {
    ...initialWizard,
    settings: { ...DEFAULT_SETTINGS, autoTranslate: Boolean(defaultAutoTranslateImport) },
  };
}

function wizardReducer(state, action) {
  switch (action.type) {
    case "SET_SOURCE": {
      if (state.headers.length > 0) {
        const { mapping, matchedFields } = autoMapColumns(state.headers, action.source);
        return { ...state, source: action.source, mapping, matchedFields };
      }
      return { ...state, source: action.source };
    }
    case "SET_FILE_DATA": {
      const { headers, rows, file, parseError } = action;
      if (parseError) {
        return { ...state, file, headers: [], rows: [], mapping: {}, matchedFields: new Set(), parseError };
      }
      const { mapping, matchedFields } = autoMapColumns(headers, state.source);
      return {
        ...state,
        file,
        headers,
        rows,
        mapping,
        matchedFields,
        parseError: null,
      };
    }
    case "SET_MAPPING":
      return {
        ...state,
        mapping: { ...state.mapping, [action.csvColumn]: action.target },
        matchedFields: new Set(),
      };
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "RESET_FILE":
      return {
        ...state,
        file: null,
        headers: [],
        rows: [],
        mapping: {},
        matchedFields: new Set(),
        parseError: null,
      };
    default:
      return state;
  }
}

function parseCsvFile(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta?.fields ?? [];
        const rows = results.data ?? [];
        resolve({ headers, rows, error: null });
      },
      error: (err) => {
        resolve({ headers: [], rows: [], error: err.message || "Failed to parse CSV." });
      },
    });
  });
}

export default function ImportReviewsPage() {
  const {
    hasPremium,
    planStatus,
    trialStatus,
    productIndexCount,
    defaultAutoTranslateImport,
    translationTargetLabel,
  } = useLoaderData();
  const importsRemaining = planStatus?.featureUsage?.review_imports?.remaining;
  const location = useLocation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher();

  const [step, setStep] = useState(1);
  const [wizard, dispatch] = useReducer(
    wizardReducer,
    defaultAutoTranslateImport,
    createInitialWizard,
  );
  const [fileError, setFileError] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  const isSubmitting = fetcher.state !== "idle";
  const actionError = fetcher.data?.error ?? null;

  const goToStep = useCallback((n) => {
    const next = n >= 1 && n <= 4 ? n : 1;
    setStep(next);
  }, []);

  const reviewsHref = mergeShopifyEmbedParams("/app/reviews", location.search);

  const selectedSource = SOURCE_PRESETS[wizard.source] ?? SOURCE_PRESETS.custom;
  const exportGuide = useMemo(() => getExportInstructions(wizard.source), [wizard.source]);
  const showTemplate = supportsImportTemplate(wizard.source);

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplateCsv(wizard.source);
    setTemplateDownloaded(true);
  }, [wizard.source]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sourceParam = params.get("source");
    if (sourceParam && SOURCE_PRESETS[sourceParam]) {
      dispatch({ type: "SET_SOURCE", source: sourceParam });
    }
  }, [location.search]);

  useEffect(() => {
    setTemplateDownloaded(false);
  }, [wizard.source]);

  const embedNavigate = useCallback(
    (to) => {
      const target = mergeShopifyEmbedParams(to, location.search);
      if (typeof shopify?.navigate === "function") {
        shopify.navigate(target);
      } else {
        navigate(target);
      }
    },
    [shopify, location.search, navigate],
  );

  const handleFile = useCallback(
    async (file) => {
      setFileError(null);
      if (file.size > IMPORT_LIMITS.maxBytes) {
        setFileError(`File is too large. Maximum size is ${IMPORT_LIMITS.maxBytes / (1024 * 1024)} MB.`);
        return;
      }
      const { headers, rows, error } = await parseCsvFile(file);
      if (error) {
        dispatch({ type: "SET_FILE_DATA", file, headers: [], rows: [], parseError: error });
        setFileError(error);
        return;
      }
      if (rows.length === 0) {
        setFileError("CSV file contains no data rows.");
        return;
      }
      if (rows.length > IMPORT_LIMITS.maxRows) {
        setFileError(
          `Too many rows (${rows.length.toLocaleString()}). Maximum is ${IMPORT_LIMITS.maxRows.toLocaleString()}.`,
        );
        return;
      }
      dispatch({ type: "SET_FILE_DATA", file, headers, rows, parseError: null });
    },
    [],
  );

  const mappingValidation = useMemo(
    () => validateMapping(wizard.mapping),
    [wizard.mapping],
  );

  const canProceedStep1 = Boolean(wizard.source);
  const canProceedStep2 = wizard.rows.length > 0 && !wizard.parseError;
  const canProceedStep3 = mappingValidation.valid;

  const prevStepRef = useRef(step);

  useEffect(() => {
    if (step === 2 && !wizard.source) goToStep(1);
    else if (step === 3 && wizard.rows.length === 0) goToStep(2);
    else if (step === 4 && (!mappingValidation.valid || wizard.rows.length === 0)) goToStep(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      setPreviewResult(fetcher.data);
    }
  }, [fetcher.data]);

  useEffect(() => {
    const enteredStep4 = step === 4 && prevStepRef.current !== 4;
    prevStepRef.current = step;
    if (enteredStep4 && wizard.rows.length > 0) {
      setPreviewResult(null);
      const payload = JSON.stringify({
        source: wizard.source,
        mapping: wizard.mapping,
        settings: wizard.settings,
        rows: wizard.rows,
      });
      fetcher.submit({ _intent: "preview", payload }, { method: "post" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleImport = () => {
    const payload = JSON.stringify({
      source: wizard.source,
      mapping: wizard.mapping,
      settings: wizard.settings,
      rows: wizard.rows,
    });
    fetcher.submit({ _intent: "import", payload }, { method: "post" });
  };

  const targetOptions = TARGET_FIELDS;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6d7175", lineHeight: 1.5 }}>
          Migrate reviews from Loox, Stamped, Yotpo, Judge.me, Amazon, Flipkart, and more in under
          2 minutes.
        </p>
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <PremiumTrialBadge trialStatus={trialStatus} />
        </div>
      </div>

      <ImportStepper currentStep={step} />

      {!hasPremium ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="info">
            Free plan includes {planStatus?.featureUsage?.review_imports?.limit ?? 50} CSV imports
            per month
            {planStatus?.featureUsage?.review_imports
              ? ` (${planStatus.featureUsage.review_imports.remaining} remaining).`
              : "."}{" "}
            Auto translate during import requires Pro.
          </Banner>
        </div>
      ) : null}

      {productIndexCount === 0 ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="info">
            No products indexed yet. Product matching requires at least one product in your store.
          </Banner>
        </div>
      ) : null}

      {actionError ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="critical">{actionError}</Banner>
        </div>
      ) : null}

      <Stack>
        {step === 1 ? (
          <Card
            title="Where are you importing from?"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span />
              <StepBadge step={1} />
            </div>
            <SourceGrid
              sources={SOURCE_LIST}
              selectedId={wizard.source}
              onSelect={(id) => dispatch({ type: "SET_SOURCE", source: id })}
            />
            <ExportInstructions
              title={exportGuide.title}
              steps={exportGuide.steps}
              sourceName={selectedSource.name}
              onDownload={handleDownloadTemplate}
              downloaded={templateDownloaded}
              showTemplate={showTemplate}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 24,
              }}
            >
              <PrimaryButton
                disabled={!canProceedStep1}
                onClick={() => goToStep(2)}
              >
                Continue
              </PrimaryButton>
            </div>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card title="Upload Your CSV File" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span />
              <StepBadge step={2} />
            </div>
            <FileDropZone
              file={wizard.file}
              onFile={handleFile}
              error={fileError || wizard.parseError}
            />
            {showTemplate ? (
              <TemplateDownloadBar
                sourceName={selectedSource.name}
                onDownload={handleDownloadTemplate}
                downloaded={templateDownloaded}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
                gap: 10,
              }}
            >
              <SecondaryButton onClick={() => goToStep(1)}>
                <ChevronLeft size={16} style={{ marginRight: 4 }} />
                Back
              </SecondaryButton>
              <PrimaryButton disabled={!canProceedStep2} onClick={() => goToStep(3)}>
                Continue
              </PrimaryButton>
            </div>
          </Card>
        ) : null}

        {step === 3 ? (
          <>
            <Card title="Column Mapping" description="We detected your CSV columns. Map them to our fields below." style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span />
                <StepBadge step={3} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 24px 1fr",
                  gap: 12,
                  padding: "8px 0 12px",
                  borderBottom: "2px solid #e5ebe8",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#6d7175", letterSpacing: "0.04em" }}>
                  YOUR CSV COLUMN
                </span>
                <span />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#6d7175", letterSpacing: "0.04em" }}>
                  MAPS TO
                </span>
              </div>
              {wizard.headers.map((col) => (
                <ColumnMappingRow
                  key={col}
                  csvColumn={col}
                  value={wizard.mapping[col] ?? "skip"}
                  options={targetOptions}
                  autoMatched={wizard.matchedFields.has(wizard.mapping[col])}
                  onChange={(csvCol, target) =>
                    dispatch({ type: "SET_MAPPING", csvColumn: csvCol, target })
                  }
                />
              ))}
              {!mappingValidation.valid ? (
                <div style={{ marginTop: 12 }}>
                  <Banner tone="critical">
                    {mappingValidation.errors.join(" ")}
                  </Banner>
                </div>
              ) : null}
            </Card>

            <Card title="Import Settings" style={{ padding: 20 }}>
              <ToggleSwitch
                label="Publish reviews immediately"
                description="Imported reviews will be live on your store right away."
                checked={wizard.settings.publishImmediately}
                onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { publishImmediately: v } })}
              />
              <ToggleSwitch
                label="Skip duplicate reviews"
                description="Detect and skip reviews that already exist in your store."
                checked={wizard.settings.skipDuplicates}
                onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { skipDuplicates: v } })}
              />
              <ToggleSwitch
                label="Filter by minimum rating"
                description="Only import reviews with 4 stars or above as published."
                checked={wizard.settings.filterMinRating}
                onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { filterMinRating: v } })}
              />
              <ToggleSwitch
                label="Auto translate imported reviews"
                description={`Translate to ${translationTargetLabel} using your Translation settings (source and target language).`}
                checked={wizard.settings.autoTranslate}
                onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { autoTranslate: v } })}
                disabled={!hasPremium}
                proBadge={!hasPremium}
              />
            </Card>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <SecondaryButton onClick={() => goToStep(2)}>
                <ChevronLeft size={16} style={{ marginRight: 4 }} />
                Back
              </SecondaryButton>
              <PrimaryButton
                disabled={!canProceedStep3}
                onClick={() => {
                  if (canProceedStep3) goToStep(4);
                }}
              >
                Preview Import
              </PrimaryButton>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <Card
            title="Preview: First 5 Rows"
            description="Confirm everything looks right before importing."
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span />
              <StepBadge step={4} />
            </div>

            {fetcher.state !== "idle" && !previewResult ? (
              <div style={{ padding: 32, textAlign: "center", fontWeight: 600, color: "#6d7175" }}>
                Validating your importΓÇª
              </div>
            ) : (
              <>
                <PreviewTable rows={previewResult?.previewRows ?? []} />
                <div style={{ marginTop: 20 }}>
                  <PreviewSummary summary={previewResult?.summary} settings={wizard.settings} />
                  <PreviewStats summary={previewResult?.summary} />
                </div>
                {previewResult?.summary?.ready === 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <Banner tone="critical">
                      No rows are ready to import. Check product handles/IDs match your store catalog,
                      and verify required fields are mapped correctly.
                    </Banner>
                  </div>
                ) : null}
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 24,
                gap: 10,
              }}
            >
              <SecondaryButton onClick={() => goToStep(3)} disabled={isSubmitting}>
                Back
              </SecondaryButton>
              <PrimaryButton
                onClick={handleImport}
                disabled={
                  isSubmitting ||
                  !previewResult?.summary?.ready ||
                  (!hasPremium && importsRemaining != null && importsRemaining <= 0)
                }
                loading={isSubmitting}
              >
                {isSubmitting ? "ImportingΓÇª" : "Start Import"}
              </PrimaryButton>
            </div>
          </Card>
        ) : null}
      </Stack>
    </>
  );
}
