import { Buffer } from "node:buffer";
import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import {
  invalidateShopReviewsCache,
  invalidateShopSettingsCache,
} from "./public-cache.server.js";
import { normalizeShopifyProductId } from "../utils/product-id.shared.js";
import {
  FORM_TEXT_KEYS,
  mergeFormConfig,
  serializeFormConfig,
} from "./review-form-config.shared.js";

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

export async function resolveStorefrontPreview(admin, shopDomain, productId) {
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

export async function reviewFormEditorLoader({ request, session, billing, admin }) {
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus, serializePlanStatus } = await import("./billing.server.js");
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
}

export async function reviewFormEditorAction({ request, session, admin }) {
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");
  const routeIntent = fd.get("intent");

  if (routeIntent === "mark_install") {
    const { markWidgetInstallIntent } = await import("./widgets.server.js");
    const widgetId = String(fd.get("widgetId") || "review-showcase");
    await markWidgetInstallIntent(shop, widgetId);
    return { ok: true };
  }

  if (intent === "generateFormCopy") {
    const { getResolvedOpenRouterKey, generateReviewFormCopy } = await import("./openrouter.server.js");
    const { getShopPlanStatus } = await import("./billing.server.js");
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
    const { saveShopBrandLogo } = await import("./shop-assets.server.js");
    const brandLogoUrl = await saveShopBrandLogo(
      shop,
      { mimeType: file.type, buffer, filename: file.name || "brand-logo" },
      // request not available here — store proxy-relative path; public settings resolves origin
    );

    const row = await db.settings.findUnique({ where: { shop } });
    let stored = {};
    if (row?.config) {
      try {
        stored = JSON.parse(row.config);
      } catch {
        stored = {};
      }
    }
    const merged = mergeFormConfig({ ...stored, brandLogoUrl });
    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify({ ...stored, ...merged }) },
      create: { shop, config: JSON.stringify(merged) },
    });
    invalidateShopSettingsCache(shop);
    const { setCachedShopConfig } = await import("./shop-config-cache.server.js");
    setCachedShopConfig(shop, { ...stored, ...merged });
    return { logoUploaded: true, brandLogoUrl };
  }

  if (intent === "postReview") {
    const { canCreateReview, getShopPlanStatus } = await import("./billing.server.js");
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

    const { maybeAutoTranslateReviewData } = await import("./review-translation.server.js");
    const { data: translatedData } = await maybeAutoTranslateReviewData(shop, reviewData);
    reviewData = translatedData;

    const { extractMediaFilesFromForm, saveReviewMedia } = await import("./review-media.server.js");
    const mediaResult = extractMediaFilesFromForm(fd, {
      allowImages: formConfig.showPhotos !== false,
      allowVideos: formConfig.showVideos !== false,
    });
    if (!mediaResult.ok) {
      return { reviewError: mediaResult.error };
    }

    const planStatus = await getShopPlanStatus(shop);
    if (mediaResult.files.length > 0) {
      const { mediaKindFromMime } = await import("./review-media.shared.js");
      const hasVideo = mediaResult.files.some((f) => mediaKindFromMime(f.type) === "video");
      if (hasVideo && !planStatus.hasPro) {
        return { reviewError: "Video reviews require a Pro Plan." };
      }
    }

    const created = await db.review.create({ data: reviewData });
    if (mediaResult.files.length > 0) {
      await saveReviewMedia(created.id, mediaResult.files);
    }
    invalidateShopReviewsCache(shop, [reviewData.productId]);

    const { emitReviewCollectedFlowTrigger } = await import("./flow-review-trigger.server.js");
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

  const { getShopPlanStatus, checkFeatureAccess, consumeFeatureUsage } = await import("./billing.server.js");
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
  invalidateShopSettingsCache(shop);

  const { getFeatureLimit } = await import("./usage.shared.js");
  const widgetLimit = getFeatureLimit(planStatus, "ai_widget_customization");
  if (Number.isFinite(widgetLimit)) {
    await consumeFeatureUsage(shop, "ai_widget_customization", 1);
  }

  return { ok: true, publishedAt: merged.formConfigPublishedAt };
}
