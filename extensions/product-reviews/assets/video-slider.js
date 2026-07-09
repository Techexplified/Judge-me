/**
 * Video Reviews Slider — storefront carousel widget.
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
    return window.__JUDGEME__?.config?.videoSlider || {};
  }

  function resolveConfig(root) {
    const app = getAppConfig();
    return {
      heading: app.heading || root.dataset.heading || "Video Reviews",
      limit: Number(app.limit ?? root.dataset.limit) || 8,
      starColor: app.starColor || "#f59e0b",
      cardWidth: Number(app.cardWidth) || 160,
      cardHeight: Number(app.cardHeight) || 220,
      cardBorderRadius: Number(app.cardBorderRadius) || 12,
      headingFontSize: Number(app.headingFontSize) || 22,
      showStars: app.showStars !== false,
      sectionPadding: Number(app.sectionPadding) || 32,
    };
  }

  async function waitForSharedConfig() {
    if (window.__JUDGEME__?.config) return window.__JUDGEME__.config;
    if (typeof window.__JUDGEME__?.ensureConfig === "function") {
      return window.__JUDGEME__.ensureConfig();
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
    const root = document.getElementById("jd-video-slider-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    if (!shop || !API) return;

    await waitForSharedConfig();
    let cfg = resolveConfig(root);

    const { heading, limit, starColor, cardWidth, cardHeight, cardBorderRadius, headingFontSize, showStars, sectionPadding } = cfg;

    root.innerHTML = `<p style="color:#64748b;padding:24px 0">Loading video reviews…</p>`;

    try {
      const res = await fetch(
        `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=shop&media=video&limit=${limit}&lite=1`,
      );
      const data = await res.json();
      const reviews = data.reviews || [];

      if (reviews.length === 0) {
        root.innerHTML = `<section style="padding:${sectionPadding}px 0;font-family:system-ui,sans-serif"><h2 style="margin:0 0 16px;font-size:${headingFontSize}px">${esc(heading)}</h2><p style="color:#64748b">No video reviews yet.</p></section>`;
        return;
      }

      const style = document.createElement("style");
      style.textContent = `
        .jd-vid-wrap { font-family: system-ui, sans-serif; padding: ${sectionPadding}px 0; }
        .jd-vid-head { font-size: ${headingFontSize}px; font-weight: 700; margin: 0 0 20px; }
        .jd-vid-track-wrap { position: relative; }
        .jd-vid-track { display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth; padding: 4px 40px; scrollbar-width: none; }
        .jd-vid-track::-webkit-scrollbar { display: none; }
        .jd-vid-card {
          flex: 0 0 ${cardWidth}px; border-radius: ${cardBorderRadius}px; overflow: hidden; background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s ease;
          cursor: pointer; position: relative;
        }
        .jd-vid-card:hover { transform: scale(1.05); z-index: 2; }
        .jd-vid-thumb { width: ${cardWidth}px; height: ${cardHeight}px; object-fit: cover; display: block; background: #0f172a; }
        .jd-vid-thumb-placeholder {
          background: #0f172a;
        }
        .jd-vid-play {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.92);
          display: flex; align-items: center; justify-content: center; font-size: 18px; pointer-events: none;
        }
        .jd-vid-meta { padding: 10px; font-size: 12px; }
        .jd-vid-stars { color: ${starColor}; letter-spacing: 1px; }
        .jd-vid-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; border-radius: 50%; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; z-index: 3; font-size: 16px;
        }
        .jd-vid-prev { left: 0; }
        .jd-vid-next { right: 0; }
        .jd-vid-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999999;
          display: none; align-items: center; justify-content: center; padding: 16px;
        }
        .jd-vid-modal video { max-width: 100%; max-height: 85vh; border-radius: 8px; }
        .jd-vid-modal-close {
          position: absolute; top: 16px; right: 16px; background: #fff; border: none;
          border-radius: 50%; width: 36px; height: 36px; font-size: 20px; cursor: pointer;
        }
      `;
      document.head.appendChild(style);

      // Never put <video src> in the carousel — browsers download bytes even with
      // preload="metadata", which was the main egress leak for tiny stored media.
      const cards = reviews
        .map((r) => {
          const video = (r.media || []).find((m) => m.type === "video");
          if (!video) return "";
          const poster = (r.media || []).find((m) => m.type === "image");
          const dur = video.filename?.match(/(\d+:\d+)/)?.[1] || "";
          const starsHtml = showStars ? `<div class="jd-vid-stars">${stars(r.rating)}</div>` : "";
          const thumbInner = poster
            ? `<img class="jd-vid-thumb" src="${esc(poster.url)}" alt="" loading="lazy" decoding="async" />`
            : `<div class="jd-vid-thumb jd-vid-thumb-placeholder" aria-hidden="true"></div>`;
          return `
            <article class="jd-vid-card" data-video-url="${esc(video.url)}">
              ${thumbInner}
              <span class="jd-vid-play">▶</span>
              <div class="jd-vid-meta">
                ${starsHtml}
                ${dur ? `<div style="margin-top:4px;color:#64748b">${esc(dur)}</div>` : ""}
              </div>
            </article>`;
        })
        .join("");

      root.innerHTML = `
        <section class="jd-vid-wrap">
          <h2 class="jd-vid-head">${esc(heading)}</h2>
          <div class="jd-vid-track-wrap">
            <button type="button" class="jd-vid-nav jd-vid-prev" aria-label="Previous">‹</button>
            <div class="jd-vid-track" id="jd-vid-track">${cards}</div>
            <button type="button" class="jd-vid-nav jd-vid-next" aria-label="Next">›</button>
          </div>
        </section>
        <div class="jd-vid-modal" id="jd-vid-modal">
          <button type="button" class="jd-vid-modal-close" id="jd-vid-modal-close">×</button>
          <video id="jd-vid-modal-player" controls playsinline></video>
        </div>`;

      const track = document.getElementById("jd-vid-track");
      const scrollStep = cardWidth + 20;
      root.querySelector(".jd-vid-prev")?.addEventListener("click", () => {
        track.scrollBy({ left: -scrollStep, behavior: "smooth" });
      });
      root.querySelector(".jd-vid-next")?.addEventListener("click", () => {
        track.scrollBy({ left: scrollStep, behavior: "smooth" });
      });

      const modal = document.getElementById("jd-vid-modal");
      const player = document.getElementById("jd-vid-modal-player");
      document.getElementById("jd-vid-modal-close")?.addEventListener("click", () => {
        modal.style.display = "none";
        player.pause();
        player.removeAttribute("src");
      });
      track.querySelectorAll(".jd-vid-card").forEach((card) => {
        card.addEventListener("click", () => {
          const url = card.getAttribute("data-video-url");
          if (!url) return;
          player.src = url;
          modal.style.display = "flex";
          player.play().catch(() => {});
        });
      });

      try {
        const viewKey = `jd_vid_${shop}`;
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          fetch(`${API}/api/public/widget-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shop, event: "video_slider_view" }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error("[JudgeMe Video Slider]", e);
      root.innerHTML = `<p style="color:#e53e3e">Could not load video reviews.</p>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
