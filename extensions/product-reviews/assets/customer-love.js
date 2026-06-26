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

  async function init() {
    const root = document.getElementById("jd-customer-love-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    const heading = root.dataset.heading || "Customer Love";
    const limit = Number(root.dataset.limit) || 12;
    if (!shop || !API) return;

    let mediaFilter = "all";
    root.innerHTML = `<p style="color:#64748b;padding:24px 0">Loading reviews…</p>`;

    async function render() {
      const res = await fetch(
        `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=shop&media=${mediaFilter}&limit=${limit}`,
      );
      const data = await res.json();
      const { reviews = [], summary = {}, filters = {} } = data;

      const dist = summary.distribution || {};
      const maxDist = Math.max(1, ...[5, 4, 3, 2, 1].map((k) => dist[k] || 0));
      const bars = [5, 4, 3, 2, 1]
        .map(
          (star) => `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px">
            <span style="width:14px">${star}</span>
            <span style="color:#f59e0b">★</span>
            <div style="flex:1;height:8px;background:#fce7f3;border-radius:999px;overflow:hidden">
              <div style="height:100%;width:${Math.round(((dist[star] || 0) / maxDist) * 100)}%;background:#e11d48"></div>
            </div>
            <span style="width:40px;text-align:right;color:#64748b">${dist[star] || 0}</span>
          </div>`,
        )
        .join("");

      const collage = reviews
        .flatMap((r) => (r.media || []).filter((m) => m.type === "image").slice(0, 1))
        .slice(0, 5)
        .map((m) => `<button type="button" data-jd-preview="${esc(m.url)}" data-jd-preview-alt="Customer review photo" aria-label="View review photo" style="padding:0;border:none;background:none;cursor:zoom-in;border-radius:8px;overflow:hidden"><img src="${esc(m.url)}" alt="Review photo" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:block" loading="lazy" /></button>`)
        .join("");

      const pill = (id, label, count) => `
        <button type="button" class="jd-love-pill" data-filter="${id}"
          style="padding:8px 16px;border-radius:999px;border:1px solid ${mediaFilter === id ? "#e11d48" : "#e2e8f0"};
          background:${mediaFilter === id ? "#e11d48" : "#fff"};color:${mediaFilter === id ? "#fff" : "#334155"};
          font-weight:600;cursor:pointer;font-size:13px">
          ${esc(label)} (${count})
        </button>`;

      const cards = reviews
        .map((r) => {
          const img = (r.media || []).find((m) => m.type === "image");
          const vid = (r.media || []).find((m) => m.type === "video");
          const mediaHtml = vid
            ? `<div style="position:relative;margin-top:12px;border-radius:10px;overflow:hidden">
                <video src="${esc(vid.url)}" style="width:100%;max-height:200px;object-fit:cover" muted playsinline></video>
                <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.9);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center">▶</span>
              </div>`
            : img
              ? `<button type="button" data-jd-preview="${esc(img.url)}" data-jd-preview-alt="Review photo by ${esc(r.author)}" aria-label="View review photo" style="display:block;width:100%;padding:0;border:none;background:none;cursor:zoom-in;margin-top:12px;border-radius:10px;overflow:hidden;position:relative">
                  <img src="${esc(img.url)}" alt="Review photo" style="width:100%;max-height:200px;object-fit:cover;display:block" loading="lazy" />
                  <span aria-hidden="true" style="position:absolute;bottom:10px;right:10px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.92);display:flex;align-items:center;justify-content:center;font-size:14px;color:#334155;box-shadow:0 2px 8px rgba(0,0,0,0.12)">⤢</span>
                </button>`
              : "";
          return `
            <article style="background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:16px">
              <div style="color:#f59e0b;letter-spacing:1px;font-size:14px">${stars(r.rating)}</div>
              ${r.title ? `<h3 style="margin:8px 0 4px;font-size:15px">${esc(r.title)}</h3>` : ""}
              <p style="margin:0 0 8px;line-height:1.55;color:#334155;font-size:14px">${esc(r.comment)}</p>
              ${mediaHtml}
              <div style="margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px">
                <strong>${esc(r.author)}</strong>
                <span style="background:#fce7f3;color:#be185d;padding:2px 8px;border-radius:999px;font-weight:600">Verified Buyer</span>
                <span style="color:#94a3b8">${timeAgo(r.createdAt)}</span>
              </div>
            </article>`;
        })
        .join("");

      root.innerHTML = `
        <section style="font-family:system-ui,sans-serif;padding:32px 0;max-width:1100px;margin:0 auto">
          <h1 style="font-size:28px;margin:0 0 24px">${esc(heading)}</h1>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:28px;align-items:center">
            <div>
              <div style="font-size:48px;font-weight:800;line-height:1">${summary.average || "0.0"}</div>
              <div style="color:#f59e0b;font-size:20px;letter-spacing:2px">${stars(Math.round(summary.average || 0))}</div>
              <div style="color:#64748b;margin-top:4px">${summary.total || 0} Reviews</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">${bars}</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">${collage || ""}</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
            ${pill("all", "All Reviews", filters.all || 0)}
            ${pill("photo", "With Photos", filters.photos || 0)}
            ${pill("video", "With Videos", filters.videos || 0)}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
            ${cards || '<p style="color:#64748b">No reviews match this filter.</p>'}
          </div>
        </section>`;

      root.querySelectorAll(".jd-love-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          mediaFilter = btn.getAttribute("data-filter") || "all";
          render().catch(console.error);
        });
      });

      window.JudgeMeMediaLightbox?.injectStyles?.();
      window.JudgeMeMediaLightbox?.bind?.(root);
    }

    try {
      await render();
      fetch(`${API}/api/public/widget-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, event: "customer_love_view" }),
      }).catch(() => {});
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
