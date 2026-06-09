import { useCallback, useEffect, useState } from "react";
import { useSubmit, useLoaderData, useNavigation, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { normalizeShopifyProductId } from "../utils/product-id.shared.js";
import {
  defaultFormConfig,
  mergeFormConfig,
  serializeFormConfig,
} from "../lib/review-form-config.shared.js";
import { useConfigHistory } from "../hooks/use-config-history.js";
import { CustomizerShell } from "../components/review-form/customizer-shell.jsx";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
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
  const settings = await db.settings.findUnique({ where: { shop } });
  let parsed = {};
  if (settings?.config) {
    try {
      parsed = JSON.parse(settings.config);
    } catch {
      parsed = {};
    }
  }
  const formConfig = mergeFormConfig(parsed);
  const planStatus = await getShopPlanStatus(shop, billing);
  const widgetUsage = planStatus.featureUsage?.ai_widget_customization ?? null;
  return {
    savedConfig: formConfig,
    reviewContext: { productId, productName, productImage },
    shopDomain: shop,
    planStatus: serializePlanStatus(planStatus),
    widgetUsage,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");

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

    const { extractMediaFilesFromForm, saveReviewMedia } = await import(
      "../lib/review-media.server.js"
    );
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

  // Check access BEFORE touching the DB, but do NOT consume yet
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

  // Save to DB first — only consume credit after a confirmed successful save
  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(merged) },
    create: { shop, config: JSON.stringify(merged) },
  });

  // Credit consumed ONLY after the save succeeds
  await consumeFeatureUsage(shop, "ai_widget_customization", 1);

  return { ok: true, publishedAt: merged.formConfigPublishedAt };
};

export default function ReviewFormCustomizer() {
  const {
    savedConfig,
    reviewContext,
    shopDomain,
    widgetUsage,
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const {
    config,
    getConfig,
    updateConfig,
    patchConfig,
    replaceConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useConfigHistory(savedConfig);

  const [showPublishToast, setShowPublishToast] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.ok) {
      setSaveError("");
      setShowPublishToast(true);
      const t = setTimeout(() => setShowPublishToast(false), 4000);
      return () => clearTimeout(t);
    }
    if (actionData?.ok === false) {
      setSaveError(actionData.publishError || "Could not publish settings. Please try again.");
    }
    if (actionData?.logoError) {
      setSaveError(actionData.logoError);
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.logoUploaded && actionData.brandLogoUrl) {
      updateConfig("brandLogoUrl", actionData.brandLogoUrl);
    }
  }, [actionData, updateConfig]);

  const publishBlocked =
    widgetUsage != null && widgetUsage.remaining != null && widgetUsage.remaining <= 0;
  const publishBlockedMessage =
    widgetUsage?.limit != null
      ? `You've used all ${widgetUsage.limit} widget publishes this month. Resets on the 1st.`
      : "Upgrade to Pro for more widget publishes.";

  const saveConfig = useCallback(() => {
    if (publishBlocked) return;
    submit({ config: serializeFormConfig(config) }, { method: "POST" });
  }, [submit, config, publishBlocked]);

  const resetConfig = useCallback(() => {
    resetHistory(mergeFormConfig(defaultFormConfig));
  }, [resetHistory]);

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

  const handlePreview = () => {
    const pid = reviewContext.productId;
    if (pid && pid !== "manual-product") {
      const numericId = String(pid).replace(/\D/g, "");
      if (numericId) {
        window.open(
          `https://${shopDomain}/products/${numericId}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }
    window.alert(
      "Open a product page with the Product Reviews block enabled to preview on your storefront. Add ?productId= to this URL from the dashboard for a direct link.",
    );
  };

  const handleSubmitReview = ({ rating, author, comment, mediaItems }) => {
    const fd = new FormData();
    fd.set("_intent", "postReview");
    fd.set("rating", String(rating));
    fd.set("author", author);
    fd.set("comment", comment);
    fd.set("productId", reviewContext.productId || "manual-product");
    fd.set("productName", reviewContext.productName || "Manual Review Product");
    if (reviewContext.productImage) fd.set("productImage", reviewContext.productImage);
    for (const item of mediaItems) {
      fd.append("media", item.file);
    }
    submit(fd, { method: "POST", encType: "multipart/form-data" });
  };

  return (
    <CustomizerShell
      config={config}
      getConfig={getConfig}
      updateConfig={updateConfig}
      patchConfig={patchConfig}
      replaceConfig={replaceConfig}
      onReset={resetConfig}
      onSave={saveConfig}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      isSaving={isSaving}
      showPublishToast={showPublishToast}
      saveError={saveError}
      reviewContext={reviewContext}
      actionData={actionData}
      onSubmitReview={handleSubmitReview}
      onPreview={handlePreview}
      publishBlocked={publishBlocked}
      publishBlockedMessage={publishBlockedMessage}
      widgetUsage={widgetUsage}
      embedded
    />
  );
}
