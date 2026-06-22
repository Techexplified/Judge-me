import { useCallback, useEffect, useState } from "react";
import { Buffer } from "node:buffer";
import { useSubmit, useLoaderData, useNavigation, useActionData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { normalizeShopifyProductId } from "../utils/product-id.shared.js";
import {
  FORM_TEXT_KEYS,
  mergeFormConfig,
  serializeFormConfig,
} from "../lib/review-form-config.shared.js";
import { useConfigHistory } from "../hooks/use-config-history.js";
import { ReviewFormEditorShell } from "../components/review-form-editor/review-form-editor-shell.jsx";
import { boundary } from "@shopify/shopify-app-react-router/server";

const PRODUCT_PREVIEW_QUERY = `
  query ProductStorefrontPreview($id: ID!) {
    product(id: $id) {
      title
      handle
      onlineStoreUrl
      featuredImage {
        url
      }
    }
  }
`;

const FIRST_PRODUCT_PREVIEW_QUERY = `
  query FirstProductStorefrontPreview {
    products(first: 1, query: "status:active") {
      edges {
        node {
          title
          handle
          onlineStoreUrl
          featuredImage {
            url
          }
        }
      }
    }
  }
`;

function storefrontUrlFromProduct(node, shopDomain) {
  if (node?.onlineStoreUrl) return node.onlineStoreUrl;
  if (node?.handle) return `https://${shopDomain}/products/${node.handle}`;
  return null;
}

async function resolveStorefrontPreview(admin, shopDomain, productId) {
  const normalized = normalizeShopifyProductId(productId);
  const hasSpecificProduct =
    productId && productId !== "manual-product" && normalized && /^\d+$/.test(normalized);

  try {
    if (hasSpecificProduct) {
      const res = await admin.graphql(PRODUCT_PREVIEW_QUERY, {
        variables: { id: `gid://shopify/Product/${normalized}` },
      });
      const node = (await res.json())?.data?.product;
      const url = storefrontUrlFromProduct(node, shopDomain);
      if (url) return { url, title: node?.title ?? null, image: node?.featuredImage?.url ?? null };
    }

    const res = await admin.graphql(FIRST_PRODUCT_PREVIEW_QUERY);
    const node = (await res.json())?.data?.products?.edges?.[0]?.node;
    const url = storefrontUrlFromProduct(node, shopDomain);
    if (url) return { url, title: node?.title ?? null, image: node?.featuredImage?.url ?? null };
  } catch (err) {
    console.error("[review-form-editor] storefront preview", err);
  }

  return { url: null, title: null, image: null };
}

export const loader = async ({ request }) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus, serializePlanStatus } = await import("../lib/billing.server.js");
  const url = new URL(request.url);
  const rawProductId = url.searchParams.get("productId");
  const productId =
    normalizeShopifyProductId(rawProductId) ||
    (typeof rawProductId === "string" && rawProductId.trim()) ||
    "manual-product";
  const productName = url.searchParams.get("productName")?.trim() || "Manual Review Product";
  const productImage = url.searchParams.get("productImage")?.trim() || null;

  let formConfig = mergeFormConfig({});
  let widgetUsage = null;
  let planStatus = null;
  let storefrontPreview = { url: null, title: null, image: null };

  try {
    const settings = await db.settings.findUnique({ where: { shop } });
    let parsed = {};
    if (settings?.config) {
      try {
        parsed = JSON.parse(settings.config);
      } catch {
        parsed = {};
      }
    }
    formConfig = mergeFormConfig(parsed);
    planStatus = await getShopPlanStatus(shop, billing);
    widgetUsage = planStatus.featureUsage?.ai_widget_customization ?? null;
    storefrontPreview = await resolveStorefrontPreview(admin, shop, productId);
  } catch (err) {
    console.error("[review-form-editor] loader failed:", err);
  }

  return {
    savedConfig: formConfig,
    reviewContext: {
      productId,
      productName: storefrontPreview.title || productName,
      productImage: productImage || storefrontPreview.image,
    },
    shopDomain: shop,
    storefrontPreview,
    planStatus: planStatus ? serializePlanStatus(planStatus) : null,
    widgetUsage,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");

  if (intent === "generateFormCopy") {
    const { getResolvedOpenRouterKey, generateReviewFormCopy } = await import("../lib/openrouter.server.js");
    const { getShopPlanStatus } = await import("../lib/billing.server.js");
    const planStatus = await getShopPlanStatus(shop);
    if (!planStatus.hasPro) {
      return { autofillError: "Pro plan required for AI autofill." };
    }
    const apiKey = getResolvedOpenRouterKey();
    if (!apiKey) {
      return { autofillError: "AI is not configured. Contact support." };
    }
    const storeName = shop.replace(".myshopify.com", "").replace(/-/g, " ");
    const result = await generateReviewFormCopy({ apiKey, storeName });
    if (result.error) return { autofillError: result.error };
    const copy = {};
    for (const key of FORM_TEXT_KEYS) {
      if (result.copy?.[key]) copy[key] = String(result.copy[key]);
    }
    return { autofillCopy: copy };
  }

  if (intent === "uploadBrandLogo") {
    const file = fd.get("logo");
    if (!(file instanceof File) || file.size === 0) {
      return { logoError: "No file selected." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { logoError: "Logo must be 2MB or less." };
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      return { logoError: "Use PNG, JPG, SVG, or WebP." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const b64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${b64}`;

    const row = await db.settings.findUnique({ where: { shop } });
    let stored = {};
    if (row?.config) {
      try {
        stored = JSON.parse(row.config);
      } catch {
        stored = {};
      }
    }
    const merged = mergeFormConfig({ ...stored, brandLogoUrl: dataUrl });
    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify({ ...stored, ...merged }) },
      create: { shop, config: JSON.stringify(merged) },
    });
    return { logoUploaded: true, brandLogoUrl: dataUrl };
  }

  if (intent === "postReview") {
    const { canCreateReview, getShopPlanStatus } = await import("../lib/billing.server.js");
    const createCheck = await canCreateReview(shop);
    if (!createCheck.ok) {
      return { reviewError: createCheck.error };
    }

    const rating = Number(fd.get("rating"));
    const author = String(fd.get("author") || "").trim();
    const comment = String(fd.get("comment") || "").trim();
    const rawProductId = String(fd.get("productId") || "").trim();
    const productId = normalizeShopifyProductId(rawProductId) || rawProductId || "manual-product";
    const productName = String(fd.get("productName") || "").trim() || "Manual Review Product";
    const productImage = String(fd.get("productImage") || "").trim() || null;
    const title = String(fd.get("title") || "").trim() || null;
    const email = String(fd.get("email") || "").trim() || null;

    const settingsRow = await db.settings.findUnique({ where: { shop } });
    let savedConfig = {};
    if (settingsRow?.config) {
      try {
        savedConfig = JSON.parse(settingsRow.config);
      } catch {
        savedConfig = {};
      }
    }
    const formConfig = mergeFormConfig(savedConfig);
    const needsRating = formConfig.showRatings !== false;
    const needsWritten = formConfig.showWrittenReviews !== false;

    if (needsRating && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      return { reviewError: "Please select a rating before posting." };
    }
    if (needsWritten && (!author || !comment)) {
      return { reviewError: "Please add name and review before posting." };
    }

    const finalRating = needsRating ? rating : 5;
    const finalAuthor = author || "Anonymous";
    const finalComment = comment || "—";

    let reviewData = {
      shop,
      productId,
      productName,
      productImage,
      rating: finalRating,
      title,
      comment: finalComment,
      author: finalAuthor,
      email,
      status: "PUBLISHED",
    };

    const { maybeAutoTranslateReviewData } = await import("../lib/review-translation.server.js");
    const { data: translatedData } = await maybeAutoTranslateReviewData(shop, reviewData);
    reviewData = translatedData;

    const { extractMediaFilesFromForm, saveReviewMedia } = await import("../lib/review-media.server.js");
    const mediaResult = extractMediaFilesFromForm(fd, {
      allowImages: formConfig.showPhotos !== false,
      allowVideos: formConfig.showVideos !== false,
    });
    if (!mediaResult.ok) {
      return { reviewError: mediaResult.error };
    }

    const planStatus = await getShopPlanStatus(shop);
    if (mediaResult.files.length > 0) {
      const { mediaKindFromMime } = await import("../lib/review-media.shared.js");
      const hasVideo = mediaResult.files.some((f) => mediaKindFromMime(f.type) === "video");
      if (hasVideo && !planStatus.hasPro) {
        return { reviewError: "Video reviews require a Pro Plan." };
      }
    }

    const created = await db.review.create({ data: reviewData });
    if (mediaResult.files.length > 0) {
      await saveReviewMedia(created.id, mediaResult.files);
    }

    const { emitReviewCollectedFlowTrigger } = await import("../lib/flow-review-trigger.server.js");
    await emitReviewCollectedFlowTrigger(shop, created, { admin });
    return { reviewSaved: true };
  }

  const configRaw = fd.get("config");
  if (typeof configRaw !== "string") {
    return { ok: false };
  }

  let formPayload;
  try {
    formPayload = JSON.parse(configRaw);
  } catch {
    return { ok: false };
  }

  const { getShopPlanStatus, checkFeatureAccess, consumeFeatureUsage } = await import("../lib/billing.server.js");
  const planStatus = await getShopPlanStatus(shop);

  const accessCheck = await checkFeatureAccess(planStatus, "ai_widget_customization");
  if (!accessCheck.ok) {
    return { ok: false, publishError: accessCheck.message };
  }

  const row = await db.settings.findUnique({ where: { shop } });
  let stored = {};
  if (row?.config) {
    try {
      stored = JSON.parse(row.config);
    } catch {
      stored = {};
    }
  }

  const normalized = mergeFormConfig({ ...stored, ...formPayload });
  const merged = {
    ...stored,
    ...normalized,
    formConfigPublishedAt: new Date().toISOString(),
  };

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(merged) },
    create: { shop, config: JSON.stringify(merged) },
  });

  await consumeFeatureUsage(shop, "ai_widget_customization", 1);

  return { ok: true, publishedAt: merged.formConfigPublishedAt };
};

export default function ReviewFormCustomizeRoute() {
  const { savedConfig, reviewContext, storefrontPreview, widgetUsage, shopDomain } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const {
    config,
    updateConfig,
    patchConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useConfigHistory(savedConfig);

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [autofillError, setAutofillError] = useState("");
  const isSaving = navigation.state === "submitting";
  const autofillLoading = navigation.state === "submitting" && navigation.formData?.get("_intent") === "generateFormCopy";

  useEffect(() => {
    if (actionData?.ok) {
      queueMicrotask(() => {
        setSaveError("");
        setShowSaveToast(true);
      });
      const t = setTimeout(() => setShowSaveToast(false), 4000);
      return () => clearTimeout(t);
    }
    if (actionData?.ok === false) {
      queueMicrotask(() => {
        setSaveError(actionData.publishError || "Could not save settings. Please try again.");
      });
    }
    if (actionData?.logoError) {
      queueMicrotask(() => {
        setSaveError(actionData.logoError);
      });
    }
    if (actionData?.autofillError) {
      queueMicrotask(() => {
        setAutofillError(actionData.autofillError);
      });
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.autofillCopy) {
      queueMicrotask(() => {
        setAutofillError("");
        patchConfig(actionData.autofillCopy);
      });
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
    />
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
