import { useCallback, useEffect } from "react";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { WidgetsPage } from "../components/widgets/widgets-page.jsx";
import { getWidgetCustomizePath } from "../lib/theme-editor-nav.shared.js";
import { openThemeEditorUrl } from "../components/onboarding/theme-editor-guide.jsx";
import { useEmbedNavigate } from "../hooks/use-embed-navigate.js";

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const { loadWidgetsPageData } = await import("../lib/widgets.server.js");
  return loadWidgetsPageData({ session, admin, billing });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { markWidgetInstallIntent, markCoreEmbedAcknowledged } = await import("../lib/widgets.server.js");
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const widgetId = String(fd.get("widgetId") ?? "").trim();
  const intent = String(fd.get("intent") ?? "");
  if (intent === "ack_core_embed") {
    await markCoreEmbedAcknowledged(shop);
    return { ok: true };
  }
  if (widgetId) {
    await markWidgetInstallIntent(shop, widgetId);
  }
  return { ok: true };
};

export default function WidgetsIndexRoute() {
  const data = useLoaderData();
  const shopify = useAppBridge();
  const embedNavigate = useEmbedNavigate();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        revalidator.revalidate();
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [revalidator]);

  const handleAddToTheme = useCallback(
    (widget) => {
      if (!widget?.id) return;

      if (widget.id === "review-translation-hub") {
        embedNavigate("/app/widgets/translation");
        return;
      }

      if (data.themeInstalled?.[widget.id]) {
        shopify?.toast?.show?.(`${widget.title || "This widget"} is already added to your theme.`, {
          isError: true,
        });
        return;
      }

      if (widget.id === "video-reviews-slider" && !data.premium) {
        shopify?.toast?.show?.("Video Reviews Slider requires a Pro plan.", { isError: true });
        embedNavigate("/app/settings");
        return;
      }

      if (widget.id === "customers-love-page" && !data.premium) {
        shopify?.toast?.show?.("Customer's Love Page requires a Pro plan.", { isError: true });
        embedNavigate("/app/settings");
        return;
      }

      if (widget.id === "testimonials" && !data.premium) {
        shopify?.toast?.show?.("Testimonials requires a Pro plan.", { isError: true });
        embedNavigate("/app/settings");
        return;
      }

      const url = data.themeEditorUrls?.[widget.id];
      if (!url) {
        shopify?.toast?.show?.("Could not build theme editor link.", { isError: true });
        return;
      }

      const fd = new FormData();
      fd.set("widgetId", widget.id);
      fetcher.submit(fd, { method: "post" });

      openThemeEditorUrl(url, shopify);
      shopify?.toast?.show?.(
        "Theme editor opened. Preview the block, then click Save. Enable JudgeMe Core in App embeds if prompted.",
      );
    },
    [data.premium, data.themeEditorUrls, data.themeInstalled, embedNavigate, fetcher, shopify],
  );

  const handleEnableCore = useCallback(() => {
    if (!data.coreEmbedUrl) {
      shopify?.toast?.show?.("Could not build app embed link.", { isError: true });
      return;
    }
    const fd = new FormData();
    fd.set("intent", "ack_core_embed");
    fetcher.submit(fd, { method: "post" });
    openThemeEditorUrl(data.coreEmbedUrl, shopify);
    shopify?.toast?.show?.("Enable JudgeMe Core under Theme Settings → App embeds, then Save.");
  }, [data.coreEmbedUrl, fetcher, shopify]);

  const handleRefreshStatus = useCallback(() => {
    revalidator.revalidate();
    shopify?.toast?.show?.("Checking your theme for installed widgets…");
  }, [revalidator, shopify]);

  const handleCustomize = useCallback(
    (widget) => {
      if (!widget?.id) return;
      if (widget.id === "review-translation-hub") {
        embedNavigate("/app/widgets/translation");
        return;
      }
      const path = getWidgetCustomizePath(widget.id);
      if (path) {
        embedNavigate(path);
      }
    },
    [embedNavigate],
  );

  return (
    <WidgetsPage
      {...data}
      onAddToTheme={handleAddToTheme}
      onCustomize={handleCustomize}
      onEnableCore={handleEnableCore}
      onRefreshStatus={handleRefreshStatus}
    />
  );
}
