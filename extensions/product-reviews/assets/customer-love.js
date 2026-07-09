/**
 * Customer Love Page — full storefront reviews hub.
 */
(function () {
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function stars(n) {
    const c = Math.min(5, Math.max(0, Number(n) || 0));
    return "★".repeat(c) + "☆".repeat(5 - c);
  }

  function getAppConfig() {
    return window.__JUDGEME__?.config?.customerLove || {};
  }

  function resolveConfig(root) {
    const app = getAppConfig();
    return {
      heading: app.heading || root.dataset.heading || "Customer Love",
      limit: Number(app.limit ?? root.dataset.limit) || 12,
      primaryColor: app.primaryColor || "#e11d48",
      starColor: app.starColor || "#f59e0b",
      barTrackColor: app.barTrackColor || "#fce7f3",
      barFillColor: app.barFillColor || "#e11d48",
      showDistribution: app.showDistribution !== false,
      showFilterPills: app.showFilterPills !== false,
      showPhotoCollage: app.showPhotoCollage !== false,
      cardMinWidth: Number(app.cardMinWidth) || 260,
      verifiedBadgeText: app.verifiedBadgeText || "Verified Buyer",
    };
  }

  function normalizeDistribution(raw) {
    const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!raw) return out;
    if (Array.isArray(raw)) {
      for (const row of raw) {
        const star = Number(row?.star ?? row?.rating);
        const count = Number(row?.count ?? row?.value ?? 0);
        if (star >= 1 && star <= 5) out[star] = count;
      }
      return out;
    }
    for (const star of [1, 2, 3, 4, 5]) {
      out[star] = Number(raw[star] ?? raw[String(star)] ?? 0) || 0;
    }
    return out;
  }

  function injectBarStyles(cfg) {
    if (document.getElementById("jd-customer-love-bar-styles")) return;
    const style = document.createElement("style");
    style.id = "jd-customer-love-bar-styles";
    style.textContent = `
      .jd-customer-love-root .jd-love-bar-row { display:flex; align-items:center; gap:8px; font-size:13px; }
      .jd-customer-love-root .jd-love-bar-track {
        flex:1 1 auto;
        min-width:0;
        height:8px;
        background:${cfg.barTrackColor};
        border-radius:999px;
        overflow:hidden;
        display:flex;
        align-items:stretch;
      }
      .jd-customer-love-root .jd-love-bar-fill {
        height:100%;
        background:${cfg.barFillColor};
        border-radius:999px;
        min-width:0;
      }
      .jd-customer-love-root .jd-love-bar-spacer {
        height:100%;
        min-width:0;
      }
    `;
    document.head.appendChild(style);
  }

  function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days < 1) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "1 week ago";
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return d.toLocaleDateString();
  }

  async function waitForSharedConfig() {
    if (window.__JUDGEME__?.config) return window.__JUDGEME__.config;
    if (typeof window.__JUDGEME__?.ensureConfig === "function") {
      try {
        return await Promise.race([
          window.__JUDGEME__.ensureConfig(),
          new Promise((r) => setTimeout(() => r(null), 2000)),
        ]);
      } catch {
        return null;
      }
    }
    if (window.__JUDGEME__?.configReady) {
      try {
        await Promise.race([
          window.__JUDGEME__.configReady,
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      } catch {
        /* ignore */
      }
    }
    return window.__JUDGEME__?.config || null;
  }

  async function init() {
    const root = document.getElementById("jd-customer-love-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    if (!shop || !API) return;

    // Render with Liquid/dataset defaults immediately; settings is best-effort.
    let cfg = resolveConfig(root);
    void waitForSharedConfig().then(() => {
      cfg = resolveConfig(root);
    });

    let mediaFilter = "all";
    let summaryCache = null;
    let filtersCache = null;
    const reviewsByFilter = Object.create(null);
    root.innerHTML = `<p style="color:#64748b;padding:24px 0">Loading reviews…</p>`;
    injectBarStyles(cfg);

    async function loadPayload() {
      if (!reviewsByFilter[mediaFilter]) {
        const res = await fetch(
          `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=shop&media=${mediaFilter}&limit=${cfg.limit}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        reviewsByFilter[mediaFilter] = data.reviews || [];
        // Keep summary/filter counts from the richest response (prefer "all").
        if (!summaryCache || mediaFilter === "all") {
          summaryCache = data.summary || summaryCache;
        }
        if (!filtersCache || mediaFilter === "all") {
          filtersCache = data.filters || filtersCache;
        }
      }
      return {
        reviews: reviewsByFilter[mediaFilter] || [],
        summary: summaryCache || {},
        filters: filtersCache || {},
      };
    }

    async function render() {
      const data = await loadPayload();
      const { reviews = [], summary = {}, filters = {} } = data;

      const dist = normalizeDistribution(summary.distribution);
      const maxDist = Math.max(1, ...[5, 4, 3, 2, 1].map((k) => dist[k] || 0));
      const bars = [5, 4, 3, 2, 1]
        .map((star) => {
          const count = dist[star] || 0;
          const remainder = Math.max(0, maxDist - count);
          return `
          <div class="jd-love-bar-row">
            <span style="width:14px">${star}</span>
            <span style="color:${cfg.starColor}">★</span>
            <div class="jd-love-bar-track" role="presentation" aria-hidden="true">
              <div class="jd-love-bar-fill" style="flex:${count} 0 0;${count > 0 ? "min-width:4px;" : ""}"></div>
              <div class="jd-love-bar-spacer" style="flex:${remainder} 0 0"></div>
            </div>
            <span style="width:40px;text-align:right;color:#64748b">${count}</span>
          </div>`;
        })
        .join("");

      const collage = cfg.showPhotoCollage
        ? reviews
            .flatMap((r) => (r.media || []).filter((m) => m.type === "image").slice(0, 1))
            .slice(0, 5)
            .map(
              (m) =>
                `<button type="button" data-jd-preview="${esc(m.url)}" data-jd-preview-alt="Customer review photo" aria-label="View review photo" style="padding:0;border:none;background:none;cursor:zoom-in;border-radius:8px;overflow:hidden"><img src="${esc(m.url)}" alt="Review photo" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:block" loading="lazy" /></button>`,
            )
            .join("")
        : "";

      const pill = (id, label, count) => `
        <button type="button" class="jd-love-pill" data-filter="${id}"
          style="padding:8px 16px;border-radius:999px;border:1px solid ${mediaFilter === id ? cfg.primaryColor : "#e2e8f0"};
          background:${mediaFilter === id ? cfg.primaryColor : "#fff"};color:${mediaFilter === id ? "#fff" : "#334155"};
          font-weight:600;cursor:pointer;font-size:13px">
          ${esc(label)} (${count})
        </button>`;

      const badgeBg = `${cfg.primaryColor}22`;

      const cards = reviews
        .map((r) => {
          const img = (r.media || []).find((m) => m.type === "image");
          const vid = (r.media || []).find((m) => m.type === "video");
          const mediaHtml = vid
            ? `<button type="button" class="jd-love-video-poster" data-video-url="${esc(vid.url)}" aria-label="Play video review"
                style="position:relative;margin-top:12px;border-radius:10px;overflow:hidden;display:block;width:100%;padding:0;border:none;background:#0f172a;cursor:pointer;min-height:160px">
                ${img ? `<img src="${esc(img.url)}" alt="" loading="lazy" decoding="async" style="width:100%;max-height:200px;object-fit:cover;display:block;opacity:0.85" />` : `<div style="height:160px"></div>`}
                <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.9);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center">▶</span>
              </button>`
            : img
              ? `<button type="button" data-jd-preview="${esc(img.url)}" data-jd-preview-alt="Review photo by ${esc(r.author)}" aria-label="View review photo" style="display:block;width:100%;padding:0;border:none;background:none;cursor:zoom-in;margin-top:12px;border-radius:10px;overflow:hidden;position:relative">
                  <img src="${esc(img.url)}" alt="Review photo" style="width:100%;max-height:200px;object-fit:cover;display:block" loading="lazy" decoding="async" />
                  <span aria-hidden="true" style="position:absolute;bottom:10px;right:10px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.92);display:flex;align-items:center;justify-content:center;font-size:14px;color:#334155;box-shadow:0 2px 8px rgba(0,0,0,0.12)">⤢</span>
                </button>`
              : "";
          return `
            <article style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:16px">
              <div style="color:${cfg.starColor};letter-spacing:1px;font-size:14px">${stars(r.rating)}</div>
              ${r.title ? `<h3 style="margin:8px 0 4px;font-size:15px">${esc(r.title)}</h3>` : ""}
              <p style="margin:0 0 8px;line-height:1.55;color:#334155;font-size:14px">${esc(r.comment)}</p>
              ${mediaHtml}
              <div style="margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px">
                <strong>${esc(r.author)}</strong>
                <span style="background:${badgeBg};color:${cfg.primaryColor};padding:2px 8px;border-radius:999px;font-weight:600">${esc(cfg.verifiedBadgeText)}</span>
                <span style="color:#94a3b8">${timeAgo(r.createdAt)}</span>
              </div>
            </article>`;
        })
        .join("");

      const distributionBlock = cfg.showDistribution
        ? `<div style="display:flex;flex-direction:column;gap:6px">${bars}</div>`
        : "";
      const collageBlock = collage ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${collage}</div>` : "";
      const filterBlock = cfg.showFilterPills
        ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
            ${pill("all", "All Reviews", filters.all || 0)}
            ${pill("photo", "With Photos", filters.photos || 0)}
            ${pill("video", "With Videos", filters.videos || 0)}
          </div>`
        : "";

      root.innerHTML = `
        <section style="font-family:system-ui,sans-serif;padding:32px 0;max-width:1100px;margin:0 auto">
          <h1 style="font-size:28px;margin:0 0 24px">${esc(cfg.heading)}</h1>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:28px;align-items:center">
            <div>
              <div style="font-size:48px;font-weight:800;line-height:1">${summary.average || "0.0"}</div>
              <div style="color:${cfg.starColor};font-size:20px;letter-spacing:2px">${stars(Math.round(summary.average || 0))}</div>
              <div style="color:#64748b;margin-top:4px">${summary.total || 0} Reviews</div>
            </div>
            ${distributionBlock}
            ${collageBlock}
          </div>
          ${filterBlock}
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${cfg.cardMinWidth}px,1fr));gap:16px">
            ${cards || '<p style="color:#64748b">No reviews match this filter.</p>'}
          </div>
        </section>`;

      root.querySelectorAll(".jd-love-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          mediaFilter = btn.getAttribute("data-filter") || "all";
          render().catch(console.error);
        });
      });

      root.querySelectorAll(".jd-love-video-poster").forEach((btn) => {
        btn.addEventListener("click", () => {
          const url = btn.getAttribute("data-video-url");
          if (!url || btn.dataset.playing === "1") return;
          btn.dataset.playing = "1";
          btn.innerHTML = `<video src="${esc(url)}" style="width:100%;max-height:200px;object-fit:cover;display:block" controls playsinline autoplay></video>`;
        });
      });

      window.JudgeMeMediaLightbox?.injectStyles?.();
      window.JudgeMeMediaLightbox?.bind?.(root);
    }

    try {
      await render();
      try {
        const viewKey = `jd_love_${shop}`;
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          fetch(`${API}/api/public/widget-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shop, event: "customer_love_view" }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error("[JudgeMe Customer Love]", e);
      root.innerHTML = `<p style="color:#e53e3e">Could not load reviews.</p>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
