/* eslint-disable react/prop-types, react-hooks/set-state-in-effect */
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  data,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useRouteError,
  useSearchParams,
  useSubmit,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { importReviewsLoader, importReviewsAction } from "../lib/import-reviews.server.js";
import {
  loadOnsiteWidgetMetrics,
  saveOnsiteWidgetSettings,
} from "../lib/collect-reviews.server.js";
import { CollectReviewsShell } from "../components/collect-reviews/collect-reviews-shell.jsx";
import { TabOnsiteWidget } from "../components/collect-reviews/tab-onsite-widget.jsx";
import { TabReviewForm } from "../components/collect-reviews/tab-review-form.jsx";

const ImportReviewsWizard = lazy(() =>
  import("../components/collect-reviews/import-reviews-wizard.jsx").then((module) => ({
    default: module.ImportReviewsWizard,
  })),
);

const VALID_TABS = new Set(["widget", "review-form", "import"]);

const EMPTY_WIDGET = {
  timing: "after_fulfillment",
  enabled: true,
  metrics: {
    widgetViews: 0,
    widgetViewsTrend: null,
    conversionRate: 0,
    conversionTrend: null,
    reviewsCollected: 0,
    reviewsCollectedTrend: null,
  },
  formConfig: {},
};

const EMPTY_IMPORT_DATA = {
  hasPremium: false,
  planStatus: null,
  trialStatus: null,
  productIndexCount: 0,
  defaultAutoTranslateImport: false,
  translationTargetLabel: "English",
};

function parseTab(searchParams) {
  const tab = searchParams.get("tab") ?? "widget";
  return VALID_TABS.has(tab) ? tab : "widget";
}

function isTabOnlySearchChange(currentUrl, nextUrl) {
  if (currentUrl.pathname !== nextUrl.pathname) return false;

  const current = new URLSearchParams(currentUrl.search);
  const next = new URLSearchParams(nextUrl.search);
  const currentTab = current.get("tab") ?? "widget";
  const nextTab = next.get("tab") ?? "widget";

  if (currentTab === nextTab) return false;

  current.delete("tab");
  next.delete("tab");
  return current.toString() === next.toString();
}

export const loader = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const shop = normalizeShopDomain(auth.session.shop);
  const url = new URL(request.url);

  const templateSource = url.searchParams.get("template");
  if (templateSource) {
    return importReviewsLoader({ request, ...auth });
  }

  const tab = parseTab(url.searchParams);
  const needsImportData = tab === "import";

  try {
    const [widgetData, importData] = await Promise.all([
      loadOnsiteWidgetMetrics(shop),
      needsImportData
        ? importReviewsLoader({ request, ...auth })
        : Promise.resolve(EMPTY_IMPORT_DATA),
    ]);

    return {
      tab,
      widget: widgetData,
      importDataLoaded: needsImportData,
      ...importData,
    };
  } catch (err) {
    console.error("[collect-reviews] loader failed:", err);
    let widget = EMPTY_WIDGET;
    let importData = EMPTY_IMPORT_DATA;

    try {
      widget = await loadOnsiteWidgetMetrics(shop);
    } catch (widgetErr) {
      console.error("[collect-reviews] widget loader failed:", widgetErr);
    }

    if (needsImportData) {
      try {
        importData = await importReviewsLoader({ request, ...auth });
      } catch (importErr) {
        console.error("[collect-reviews] import loader failed:", importErr);
      }
    }

    return {
      tab,
      widget,
      importDataLoaded: needsImportData,
      loaderError: "Some collect review data could not be loaded.",
      ...importData,
    };
  }
};

export const action = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const shop = normalizeShopDomain(auth.session.shop);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? formData.get("_intent") ?? "");

  if (intent === "saveOnsiteWidget") {
    const timing = String(formData.get("timing") ?? "after_fulfillment");
    await saveOnsiteWidgetSettings(shop, { timing });
    return data({ ok: true, saved: true });
  }

  if (intent === "preview" || intent === "import") {
    try {
      return await importReviewsAction({ request, formData, ...auth });
    } catch (err) {
      console.error("[collect-reviews] import action failed:", err);
      return data(
        { error: "Import failed. Please check your CSV and try again." },
        { status: 500 },
      );
    }
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  formData,
  defaultShouldRevalidate,
}) {
  // The import wizard submits "preview" and "import" through a fetcher that
  // returns its own data. Revalidating this route's loader on those submits
  // re-runs authenticate.admin + the heavy import loader (and the import-data
  // fetcher) on every click, which in the embedded admin churns/remounts the
  // wizard and throws the merchant back to step 1. The preview/import results
  // don't depend on this loader, and a successful import navigates away on its
  // own, so skip revalidation for those intents.
  if (formData) {
    const intent = formData.get("_intent") ?? formData.get("intent");
    if (intent === "preview" || intent === "import") return false;
  }

  if (formMethod && formMethod.toUpperCase() !== "GET") return true;

  if (
    currentUrl.pathname.startsWith("/app/collect-reviews") &&
    nextUrl.pathname.startsWith("/app/collect-reviews") &&
    isTabOnlySearchChange(currentUrl, nextUrl)
  ) {
    return false;
  }

  if (currentUrl.pathname !== nextUrl.pathname) {
    return true;
  }

  return defaultShouldRevalidate;
}

