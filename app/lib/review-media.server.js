import db from "../db.server.js";
import {
  mediaKindFromMime,
  validateReviewMediaFile,
} from "./review-media.shared.js";

export { MAX_REVIEW_IMAGES, MAX_REVIEW_VIDEOS } from "./review-media.shared.js";

/** Public URL path for a stored media row (prepend your app origin on the storefront). */
export function reviewMediaPublicPath(mediaId) {
  return `/api/public/review-media/${encodeURIComponent(mediaId)}`;
}

/**
 * @param {Request} request
 * @param {string} mediaId
 */
export function reviewMediaPublicUrl(request, mediaId) {
  const origin = new URL(request.url).origin;
  return `${origin}${reviewMediaPublicPath(mediaId)}`;
}

/**
 * Read uploaded files from multipart form data (`media` fields).
 * @param {FormData} fd
 * @param {{ allowImages?: boolean, allowVideos?: boolean }} opts
 */
export function extractMediaFilesFromForm(fd, opts = {}) {
  const raw = fd.getAll("media");
  const files = [];
  let imageCount = 0;
  let videoCount = 0;

  for (const entry of raw) {
    if (!entry || typeof entry === "string") continue;
    const file = /** @type {File} */ (entry);
    if (!file.size) continue;

    const check = validateReviewMediaFile(file, {
      ...opts,
      imageCount,
      videoCount,
    });
    if (!check.ok) {
      return { ok: false, error: check.error, files: [] };
    }
    if (check.kind === "image") imageCount += 1;
    if (check.kind === "video") videoCount += 1;
    files.push({ file, kind: check.kind });
  }

  return { ok: true, files, error: null };
}

/**
 * Persist media blobs for a review.
 * @param {string} reviewId
 * @param {Array<{ file: File | Blob, kind: string }>} items
 */
export async function saveReviewMedia(reviewId, items) {
  if (!items?.length) return [];

  const created = [];
  for (const { file, kind } of items) {
    const mimeType = String(file.type || "").toLowerCase() || "application/octet-stream";
    const resolvedKind = kind || mediaKindFromMime(mimeType);
    if (!resolvedKind) continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename =
      typeof file.name === "string" && file.name.trim()
        ? file.name.trim()
        : `${resolvedKind}-${created.length + 1}`;

    const row = await db.reviewMedia.create({
      data: {
        reviewId,
        type: resolvedKind,
        mimeType,
        filename,
        data: buffer,
      },
      select: {
        id: true,
        type: true,
        mimeType: true,
        filename: true,
        createdAt: true,
      },
    });
    created.push(row);
  }
  return created;
}

/**
 * @param {Request} request
 * @param {Array<{ id: string, type: string, mimeType: string, filename: string | null }>} rows
 */
export function serializeReviewMedia(request, rows) {
  if (!rows?.length) return [];
  return rows.map((m) => ({
    id: m.id,
    type: m.type,
    mimeType: m.mimeType,
    filename: m.filename,
    url: reviewMediaPublicUrl(request, m.id),
  }));
}

/** @param {string} reviewId */
export async function listReviewMediaMeta(reviewId) {
  return db.reviewMedia.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      mimeType: true,
      filename: true,
      createdAt: true,
    },
  });
}

/**
 * @param {Request} request
 * @param {Array<Record<string, unknown> & { media?: Array<{ id: string, type: string, mimeType: string, filename: string | null }> }>} reviews
 */
export function attachPublicMediaUrls(request, reviews) {
  return reviews.map((r) => ({
    ...r,
    media: serializeReviewMedia(request, r.media || []),
  }));
}
