/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigation, useActionData, useSubmit } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { buildThemeEditorBlockUrl } from "../lib/theme-editor-nav.shared.js";
import { serializeFormConfig } from "../lib/review-form-config.shared.js";
import { useConfigHistory } from "../hooks/use-config-history.js";
import { ReviewFormEditorShell } from "../components/review-form-editor/review-form-editor-shell.jsx";
import { openThemeEditorUrl } from "../components/onboarding/theme-editor-guide.jsx";

const WIDGET_ID = "review-showcase";

export const loader = async ({ request }) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const { reviewFormEditorLoader } = await import("../lib/review-form-editor.server.js");
  const base = await reviewFormEditorLoader({ request, session, billing, admin });
  const shop = normalizeShopDomain(session.shop);
  const apiKey = globalThis.process?.env?.SHOPIFY_API_KEY || "";
  return {
    ...base,
    themeEditorUrl: buildThemeEditorBlockUrl(shop, apiKey, WIDGET_ID),
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const { reviewFormEditorAction } = await import("../lib/review-form-editor.server.js");
  return reviewFormEditorAction({ request, session, admin });
};

export default function WidgetReviewShowcaseRoute() {
  const { savedConfig, reviewContext, storefrontPreview, widgetUsage, shopDomain, themeEditorUrl } =
    useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const { config, updateConfig, patchConfig, undo, redo, canUndo, canRedo } = useConfigHistory(savedConfig);

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [autofillError, setAutofillError] = useState("");
  const isSaving = navigation.state === "submitting";
  const autofillLoading =
    navigation.state === "submitting" && navigation.formData?.get("_intent") === "generateFormCopy";

  useEffect(() => {
    if (actionData?.ok) {
      setSaveError("");
      setShowSaveToast(true);
      const t = setTimeout(() => setShowSaveToast(false), 4000);
      return () => clearTimeout(t);
    }
    if (actionData?.ok === false) {
      setSaveError(actionData.publishError || "Could not save settings. Please try again.");
    }
    if (actionData?.logoError) {
      setSaveError(actionData.logoError);
    }
    if (actionData?.autofillError) {
      setAutofillError(actionData.autofillError);
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.autofillCopy) {
      setAutofillError("");
      patchConfig(actionData.autofillCopy);
    }
  }, [actionData?.autofillCopy, patchConfig]);

  useEffect(() => {
    if (actionData?.logoUploaded && actionData.brandLogoUrl) {
      updateConfig("brandLogoUrl", actionData.brandLogoUrl);
    }
  }, [actionData, updateConfig]);

  const publishBlocked =
    widgetUsage != null && widgetUsage.remaining != null && widgetUsage.remaining <= 0;
  const publishBlockedMessage =
    widgetUsage?.limit != null
      ? `You've used all ${widgetUsage.limit} widget publishes. More available on your next bill.`
      : "Upgrade to Pro for more widget publishes.";

  const saveConfig = useCallback(() => {
    if (publishBlocked) return;
    submit({ config: serializeFormConfig(config) }, { method: "POST" });
  }, [submit, config, publishBlocked]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving) saveConfig();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSaving, saveConfig]);

  const handlePreview = useCallback(() => {
    const url = storefrontPreview?.url;
    if (url) {
      try {
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        shopify?.toast?.show?.("Could not open your storefront. Please try again.");
      }
      return;
    }
    shopify?.toast?.show?.(
      "Add the Product Reviews block to a product page in your theme, then open that page to preview your widget.",
    );
  }, [storefrontPreview, shopify]);

  const handleLogoUpload = (file) => {
    const fd = new FormData();
    fd.set("_intent", "uploadBrandLogo");
    fd.set("logo", file);
    submit(fd, { method: "POST", encType: "multipart/form-data" });
  };

  const handleAutofill = () => {
    setAutofillError("");
    submit({ _intent: "generateFormCopy" }, { method: "POST" });
  };

  const handleAddToTheme = useCallback(() => {
    if (!themeEditorUrl) {
      shopify?.toast?.show?.("Could not build theme editor link.", { isError: true });
      return;
    }
    const fd = new FormData();
    fd.set("intent", "mark_install");
    fd.set("widgetId", WIDGET_ID);
    fetcher.submit(fd, { method: "post" });
    openThemeEditorUrl(themeEditorUrl, shopify);
    shopify?.toast?.show?.("Theme editor opened. Save your theme after placing the block.");
  }, [themeEditorUrl, fetcher, shopify]);

  return (
    <ReviewFormEditorShell
      config={config}
      updateConfig={updateConfig}
      patchConfig={patchConfig}
      onSave={saveConfig}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      isSaving={isSaving}
      showSaveToast={showSaveToast}
      saveError={saveError}
      onPreview={handlePreview}
      onLogoUpload={handleLogoUpload}
      onAutofill={handleAutofill}
      autofillLoading={autofillLoading}
      autofillError={autofillError}
      shopDomain={shopDomain}
      reviewContext={reviewContext}
      storefrontPreview={storefrontPreview}
      publishBlocked={publishBlocked}
      publishBlockedMessage={publishBlockedMessage}
      backHref="/app/widgets"
      onAddToTheme={handleAddToTheme}
    />
  );
}