function CollectReviewsLoading() {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "#6d7175", fontSize: 14 }}>
      Loading collect reviews...
    </div>
  );
}

export default function CollectReviewsPage() {
  const loaderData = useLoaderData();
  const widget = loaderData?.widget ?? EMPTY_WIDGET;
  const actionData = useActionData();
  const navigation = useNavigation();
  const location = useLocation();
  const importFetcher = useFetcher();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = parseTab(searchParams);
  const isTabSwitch =
    navigation.state !== "idle" &&
    navigation.location &&
    isTabOnlySearchChange(location, navigation.location);
  const isPageLoading = navigation.state === "loading" && !isTabSwitch;
  const importDataLoaded = loaderData?.importDataLoaded === true || Boolean(importFetcher.data);
  const importDataHref = mergeShopifyEmbedParams("/app/collect-reviews?tab=import", location.search);
  const [draftTiming, setDraftTiming] = useState(null);
  const timing = draftTiming ?? widget.timing;
  const isSaving =
    navigation.state === "submitting" &&
    navigation.formData != null &&
    navigation.formData.get("intent") === "saveOnsiteWidget";

  useEffect(() => {
    if (actionData?.saved) {
      setDraftTiming(null);
      shopify?.toast?.show?.("Settings saved");
    }
  }, [actionData, shopify]);

  useEffect(() => {
    if (
      activeTab === "import" &&
      !importDataLoaded &&
      importFetcher.state === "idle" &&
      !importFetcher.data
    ) {
      importFetcher.load(importDataHref);
    }
  }, [activeTab, importDataHref, importDataLoaded, importFetcher]);

  const selectTab = useCallback(
    (tabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tabId === "widget") {
            next.delete("tab");
          } else {
            next.set("tab", tabId);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSave = () => {
    if (activeTab !== "widget") return;
    const fd = new FormData();
    fd.set("intent", "saveOnsiteWidget");
    fd.set("timing", timing);
    submit(fd, { method: "post" });
  };

  const saveDisabled = activeTab !== "widget" || draftTiming === null || draftTiming === widget.timing;

  const importSource = importFetcher.data ?? loaderData;
  const importWizardProps = {
    hasPremium: importSource?.hasPremium ?? EMPTY_IMPORT_DATA.hasPremium,
    planStatus: importSource?.planStatus ?? EMPTY_IMPORT_DATA.planStatus,
    trialStatus: importSource?.trialStatus ?? EMPTY_IMPORT_DATA.trialStatus,
    productIndexCount: importSource?.productIndexCount ?? EMPTY_IMPORT_DATA.productIndexCount,
    defaultAutoTranslateImport:
      importSource?.defaultAutoTranslateImport ?? EMPTY_IMPORT_DATA.defaultAutoTranslateImport,
    translationTargetLabel:
      importSource?.translationTargetLabel ?? EMPTY_IMPORT_DATA.translationTargetLabel,
  };
  const isImportLoading =
    activeTab === "import" &&
    !importDataLoaded &&
    (importFetcher.state === "loading" || importFetcher.state === "submitting");

  return (
    <CollectReviewsShell
      activeTab={activeTab}
      onTabChange={selectTab}
      onSave={handleSave}
      saveDisabled={saveDisabled}
      saveLoading={isSaving}
    >
      {loaderData?.loaderError ? (
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8a6116" }}>{loaderData.loaderError}</p>
      ) : null}

      {isPageLoading ? (
        <CollectReviewsLoading />
      ) : (
        <>
          {activeTab === "widget" ? (
            <TabOnsiteWidget
              metrics={widget.metrics ?? EMPTY_WIDGET.metrics}
              timing={timing}
              formConfig={widget.formConfig ?? EMPTY_WIDGET.formConfig}
              onTimingChange={setDraftTiming}
            />
          ) : null}

          {activeTab === "review-form" ? <TabReviewForm /> : null}

          {activeTab === "import" ? (
            isImportLoading ? (
              <CollectReviewsLoading />
            ) : (
              <Suspense fallback={<CollectReviewsLoading />}>
                <ImportReviewsWizard {...importWizardProps} />
              </Suspense>
            )
          ) : null}
        </>
      )}
    </CollectReviewsShell>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
