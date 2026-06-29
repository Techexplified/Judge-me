/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigation, useActionData, useSubmit } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  mergeVideoSliderConfig,
  serializeVideoSliderConfig,
} from "../lib/video-slider-config.shared.js";
import { useConfigHistory } from "../hooks/use-config-history.js";
import { WidgetCustomizeShell } from "../components/widgets/widget-customize-shell.jsx";
import { WidgetVideoSliderPanel } from "../components/widgets/widget-video-slider-panel.jsx";
import { WidgetVideoSliderPreview } from "../components/widgets/widget-video-slider-preview.jsx";
import { openThemeEditorUrl } from "../components/onboarding/theme-editor-guide.jsx";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const { widgetVideoSliderLoader } = await import("../lib/widget-video-slider.server.js");
  return widgetVideoSliderLoader({ session, billing });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { widgetVideoSliderAction } = await import("../lib/widget-video-slider.server.js");
  return widgetVideoSliderAction({ request, session });
};

export default function WidgetVideoSliderCustomizeRoute() {
  const { savedConfig, premium, themeEditorUrl } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const initialConfig = savedConfig ?? mergeVideoSliderConfig({});
  const { config, updateConfig, undo, redo, canUndo, canRedo } = useConfigHistory(initialConfig);
  const isSaving = navigation.state === "submitting";
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (actionData?.ok) {
      setShowSaveToast(true);
      setSaveError("");
      const t = setTimeout(() => setShowSaveToast(false), 4000);
      return () => clearTimeout(t);
    }
    if (actionData?.ok === false) {
      setSaveError(actionData.publishError || "Could not save settings.");
    }
  }, [actionData]);

  const saveConfig = useCallback(() => {
    if (!premium) return;
    submit({ config: serializeVideoSliderConfig(config) }, { method: "POST" });
  }, [submit, config, premium]);

  const handleAddToTheme = useCallback(() => {
    if (!premium) {
      shopify?.toast?.show?.("Video Reviews Slider requires a Pro plan.", { isError: true });
      return;
    }
    if (!themeEditorUrl) {
      shopify?.toast?.show?.("Could not build theme editor link.", { isError: true });
      return;
    }
    const fd = new FormData();
    fd.set("intent", "mark_install");
    fetcher.submit(fd, { method: "post" });
    openThemeEditorUrl(themeEditorUrl, shopify);
    shopify?.toast?.show?.("Theme editor opened. Save your theme after placing the block.");
  }, [premium, themeEditorUrl, fetcher, shopify]);

  return (
    <WidgetCustomizeShell
      title="Video Reviews Slider"
      onSave={saveConfig}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      isSaving={isSaving}
      showSaveToast={showSaveToast}
      saveError={saveError}
      onAddToTheme={handleAddToTheme}
      addToThemeDisabled={!premium}
      proGateBanner={!premium ? "Upgrade to Pro to customize and add the Video Reviews Slider." : null}
      preview={<WidgetVideoSliderPreview config={config} />}
    >
      <WidgetVideoSliderPanel config={config} updateConfig={updateConfig} />
    </WidgetCustomizeShell>
  );
}
