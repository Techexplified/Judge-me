/**
 * In-process cache for ReviewMedia blobs.
 * Neon data-transfer is billed when BYTEA columns leave Postgres — caching here
 * stops repeat storefront image/video hits from re-pulling the same rows.
 */

const MAX_ENTRIES = 40;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024; // ~40MB soft cap per warm instance

const state =
  global.__judgemeMediaBlobCache ??
  {
    entries: new Map(), // id -> { buffer, mimeType, filename, type, size }
    totalBytes: 0,
  };

global.__judgemeMediaBlobCache = state;

function touch(id) {
  const entry = state.entries.get(id);
  if (!entry) return null;
  // Refresh LRU order
  state.entries.delete(id);
  state.entries.set(id, entry);
  return entry;
}

function evictIfNeeded() {
  while (
    state.entries.size > MAX_ENTRIES ||
    state.totalBytes > MAX_TOTAL_BYTES
  ) {
    const oldestKey = state.entries.keys().next().value;
    if (!oldestKey) return;
    const oldest = state.entries.get(oldestKey);
    state.entries.delete(oldestKey);
    state.totalBytes -= oldest?.size || 0;
  }
}

export function getCachedMediaBlob(id) {
  return touch(id);
}

export function setCachedMediaBlob(id, row) {
  if (!id || !row?.data) return;
  const existing = state.entries.get(id);
  if (existing) {
    state.totalBytes -= existing.size;
    state.entries.delete(id);
  }
  const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  const entry = {
    buffer,
    mimeType: row.mimeType,
    filename: row.filename,
    type: row.type,
    size: buffer.length,
  };
  state.entries.set(id, entry);
  state.totalBytes += entry.size;
  evictIfNeeded();
  return entry;
}
