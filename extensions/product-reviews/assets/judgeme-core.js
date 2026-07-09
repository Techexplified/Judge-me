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
  const configReady = new Promise((resolve) => {
    resolveConfig = resolve;
  });

  // Always settle — never leave widgets waiting forever on a hung settings request.
  const SETTINGS_TIMEOUT_MS = 2500;

  window.__JUDGEME__ = {
    ...cfg,
    shop,
    apiBase: API,
    ready: true,
    configReady,
  };

  /**
   * Single-flight settings fetch shared by all widgets on the page.
   * Always resolves (never rejects) so review widgets are not blocked.
   * @returns {Promise<object|null>}
   */
  window.__JUDGEME__.ensureConfig = function ensureConfig() {
    if (window.__JUDGEME__.config) {
      return Promise.resolve(window.__JUDGEME__.config);
    }
    if (window.__JUDGEME__._configFetch) {
      return window.__JUDGEME__._configFetch;
    }

    const fetchPromise = fetch(
      `${API}/api/public/settings?shop=${encodeURIComponent(shop)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) {
          window.__JUDGEME__.config = data.config;
        }
        return window.__JUDGEME__.config || null;
      })
      .catch(() => null);

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), SETTINGS_TIMEOUT_MS);
    });

    window.__JUDGEME__._configFetch = Promise.race([fetchPromise, timeoutPromise]).then(
      (config) => {
        // If timeout won first, still adopt late settings when they arrive.
        fetchPromise.then((late) => {
          if (late && !window.__JUDGEME__.config) {
            window.__JUDGEME__.config = late;
          }
        });
        resolveConfig(window.__JUDGEME__.config || config || null);
        return window.__JUDGEME__.config || config || null;
      },
    );

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
