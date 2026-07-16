/**
 * Short-lived in-process cache for Settings.config.
 * Neon transfer was dominated by repeated full-row Settings reads (some rows
 * were 1–2MB because brandLogoUrl stored base64). Caching cuts that traffic.
 */

const TTL_MS = 60_000;
const MAX_ENTRIES = 200;

const state =
  global.__verdictShopConfigCache ??
  {
    entries: new Map(),
  };

global.__verdictShopConfigCache = state;

export function getCachedShopConfig(shop) {
  const entry = state.entries.get(shop);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    state.entries.delete(shop);
    return undefined;
  }
  // Refresh LRU
  state.entries.delete(shop);
  state.entries.set(shop, entry);
  return entry.config;
}

export function setCachedShopConfig(shop, config) {
  if (!shop) return;
  if (state.entries.has(shop)) state.entries.delete(shop);
  state.entries.set(shop, {
    config,
    expiresAt: Date.now() + TTL_MS,
  });
  while (state.entries.size > MAX_ENTRIES) {
    const oldest = state.entries.keys().next().value;
    if (!oldest) break;
    state.entries.delete(oldest);
  }
}

export function invalidateShopConfigCache(shop) {
  if (shop) state.entries.delete(shop);
}
