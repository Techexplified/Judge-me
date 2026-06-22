/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  data,
  useLoaderData,
  useFetcher,
  useNavigate,
  useLocation,
  useSubmit,
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
  saveOnboardingImportChoice,
} from "../lib/onboarding.server";
import {
  ONBOARDING_ACCENT_COLORS,
  ONBOARDING_IMPORT_KEYS,
  ONBOARDING_LAYOUT_OPTIONS,
  resolveOnboardingStep,
} from "../lib/onboarding.shared.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { getShopPlanStatus } from "../lib/billing.server.js";
import { SOURCE_PRESETS } from "../lib/csv-import.shared.js";
import { loadShopConfig } from "../lib/collect-reviews.server.js";
import { Banner } from "../components/admin-ui";
import { OnboardingShell } from "../components/onboarding/onboarding-shell.jsx";
import { StepAppearance } from "../components/onboarding/step-appearance.jsx";
import { StepConnect } from "../components/onboarding/step-connect.jsx";
import { StepCollect } from "../components/onboarding/step-collect.jsx";

const TOTAL_STEPS = 3;

function parseStep(searchParams) {
  const s = Number.parseInt(searchParams.get("step") ?? "1", 10);
  return s >= 1 && s <= TOTAL_STEPS ? s : 1;
}

