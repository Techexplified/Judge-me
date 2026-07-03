/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  data,
  useLoaderData,
  useFetcher,
  useNavigate,
  useLocation,
  useNavigation,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import {
  completeOnboarding,
  getOnboardingState,
  isOnboardingComplete,
  removeOnboardingBrandLogo,
  saveOnboardingAppearance,
  saveOnboardingBrandLogo,
  saveOnboardingCollectionSettings,
  saveOnboardingGoal,
  saveOnboardingImportChoice,
  saveOnboardingStoreInfo,
} from "../lib/onboarding.server";
import {
  ONBOARDING_ACCENT_COLORS,
  ONBOARDING_COMPLETION_STEP,
  ONBOARDING_GOAL_OPTIONS,
  ONBOARDING_IMPORT_KEYS,
  ONBOARDING_IMPORT_SOURCES,
  ONBOARDING_INDUSTRY_OPTIONS,
  ONBOARDING_LAYOUT_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  resolveOnboardingStep,
} from "../lib/onboarding.shared.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { buildThemeEditorProductBlockUrl } from "../lib/theme-editor-nav.shared.js";
import { getShopPlanStatus } from "../lib/billing.server.js";
import { SOURCE_PRESETS } from "../lib/csv-import.shared.js";
import { loadShopConfig } from "../lib/collect-reviews.server.js";
import { Banner } from "../components/admin-ui";
import { OnboardingShell } from "../components/onboarding/onboarding-shell.jsx";
import { StepStoreProfile } from "../components/onboarding/step-store-profile.jsx";
import { StepGoal } from "../components/onboarding/step-goal.jsx";
import { StepImport } from "../components/onboarding/step-import.jsx";
import { StepAppearance } from "../components/onboarding/step-appearance.jsx";
import { StepCollect } from "../components/onboarding/step-collect.jsx";
import { StepComplete } from "../components/onboarding/step-complete.jsx";

const TOTAL_STEPS = ONBOARDING_TOTAL_STEPS;
const COMPLETION_STEP = ONBOARDING_COMPLETION_STEP;

function parseStep(searchParams) {
  const s = Number.parseInt(searchParams.get("step") ?? "1", 10);
  return s >= 1 && s <= COMPLETION_STEP ? s : 1;
}

