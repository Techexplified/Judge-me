export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_VIDEOS = 2;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Kept ≤4MB so multipart uploads work on Vercel serverless. */
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

export const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

/** @param {string} mime */
export function mediaKindFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (IMAGE_MIME_TYPES.has(m)) return "image";
  if (VIDEO_MIME_TYPES.has(m)) return "video";
  return null;
}

/**
 * @param {File | Blob} file
 * @param {{ allowImages?: boolean, allowVideos?: boolean, imageCount?: number, videoCount?: number }} opts
 */
export function validateReviewMediaFile(file, opts = {}) {
  const allowImages = opts.allowImages !== false;
  const allowVideos = opts.allowVideos !== false;
  const kind = mediaKindFromMime(file.type);
  if (!kind) {
    return { ok: false, error: "Use PNG, JPG, WebP, MP4, MOV, or WebM files only." };
  }
  if (kind === "image" && !allowImages) {
    return { ok: false, error: "Photo uploads are disabled for this form." };
  }
  if (kind === "video" && !allowVideos) {
    return { ok: false, error: "Video uploads are disabled for this form." };
  }
  if (kind === "image" && (opts.imageCount ?? 0) >= MAX_REVIEW_IMAGES) {
    return { ok: false, error: `You can add up to ${MAX_REVIEW_IMAGES} photos.` };
  }
  if (kind === "video" && (opts.videoCount ?? 0) >= MAX_REVIEW_VIDEOS) {
    return { ok: false, error: `You can add up to ${MAX_REVIEW_VIDEOS} videos.` };
  }
  if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Each photo must be 5MB or less." };
  }
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Each video must be 4MB or less." };
  }
  return { ok: true, kind };
}
