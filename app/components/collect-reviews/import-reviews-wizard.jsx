/* eslint-disable react/prop-types, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import Papa from "papaparse";
import { ChevronLeft } from "lucide-react";
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
} from "../../lib/csv-import.shared.js";
import {
  Card,
  Stack,
  PrimaryButton,
  SecondaryButton,
  Banner,
} from "../admin-ui";
import { PremiumTrialBadge } from "../premium-trial-banner";
import {
  ImportStepper,
  SourceGrid,
  FileDropZone,
  ColumnMappingRow,
  MappingErrorsList,
  ToggleSwitch,
  PreviewTable,
  PreviewSummary,
  PreviewStats,
  StepBadge,
  TemplateDownloadBar,
  ExportInstructions,
} from "../import-wizard-ui";

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

export function ImportReviewsWizard({
  hasPremium,
  planStatus,
  trialStatus,
  productIndexCount,
  defaultAutoTranslateImport,
  translationTargetLabel,
}) {
  const importsRemaining = planStatus?.featureUsage?.review_imports?.remaining;
  const location = useLocation();
  const fetcher = useFetcher();
  const embedNavigate = useEmbedNavigate();

  const [step, setStep] = useState(1);
  const [wizard, dispatch] = useReducer(
    wizardReducer,
    defaultAutoTranslateImport,
    createInitialWizard,
  );
  const [fileError, setFileError] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  const isSubmitting = fetcher.state !== "idle";
  const actionError = fetcher.data?.error ?? null;
  const isImporting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("_intent") === "import";

  const goToStep = useCallback((n) => {
    const next = n >= 1 && n <= 4 ? n : 1;
    setStep(next);
  }, []);

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

  const handleFile = useCallback(async (file) => {
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
  }, []);

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
    if (!fetcher.data) return;

    if (fetcher.data.ok && fetcher.data.previewRows) {
      setPreviewResult(fetcher.data);
      return;
    }

    if (fetcher.data.ok && typeof fetcher.data.imported === "number") {
      if (fetcher.data.imported > 0 && fetcher.data.redirectTo) {
        embedNavigate(fetcher.data.redirectTo);
        return;
      }
      setImportResult(fetcher.data);
    }
  }, [fetcher.data, embedNavigate]);

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
    setImportResult(null);
    const payload = JSON.stringify({
      source: wizard.source,
      mapping: wizard.mapping,
      settings: wizard.settings,
      rows: wizard.rows,
    });
    fetcher.submit({ _intent: "import", payload }, { method: "post" });
  };

  const buildImportMessage = (res) => {
    if (!res) return null;
    const { imported = 0, skipped = 0, summary } = res;
    const dups = summary?.duplicate ?? 0;
    const notFound = summary?.productNotFound ?? 0;
    const invalid = summary?.invalid ?? 0;

    if (imported === 0) {
      const reasons = [];
      if (dups > 0) reasons.push(`${dups} duplicate row${dups === 1 ? "" : "s"}`);
      if (notFound > 0)
        reasons.push(`${notFound} row${notFound === 1 ? "" : "s"} with no matching product`);
      if (invalid > 0)
        reasons.push(`${invalid} row${invalid === 1 ? "" : "s"} missing required fields`);
      const detail = reasons.length ? ` — ${reasons.join(", ")}.` : ".";
      return {
        tone: "warning",
        text: `No new reviews were imported${detail}`,
      };
    }

    const extras = [];
    if (skipped > 0) extras.push(`${skipped} skipped`);
    if (dups > 0 && !extras.includes(`${dups} duplicates`))
      extras.push(`${dups} duplicate${dups === 1 ? "" : "s"}`);
    const suffix = extras.length ? ` (${extras.join(", ")})` : "";
    return {
      tone: "success",
      text: `Imported ${imported.toLocaleString()} review${imported === 1 ? "" : "s"}${suffix}.`,
    };
  };

  const importBanner = buildImportMessage(importResult);

  const targetOptions = TARGET_FIELDS;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <PremiumTrialBadge trialStatus={trialStatus} />
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
          <Banner tone="critical">
            {Array.isArray(actionError) ? (
              <MappingErrorsList errors={actionError} />
            ) : (
              actionError
            )}
          </Banner>
        </div>
      ) : null}

      <Stack>
        {step === 1 ? (
          <Card title="Where are you importing from?" style={{ padding: 20 }}>
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
              requiredFields={exportGuide.requiredFields}
              sourceName={selectedSource.name}
              onDownload={handleDownloadTemplate}
              downloaded={templateDownloaded}
              showTemplate={showTemplate}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <PrimaryButton disabled={!canProceedStep1} onClick={() => goToStep(2)}>
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
            <Card
              title="Match your columns"
              description="For each column in your file, choose what it contains using the dropdown on the right."
              style={{ padding: 20 }}
            >
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
                  COLUMN IN YOUR FILE
                </span>
                <span />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#6d7175", letterSpacing: "0.04em" }}>
                  WHAT IT CONTAINS
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
                    <MappingErrorsList errors={mappingValidation.errors} />
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

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
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

            {isImporting ? (
              <div style={{ padding: 32, textAlign: "center", fontWeight: 600, color: "#6d7175" }}>
                Importing your reviews...
              </div>
            ) : fetcher.state !== "idle" && !previewResult ? (
              <div style={{ padding: 32, textAlign: "center", fontWeight: 600, color: "#6d7175" }}>
                Validating your import...
              </div>
            ) : (
              <>
                {importBanner ? (
                  <div style={{ marginBottom: 16 }}>
                    <Banner tone={importBanner.tone}>{importBanner.text}</Banner>
                  </div>
                ) : null}
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
                {isSubmitting ? "Importing..." : "Start Import"}
              </PrimaryButton>
            </div>
          </Card>
        ) : null}
      </Stack>
    </>
  );
}
