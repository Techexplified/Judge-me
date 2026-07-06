import { normalizeShopDomain } from "../utils/shop.js";
import { hasProAccess, getShopPlanStatus, serializePlanStatus } from "./billing.server.js";
import { buildThemeEditorBlockUrl } from "./theme-editor-nav.shared.js";
import { loadWidgetCustomization, saveWidgetCustomization } from "./widget-customization.server.js";
import { markWidgetInstallIntent } from "./widgets.server.js";

const WIDGET_ID = "testimonials";

export async function widgetTestimonialsLoader({ session, billing }) {
  const shop = normalizeShopDomain(session.shop);
  const planStatus = await getShopPlanStatus(shop, billing);
  const premium = hasProAccess(planStatus);
  const savedConfig = await loadWidgetCustomization(shop, WIDGET_ID);
  const apiKey = globalThis.process?.env?.SHOPIFY_API_KEY || "";

  return {
    savedConfig,
    premium,
    planStatus: serializePlanStatus(planStatus),
    themeEditorUrl: buildThemeEditorBlockUrl(shop, apiKey, WIDGET_ID),
  };
}

export async function widgetTestimonialsAction({ request, session }) {
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  if (intent === "mark_install") {
    await markWidgetInstallIntent(shop, WIDGET_ID);
    return { ok: true };
  }

  const configRaw = fd.get("config");
  if (typeof configRaw !== "string") return { ok: false };

  const planStatus = await getShopPlanStatus(shop);
  if (!hasProAccess(planStatus)) {
    return { ok: false, publishError: "Testimonials requires a Pro plan." };
  }

  let payload;
  try {
    payload = JSON.parse(configRaw);
  } catch {
    return { ok: false };
  }

  return saveWidgetCustomization(shop, WIDGET_ID, payload);
}