function formatShopDisplayName(shop, shopName) {
  if (shopName?.trim()) return shopName.trim();
  const base = shop.replace(/\.myshopify\.com$/i, "");
  return base
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
    : resolveOnboardingStep(requestedStep, onboarding);
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

  const defaultAccent =
    appearance?.accentColor ||
    ONBOARDING_ACCENT_COLORS.find((c) => c.id === "teal")?.value ||
    "#0d9488";

  return {
    shop,
    step,
    alreadyComplete,
    shopName: formatShopDisplayName(shop, shopName),
    layoutPreset: appearance?.layoutPreset || formConfig.layoutPreset || "modern",
    accentColor: defaultAccent,
    brandLogoUrl: formConfig.brandLogoUrl || null,
    importChoice: onboarding?.importChoice ?? "",
    onsiteWidgetEnabled:
      collection?.onsiteWidgetEnabled ??
      shopConfig?.onsiteWidget?.enabled ??
      collection?.emailReviewRequests ??
      true,
    photoVideoReviews:
      collection?.photoVideoReviews ??
      (formConfig.showPhotos !== false && formConfig.showVideos !== false),
    hasPro: planStatus.hasPro,
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
      return data({ logoError: "Logo upload is disabled in demo replay.", step: 1 }, { status: 400 });
    }
    const file = fd.get("logo");
    if (!(file instanceof File) || file.size === 0) {
      return data({ logoError: "No file selected.", step: 1 }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return data({ logoError: "Logo must be 2MB or less.", step: 1 }, { status: 400 });
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      return data({ logoError: "Use PNG, JPG, SVG, or WebP.", step: 1 }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const brandLogoUrl = await saveOnboardingBrandLogo(shop, dataUrl);
    return data({ brandLogoUrl, step: 1 });
  }

  if (intent === "removeBrandLogo") {
    if (alreadyComplete) {
      return data({ brandLogoUrl: null, logoRemoved: true, step: 1 });
    }
    await removeOnboardingBrandLogo(shop);
    return data({ brandLogoUrl: null, logoRemoved: true, step: 1 });
  }

  if (intent === "saveAppearance") {
    const layoutPreset = String(fd.get("layoutPreset") ?? "").trim();
    const accentColor = String(fd.get("accentColor") ?? "").trim();

    if (!ONBOARDING_LAYOUT_OPTIONS.some((o) => o.id === layoutPreset)) {
      return data({ error: "Select a layout style.", step: 1 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingAppearance(shop, { layoutPreset, accentColor });
    }
    return data({ ok: true, nextStep: 2 });
  }

  if (intent === "saveImport") {
    const skipImport = fd.get("skipImport") === "true";
    const importKey = String(fd.get("importKey") ?? "").trim();

    if (!skipImport && !ONBOARDING_IMPORT_KEYS.includes(importKey)) {
      return data({ error: "Select an import option or skip.", step: 2 }, { status: 400 });
    }

    if (!alreadyComplete) {
      await saveOnboardingImportChoice(shop, {
        importKey: skipImport ? "" : importKey,
        skipImport,
      });
    }
    return data({ ok: true, nextStep: 3 });
  }

  if (intent === "finish") {
    const onsiteWidgetEnabled = fd.get("onsiteWidgetEnabled") === "true";
    const photoVideoRequests = fd.get("photoVideoReviews") === "true";

    if (!alreadyComplete) {
      await saveOnboardingCollectionSettings(shop, {
        onsiteWidgetEnabled,
        photoVideoReviews: photoVideoRequests,
      });
      await completeOnboarding(shop);
    }

    const { storeProfile } = await getOnboardingState(shop);
    if (
      !alreadyComplete &&
      storeProfile?.importingFromOtherApp === "yes" &&
      storeProfile?.importSource &&
      SOURCE_PRESETS[storeProfile.importSource]
    ) {
      throw embedRedirect(
        `/app/collect-reviews?tab=import&source=${encodeURIComponent(storeProfile.importSource)}`,
        request,
      );
    }

    throw embedRedirect("/app/performance-overview?fromOnboarding=1", request);
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
    shopName,
    step,
    alreadyComplete,
    layoutPreset: savedLayout,
    accentColor: savedAccent,
    brandLogoUrl: savedLogo,
    importChoice: savedImport,
    onsiteWidgetEnabled: savedOnsiteWidget,
    photoVideoReviews: savedPhotoVideo,
    hasPro,
  } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const logoFetcher = useFetcher();
  const stepFetcher = useFetcher();
  const handledStepResponseRef = useRef(null);
  const finishing =
    navigation.state !== "idle" &&
    navigation.formData?.get("intent") === "finish";
  const stepSaving = stepFetcher.state !== "idle" || finishing;
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

  const [layoutPreset, setLayoutPreset] = useState(savedLayout);
  const [accentColor, setAccentColor] = useState(savedAccent);
  const [brandLogoUrl, setBrandLogoUrl] = useState(savedLogo || null);
  const [logoError, setLogoError] = useState(null);
  const [importChoice, setImportChoice] = useState(savedImport || "");
  const [onsiteWidgetEnabled, setOnsiteWidgetEnabled] = useState(savedOnsiteWidget);
  const [photoVideoReviews, setPhotoVideoReviews] = useState(
    hasPro ? savedPhotoVideo : false,
  );

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
    setLayoutPreset(savedLayout);
    setAccentColor(savedAccent);
    setBrandLogoUrl(savedLogo || null);
    setImportChoice(savedImport || "");
    setOnsiteWidgetEnabled(savedOnsiteWidget);
    setPhotoVideoReviews(hasPro ? savedPhotoVideo : false);
  }, [
    step,
    savedLayout,
    savedAccent,
    savedLogo,
    savedImport,
    savedOnsiteWidget,
    savedPhotoVideo,
    hasPro,
  ]);

  const stepError =
    (stepFetcher.data?.error && stepFetcher.data?.step === step
      ? stepFetcher.data.error
      : null) ||
    (step === 1 && logoFetcher.data?.logoError ? logoFetcher.data.logoError : null);

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
        {
          intent: "saveAppearance",
          layoutPreset,
          accentColor,
        },
        { method: "post" },
      );
      return;
    }

    if (step === 2) {
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

    submit(
      {
        intent: "finish",
        onsiteWidgetEnabled: onsiteWidgetEnabled ? "true" : "false",
        photoVideoReviews: photoVideoReviews ? "true" : "false",
      },
      { method: "post" },
    );
  };

  const continueDisabled =
    (step === 2 && !importChoice) || logoUploading || stepSaving;

  const handleBack = () => {
    if (step <= 1 || logoUploading || finishing) return;
    embedNavigate(`/app/onboarding?step=${step - 1}`);
  };

  return (
    <OnboardingShell
      step={step}
      totalSteps={TOTAL_STEPS}
      wide={step === 1}
      showBack={step > 1}
      onBack={handleBack}
      backDisabled={logoUploading || finishing}
      onContinue={handleContinue}
      continueDisabled={continueDisabled}
      continueLoading={stepSaving}
      continueLabel={step === TOTAL_STEPS ? (alreadyComplete ? "Finish demo" : "Finish setup") : "Continue"}
    >
      {stepError ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="critical">{stepError}</Banner>
        </div>
      ) : null}

      {step === 1 ? (
        <StepAppearance
          layoutPreset={layoutPreset}
          accentColor={accentColor}
          brandLogoUrl={brandLogoUrl}
          onLayoutChange={setLayoutPreset}
          onAccentChange={setAccentColor}
          onLogoFile={handleLogoFile}
          onLogoRemove={handleLogoRemove}
          logoError={logoError}
          logoUploading={logoUploading}
        />
      ) : null}

      {step === 2 ? (
        <StepConnect
          shopName={shopName}
          importChoice={importChoice}
          onImportChoiceChange={setImportChoice}
        />
      ) : null}

      {step === 3 ? (
        <StepCollect
          onsiteWidgetEnabled={onsiteWidgetEnabled}
          photoVideoReviews={photoVideoReviews}
          onOnsiteWidgetChange={setOnsiteWidgetEnabled}
          onPhotoVideoChange={(val) => {
            if (hasPro || !val) setPhotoVideoReviews(val);
          }}
          hasPro={hasPro}
          accentColor={accentColor}
        />
      ) : null}
    </OnboardingShell>
  );
}
