/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import { Buffer } from "node:buffer";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import {
  deriveInactiveStarColor,
  mergeFormConfig,
  normalizeHex,
  radiusFromPreset,
  TYPOGRAPHY_OPTIONS,
} from "../lib/review-form-config.shared.js";
import { BrandingSettingsPanel } from "../components/settings/branding-settings-panel.jsx";

const BRANDING_CORNER_IDS = ["sharp", "slight", "default", "rounded"];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const { loadShopConfig } = await import("../lib/collect-reviews.server.js");

  const stored = await loadShopConfig(shop);
  const formConfig = mergeFormConfig(stored);

  return {
    shop,
    branding: {
      brandLogoUrl: formConfig.brandLogoUrl || null,
      starColor: formConfig.starColor,
      radiusPreset: formConfig.radiusPreset,
      borderRadius: formConfig.borderRadius,
      typography: formConfig.typography,
      hideJudgeMeBranding: formConfig.hideJudgeMeBranding === true,
    },
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = String(fd.get("intent") || "");

  const { loadShopConfig, saveShopConfig } = await import("../lib/collect-reviews.server.js");

  if (intent === "uploadBrandLogo") {
    const file = fd.get("logo");
    if (!(file instanceof File) || file.size === 0) {
      return data({ error: "No file selected." }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return data({ error: "Logo must be 2MB or less." }, { status: 400 });
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      return data({ error: "Use PNG, JPG, SVG, or WebP." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { saveShopBrandLogo } = await import("../lib/shop-assets.server.js");
    const brandLogoUrl = await saveShopBrandLogo(shop, {
      mimeType: file.type,
      buffer,
      filename: file.name || "brand-logo",
    });

    const stored = await loadShopConfig(shop);
    const merged = mergeFormConfig({ ...stored, brandLogoUrl });
    await saveShopConfig(shop, { ...stored, ...merged, brandLogoUrl });
    return data({ ok: true, logoUploaded: true, brandLogoUrl });
  }

  if (intent === "removeBrandLogo") {
    const { deleteShopBrandLogo } = await import("../lib/shop-assets.server.js");
    await deleteShopBrandLogo(shop);
    const stored = await loadShopConfig(shop);
    const merged = mergeFormConfig({ ...stored, brandLogoUrl: null });
    await saveShopConfig(shop, { ...stored, ...merged, brandLogoUrl: null });
    return data({ ok: true, logoRemoved: true, brandLogoUrl: null });
  }

  if (intent === "saveBranding") {
    const starColorRaw = String(fd.get("starColor") || "");
    const starColor = normalizeHex(starColorRaw) || null;
    if (!starColor) {
      return data({ error: "Enter a valid star color hex code." }, { status: 400 });
    }

    let radiusPreset = String(fd.get("radiusPreset") || "default");
    if (!BRANDING_CORNER_IDS.includes(radiusPreset)) {
      radiusPreset = "default";
    }

    let typography = String(fd.get("typography") || "Inter (System)");
    if (!TYPOGRAPHY_OPTIONS.some((o) => o.value === typography)) {
      typography = "Inter (System)";
    }

    const hideJudgeMeBranding = String(fd.get("hideJudgeMeBranding") || "") === "true";

    const stored = await loadShopConfig(shop);
    const patch = {
      starColor,
      inactiveStarColor: deriveInactiveStarColor(starColor),
      radiusPreset,
      borderRadius: radiusFromPreset(radiusPreset),
      typography,
      hideJudgeMeBranding,
    };

    const brandLogoUrlField = fd.get("brandLogoUrl");
    if (brandLogoUrlField === "" || brandLogoUrlField === "null") {
      patch.brandLogoUrl = null;
    }

    const merged = mergeFormConfig({ ...stored, ...patch });
    await saveShopConfig(shop, { ...stored, ...merged, ...patch });
    return data({
      ok: true,
      saved: true,
      branding: {
        brandLogoUrl: merged.brandLogoUrl || null,
        starColor: merged.starColor,
        radiusPreset: merged.radiusPreset,
        borderRadius: merged.borderRadius,
        typography: merged.typography,
        hideJudgeMeBranding: merged.hideJudgeMeBranding === true,
      },
    });
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

export default function SettingsBrandingPage() {
  const { branding: initialBranding } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [branding, setBranding] = useState(initialBranding);
  const [saveOk, setSaveOk] = useState(false);

  const isSaving =
    navigation.state === "submitting" && navigation.formData?.get("intent") === "saveBranding";
  const isUploading =
    navigation.state === "submitting" &&
    (navigation.formData?.get("intent") === "uploadBrandLogo" ||
      navigation.formData?.get("intent") === "removeBrandLogo");

  useEffect(() => {
    setBranding(initialBranding);
  }, [initialBranding]);

  useEffect(() => {
    if (actionData?.brandLogoUrl !== undefined) {
      setBranding((prev) => ({ ...prev, brandLogoUrl: actionData.brandLogoUrl }));
    }
    if (actionData?.branding) {
      setBranding(actionData.branding);
    }
    if (actionData?.saved) {
      setSaveOk(true);
      const t = setTimeout(() => setSaveOk(false), 3500);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  const handleSave = (patch) => {
    setSaveOk(false);
    submit(
      {
        intent: "saveBranding",
        starColor: patch.starColor,
        radiusPreset: patch.radiusPreset,
        typography: patch.typography,
        hideJudgeMeBranding: String(patch.hideJudgeMeBranding === true),
        brandLogoUrl: patch.brandLogoUrl ?? "",
      },
      { method: "post" },
    );
  };

  const handleLogoUpload = (file) => {
    setSaveOk(false);
    const fd = new FormData();
    fd.set("intent", "uploadBrandLogo");
    fd.set("logo", file);
    submit(fd, { method: "post", encType: "multipart/form-data" });
  };

  const handleLogoRemove = () => {
    setSaveOk(false);
    submit({ intent: "removeBrandLogo" }, { method: "post" });
  };

  return (
    <BrandingSettingsPanel
      config={branding}
      isSaving={isSaving}
      isUploading={isUploading}
      saveOk={saveOk}
      error={actionData?.error || null}
      onSave={handleSave}
      onLogoUpload={handleLogoUpload}
      onLogoRemove={handleLogoRemove}
    />
  );
}
