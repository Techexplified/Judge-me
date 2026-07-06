/**
 * JudgeMe Core — global storefront bootstrap (app embed).
 */
(function () {
  const cfg = window.__JUDGEME__ || {};
  const shop = cfg.shop;
  const API = String(cfg.apiBase || "/apps/judgeme-reviews").replace(/\/$/, "");
  if (!shop) return;

  window.__JUDGEME__ = { ...cfg, shop, apiBase: API, ready: true };

  fetch(`${API}/api/public/settings?shop=${encodeURIComponent(shop)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.config) {
        window.__JUDGEME__.config = data.config;
      }
    })
    .catch(() => {});

  fetch(`${API}/api/public/widget-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, event: "core_embed_load" }),
  }).catch(() => {});
})();
