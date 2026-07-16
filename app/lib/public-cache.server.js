const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 500;

const cacheState =
  global.__verdictPublicCache ??
  {
    entries: new Map(),
    tags: new Map(),
  };

// Persist across warm serverless invocations so public JSON is not rebuilt every cold hit.
global.__verdictPublicCache = cacheState;

function nowMs() {
  return Date.now();
}

function pruneExpired(now = nowMs()) {
  for (const [key, entry] of cacheState.entries) {
    if (entry.expiresAt <= now) {
      deleteCacheKey(key, entry.tags);
    }
  }
}

function deleteCacheKey(key, tags = []) {
  cacheState.entries.delete(key);
  for (const tag of tags) {
    const keys = cacheState.tags.get(tag);
    if (!keys) continue;
    keys.delete(key);
    if (keys.size === 0) cacheState.tags.delete(tag);
  }
}

function pruneSize() {
  while (cacheState.entries.size > MAX_ENTRIES) {
    const oldestKey = cacheState.entries.keys().next().value;
    if (!oldestKey) return;
    const oldest = cacheState.entries.get(oldestKey);
    deleteCacheKey(oldestKey, oldest?.tags || []);
  }
}

export function getPublicCache(key) {
  const entry = cacheState.entries.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    deleteCacheKey(key, entry.tags);
    return null;
  }
  return entry.value;
}

export function setPublicCache(key, value, { ttlMs = DEFAULT_TTL_MS, tags = [] } = {}) {
  pruneExpired();
  const entry = {
    value,
    tags: [...new Set(tags.filter(Boolean))],
    expiresAt: nowMs() + ttlMs,
  };
  cacheState.entries.set(key, entry);
  for (const tag of entry.tags) {
    if (!cacheState.tags.has(tag)) cacheState.tags.set(tag, new Set());
    cacheState.tags.get(tag).add(key);
  }
  pruneSize();
  return value;
}

export function invalidatePublicCacheTags(tags) {
  const keys = new Set();
  for (const tag of tags.filter(Boolean)) {
    for (const key of cacheState.tags.get(tag) || []) {
      keys.add(key);
    }
  }
  for (const key of keys) {
    const entry = cacheState.entries.get(key);
    deleteCacheKey(key, entry?.tags || []);
  }
}

/** Invalidate storefront review caches for a shop (optional product IDs). */
export function invalidateShopReviewsCache(shop, productIds = []) {
  if (!shop) return;
  const tags = [`reviews:${shop}`];
  for (const id of productIds.filter(Boolean)) {
    tags.push(`reviews:${shop}:product:${id}`);
  }
  invalidatePublicCacheTags(tags);
}

/** Invalidate cached public settings for a shop. */
export function invalidateShopSettingsCache(shop) {
  if (!shop) return;
  invalidatePublicCacheTags([`settings:${shop}`]);
}

export function publicCacheKey(request, namespace) {
  const url = new URL(request.url);
  url.searchParams.sort();
  return `${namespace}:${url.pathname}?${url.searchParams.toString()}`;
}

export function publicCacheHeaders(hit = false) {
  // Longer browser + CDN TTL: storefront widgets re-hit these on every page;
  // short TTLs were amplifying egress for tiny config/review JSON payloads.
  return {
    "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
    "X-Verdict-Cache": hit ? "HIT" : "MISS",
  };
}
