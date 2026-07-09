/**
 * JudgeMe Core — global storefront bootstrap (app embed).
 * Exposes a shared config promise so widgets do not each refetch settings.
 */
(function () {
  const cfg = window.__JUDGEME__ || {};
  const shop = cfg.shop;
  const API = String(cfg.apiBase || "/apps/judgeme-reviews").replace(/\/$/, "");
  if (!shop) return;

  let resolveConfig;
  let rejectConfig;
  const configReady = new Promise((resolve, reject) => {
    resolveConfig = resolve;
    rejectConfig = reject;
  });

  window.__JUDGEME__ = {
    ...cfg,
    shop,
    apiBase: API,
    ready: true,
    configReady,
  };

  /**
   * Single-flight settings fetch shared by all widgets on the page.
   * @returns {Promise<object|null>}
   */
  window.__JUDGEME__.ensureConfig = function ensureConfig() {
    if (window.__JUDGEME__.config) {
      return Promise.resolve(window.__JUDGEME__.config);
    }
    if (window.__JUDGEME__._configFetch) {
      return window.__JUDGEME__._configFetch;
    }
    window.__JUDGEME__._configFetch = fetch(
      `${API}/api/public/settings?shop=${encodeURIComponent(shop)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) {
          window.__JUDGEME__.config = data.config;
        }
        resolveConfig(window.__JUDGEME__.config || null);
        return window.__JUDGEME__.config || null;
      })
      .catch((err) => {
        rejectConfig(err);
        return null;
      });
    return window.__JUDGEME__._configFetch;
  };

  window.__JUDGEME__.ensureConfig();

  // One lightweight beacon per page (deduped in-session for view metrics).
  try {
    const key = `jd_core_${shop}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`${API}/api/public/widget-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, event: "core_embed_load" }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* sessionStorage unavailable */
  }
})();
