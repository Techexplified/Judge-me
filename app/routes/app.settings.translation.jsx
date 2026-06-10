/* eslint-disable react/prop-types, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLoaderData, useSubmit, useNavigation, useActionData, useFetcher } from "react-router";
import { Languages, Globe, CheckCircle2, RefreshCw, Sparkles, Upload } from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { hasProAccess, serializePlanStatus } from "../lib/billing.server.js";
import { getResolvedOpenRouterKey } from "../lib/openrouter.server";
import {
  AUTO_DETECT,
  languageLabel,
  LANGUAGE_OPTIONS,
  SOURCE_LANGUAGE_OPTIONS,
  getTranslationSettings,
  mergeTranslationIntoConfig,
} from "../lib/review-translation.shared.js";
import {
  Banner,
  Card,
  PrimaryButton,
  SecondaryButton,
  Stack,
} from "../components/admin-ui";
import { PremiumTrialBadge, PremiumGateBanner } from "../components/premium-trial-banner";
import { ToggleSwitch } from "../components/import-wizard-ui";

function LanguageSelect({ id, value, options, onChange, disabled, shopLocale, hint }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "#202223",
          marginBottom: 6,
        }}
      >
        {hint}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #c9cccf",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit",
          background: disabled ? "#f6f6f7" : "#fff",
        }}
      >
        {options.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
            {lang.code === shopLocale && lang.code !== AUTO_DETECT ? " (store default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop, billing);
  const premium = hasProAccess(planStatus);

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

  let shopLocale = "en";
  try {
    const resp = await admin.graphql(`#graphql
      query ShopLocale {
        localization {
          availableLocales { locale primary }
        }
      }
    `);
    const json = await resp.json();
    const locales = json?.data?.localization?.availableLocales ?? [];
    const primary = locales.find((l) => l.primary) ?? locales[0];
    if (primary?.locale) {
      shopLocale = String(primary.locale).split("-")[0];
    }
  } catch {
    shopLocale = "en";
  }

  const totalReviews = await db.review.count({ where: { shop } });
  const translatedCount = await db.review.count({
    where: { shop, translatedLang: translation.targetLanguage },
  });

  return {
    shop,
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    premium,
    aiAvailable: premium && Boolean(getResolvedOpenRouterKey()),
    translation,
    shopLocale,
    totalReviews,
    translatedCount,
    languages: LANGUAGE_OPTIONS,
    sourceLanguages: SOURCE_LANGUAGE_OPTIONS,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop);

  if (!hasProAccess(planStatus)) {
    return {
      error: "Pro plan required. Upgrade in Settings to use review translation.",
    };
  }

  const apiKey = getResolvedOpenRouterKey();
  if (!apiKey) {
    return { error: "Translation service is temporarily unavailable." };
  }

  const fd = await request.formData();
  const intent = fd.get("_intent");

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }

  if (intent === "save") {
    const enabled = fd.get("enabled") === "true";
    const autoTranslateNewReviews = fd.get("autoTranslateNewReviews") === "true";
    const autoTranslateImport = fd.get("autoTranslateImport") === "true";
    const targetLanguage = String(fd.get("targetLanguage") || "en").trim();
    const sourceLanguage = String(fd.get("sourceLanguage") || AUTO_DETECT).trim();

    const validTarget = LANGUAGE_OPTIONS.some((l) => l.code === targetLanguage)
      ? targetLanguage
      : "en";
    const validSource = SOURCE_LANGUAGE_OPTIONS.some((l) => l.code === sourceLanguage)
      ? sourceLanguage
      : AUTO_DETECT;

    const prev = getTranslationSettings(config);
    const nextConfig = mergeTranslationIntoConfig(config, {
      enabled,
      targetLanguage: validTarget,
      sourceLanguage: validSource,
      autoTranslateNewReviews,
      autoTranslateImport,
    });

    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(nextConfig) },
      create: { shop, config: JSON.stringify(nextConfig) },
    });

    let bulkResult = null;
    const shouldBulk =
      enabled &&
      (!prev.enabled ||
        prev.targetLanguage !== validTarget ||
        prev.sourceLanguage !== validSource);

    return {
      ok: true,
      translation: getTranslationSettings(nextConfig),
      bulkResult,
      startBulk: shouldBulk,
      bulkForce: false,
    };
  }

  if (intent === "translate_batch") {
    const translation = getTranslationSettings(config);
    const cursor = Number(fd.get("cursor") || 0);
    const force = fd.get("force") === "true";
    const batchSize = Math.min(50, Math.max(1, Number(fd.get("batchSize") || 20)));

    const { requireFeatureUsage } = await import("../lib/billing.server.js");
    const usageCheck = await requireFeatureUsage(planStatus, "auto_translate", batchSize);
    if (!usageCheck.ok) {
      return { error: usageCheck.message };
    }

    const { bulkTranslateShopReviewsBatch } = await import("../lib/review-translation.server.js");
    const batchResult = await bulkTranslateShopReviewsBatch(
      shop,
      translation.targetLanguage,
      apiKey,
      translation.sourceLanguage,
      { cursor, batchSize, force },
    );

    const translatedCount = await db.review.count({
      where: { shop, translatedLang: translation.targetLanguage },
    });

    return { ok: true, batchResult, translatedCount };
  }

  if (intent === "retranslate") {
    const translation = getTranslationSettings(config);
    if (!translation.enabled) {
      return { error: "Enable storefront translation before retranslating reviews." };
    }

    return {
      ok: true,
      startBulk: true,
      bulkForce: true,
      translation,
    };
  }

  if (intent === "translate_pending") {
    const translation = getTranslationSettings(config);

    return {
      ok: true,
      startBulk: true,
      bulkForce: false,
      translation,
    };
  }

  if (intent === "quick_toggle") {
    const enabled = fd.get("enabled") === "true";
    const nextConfig = mergeTranslationIntoConfig(config, { enabled });

    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(nextConfig) },
      create: { shop, config: JSON.stringify(nextConfig) },
    });

    return { ok: true, translation: getTranslationSettings(nextConfig) };
  }

  return { error: "Unknown action." };
};

export default function ReviewTranslationPage() {
  const {
    trialStatus,
    premium,
    aiAvailable,
    translation: savedTranslation,
    shopLocale,
    totalReviews,
    translatedCount: initialTranslatedCount,
    languages,
    sourceLanguages,
  } = useLoaderData();

  const actionData = useActionData();
  const submit = useSubmit();
  const batchFetcher = useFetcher();
  const navigation = useNavigation();
  const busy = navigation.state === "submitting" || batchFetcher.state !== "idle";

  const [enabled, setEnabled] = useState(savedTranslation.enabled);
  const [autoTranslateNewReviews, setAutoTranslateNewReviews] = useState(
    savedTranslation.autoTranslateNewReviews,
  );
  const [autoTranslateImport, setAutoTranslateImport] = useState(
    savedTranslation.autoTranslateImport,
  );
  const [targetLanguage, setTargetLanguage] = useState(
    savedTranslation.targetLanguage || shopLocale || "en",
  );
  const [sourceLanguage, setSourceLanguage] = useState(
    savedTranslation.sourceLanguage || AUTO_DETECT,
  );
  const [translatedCount, setTranslatedCount] = useState(initialTranslatedCount);
  const [showSaved, setShowSaved] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const bulkCancelRef = useRef(false);
  const bulkForceRef = useRef(false);

  const runBulkLoop = useCallback(
    (force = false) => {
      bulkCancelRef.current = false;
      bulkForceRef.current = force;
      setBulkProgress({ cursor: 0, processed: 0, total: totalReviews, translated: 0 });

      const fd = new FormData();
      fd.set("_intent", "translate_batch");
      fd.set("cursor", "0");
      fd.set("force", force ? "true" : "false");
      batchFetcher.submit(fd, { method: "post" });
    },
    [batchFetcher, totalReviews],
  );

  useEffect(() => {
    if (batchFetcher.state !== "idle" || !batchFetcher.data?.batchResult) return;
    if (bulkCancelRef.current) {
      setBulkProgress(null);
      return;
    }

    const { batchResult, translatedCount: newCount } = batchFetcher.data;
    if (typeof newCount === "number") {
      setTranslatedCount(newCount);
    }

    if (batchResult.error || batchResult.done) {
      setBulkProgress(null);
      return;
    }

    const processed = batchResult.nextCursor ?? 0;
    const total = batchResult.totalPending ?? totalReviews;

    setBulkProgress((prev) => ({
      cursor: processed,
      processed,
      total,
      translated: (prev?.translated ?? 0) + (batchResult.translated ?? 0),
    }));

    const fd = new FormData();
    fd.set("_intent", "translate_batch");
    fd.set("cursor", String(processed));
    fd.set("force", bulkForceRef.current ? "true" : "false");
    batchFetcher.submit(fd, { method: "post" });
  }, [batchFetcher.state, batchFetcher.data, batchFetcher, totalReviews]);

  useEffect(() => {
    setEnabled(savedTranslation.enabled);
    setAutoTranslateNewReviews(savedTranslation.autoTranslateNewReviews);
    setAutoTranslateImport(savedTranslation.autoTranslateImport);
    setTargetLanguage(savedTranslation.targetLanguage || shopLocale || "en");
    setSourceLanguage(savedTranslation.sourceLanguage || AUTO_DETECT);
  }, [savedTranslation, shopLocale]);

  useEffect(() => {
    if (actionData?.ok) {
      setShowSaved(true);
      if (actionData.translation) {
        setEnabled(actionData.translation.enabled);
        setAutoTranslateNewReviews(actionData.translation.autoTranslateNewReviews);
        setAutoTranslateImport(actionData.translation.autoTranslateImport);
        setTargetLanguage(actionData.translation.targetLanguage);
        setSourceLanguage(actionData.translation.sourceLanguage);
      }
      if (typeof actionData.translatedCount === "number") {
        setTranslatedCount(actionData.translatedCount);
      }
      if (actionData.startBulk) {
        runBulkLoop(Boolean(actionData.bulkForce));
      }
      const t = setTimeout(() => setShowSaved(false), 3500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [actionData, runBulkLoop]);

  const handleSave = () => {
    const fd = new FormData();
    fd.set("_intent", "save");
    fd.set("enabled", enabled ? "true" : "false");
    fd.set("autoTranslateNewReviews", autoTranslateNewReviews ? "true" : "false");
    fd.set("autoTranslateImport", autoTranslateImport ? "true" : "false");
    fd.set("targetLanguage", targetLanguage);
    fd.set("sourceLanguage", sourceLanguage);
    submit(fd, { method: "post" });
  };

  const handleRetranslate = () => {
    const fd = new FormData();
    fd.set("_intent", "retranslate");
    submit(fd, { method: "post" });
  };

  const handleTranslatePending = () => {
    const fd = new FormData();
    fd.set("_intent", "translate_pending");
    submit(fd, { method: "post" });
  };

  const handleCancelBulk = () => {
    bulkCancelRef.current = true;
    setBulkProgress(null);
  };

  const pendingCount = Math.max(0, totalReviews - translatedCount);
  const settingsDisabled = !premium || !aiAvailable;
  const bulkActive = bulkProgress !== null;
  const bulkPercent =
    bulkProgress && bulkProgress.total > 0
      ? Math.min(100, Math.round((bulkProgress.processed / bulkProgress.total) * 100))
      : 0;

  return (
    <Stack>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6d7175", lineHeight: 1.5 }}>
          Translate reviews for your storefront, imports, and new submissions with full control
          over when and how.
        </p>
        <div style={{ flexShrink: 0 }}>
          <PremiumTrialBadge trialStatus={trialStatus} />
        </div>
      </div>
        {actionData?.error ? (
          <Banner tone="critical">{actionData.error}</Banner>
        ) : null}

        {actionData?.ok && showSaved ? (
          <Banner tone="success">
            Settings saved
            {actionData.startBulk ? ". Translation started in the background." : "."}
          </Banner>
        ) : null}

        {batchFetcher.data?.batchResult?.error ? (
          <Banner tone="critical">
            Translation error: {batchFetcher.data.batchResult.error}
          </Banner>
        ) : null}

        {bulkActive ? (
          <Banner tone="info">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span>
                Translating reviewsΓÇª {bulkProgress.processed.toLocaleString()} /{" "}
                {bulkProgress.total.toLocaleString()}
                {bulkProgress.translated > 0
                  ? ` (${bulkProgress.translated.toLocaleString()} updated)`
                  : ""}
              </span>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "#e5ebe8",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${bulkPercent}%`,
                    background: "#008060",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <SecondaryButton onClick={handleCancelBulk}>Cancel</SecondaryButton>
            </div>
          </Banner>
        ) : null}

        {!premium ? (
          <PremiumGateBanner feature="translation" />
        ) : !aiAvailable ? (
          <Banner tone="warning">
            Translation service is temporarily unavailable. Please try again later.
          </Banner>
        ) : null}

        <Card
          title="Languages"
          description="Choose where reviews come from and which language shoppers see on product pages."
          style={{ padding: 20 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <LanguageSelect
              id="source-language"
              value={sourceLanguage}
              options={sourceLanguages}
              onChange={setSourceLanguage}
              disabled={settingsDisabled}
              shopLocale={shopLocale}
              hint="Translate from"
            />
            <LanguageSelect
              id="target-language"
              value={targetLanguage}
              options={languages}
              onChange={setTargetLanguage}
              disabled={settingsDisabled}
              shopLocale={shopLocale}
              hint="Translate to (storefront language)"
            />
          </div>
        </Card>

        <Card
          title="Storefront display"
          description="When enabled, translated text is shown on widgets and product pages. Original text stays in your dashboard."
          style={{ padding: 20 }}
        >
          <ToggleSwitch
            label="Show translated reviews on storefront"
            description={`Display reviews in ${languageLabel(targetLanguage)} for shoppers.`}
            checked={enabled}
            onChange={setEnabled}
            disabled={settingsDisabled}
            proBadge={!premium}
          />
        </Card>

        <Card
          title="Automatic translation"
          description="Control when AI translation runs without manual action."
          style={{ padding: 20 }}
        >
          <ToggleSwitch
            label="Auto translate new reviews"
            description="Translate reviews submitted via your widget, write review page, and review form."
            checked={autoTranslateNewReviews}
            onChange={setAutoTranslateNewReviews}
            disabled={settingsDisabled}
            proBadge={!premium}
          />
          <div style={{ marginTop: 14 }}>
            <ToggleSwitch
              label="Auto translate CSV imports"
              description={`Default ON in the import wizard. Translates imported reviews to ${languageLabel(targetLanguage)}.`}
              checked={autoTranslateImport}
              onChange={setAutoTranslateImport}
              disabled={settingsDisabled}
              proBadge={!premium}
            />
          </div>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 12,
              fontWeight: 600,
              color: "#6d7175",
              lineHeight: 1.5,
            }}
          >
            You can still translate individual reviews from the Reviews page at any time.
          </p>
        </Card>

        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <PrimaryButton
              onClick={handleSave}
              disabled={busy || settingsDisabled || bulkActive}
              loading={busy && navigation.formData?.get("_intent") === "save"}
            >
              Save settings
            </PrimaryButton>
            {premium && pendingCount > 0 ? (
              <SecondaryButton
                onClick={handleTranslatePending}
                disabled={busy || totalReviews === 0 || bulkActive}
                loading={busy && navigation.formData?.get("_intent") === "translate_pending"}
              >
                <RefreshCw size={16} />
                Translate pending ({pendingCount.toLocaleString()})
              </SecondaryButton>
            ) : null}
            {enabled && premium ? (
              <SecondaryButton
                onClick={handleRetranslate}
                disabled={busy || totalReviews === 0 || bulkActive}
                loading={busy && navigation.formData?.get("_intent") === "retranslate"}
              >
                <RefreshCw size={16} />
                Retranslate all (force)
              </SecondaryButton>
            ) : null}
          </div>
        </Card>

        <Card title="Status" style={{ padding: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            <StatTile
              icon={<Globe size={18} color="#008060" />}
              label="Total reviews"
              value={totalReviews.toLocaleString()}
            />
            <StatTile
              icon={<CheckCircle2 size={18} color="#008060" />}
              label={`Translated to ${languageLabel(targetLanguage)}`}
              value={translatedCount.toLocaleString()}
            />
            <StatTile
              icon={<Languages size={18} color="#6d7175" />}
              label="Pending"
              value={pendingCount.toLocaleString()}
            />
          </div>
          {premium ? (
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              <FeaturePill
                icon={<Sparkles size={14} />}
                label="New reviews"
                active={autoTranslateNewReviews}
              />
              <FeaturePill
                icon={<Upload size={14} />}
                label="CSV import default"
                active={autoTranslateImport}
              />
              <FeaturePill
                icon={<Globe size={14} />}
                label="Storefront display"
                active={enabled}
              />
            </div>
          ) : null}
        </Card>
    </Stack>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 8,
        border: "1px solid #e5ebe8",
        background: "#fafcfb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6d7175" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#202223" }}>{value}</p>
    </div>
  );
}

function FeaturePill({ icon, label, active }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "#b4e4cf" : "#e5ebe8"}`,
        background: active ? "#ecfdf3" : "#fafcfb",
        fontSize: 12,
        fontWeight: 700,
        color: active ? "#008060" : "#6d7175",
      }}
    >
      {icon}
      {label}: {active ? "On" : "Off"}
    </div>
  );
}
