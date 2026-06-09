/**
 * Storefront Product Reviews widget — keep in sync with app/lib/review-form-config.shared.js
 */
(function () {
  const TYPOGRAPHY_STACKS = {
    "Inter (System)": "'Inter', system-ui, -apple-system, sans-serif",
    Georgia: "Georgia, 'Times New Roman', serif",
    "System UI": "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    Monospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
  };

  const DEFAULT_CFG = {
    primaryColor: "#059669",
    accentColor: "#10B981",
    textColor: "#0f172a",
    starColor: "#F59E0B",
    inactiveStarColor: "#E5E7EB",
    starStyle: "filled",
    starSize: 20,
    buttonColor: "#059669",
    backgroundColor: "#F8FAFC",
    brandLogoUrl: null,
    showPhotos: true,
    showVideos: true,
    showRatings: true,
    showWrittenReviews: true,
    borderRadius: 12,
    spacing: 16,
    shadowLevel: "medium",
    fontSize: 14,
    typography: "Inter (System)",
    layoutPreset: "modern",
    trustBadgeEnabled: true,
    trustBadgeText: "Protected by SSL. We never share your info.",
  };

  function mergeConfig(saved) {
    const c = { ...DEFAULT_CFG, ...(saved || {}) };
    if (c.layoutPreset === "compact") c.layoutPreset = "modern";
    if (c.layoutPreset === "brandLed") c.layoutPreset = "luxury";
    if (!["minimal", "modern", "luxury", "shopifyNative"].includes(c.layoutPreset)) {
      c.layoutPreset = "modern";
    }
    c.starSize = Math.min(40, Math.max(14, Number(c.starSize) || 20));
    c.fontSize = Math.min(20, Math.max(12, Number(c.fontSize) || 14));
    c.borderRadius = Number(c.borderRadius) || 12;
    return c;
  }

  function shadowCss(level) {
    if (level === "low") return "0 2px 8px rgba(15,23,42,0.06)";
    if (level === "high") return "0 16px 48px rgba(15,23,42,0.12)";
    return "0 8px 32px rgba(15,23,42,0.08)";
  }

  function fontFamily(cfg) {
    return TYPOGRAPHY_STACKS[cfg.typography] || TYPOGRAPHY_STACKS["Inter (System)"];
  }

  function presetLayout(cfg) {
    if (cfg.layoutPreset === "luxury") return { titleSize: 28, gapScale: 1.1, hideSubtitle: false };
    if (cfg.layoutPreset === "minimal") return { titleSize: 22, gapScale: 0.92, hideSubtitle: true };
    return { titleSize: 24, gapScale: 1, hideSubtitle: false };
  }

  function starChar(index, rating, cfg) {
    const active = index <= rating;
    if (cfg.starStyle === "emoji") return active ? "⭐" : "☆";
    return active ? "★" : "☆";
  }

  function starsHtml(rating, cfg) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const active = i <= rating;
      const color = active ? cfg.starColor : cfg.inactiveStarColor;
      const opacity = cfg.starStyle === "outline" && !active ? 0.45 : 1;
      html += `<span style="color:${color};opacity:${opacity};font-size:${cfg.starSize}px">${starChar(i, rating, cfg)}</span>`;
    }
    return html;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  async function init() {
    const root = document.getElementById("app-reviews-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const productId = root.dataset.productId;
    const productName = root.dataset.productName || "";
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    if (!API || !shop) return;

    root.innerHTML = '<p style="color:#64748b">Loading reviews…</p>';

    try {
      const [settingsRes, reviewsRes] = await Promise.all([
        fetch(`${API}/api/public/settings?shop=${encodeURIComponent(shop)}&t=${Date.now()}`),
        fetch(
          `${API}/api/public/reviews?productId=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}`,
        ),
      ]);

      const settingsData = await settingsRes.json();
      const reviewsData = await reviewsRes.json();
      const cfg = mergeConfig(settingsData.config || {});
      const pl = presetLayout(cfg);
      const gap = Math.round(cfg.spacing * pl.gapScale);
      const inputRadius = Math.max(4, Math.round(cfg.borderRadius * 0.75));
      const ff = fontFamily(cfg);

      const style = document.createElement("style");
      style.textContent = `
        .jd-root { font-family: ${ff}; font-size: ${cfg.fontSize}px; color: ${cfg.textColor}; margin: 40px 0; }
        .jd-wrapper { display: flex; gap: 48px; align-items: flex-start; flex-wrap: wrap; }
        .jd-left { flex: 1; min-width: 280px; }
        .jd-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 16px;
        }
        .jd-right {
          width: 100%;
          max-width: 560px;
          background: #fff; padding: ${gap + 16}px; border-radius: ${cfg.borderRadius}px;
          box-shadow: ${shadowCss(cfg.shadowLevel)}; border: 1px solid #e8eef3;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          color: ${cfg.textColor};
          font-family: ${ff};
        }
        .jd-close-modal {
          position: absolute;
          top: 14px;
          right: 14px;
          border: none;
          background: none;
          font-size: 24px;
          cursor: pointer;
          color: #94a3b8;
          line-height: 1;
          padding: 4px;
        }
        .jd-close-modal:hover {
          color: #64748b;
        }
        .jd-title { font-size: 26px; font-weight: 800; margin-bottom: 20px; }
        .jd-review { padding: 24px 0; border-bottom: 1px solid #edf2f7; }
        .jd-review:last-child { border-bottom: none; }
        .jd-stars { display: flex; gap: 2px; margin: 6px 0; }
        .jd-comment { line-height: 1.65; word-break: break-word; }
        .jd-media-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .jd-media-grid img, .jd-media-grid video { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
        .jd-input { width: 100%; padding: 12px; margin: 8px 0 12px; border: 1px solid #e2e8f0; border-radius: ${inputRadius}px; box-sizing: border-box; font-family: inherit; font-size: inherit; }
        .jd-submit { width: 100%; padding: 14px; background: ${cfg.buttonColor}; color: #fff; border: none; border-radius: ${inputRadius}px; font-weight: 700; cursor: pointer; font-size: 15px; }
        .jd-submit:disabled { opacity: 0.7; cursor: wait; }
        .jd-star-input span { cursor: pointer; line-height: 1; }
        .jd-upload { border: 2px dashed #e2e8f0; border-radius: ${inputRadius}px; padding: 16px; text-align: center; color: #64748b; font-size: 12px; cursor: pointer; margin: 8px 0 12px; background: #f8fafc; }
        .jd-trust { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .jd-logo { max-height: 48px; max-width: 140px; object-fit: contain; display: block; margin: 0 auto 12px; }
        .jd-icon-box { width: 52px; height: 52px; border-radius: 12px; background: ${cfg.primaryColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #fff; font-size: 24px; }
        .jd-form-title { font-size: ${pl.titleSize}px; font-weight: 800; text-align: center; margin: 0 0 8px; }
        .jd-form-sub { text-align: center; color: #94a3b8; font-size: 14px; margin: 0 0 ${gap}px; line-height: 1.5; }
        .jd-write-btn { padding: 12px 24px; border-radius: ${inputRadius}px; border: 1px solid ${cfg.textColor}; background: transparent; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
        .jd-reply-box { margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: ${inputRadius}px; font-size: 14px; color: #475569; }
      `;
      document.head.appendChild(style);

      const reviewsHtml =
        reviewsData.length === 0
          ? '<p style="color:#718096">No reviews yet. Be the first!</p>'
          : reviewsData
              .map((r) => {
                const mediaHtml = (r.media || [])
                  .map((m) => {
                    if (m.type === "video") {
                      return `<video src="${esc(m.url)}" controls muted playsinline></video>`;
                    }
                    return `<img src="${esc(m.url)}" alt="" loading="lazy" />`;
                  })
                  .join("");
                return `
              <div class="jd-review">
                <div style="font-weight:700;font-size:16px">${esc(r.author)}</div>
                <div class="jd-stars">${starsHtml(r.rating, cfg)}</div>
                <div style="font-size:13px;color:#718096;margin-bottom:8px">
                  ${new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div class="jd-comment">${esc(r.comment)}</div>
                ${mediaHtml ? `<div class="jd-media-grid">${mediaHtml}</div>` : ""}
                ${r.reply ? `<div class="jd-reply-box"><strong>Store Response</strong><p style="margin:6px 0 0">${esc(r.reply)}</p></div>` : ""}
              </div>`;
              })
              .join("");

      const logoHeader = cfg.brandLogoUrl
        ? `<img class="jd-logo" src="${cfg.brandLogoUrl}" alt="" />`
        : `<div class="jd-icon-box">★</div>`;

      const subtitle = pl.hideSubtitle
        ? ""
        : `<p class="jd-form-sub">Share your experience with this product. Your feedback helps other shoppers decide.</p>`;

      const ratingsBlock = cfg.showRatings
        ? `<label style="font-weight:700;display:block;margin-bottom:8px">How would you rate this product?</label>
           <div class="jd-star-input" id="jd-star-input" style="margin-bottom:8px">${[1, 2, 3, 4, 5]
             .map((i) => `<span data-v="${i}">${starChar(i, 5, cfg)}</span>`)
             .join("")}</div>
           <p id="jd-rating-label" style="text-align:center;font-size:13px;color:#94a3b8;margin:0 0 12px">5 out of 5 stars</p>`
        : "";

      const writtenBlock = cfg.showWrittenReviews
        ? `<label style="font-weight:700">Your Name <span style="color:#dc2626">*</span></label>
           <input id="jd-author" class="jd-input" placeholder="e.g. Sarah M." autocomplete="name" />
           <label style="font-weight:700">Your Review <span style="color:#dc2626">*</span></label>
           <textarea id="jd-comment" class="jd-input" style="min-height:120px;resize:vertical" maxlength="500" placeholder="What did you love about this product?"></textarea>`
        : "";

      const showMedia = cfg.showPhotos !== false || cfg.showVideos !== false;
      const mediaBlock = showMedia
        ? `<label style="font-weight:700;display:block;margin-bottom:6px">Add Photos</label>
           <div class="jd-upload" id="jd-upload-zone">Drag & drop or click to upload · PNG, JPG up to 5MB</div>
           <input type="file" id="jd-media-input" multiple style="display:none" accept="${
             cfg.showPhotos !== false && cfg.showVideos !== false
               ? "image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm"
               : cfg.showVideos !== false
                 ? "video/mp4,video/webm"
                 : "image/png,image/jpeg,image/jpg,image/webp"
           }" />
           <div id="jd-media-previews" class="jd-media-grid"></div>`
        : "";

      const trustBlock =
        cfg.trustBadgeEnabled !== false
          ? `<div class="jd-trust">🔒 ${esc(cfg.trustBadgeText)}</div>`
          : "";

      root.innerHTML = `
        <div class="jd-root">
          <div class="jd-wrapper">
            <div class="jd-left">
              <div class="jd-title">Customer Reviews</div>
              <button type="button" class="jd-write-btn" id="jd-open-form">Write a product review</button>
              <div id="jd-reviews-list">${reviewsHtml}</div>
            </div>
            <div class="jd-modal-overlay" id="jd-modal" style="display:none">
              <div class="jd-right" id="jd-form-panel">
                <button type="button" class="jd-close-modal" id="jd-close-form">×</button>
                ${logoHeader}
                <h3 class="jd-form-title">Write a Review</h3>
                ${subtitle}
                ${ratingsBlock}
                ${writtenBlock}
                ${mediaBlock}
                <button type="button" class="jd-submit" id="jd-submit">Post Review</button>
                <p id="jd-form-msg" style="text-align:center;font-size:13px;font-weight:600;margin-top:10px"></p>
                ${trustBlock}
              </div>
            </div>
          </div>
        </div>`;

      const modal = document.getElementById("jd-modal");
      const openBtn = document.getElementById("jd-open-form");
      const closeBtn = document.getElementById("jd-close-form");
      if (openBtn && modal) {
        openBtn.onclick = () => {
          modal.style.display = "flex";
        };
      }
      if (closeBtn && modal) {
        closeBtn.onclick = () => {
          modal.style.display = "none";
        };
        modal.onclick = (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        };
      }

      let currentRating = 5;
      const starEls = document.querySelectorAll("#jd-star-input span");
      const updateStars = (val) => {
        starEls.forEach((s) => {
          const idx = Number(s.dataset.v);
          s.textContent = starChar(idx, val, cfg);
          s.style.color = idx <= val ? cfg.starColor : cfg.inactiveStarColor;
          s.style.opacity = cfg.starStyle === "outline" && idx > val ? 0.45 : 1;
        });
        const lbl = document.getElementById("jd-rating-label");
        if (lbl) lbl.textContent = `${val} out of 5 stars`;
      };
      starEls.forEach((star) => {
        star.onclick = () => {
          currentRating = Number(star.dataset.v);
          updateStars(currentRating);
        };
      });
      if (starEls.length) updateStars(5);

      const mediaFiles = [];
      const mediaInput = document.getElementById("jd-media-input");
      const uploadZone = document.getElementById("jd-upload-zone");
      const previews = document.getElementById("jd-media-previews");

      if (uploadZone && mediaInput) {
        uploadZone.onclick = () => mediaInput.click();
        uploadZone.ondragover = (e) => e.preventDefault();
        uploadZone.ondrop = (e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        };
        mediaInput.onchange = () => {
          addFiles(mediaInput.files);
          mediaInput.value = "";
        };
      }

      function addFiles(fileList) {
        Array.from(fileList || []).forEach((file) => {
          mediaFiles.push(file);
          const url = URL.createObjectURL(file);
          const el = file.type.startsWith("video/")
            ? Object.assign(document.createElement("video"), { src: url, muted: true, playsInline: true })
            : Object.assign(document.createElement("img"), { src: url, alt: "" });
          if (previews) previews.appendChild(el);
        });
      }

      const submitBtn = document.getElementById("jd-submit");
      if (!submitBtn) return;

      submitBtn.onclick = async () => {
        const authorEl = document.getElementById("jd-author");
        const commentEl = document.getElementById("jd-comment");
        const author = authorEl?.value?.trim() || "Anonymous";
        const comment = commentEl?.value?.trim() || "";
        const msg = document.getElementById("jd-form-msg");
        const btn = submitBtn;

        if (cfg.showWrittenReviews !== false && !comment) {
          msg.style.color = "#e53e3e";
          msg.textContent = "Please write a review.";
          return;
        }

        btn.disabled = true;
        msg.style.color = "#64748b";
        msg.textContent = "Submitting…";

        try {
          let res;
          if (mediaFiles.length > 0) {
            const fd = new FormData();
            fd.set("shop", shop);
            fd.set("productId", productId);
            fd.set("productName", productName);
            fd.set("rating", String(cfg.showRatings ? currentRating : 5));
            fd.set("author", author);
            fd.set("comment", comment || "—");
            mediaFiles.forEach((f) => fd.append("media", f));
            res = await fetch(`${API}/api/public/reviews`, { method: "POST", body: fd });
          } else {
            res = await fetch(`${API}/api/public/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shop,
                productId,
                productName,
                rating: cfg.showRatings ? currentRating : 5,
                author,
                comment: comment || "—",
              }),
            });
          }

          if (res.ok) {
            msg.style.color = "#16a34a";
            msg.textContent = "Thanks for your review!";
            setTimeout(() => init(), 1200);
          } else {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed");
          }
        } catch (e) {
          msg.style.color = "#e53e3e";
          msg.textContent = e.message || "Error submitting review.";
          btn.disabled = false;
        }
      };
    } catch (e) {
      console.error("[JudgeMe Reviews]", e);
      root.innerHTML = '<p style="color:#e53e3e">Could not load reviews.</p>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