function formatShopDisplayName(shop, shopName) {
  if (shopName?.trim()) return shopName.trim();
  const base = shop.replace(/\.myshopify\.com$/i, "");
  return base
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveImportRedirect(storeProfile, onboarding) {
  const importChoice = onboarding?.importChoice;
  const skippedImport =
    importChoice === "skip" ||
    !importChoice ||
    storeProfile?.importingFromOtherApp === "no";
  const importSource =
    storeProfile?.importSource ||
    (importChoice && ONBOARDING_IMPORT_SOURCES[importChoice]) ||
    "";
  if (!skippedImport && importSource && SOURCE_PRESETS[importSource]) {
    return `/app/collect-reviews?tab=import&source=${encodeURIComponent(importSource)}`;
  }
  return "/app/performance-overview?fromOnboarding=1";
}

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const url = new URL(request.url);
  const requestedStep = parseStep(url.searchParams);
  const alreadyComplete = await isOnboardingComplete(shop);

  const { storeProfile, onboarding, appearance, collection, formConfig } =
    await getOnboardingState(shop);

  const step = alreadyComplete
    ? requestedStep
    : resolveOnboardingStep(requestedStep, { onboarding, storeProfile });
  if (!alreadyComplete && step !== requestedStep) {
    throw embedRedirect(`/app/onboarding?step=${step}`, request);
  }

  let shopName = "";
  try {
    const shopRes = await admin.graphql(`
      query OnboardingShopName {
        shop { name }
      }
    `);
    const shopJson = await shopRes.json();
    shopName = shopJson?.data?.shop?.name ?? "";
  } catch {
    /* optional */
  }

  const planStatus = await getShopPlanStatus(shop, billing);
  const shopConfig = await loadShopConfig(shop);
  const apiKey = globalThis.process?.env?.SHOPIFY_API_KEY || "";
  const themeEditorUrl = buildThemeEditorProductBlockUrl(shop, apiKey);
  const dashboardUrl = resolveImportRedirect(storeProfile, onboarding);

  const defaultAccent =
    appearance?.accentColor ||
    ONBOARDING_ACCENT_COLORS.find((c) => c.id === "teal")?.value ||
    "#0d9488";

  const onsiteWidgetEnabled =
    collection?.onsiteWidgetEnabled ??
    shopConfig?.onsiteWidget?.enabled ??
    collection?.emailReviewRequests ??
    true;

  return {
    shop,
    step,
    alreadyComplete,
    storeName: storeProfile?.storeName || formatShopDisplayName(shop, shopName),
    industry: storeProfile?.industry || "",
    goal: storeProfile?.primaryGoal || "",
    layoutPreset: appearance?.layoutPreset || formConfig.layoutPreset || "modern",
    accentColor: defaultAccent,
    brandLogoUrl: formConfig.brandLogoUrl || null,
    importChoice: onboarding?.importChoice ?? "",
    onsiteWidgetEnabled,
    photoReviews: collection?.photoReviews ?? (formConfig.showPhotos !== false),
    videoReviews:
      collection?.videoReviews ??
      (planStatus.hasPro && formConfig.showVideos !== false),
    hasPro: planStatus.hasPro,
    trialActive: planStatus.hasPro,
    themeEditorUrl,
    dashboardUrl,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const alreadyComplete = await isOnboardingComplete(shop);

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  if (intent === "uploadBrandLogo") {
    if (alreadyComplete) {
      return data({ logoError: "Logo upload is disabled in demo replay.", step: 4 }, { status: 400 });
    }
    const file = fd.get("logo");
    if (!(file instanceof File) || file.size === 0) {
      return data({ logoError: "No file selected.", step: 4 }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return data({ logoError: "Logo must be 2MB or less.", step: 4 }, { status: 400 });
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      return data({ logoError: "Use PNG, JPG, SVG, or WebP.", step: 4 }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const brandLogoUrl = await saveOnboardingBrandLogo(shop, dataUrl);
    return data({ brandLogoUrl, step: 4 });
  }

  if (intent === "removeBrandLogo") {
    if (alreadyComplete) {
      return data({ brandLogoUrl: null, logoRemoved: true, step: 4 });
    }
    await removeOnboardingBrandLogo(shop);
    return data({ brandLogoUrl: null, logoRemoved: true, step: 4 });
  }

  if (intent === "saveStoreInfo") {
    const storeName = String(fd.get("storeName") ?? "").trim();
    const industry = String(fd.get("industry") ?? "").trim();

    if (!storeName) {
      return data({ error: "Enter your store name.", step: 1 }, { status: 400 });
    }
    if (!ONBOARDING_INDUSTRY_OPTIONS.some((o) => o.id === industry)) {
      return data({ error: "Select your industry.", step: 1 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingStoreInfo(shop, { storeName, industry });
    }
    return data({ ok: true, nextStep: 2 });
  }

  if (intent === "saveGoal") {
    const primaryGoal = String(fd.get("primaryGoal") ?? "").trim();

    if (!ONBOARDING_GOAL_OPTIONS.some((o) => o.id === primaryGoal)) {
      return data({ error: "Select your main goal.", step: 2 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingGoal(shop, { primaryGoal });
    }
    return data({ ok: true, nextStep: 3 });
  }

  if (intent === "saveImport") {
    const skipImport = fd.get("skipImport") === "true";
    const importKey = String(fd.get("importKey") ?? "").trim();

    if (!skipImport && !ONBOARDING_IMPORT_KEYS.includes(importKey)) {
      return data({ error: "Select an import option or skip.", step: 3 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingImportChoice(shop, {
        importKey: skipImport ? "" : importKey,
        skipImport,
      });
    }
    return data({ ok: true, nextStep: 4 });
  }

  if (intent === "saveAppearance") {
    const layoutPreset = String(fd.get("layoutPreset") ?? "").trim();
    const accentColor = String(fd.get("accentColor") ?? "").trim();

    if (!ONBOARDING_LAYOUT_OPTIONS.some((o) => o.id === layoutPreset)) {
      return data({ error: "Select a layout style.", step: 4 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingAppearance(shop, { layoutPreset, accentColor });
    }
    return data({ ok: true, nextStep: 5 });
  }

  if (intent === "finish") {
    const onsiteWidgetEnabled = fd.get("onsiteWidgetEnabled") === "true";
    const photoReviews = fd.get("photoReviews") !== "false";
    const videoReviews = fd.get("videoReviews") === "true";

    if (!alreadyComplete) {
      await saveOnboardingCollectionSettings(shop, {
        onsiteWidgetEnabled,
        photoReviews,
        videoReviews,
      });
      await completeOnboarding(shop);
    }

    throw embedRedirect(`/app/onboarding?step=${COMPLETION_STEP}`, request);
  }

  if (intent === "goToDashboard") {
    const { storeProfile, onboarding } = await getOnboardingState(shop);
    throw embedRedirect(resolveImportRedirect(storeProfile, onboarding), request);
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) {
  if (formMethod && formMethod.toUpperCase() !== "GET") return true;
  if (
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search
  ) {
    return true;
  }
  return defaultShouldRevalidate;
}

export default function Onboarding() {
  const {
    step,
    alreadyComplete,
    storeName: savedStoreName,
    industry: savedIndustry,
    goal: savedGoal,
    layoutPreset: savedLayout,
    accentColor: savedAccent,
    brandLogoUrl: savedLogo,
    importChoice: savedImport,
    onsiteWidgetEnabled: savedOnsiteWidget,
    photoReviews: savedPhotoReviews,
    videoReviews: savedVideoReviews,
    hasPro,
    trialActive,
    themeEditorUrl,
    dashboardUrl,
  } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const logoFetcher = useFetcher();
  const stepFetcher = useFetcher();
  const handledStepResponseRef = useRef(null);
  const goingToDashboard =
    navigation.state !== "idle" &&
    !navigation.location?.pathname.startsWith("/app/onboarding");
  const stepSaving = stepFetcher.state !== "idle";
  const logoUploading = logoFetcher.state !== "idle";

  const embedNavigate = useCallback(
    (to) => {
      const target = mergeShopifyEmbedParams(to, location.search);
      navigate(target);
      if (typeof shopify?.navigate === "function") {
        shopify.navigate(target);
      }
    },
    [location.search, navigate, shopify],
  );

  const [storeName, setStoreName] = useState(savedStoreName);
  const [industry, setIndustry] = useState(savedIndustry);
  const [goal, setGoal] = useState(savedGoal);
  const [layoutPreset, setLayoutPreset] = useState(savedLayout);
  const [accentColor, setAccentColor] = useState(savedAccent);
  const [brandLogoUrl, setBrandLogoUrl] = useState(savedLogo || null);
  const [logoError, setLogoError] = useState(null);
  const [importChoice, setImportChoice] = useState(savedImport || "");
  const [onsiteWidgetEnabled, setOnsiteWidgetEnabled] = useState(savedOnsiteWidget);
  const [photoReviews, setPhotoReviews] = useState(savedPhotoReviews !== false);
  const [videoReviews, setVideoReviews] = useState(hasPro ? savedVideoReviews : false);

  useEffect(() => {
    if (logoFetcher.data?.brandLogoUrl !== undefined) {
      setBrandLogoUrl(logoFetcher.data.brandLogoUrl);
    }
    if (logoFetcher.data?.logoError) {
      setLogoError(logoFetcher.data.logoError);
    } else if (logoFetcher.data?.brandLogoUrl !== undefined) {
      setLogoError(null);
    }
  }, [logoFetcher.data]);

  useEffect(() => {
    if (stepFetcher.state !== "idle" || !stepFetcher.data?.ok) return;
    if (handledStepResponseRef.current === stepFetcher.data) return;
    handledStepResponseRef.current = stepFetcher.data;

    if (stepFetcher.data.nextStep) {
      embedNavigate(`/app/onboarding?step=${stepFetcher.data.nextStep}`);
    }
  }, [embedNavigate, stepFetcher.data, stepFetcher.state]);

  useEffect(() => {
    setStoreName(savedStoreName);
    setIndustry(savedIndustry);
    setGoal(savedGoal);
    setLayoutPreset(savedLayout);
    setAccentColor(savedAccent);
    setBrandLogoUrl(savedLogo || null);
    setImportChoice(savedImport || "");
    setOnsiteWidgetEnabled(savedOnsiteWidget);
    setPhotoReviews(savedPhotoReviews !== false);
    setVideoReviews(hasPro ? savedVideoReviews : false);
  }, [
    step,
    savedStoreName,
    savedIndustry,
    savedGoal,
    savedLayout,
    savedAccent,
    savedLogo,
    savedImport,
    savedOnsiteWidget,
    savedPhotoReviews,
    savedVideoReviews,
    hasPro,
  ]);

  const stepError =
    (stepFetcher.data?.error && stepFetcher.data?.step === step
      ? stepFetcher.data.error
      : null) ||
    (step === 4 && logoFetcher.data?.logoError ? logoFetcher.data.logoError : null);

  const handleLogoFile = (file, error) => {
    if (error) {
      setLogoError(error);
      return;
    }
    if (!file) return;
    setLogoError(null);
    const formData = new FormData();
    formData.append("intent", "uploadBrandLogo");
    formData.append("logo", file);
    logoFetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
  };

  const handleLogoRemove = () => {
    setLogoError(null);
    logoFetcher.submit({ intent: "removeBrandLogo" }, { method: "post" });
  };

  const handleContinue = () => {
    if (stepSaving || logoUploading) return;

    if (step === 1) {
      stepFetcher.submit(
        { intent: "saveStoreInfo", storeName, industry },
        { method: "post" },
      );
      return;
    }

    if (step === 2) {
      stepFetcher.submit({ intent: "saveGoal", primaryGoal: goal }, { method: "post" });
      return;
    }

    if (step === 3) {
      const skipImport = importChoice === "skip";
      stepFetcher.submit(
        {
          intent: "saveImport",
          importKey: skipImport ? "" : importChoice,
          skipImport: skipImport ? "true" : "false",
        },
        { method: "post" },
      );
      return;
    }

    if (step === 4) {
      stepFetcher.submit(
        { intent: "saveAppearance", layoutPreset, accentColor },
        { method: "post" },
      );
      return;
    }

    stepFetcher.submit(
      {
        intent: "finish",
        onsiteWidgetEnabled: onsiteWidgetEnabled ? "true" : "false",
        photoReviews: photoReviews ? "true" : "false",
        videoReviews: videoReviews ? "true" : "false",
      },
      { method: "post" },
    );
  };

  const handleGoToDashboard = () => {
    if (goingToDashboard) return;
    embedNavigate(dashboardUrl);
  };

  const handleStartImport = () => {
    const source = ONBOARDING_IMPORT_SOURCES[importChoice];
    if (source) {
      embedNavigate(`/app/collect-reviews?tab=import&source=${encodeURIComponent(source)}`);
    }
  };

  const continueDisabled =
    (step === 1 && (!storeName.trim() || !industry)) ||
    (step === 2 && !goal) ||
    (step === 3 && !importChoice) ||
    logoUploading ||
    stepSaving;

  const handleBack = () => {
    if (step <= 1 || step >= COMPLETION_STEP || logoUploading || stepSaving) return;
    embedNavigate(`/app/onboarding?step=${step - 1}`);
  };

  const isCompletion = step >= COMPLETION_STEP;
  const hasImport = Boolean(importChoice && importChoice !== "skip");

  return (
    <OnboardingShell
      step={step}
      totalSteps={TOTAL_STEPS}
      showBack={step > 1 && !isCompletion}
      onBack={handleBack}
      backDisabled={logoUploading || stepSaving}
      onContinue={handleContinue}
      continueDisabled={continueDisabled}
      continueLoading={stepSaving}
      continueLabel={
        step === TOTAL_STEPS ? (alreadyComplete ? "Finish demo" : "Finish setup") : "Continue"
      }
      hideFooter={isCompletion}
      progressComplete={isCompletion}
    >
      {stepError ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="critical">{stepError}</Banner>
        </div>
      ) : null}

      {step === 1 ? (
        <StepStoreProfile
          storeName={storeName}
          industry={industry}
          onStoreNameChange={setStoreName}
          onIndustryChange={setIndustry}
        />
      ) : null}

      {step === 2 ? <StepGoal goal={goal} onGoalChange={setGoal} /> : null}

      {step === 3 ? (
        <StepImport importChoice={importChoice} onImportChoiceChange={setImportChoice} />
      ) : null}

      {step === 4 ? (
        <StepAppearance
          layoutPreset={layoutPreset}
          accentColor={accentColor}
          brandLogoUrl={brandLogoUrl}
          storeName={storeName}
          onLayoutChange={setLayoutPreset}
          onAccentChange={setAccentColor}
          onLogoFile={handleLogoFile}
          onLogoRemove={handleLogoRemove}
          logoError={logoError}
          logoUploading={logoUploading}
        />
      ) : null}

      {step === 5 ? (
        <StepCollect
          onsiteWidgetEnabled={onsiteWidgetEnabled}
          photoReviews={photoReviews}
          videoReviews={videoReviews}
          onOnsiteWidgetChange={setOnsiteWidgetEnabled}
          onPhotoReviewsChange={setPhotoReviews}
          onVideoReviewsChange={(val) => {
            if (hasPro || !val) setVideoReviews(val);
          }}
          hasPro={hasPro}
          accentColor={accentColor}
        />
      ) : null}

      {isCompletion ? (
        <StepComplete
          storeName={storeName}
          layoutPreset={layoutPreset}
          accentColor={accentColor}
          brandLogoUrl={brandLogoUrl}
          onsiteWidgetEnabled={onsiteWidgetEnabled}
          photoReviews={photoReviews}
          videoReviews={videoReviews}
          trialActive={trialActive}
          hasImport={hasImport}
          themeEditorUrl={themeEditorUrl}
          onStartImport={handleStartImport}
          onGoToDashboard={handleGoToDashboard}
          goingToDashboard={goingToDashboard}
        />
      ) : null}
    </OnboardingShell>
  );
}
