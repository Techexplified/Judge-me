import { normalizeShopifyProductId } from "../utils/product-id.server.js";
import { reviewFingerprint } from "./review-dedup.server.js";
import { normalizeRating, parseReviewDate } from "./csv-import.shared.js";

export {
  TARGET_FIELDS,
  validateMapping,
  generateTemplateCsv,
  IMPORT_LIMITS,
  DEFAULT_SETTINGS,
} from "./csv-import.shared.js";

export function buildProductLookup(rows) {
  const byHandle = new Map();
  const byProductId = new Map();
  const bySku = new Map();

  for (const row of rows) {
    const entry = {
      productId: normalizeShopifyProductId(row.productId) || row.productId,
      productName: row.title,
      productImage: null,
    };
    const handle = String(row.handle ?? "").trim().toLowerCase();
    if (handle) byHandle.set(handle, entry);
    const pid = normalizeShopifyProductId(row.productId) || String(row.productId ?? "").trim();
    if (pid) byProductId.set(pid, entry);
    const sku = String(row.sku ?? "").trim().toLowerCase();
    if (sku) bySku.set(sku, entry);
  }

  return { byHandle, byProductId, bySku };
}

function getMappedValue(row, mapping, target) {
  for (const [csvCol, field] of Object.entries(mapping)) {
    if (field === target) {
      const val = row[csvCol];
      if (val != null && String(val).trim() !== "") return String(val).trim();
    }
  }
  return "";
}

export function resolveProduct(row, mapping, lookup) {
  const handle = getMappedValue(row, mapping, "productHandle").toLowerCase();
  const productIdRaw = getMappedValue(row, mapping, "productId");
  const sku = getMappedValue(row, mapping, "productSku").toLowerCase();

  if (handle && lookup.byHandle.has(handle)) {
    return lookup.byHandle.get(handle);
  }
  const pid = normalizeShopifyProductId(productIdRaw) || productIdRaw;
  if (pid && lookup.byProductId.has(pid)) {
    return lookup.byProductId.get(pid);
  }
  if (sku && lookup.bySku.has(sku)) {
    return lookup.bySku.get(sku);
  }
  return null;
}

export function validateRows(rows, mapping, lookup, existingFingerprints, settings, shop) {
  const validated = [];
  const summary = {
    total: rows.length,
    ready: 0,
    lowRating: 0,
    duplicate: 0,
    productNotFound: 0,
    invalid: 0,
  };

  const batchFingerprints = new Set(existingFingerprints);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const author = getMappedValue(row, mapping, "author") || "Customer";
    const comment = getMappedValue(row, mapping, "comment");
    const rating = normalizeRating(getMappedValue(row, mapping, "rating"));
    const title = getMappedValue(row, mapping, "title") || null;
    const email = getMappedValue(row, mapping, "email") || null;
    const reply = getMappedValue(row, mapping, "reply") || null;
    const replyDateRaw = getMappedValue(row, mapping, "replyDate");
    const reviewDateRaw = getMappedValue(row, mapping, "reviewDate");
    const product = resolveProduct(row, mapping, lookup);

    let status = "ready";
    let importable = true;

    if (!comment || rating == null) {
      status = "invalid";
      importable = false;
      summary.invalid += 1;
    } else if (!product) {
      status = "product_not_found";
      importable = false;
      summary.productNotFound += 1;
    } else {
      const fpKey = `${shop}::${product.productId}::${reviewFingerprint(author, comment)}`;
      const isDuplicate = batchFingerprints.has(fpKey);

      if (isDuplicate) {
        status = "duplicate";
        if (settings.skipDuplicates) {
          importable = false;
          summary.duplicate += 1;
        } else {
          summary.ready += 1;
        }
      } else if (settings.filterMinRating && rating < 4) {
        status = "low_rating";
        summary.lowRating += 1;
        summary.ready += 1;
        batchFingerprints.add(fpKey);
      } else {
        summary.ready += 1;
        batchFingerprints.add(fpKey);
      }
    }

    validated.push({
      index: i,
      author,
      comment,
      rating: rating ?? 0,
      title,
      email,
      reply: reply || null,
      replyDate: parseReviewDate(replyDateRaw),
      createdAt: parseReviewDate(reviewDateRaw) ?? new Date(),
      productHandle: getMappedValue(row, mapping, "productHandle") || null,
      productId: product?.productId ?? null,
      productName: product?.productName ?? null,
      productImage: product?.productImage ?? null,
      status,
      importable,
    });
  }

  return { validated, summary };
}

export function rowsToReviewRecords(validatedRows, shop, settings) {
  return validatedRows
    .filter((r) => r.importable && r.productId)
    .map((r) => {
      let status = "PUBLISHED";
      if (!settings.publishImmediately) {
        status = "PENDING";
      } else if (settings.filterMinRating && r.rating < 4) {
        status = "PENDING";
      }

      return {
        shop,
        productId: r.productId,
        productName: r.productName,
        productImage: r.productImage,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        author: r.author,
        email: r.email,
        status,
        reply: r.reply,
        replyDate: r.replyDate,
        createdAt: r.createdAt,
      };
    });
}
