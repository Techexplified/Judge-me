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
    starStyle: "outline",
    starSize: 32,
    buttonColor: "#059669",
    backgroundColor: "#F8FAFC",
    cardBackgroundColor: "#FFFFFF",
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
    secondaryColor: "#64748b",
    trustBadgeEnabled: true,
    trustBadgeText: "Protected by SSL. We never share your info.",
    ratingPageTitle: "How would you rate this product?",
    starLabelHigh: "Love it!",
    starLabelLow: "Dislike it",
    formTitle: "Write a Review",
    formSubtitle: "Share your experience with this product. Your feedback helps other shoppers decide.",
    nameFieldLabel: "Your Name",
    reviewFieldLabel: "Your Review",
    reviewFieldPlaceholder: "What did you love about this product? How has it helped you? Any tips for others?",
    photoPageTitle: "Add photos to your review",
    photoUploadTitle: "Add Photos",
    photoUploadHint: "Drag & drop or click to upload · PNG, JPG up to 5MB",
    videoPageTitle: "Add a video to your review",
    videoUploadTitle: "Add Video",
    videoUploadHint: "Drag & drop or click to upload · MP4, WebM up to 50MB",
    videoSkipLabel: "Skip for now",
    submitButtonText: "Post Review",
    verifiedPurchaseLabel: "Verified Purchase",
    orderMetaLine: "Order #{{order}} · Purchased {{date}}",
    privacyFooterText: "Your data is secure and never shared.",
    ratingPageTitleColor: null,
    ratingPageTitleFontSize: null,
    ratingPageTitleTypography: null,
    ratingPageTitleFontWeight: null,
    orderMetaLineColor: null,
    orderMetaLineFontSize: null,
    orderMetaLineTypography: null,
    orderMetaLineFontWeight: null,
    verifiedPurchaseLabelColor: null,
    verifiedPurchaseLabelFontSize: null,
    verifiedPurchaseLabelTypography: null,
    verifiedPurchaseLabelFontWeight: null,
    starLabelHighColor: null,
    starLabelHighFontSize: null,
    starLabelHighTypography: null,
    starLabelHighFontWeight: null,
    starLabelLowColor: null,
    starLabelLowFontSize: null,
    starLabelLowTypography: null,
    starLabelLowFontWeight: null,
  };

  const RATING_TEXT_STYLE_SECTIONS = {
    ratingPageTitle: { fontSize: 16, fontWeight: 600, colorFrom: "textColor" },
    orderMetaLine: { fontSize: 13, fontWeight: 500, color: "#6d7175" },
    verifiedPurchaseLabel: { fontSize: 11, fontWeight: 700, colorFrom: "primaryColor" },
    starLabelHigh: { fontSize: 11, fontWeight: 500, color: "#6d7175" },
    starLabelLow: { fontSize: 11, fontWeight: 500, color: "#6d7175" },
  };

  function normalizeHex(input) {
    let s = String(input || "").trim();
    if (!s) return null;
    if (!s.startsWith("#")) s = `#${s}`;
    return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : null;
  }

  function resolveTextStyle(cfg, sectionId) {
    const defaults = RATING_TEXT_STYLE_SECTIONS[sectionId] || {};
    const defaultColor =
      defaults.color ||
      (defaults.colorFrom ? cfg[defaults.colorFrom] : cfg.textColor) ||
      DEFAULT_CFG.textColor;
    const color = normalizeHex(cfg[`${sectionId}Color`]) || defaultColor;
    const fontSizeRaw = Number(cfg[`${sectionId}FontSize`]);
    const fontSize =
      Number.isFinite(fontSizeRaw) && fontSizeRaw > 0
        ? Math.min(32, Math.max(10, fontSizeRaw))
        : defaults.fontSize || cfg.fontSize;
    const typography = cfg[`${sectionId}Typography`] || cfg.typography;
    const fontWeightRaw = Number(cfg[`${sectionId}FontWeight`]);
    const fontWeight =
      Number.isFinite(fontWeightRaw) && fontWeightRaw >= 100
        ? fontWeightRaw
        : defaults.fontWeight || 400;
    return {
      color,
      fontSize,
      fontFamily: fontFamily({ typography }),
      fontWeight,
    };
  }

  function textStyleCss(style) {
    return `color:${style.color};font-size:${style.fontSize}px;font-family:${style.fontFamily};font-weight:${style.fontWeight}`;
  }

  function resolveRatingPageTitleDisplay(cfg, context) {
    const item = (context.item || "").trim();
    const ctx = item ? context : { ...context, item: "this product" };
    return {
      text: resolveFormText(cfg.ratingPageTitle, ctx) || DEFAULT_CFG.ratingPageTitle,
      styleSection: "ratingPageTitle",
    };
  }

  function resolveFormText(template, context) {
    const item = (context.item || "").trim();
    const store = (context.store || "").trim();
    const order = (context.order || "").trim();
    const date = (context.date || "").trim();
    return String(template || "")
      .replace(/\{\{item\}\}/gi, item)
      .replace(/\{\{store\}\}/gi, store)
      .replace(/\{\{order\}\}/gi, order)
      .replace(/\{\{date\}\}/gi, date)
      .trim();
  }

  function resolveRatingPageTitle(cfg, context) {
    const item = (context.item || "").trim();
    const ctx = item ? context : { ...context, item: "this product" };
    return resolveFormText(cfg.ratingPageTitle, ctx) || DEFAULT_CFG.ratingPageTitle;
  }

  function getVisibleFlowSteps(cfg) {
    const steps = ["rating"];
    if (cfg.showWrittenReviews !== false) steps.push("written");
    if (cfg.showPhotos !== false) steps.push("photo");
    if (cfg.showVideos !== false) steps.push("video");
    steps.push("submit");
    return steps;
  }

  function deriveInactiveStarColor(starColor) {
    const hex = normalizeHex(starColor);
    if (!hex) return DEFAULT_CFG.inactiveStarColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = 0.4;
    const lr = 232;
    const lg = 232;
    const lb = 232;
    const nr = Math.round(r * mix + lr * (1 - mix));
    const ng = Math.round(g * mix + lg * (1 - mix));
    const nb = Math.round(b * mix + lb * (1 - mix));
    return `#${[nr, ng, nb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }

  const STAR_STYLES = ["filled", "outline", "emoji"];

  function mergeConfig(saved) {
    const c = { ...DEFAULT_CFG, ...(saved || {}) };
    if (c.layoutPreset === "compact") c.layoutPreset = "modern";
    if (c.layoutPreset === "brandLed") c.layoutPreset = "luxury";
    if (!["minimal", "modern", "luxury", "shopifyNative"].includes(c.layoutPreset)) {
      c.layoutPreset = "modern";
    }
    if (!STAR_STYLES.includes(c.starStyle)) c.starStyle = "outline";
    c.starSize = Math.min(40, Math.max(14, Number(c.starSize) || 20));
    c.fontSize = Math.min(20, Math.max(12, Number(c.fontSize) || 14));
    c.borderRadius = Number(c.borderRadius) || 12;
    c.spacing = Math.min(32, Math.max(8, Number(c.spacing) || 16));
    if (c.ratingPageTitle === "How would you rate {{item}} ?") {
      c.ratingPageTitle = DEFAULT_CFG.ratingPageTitle;
    }
    const starHex = normalizeHex(c.starColor);
    if (starHex) c.starColor = starHex;
    const inactiveHex = normalizeHex(c.inactiveStarColor);
    if (inactiveHex) c.inactiveStarColor = inactiveHex;
    if (
      c.inactiveStarColor === DEFAULT_CFG.inactiveStarColor &&
      c.starColor !== DEFAULT_CFG.starColor
    ) {
      c.inactiveStarColor = deriveInactiveStarColor(c.starColor);
    }
    return c;
  }

  function shadowCss(level) {
    if (level === "low") return "0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)";
    if (level === "high") return "0 16px 48px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.08)";
    return "0 8px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)";
  }

  function fontFamily(cfg) {
    return TYPOGRAPHY_STACKS[cfg.typography] || TYPOGRAPHY_STACKS["Inter (System)"];
  }

  function presetLayout(cfg) {
    if (cfg.layoutPreset === "luxury") return { titleSize: 28, gapScale: 1.1, hideSubtitle: false };
    if (cfg.layoutPreset === "minimal") return { titleSize: 22, gapScale: 0.92, hideSubtitle: true };
    return { titleSize: 24, gapScale: 1, hideSubtitle: false };
  }

  const STAR_PATH =
    "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  const STAR_PATH_ROUNDED =
    "M11.48 3.5a.6.6 0 0 1 1.04 0l2.34 4.74a.6.6 0 0 0 .45.33l5.23.76a.6.6 0 0 1 .33 1.02l-3.78 3.69a.6.6 0 0 0-.17.53l.89 5.21a.6.6 0 0 1-.87.63l-4.68-2.46a.6.6 0 0 0-.56 0l-4.68 2.46a.6.6 0 0 1-.87-.63l.89-5.21a.6.6 0 0 0-.17-.53L3.36 10.35a.6.6 0 0 1 .33-1.02l5.23-.76a.6.6 0 0 0 .45-.33z";

  function buildStarSvgMarkup(star, size) {
    const path = star.path || STAR_PATH;
    const fill = star.svgFill ?? star.color ?? "currentColor";
    const stroke = star.svgStroke ?? "none";
    const strokeWidth = star.svgStrokeWidth ?? 0;
    const opacity = star.opacity ?? 1;
    const filter = star.svgFilter ? `filter:${star.svgFilter};` : "";
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;opacity:${opacity};${filter}"><path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function resolveStarDisplay(index, rating, cfg) {
    const active = index <= rating;
    const style = cfg.starStyle;

    if (style === "outline") {
      return {
        path: STAR_PATH,
        glyph: active ? "★" : "☆",
        color: cfg.starColor,
        opacity: 1,
        svgFill: "none",
        svgStroke: active ? cfg.starColor : cfg.inactiveStarColor,
        svgStrokeWidth: 2,
        fontSizeScale: 1,
      };
    }

    if (style === "emoji") {
      const fill = active ? cfg.starColor : cfg.inactiveStarColor;
      return {
        path: STAR_PATH_ROUNDED,
        glyph: "★",
        color: fill,
        opacity: 1,
        svgFill: fill,
        svgStroke: "none",
        svgStrokeWidth: 0,
        fontSizeScale: 1.18,
        svgFilter: "drop-shadow(0 1.5px 1px rgba(0,0,0,0.28))",
      };
    }

    const fill = active ? cfg.starColor : cfg.inactiveStarColor;
    return {
      path: STAR_PATH,
      glyph: "★",
      color: fill,
      opacity: 1,
      svgFill: fill,
      svgStroke: "none",
      svgStrokeWidth: 0,
      fontSizeScale: 1,
    };
  }

  function starChar(index, rating, cfg) {
    return resolveStarDisplay(index, rating, cfg).glyph;
  }

  function starsHtml(rating, cfg) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const star = resolveStarDisplay(i, rating, cfg);
      const size = Math.round(cfg.starSize * (star.fontSizeScale || 1));
      html += buildStarSvgMarkup(star, size);
    }
    return html;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderMerchantReply(review, cfg) {
    const reply = review?.reply && String(review.reply).trim();
    if (!reply) return "";
    return `
      <div class="jd-reply-box">
        <div style="font-weight:700;font-size:12px;margin-bottom:6px;color:${cfg.primaryColor}">
          Response from the store
        </div>
        <div>${esc(reply)}</div>
      </div>`;
  }

  function formatOrderDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).trim();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function readReviewContext(root, shop, productName) {
    const params = new URLSearchParams(window.location.search);
    const order =
      params.get("judgeme_order") ||
      params.get("order") ||
      root.dataset.orderNumber ||
      "";
    const dateRaw =
      params.get("judgeme_date") ||
      params.get("order_date") ||
      root.dataset.orderDate ||
      "";
    const date = formatOrderDate(dateRaw) || String(dateRaw || "").trim();
    const autoOpen =
      params.get("judgeme_review") === "1" || params.get("review") === "1";

    return {
      item: productName,
      store: shop.replace(".myshopify.com", "").replace(/-/g, " "),
      order: String(order).replace(/^#/, "").trim(),
      date,
      autoOpen,
    };
  }

  function stripAutoOpenParam() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("judgeme_review") && !url.searchParams.has("review")) return;
      url.searchParams.delete("judgeme_review");
      url.searchParams.delete("review");
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  }

  function hasOrderMeta(context) {
    return !!(context.order || context.date);
  }

  function productAvatarHtml(cfg, productImage) {
    if (productImage) {
      return `<img src="${esc(productImage)}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
    }
    return `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="3" stroke="${esc(cfg.primaryColor)}" stroke-width="1.8"/><path d="M9 8h6" stroke="${esc(cfg.primaryColor)}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }

  function storeAvatarHtml(cfg) {
    return `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-8.5Z" stroke="${esc(cfg.primaryColor)}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  }

  const STORE_REVIEW_FLOW = {
    productId: "store-review",
    productName: "Store Review",
    ratingTitle: "How was your experience?",
    ratingSubtitle: "Tell us about shopping with our store.",
    formTitle: "Leave a store review",
    formSubtitle: "Share your experience shopping with us.",
    reviewPlaceholder:
      "What did you enjoy about our store? How was shipping, support, or packaging?",
    submitButtonText: "Post store review",
  };

  function createReviewFlow({
    cfg,
    textContext,
    productImage,
    gap,
    pl,
    onSubmit,
    onComplete,
  }) {
    let stepIndex = 0;
    let reviewMode = "product";
    let rating = 0;
    let author = "";
    let comment = "";
    let photoFiles = [];
    let videoFiles = [];
    let complete = false;

    function getFlowSteps() {
      const flowSteps = ["rating"];
      if (cfg.showWrittenReviews !== false) flowSteps.push("written");
      if (reviewMode !== "store") {
        if (cfg.showPhotos !== false) flowSteps.push("photo");
        if (cfg.showVideos !== false) flowSteps.push("video");
      }
      flowSteps.push("submit");
      return flowSteps;
    }

    const ratingTitleDisplay = resolveRatingPageTitleDisplay(cfg, textContext);
    const ratingTitle = ratingTitleDisplay.text;
    const trustText = cfg.privacyFooterText || cfg.trustBadgeText;
    const badgeStyle = textStyleCss(resolveTextStyle(cfg, "verifiedPurchaseLabel"));
    const orderMetaStyle = textStyleCss(resolveTextStyle(cfg, "orderMetaLine"));
    const ratingTitleStyle = textStyleCss(resolveTextStyle(cfg, ratingTitleDisplay.styleSection));
    const starHighStyle = textStyleCss(resolveTextStyle(cfg, "starLabelHigh"));
    const starLowStyle = textStyleCss(resolveTextStyle(cfg, "starLabelLow"));

    const els = {
      overlay: null,
      content: null,
      progress: null,
      back: null,
      next: null,
      skip: null,
      msg: null,
    };

    function currentStep() {
      if (complete) return "privacy";
      const steps = getFlowSteps();
      return steps[stepIndex] || "rating";
    }

    function renderStars(container, value, interactive) {
      container.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const star = resolveStarDisplay(i, value, cfg);
        const size = Math.round(cfg.starSize * (star.fontSizeScale || 1));
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "jd-star-btn";
        btn.setAttribute("aria-label", `Rate ${i} out of 5 stars`);
        btn.innerHTML = buildStarSvgMarkup(star, size);
        if (interactive) {
          const starValue = i;
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            rating = starValue;
            renderStars(container, rating, true);
          });
        }
        container.appendChild(btn);
      }
    }

    function bindUploadZone(zone, input, previews, files, accept) {
      if (!zone || !input) return;
      zone.onclick = () => input.click();
      zone.ondragover = (e) => e.preventDefault();
      zone.ondrop = (e) => {
        e.preventDefault();
        addMediaFiles(e.dataTransfer.files, files, previews, accept);
      };
      input.onchange = () => {
        addMediaFiles(input.files, files, previews, accept);
        input.value = "";
      };
    }

    function addMediaFiles(fileList, files, previews, accept) {
      Array.from(fileList || []).forEach((file) => {
        const ok = accept.some((prefix) =>
          prefix.endsWith("/*") ? file.type.startsWith(prefix.replace("/*", "/")) : file.type === prefix,
        );
        if (!ok) return;
        files.push(file);
        const url = URL.createObjectURL(file);
        const el = file.type.startsWith("video/")
          ? Object.assign(document.createElement("video"), { src: url, muted: true, playsInline: true })
          : Object.assign(document.createElement("img"), { src: url, alt: "" });
        el.style.cssText = "width:72px;height:72px;object-fit:cover;border-radius:8px";
        if (previews) previews.appendChild(el);
      });
    }

    function renderStep() {
      const step = currentStep();
      els.content.innerHTML = "";

      if (step === "rating") {
        const isStore = reviewMode === "store";
        const orderMetaLine = resolveFormText(cfg.orderMetaLine, textContext);
        const showOrderMeta = !isStore && hasOrderMeta(textContext) && orderMetaLine;
        const displayTitle = isStore ? STORE_REVIEW_FLOW.ratingTitle : ratingTitle;
        const displayName = isStore
          ? textContext.store || "Our store"
          : textContext.item || "Product";
        const avatarHtml = isStore ? storeAvatarHtml(cfg) : productAvatarHtml(cfg, productImage);
        const imageSize = Math.min(96, Math.max(72, cfg.starSize * 2.75));
        const innerRadius = Math.max(10, cfg.borderRadius - 2);
        const ratingsEnabled = cfg.showRatings !== false;
        const wrap = document.createElement("div");

        const innerCard = document.createElement("div");
        innerCard.className = "jd-rating-card";
        innerCard.style.cssText = `border:1px solid #E8EEF3;border-radius:${cfg.borderRadius}px;background:${cfg.cardBackgroundColor || "#fff"};padding:28px 24px 24px;text-align:center`;
        innerCard.innerHTML = `
            <div style="width:${imageSize}px;height:${imageSize}px;border-radius:${innerRadius}px;background:#F0F7F4;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;overflow:hidden">
              ${avatarHtml}
            </div>
            ${
              isStore
                ? ""
                : `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;background:#ECFDF5;margin-bottom:12px;${badgeStyle}">
              ✓ ${esc(cfg.verifiedPurchaseLabel)}
            </span>`
            }
            <div style="font-weight:700;font-size:18px;color:${cfg.textColor || "#202223"};margin-bottom:4px;letter-spacing:-0.01em">${esc(displayName)}</div>
            ${
              isStore
                ? `<p style="margin:0 0 20px;font-size:13px;color:#6d7175;line-height:1.5">${esc(STORE_REVIEW_FLOW.ratingSubtitle)}</p>`
                : showOrderMeta
                  ? `<div style="margin-bottom:20px;${orderMetaStyle}">${esc(orderMetaLine)}</div>`
                  : `<div style="margin-bottom:20px"></div>`
            }
            <div style="height:1px;background:#E8EEF3;margin:0 0 20px"></div>
            <p style="text-align:center;margin:0 0 ${gap + 4}px;letter-spacing:-0.01em;${ratingTitleStyle}">${esc(displayTitle)}</p>
        `;

        const starBlock = document.createElement("div");
        starBlock.className = "jd-star-rating";
        const starRow = document.createElement("div");
        starRow.className = "jd-star-row";
        renderStars(starRow, rating, ratingsEnabled);
        starBlock.appendChild(starRow);

        const labels = document.createElement("div");
        labels.className = "jd-star-labels";
        labels.style.cssText =
          "display:flex;justify-content:space-between;padding:0 4px;min-width:" +
          (cfg.starSize * 5 + 40) +
          "px;margin:0 auto";
        labels.innerHTML = `<span style="${starLowStyle}">${esc(cfg.starLabelLow)}</span><span style="${starHighStyle}">${esc(cfg.starLabelHigh)}</span>`;
        starBlock.appendChild(labels);
        innerCard.appendChild(starBlock);
        wrap.appendChild(innerCard);

        const trustFooter = document.createElement("div");
        trustFooter.className = "jd-rating-trust";
        trustFooter.style.cssText =
          "display:flex;align-items:center;justify-content:center;gap:6px;margin-top:18px;padding-top:16px;border-top:1px solid #E8EEF3;font-size:12px;color:#6d7175";
        trustFooter.textContent = `🔒 ${trustText}`;
        wrap.appendChild(trustFooter);

        const poweredBy = document.createElement("p");
        poweredBy.className = "jd-rating-powered";
        poweredBy.style.cssText = "text-align:center;margin:14px 0 0;font-size:11px;color:#94a3b8";
        poweredBy.textContent = "Powered by JudgeMe Reviews";
        wrap.appendChild(poweredBy);

        els.content.appendChild(wrap);
        return;
      }

      if (step === "written") {
        const isStore = reviewMode === "store";
        const formTitle = isStore ? STORE_REVIEW_FLOW.formTitle : cfg.formTitle;
        const formSubtitle = isStore ? STORE_REVIEW_FLOW.formSubtitle : cfg.formSubtitle;
        const reviewPlaceholder = isStore
          ? STORE_REVIEW_FLOW.reviewPlaceholder
          : cfg.reviewFieldPlaceholder;
        els.content.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:${gap}px">
            <h3 style="margin:0;font-size:${pl.titleSize}px;font-weight:800;color:${cfg.textColor}">${esc(formTitle)}</h3>
            ${pl.hideSubtitle ? "" : `<p style="margin:0;color:#6d7175;font-size:14px;line-height:1.5">${esc(formSubtitle)}</p>`}
            <label style="font-weight:700">${esc(cfg.nameFieldLabel)} <span style="color:#dc2626">*</span></label>
            <input id="jd-flow-author" class="jd-input" placeholder="e.g. Sarah M." autocomplete="name" value="${esc(author)}" />
            <label style="font-weight:700">${esc(cfg.reviewFieldLabel)} <span style="color:#dc2626">*</span></label>
            <textarea id="jd-flow-comment" class="jd-input" style="min-height:100px;resize:vertical" maxlength="500" placeholder="${esc(reviewPlaceholder)}">${esc(comment)}</textarea>
          </div>`;
        const authorEl = els.content.querySelector("#jd-flow-author");
        const commentEl = els.content.querySelector("#jd-flow-comment");
        if (authorEl) {
          authorEl.addEventListener("input", () => {
            author = authorEl.value.trim();
            if (els.msg) els.msg.textContent = "";
          });
        }
        if (commentEl) {
          commentEl.addEventListener("input", () => {
            comment = commentEl.value.trim();
            if (els.msg) els.msg.textContent = "";
          });
        }
        return;
      }

      if (step === "photo") {
        els.content.innerHTML = `
          <div style="text-align:center">
            <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:${cfg.textColor}">${esc(cfg.photoPageTitle)}</h3>
            <div class="jd-upload" id="jd-photo-zone" style="margin-top:${gap}px">
              <div style="font-size:28px;margin-bottom:8px">🖼️</div>
              <div style="font-weight:700">${esc(cfg.photoUploadTitle)}</div>
              <div style="font-size:12px;color:#6d7175;margin-top:6px">${esc(cfg.photoUploadHint)}</div>
            </div>
            <input type="file" id="jd-photo-input" multiple style="display:none" accept="image/png,image/jpeg,image/jpg,image/webp" />
            <div id="jd-photo-previews" class="jd-media-grid"></div>
          </div>`;
        bindUploadZone(
          els.content.querySelector("#jd-photo-zone"),
          els.content.querySelector("#jd-photo-input"),
          els.content.querySelector("#jd-photo-previews"),
          photoFiles,
          ["image/png", "image/jpeg", "image/jpg", "image/webp"],
        );
        const photoPreviews = els.content.querySelector("#jd-photo-previews");
        photoFiles.forEach((file) => {
          const url = URL.createObjectURL(file);
          const el = Object.assign(document.createElement("img"), { src: url, alt: "" });
          el.style.cssText = "width:72px;height:72px;object-fit:cover;border-radius:8px";
          if (photoPreviews) photoPreviews.appendChild(el);
        });
        return;
      }

      if (step === "video") {
        els.content.innerHTML = `
          <div style="text-align:center">
            <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:${cfg.textColor}">${esc(cfg.videoPageTitle)}</h3>
            <div class="jd-upload" id="jd-video-zone" style="margin-top:${gap}px">
              <div style="font-size:28px;margin-bottom:8px">🎬</div>
              <div style="font-weight:700">${esc(cfg.videoUploadTitle)}</div>
              <div style="font-size:12px;color:#6d7175;margin-top:6px">${esc(cfg.videoUploadHint)}</div>
            </div>
            <input type="file" id="jd-video-input" multiple style="display:none" accept="video/mp4,video/webm" />
            <div id="jd-video-previews" class="jd-media-grid"></div>
          </div>`;
        bindUploadZone(
          els.content.querySelector("#jd-video-zone"),
          els.content.querySelector("#jd-video-input"),
          els.content.querySelector("#jd-video-previews"),
          videoFiles,
          ["video/mp4", "video/webm"],
        );
        const videoPreviews = els.content.querySelector("#jd-video-previews");
        videoFiles.forEach((file) => {
          const url = URL.createObjectURL(file);
          const el = Object.assign(document.createElement("video"), { src: url, muted: true, playsInline: true });
          el.style.cssText = "width:72px;height:72px;object-fit:cover;border-radius:8px";
          if (videoPreviews) videoPreviews.appendChild(el);
        });
        return;
      }

      if (step === "submit") {
        const submitTitle =
          reviewMode === "store" ? STORE_REVIEW_FLOW.formTitle : cfg.formTitle;
        els.content.innerHTML = `
          <div style="text-align:center;padding:${gap}px 0">
            <h3 style="margin:0 0 16px;font-size:18px;font-weight:800;color:${cfg.textColor}">${esc(submitTitle)}</h3>
            <p style="margin:0 0 20px;font-size:14px;color:#6d7175;line-height:1.5">Ready to share your review? Tap below to publish.</p>
          </div>`;
        return;
      }

      if (step === "privacy") {
        els.content.innerHTML = `
          <div style="text-align:center;padding:${gap}px 0">
            <div style="font-size:40px;margin-bottom:12px">✓</div>
            <h3 style="margin:0 0 12px;font-size:20px;font-weight:800;color:${cfg.primaryColor}">Thank you!</h3>
            <p style="margin:0 0 20px;font-size:14px;color:#6d7175">Your review has been published.</p>
            <div style="display:inline-flex;align-items:center;gap:8px;font-size:12px;color:#6d7175;margin-bottom:16px">
              🔒 ${esc(trustText)}
            </div>
            <div style="font-size:11px;color:#94a3b8">Powered by JudgeMe Reviews</div>
          </div>`;
      }
    }

    function syncNav() {
      const step = currentStep();
      if (complete) {
        els.progress.textContent = "Review submitted";
        els.back.style.display = "none";
        els.next.textContent = "Close";
        els.next.style.display = "inline-flex";
        els.next.disabled = false;
        els.skip.style.display = "none";
        return;
      }

      els.progress.textContent = `Step ${stepIndex + 1} of ${getFlowSteps().length}`;
      els.back.style.display = stepIndex > 0 ? "inline-flex" : "none";
      els.skip.style.display = step === "video" ? "inline-flex" : "none";

      if (step === "submit") {
        els.next.innerHTML = `✓ ${esc(
          reviewMode === "store" ? STORE_REVIEW_FLOW.submitButtonText : cfg.submitButtonText,
        )}`;
      } else {
        els.next.textContent = "Continue";
      }
    }

    function persistWrittenFields() {
      const scope = els.content || document;
      const authorEl = scope.querySelector("#jd-flow-author");
      const commentEl = scope.querySelector("#jd-flow-comment");
      if (authorEl) author = authorEl.value.trim();
      if (commentEl) comment = commentEl.value.trim();
    }

    function validateCurrentStep() {
      const step = currentStep();
      els.msg.textContent = "";
      els.msg.style.color = "";

      if (step === "rating" && cfg.showRatings !== false && rating < 1) {
        els.msg.style.color = "#dc2626";
        els.msg.textContent = "Please select a star rating.";
        return false;
      }

      if (step === "written" && cfg.showWrittenReviews !== false) {
        persistWrittenFields();
        if (!author) {
          els.msg.style.color = "#dc2626";
          els.msg.textContent = "Please enter your name.";
          return false;
        }
        if (!comment) {
          els.msg.style.color = "#dc2626";
          els.msg.textContent = "Please write your review.";
          return false;
        }
      }

      if (step === "submit" && cfg.showWrittenReviews !== false) {
        const steps = getFlowSteps();
        if (steps.includes("written")) persistWrittenFields();
        if (!author || !comment) {
          els.msg.style.color = "#dc2626";
          els.msg.textContent = "Please complete the review step.";
          return false;
        }
      }

      return true;
    }

    async function handleNext() {
      if (complete) {
        close();
        if (typeof onComplete === "function") onComplete();
        return;
      }

      const step = currentStep();
      if (step === "written") persistWrittenFields();

      if (step !== "submit") {
        if (!validateCurrentStep()) return;
        stepIndex += 1;
        renderStep();
        syncNav();
        return;
      }

      if (!validateCurrentStep()) return;

      els.next.disabled = true;
      els.msg.style.color = "#64748b";
      els.msg.textContent = "Submitting…";

      try {
        await onSubmit({
          rating: cfg.showRatings !== false ? rating : 5,
          author: author || "Anonymous",
          comment: comment || "—",
          mediaFiles: [...photoFiles, ...videoFiles],
          reviewMode,
        });
        complete = true;
        els.next.disabled = false;
        renderStep();
        syncNav();
        els.msg.textContent = "";
      } catch (err) {
        els.msg.style.color = "#dc2626";
        els.msg.textContent = err.message || "Could not submit review.";
        els.next.disabled = false;
      }
    }

    function handleBack() {
      if (complete || stepIndex === 0) return;
      if (currentStep() === "written") persistWrittenFields();
      stepIndex -= 1;
      renderStep();
      syncNav();
    }

    function handleSkip() {
      if (currentStep() !== "video") return;
      stepIndex += 1;
      renderStep();
      syncNav();
    }

    function open(options = {}) {
      if (!els.overlay) return;
      reviewMode = options.mode === "store" ? "store" : "product";
      stepIndex = 0;
      rating = 0;
      author = "";
      comment = "";
      photoFiles = [];
      videoFiles = [];
      complete = false;
      els.msg.textContent = "";
      els.next.disabled = false;
      renderStep();
      syncNav();
      els.overlay.style.display = "flex";
    }

    function close() {
      if (els.overlay) els.overlay.style.display = "none";
    }

    function mount(container) {
      container.innerHTML = `
        <div class="jd-modal-overlay" id="jd-modal" style="display:none">
          <div class="jd-flow-panel" id="jd-flow-panel">
            <button type="button" class="jd-close-modal" id="jd-close-form" aria-label="Close">×</button>
            <div class="jd-flow-progress" id="jd-flow-progress"></div>
            <div class="jd-step-content" id="jd-step-content"></div>
            <div class="jd-flow-nav">
              <button type="button" class="jd-flow-back" id="jd-flow-back">Back</button>
              <button type="button" class="jd-flow-skip" id="jd-flow-skip">${esc(cfg.videoSkipLabel)}</button>
              <button type="button" class="jd-flow-next" id="jd-flow-next">Continue</button>
            </div>
            <p class="jd-flow-msg" id="jd-flow-msg"></p>
          </div>
        </div>`;

      els.overlay = container.querySelector("#jd-modal");
      els.content = container.querySelector("#jd-step-content");
      els.progress = container.querySelector("#jd-flow-progress");
      els.back = container.querySelector("#jd-flow-back");
      els.next = container.querySelector("#jd-flow-next");
      els.skip = container.querySelector("#jd-flow-skip");
      els.msg = container.querySelector("#jd-flow-msg");

      const closeBtn = container.querySelector("#jd-close-form");
      if (closeBtn) closeBtn.onclick = close;
      els.overlay.onclick = (e) => {
        if (e.target === els.overlay) close();
      };
      if (els.back) els.back.onclick = handleBack;
      if (els.next) els.next.onclick = handleNext;
      if (els.skip) els.skip.onclick = handleSkip;
    }

    return { mount, open, close };
  }

  async function init() {
    const root = document.getElementById("app-reviews-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const productId = root.dataset.productId;
    const productName = root.dataset.productName || "";
    const productImage = root.dataset.productImage || "";
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    if (!API || !shop) return;

    root.innerHTML = '<p style="color:#64748b">Loading reviews…</p>';

    try {
      const [settingsRes, reviewsRes, storeMetaRes] = await Promise.all([
        fetch(`${API}/api/public/settings?shop=${encodeURIComponent(shop)}&t=${Date.now()}`),
        fetch(
          `${API}/api/public/reviews?productId=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}&t=${Date.now()}`,
        ),
        fetch(
          `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=store&limit=50&t=${Date.now()}`,
        ),
      ]);

      const settingsData = await settingsRes.json();
      let reviewsData = await reviewsRes.json();
      const storeMeta = storeMetaRes.ok ? await storeMetaRes.json() : { reviews: [], filters: {} };
      let storeReviews = storeMeta.reviews || [];

      const isDesignMode =
        Boolean(window.Shopify?.designMode) ||
        /[?&]preview_theme_id=/.test(window.location.search);

      const SAMPLE_REVIEWS = [
        {
          id: "sample-1",
          author: "Sarah M.",
          rating: 5,
          comment: "Incredible quality and super fast shipping!",
          createdAt: new Date().toISOString(),
          media: [],
          verified: true,
        },
        {
          id: "sample-2",
          author: "Alex B.",
          rating: 5,
          comment: "Love this product — exactly as described.",
          createdAt: new Date().toISOString(),
          media: [],
          verified: true,
        },
      ];

      if (reviewsData.length === 0 && isDesignMode) {
        reviewsData = SAMPLE_REVIEWS;
      }
      if (storeReviews.length === 0 && isDesignMode) {
        storeReviews = SAMPLE_REVIEWS.map((r) => ({ ...r, id: `store-${r.id}` }));
      }

      const productCount = Array.isArray(reviewsData) ? reviewsData.length : 0;
      const storeCount = storeReviews.length || storeMeta.filters?.store || 0;
      const hasSavedConfig = settingsData?.config && typeof settingsData.config === "object";
      if (!hasSavedConfig) {
        console.warn(
          "[JudgeMe Reviews] No saved shop styling found — using defaults. Complete onboarding or save in Collect Reviews → Review Form.",
        );
      }
      const cfg = mergeConfig(hasSavedConfig ? settingsData.config : {});
      const pl = presetLayout(cfg);
      const gap = Math.round(cfg.spacing * pl.gapScale);
      const inputRadius = Math.max(4, Math.round(cfg.borderRadius * 0.75));
      const ff = fontFamily(cfg);
      const cardBg = cfg.cardBackgroundColor || "#FFFFFF";
      const textContext = readReviewContext(root, shop, productName);

      const style = document.createElement("style");
      style.textContent = `
        .jd-root { font-family: ${ff}; font-size: ${cfg.fontSize}px; color: ${cfg.textColor}; margin: 40px 0; }
        .jd-wrapper { display: flex; gap: 48px; align-items: flex-start; flex-wrap: wrap; }
        .jd-left { flex: 1; min-width: 280px; }
        .jd-shell {
          background: ${cfg.backgroundColor || "#fff"};
          border-radius: 18px;
          padding: ${gap + 12}px;
          box-shadow: ${shadowCss(cfg.shadowLevel)};
          border: 1px solid #e8eef3;
          box-sizing: border-box;
        }
        .jd-list-logo { width: 48px; height: 48px; object-fit: contain; display: block; margin-bottom: 12px; border-radius: ${Math.max(4, Math.round(cfg.borderRadius * 0.5))}px; }
        .jd-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 999999; padding: 16px;
        }
        .jd-flow-panel {
          width: 100%; max-width: 480px;
          background: ${cardBg}; padding: ${gap + 16}px; border-radius: 24px;
          box-shadow: ${shadowCss(cfg.shadowLevel)}; border: 1px solid #e8eef3;
          position: relative; max-height: 90vh; overflow-y: auto;
          box-sizing: border-box; color: ${cfg.textColor}; font-family: ${ff};
        }
        .jd-close-modal {
          position: absolute; top: 14px; right: 14px; border: none; background: none;
          font-size: 24px; cursor: pointer; color: #94a3b8; line-height: 1; padding: 4px;
          transform: none; animation: none;
        }
        .jd-close-modal:hover { color: #64748b; transform: none; animation: none; }
        .jd-flow-progress { font-size: 12px; font-weight: 600; color: #6d7175; margin-bottom: 16px; }
        .jd-step-content { min-height: 120px; }
        .jd-star-rating {
          display: inline-flex; flex-direction: column; align-items: stretch; gap: 8px;
          margin-bottom: 4px;
        }
        .jd-star-row { display: flex; gap: 10px; justify-content: center; }
        .jd-star-btn {
          border: none; background: transparent; padding: 4px; cursor: pointer;
          line-height: 0; pointer-events: auto; touch-action: manipulation;
        }
        .jd-star-btn svg { pointer-events: none; display: block; }
        .jd-flow-nav { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 20px; }
        .jd-flow-back, .jd-flow-skip, .jd-flow-next {
          padding: 12px 18px; border-radius: ${inputRadius}px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: inherit; border: none;
          display: inline-flex; align-items: center; justify-content: center;
          transform: none; animation: none;
          transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
        }
        .jd-flow-back:hover, .jd-flow-skip:hover, .jd-flow-next:hover,
        .jd-flow-back:focus-visible, .jd-flow-skip:focus-visible, .jd-flow-next:focus-visible {
          transform: none; animation: none;
        }
        .jd-flow-back { background: #fff; border: 1px solid #e2e8f0 !important; color: ${cfg.textColor}; margin-right: auto; }
        .jd-flow-skip { background: transparent; color: #6d7175; border: none !important; }
        .jd-flow-next { background: ${cfg.buttonColor}; color: #fff; flex: 1; max-width: 100%; }
        .jd-flow-next:disabled { opacity: 0.7; cursor: wait; }
        .jd-flow-msg { text-align: center; font-size: 13px; font-weight: 600; margin: 10px 0 0; min-height: 18px; }
        .jd-title { font-size: ${pl.titleSize}px; font-weight: 800; margin: 0 0 6px; color: ${cfg.primaryColor}; line-height: 1.2; }
        .jd-subtitle { margin: 0 0 ${gap}px; font-size: 14px; color: ${cfg.secondaryColor || "#6d7175"}; line-height: 1.5; }
        .jd-review { padding: 24px 0; border-bottom: 1px solid #edf2f7; }
        .jd-review:last-child { border-bottom: none; }
        .jd-stars { display: flex; gap: 2px; margin: 6px 0; }
        .jd-comment { line-height: 1.65; word-break: break-word; }
        .jd-media-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; justify-content: flex-start; }
        .jd-media-grid img, .jd-media-grid video { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
        .jd-input { width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: ${inputRadius}px; box-sizing: border-box; font-family: inherit; font-size: inherit; }
        .jd-upload { border: 2px dashed #e2e8f0; border-radius: ${inputRadius}px; padding: 24px; text-align: center; cursor: pointer; background: #f8fafc; }
        .jd-write-btn {
          padding: 12px 24px;
          border-radius: ${inputRadius}px;
          border: none;
          background: ${cfg.buttonColor};
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: ${gap}px;
          font-family: inherit;
          font-size: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.08);
          transition: opacity 0.15s ease;
        }
        .jd-write-btn:hover { opacity: 0.92; }
        .jd-reply-box { margin-top: 12px; padding: 12px 14px; background: #f8fafc; border-left: 3px solid ${cfg.primaryColor}; border-radius: ${inputRadius}px; font-size: 13px; color: #475569; line-height: 1.55; text-align: left; }
        .jd-tabs { display: flex; gap: 8px; margin-bottom: ${gap}px; flex-wrap: wrap; }
        .jd-tab {
          padding: 8px 14px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .jd-tab.active { background: ${cfg.primaryColor}; color: #fff; border-color: ${cfg.primaryColor}; }
        .jd-showcase-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;
        }
        .jd-showcase-card {
          border: 1px solid #edf2f7; border-radius: ${inputRadius}px; overflow: hidden; background: ${cardBg};
        }
        .jd-showcase-img { width: 100%; height: 140px; object-fit: cover; display: block; background: #f1f5f9; }
        .jd-showcase-img-btn {
          display: block; width: 100%; padding: 0; border: none; background: none;
          cursor: zoom-in; position: relative;
        }
        .jd-showcase-img-btn:hover .jd-showcase-img { opacity: 0.94; }
        .jd-showcase-zoom {
          position: absolute; bottom: 10px; right: 10px;
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.94); color: #334155;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          pointer-events: none;
        }
        .jd-media-thumb-btn {
          padding: 0; border: none; background: none; cursor: zoom-in;
          border-radius: 8px; overflow: hidden;
        }
        .jd-media-thumb-btn img { width: 72px; height: 72px; object-fit: cover; display: block; }
        .jd-media-thumb-btn:hover img { opacity: 0.92; }
        .jd-showcase-body { padding: 12px; }
        .jd-verified { font-size: 11px; color: ${cfg.primaryColor}; font-weight: 700; }
      `;
      document.head.appendChild(style);

      const renderShowcaseCard = (r) => {
        const images = (r.media || []).filter((m) => m.type === "image");
        let imgBlock = "";
        let extraMedia = "";
        if (images.length > 0) {
          const main = images[0];
          imgBlock = `
            <button type="button" class="jd-showcase-img-btn" data-jd-preview="${esc(main.url)}" data-jd-preview-alt="Review photo by ${esc(r.author)}" aria-label="View review photo">
              <img class="jd-showcase-img" src="${esc(main.url)}" alt="Review photo" loading="lazy" />
              <span class="jd-showcase-zoom" aria-hidden="true">⤢</span>
            </button>`;
          if (images.length > 1) {
            extraMedia = `<div class="jd-media-grid">${images
              .slice(1)
              .map(
                (m) =>
                  `<button type="button" class="jd-media-thumb-btn" data-jd-preview="${esc(m.url)}" data-jd-preview-alt="Review photo by ${esc(r.author)}" aria-label="View review photo">
                    <img src="${esc(m.url)}" alt="Review photo" loading="lazy" />
                  </button>`,
              )
              .join("")}</div>`;
          }
        }
        return `
          <article class="jd-showcase-card">
            ${imgBlock}
            <div class="jd-showcase-body">
              <div style="font-weight:700;font-size:14px">${esc(r.author)}</div>
              <div class="jd-stars">${starsHtml(r.rating, cfg)}</div>
              ${r.title ? `<div style="font-weight:600;font-size:13px;margin-top:4px">${esc(r.title)}</div>` : ""}
              <div class="jd-comment" style="font-size:13px;margin-top:6px">${esc(r.comment)}</div>
              ${extraMedia}
              ${renderMerchantReply(r, cfg)}
              <div class="jd-verified" style="margin-top:8px">✓ Verified</div>
            </div>
          </article>`;
      };

      const renderList = (reviews) => {
        if (!reviews.length) {
          return '<p style="color:#718096">No reviews yet. Be the first!</p>';
        }
        return `<div class="jd-showcase-grid">${reviews.map(renderShowcaseCard).join("")}</div>`;
      };

      let activeTab = "product";
      const productHtml = renderList(reviewsData);
      const storeHtml = renderList(storeReviews);

      const listLogoHtml = cfg.brandLogoUrl
        ? `<img class="jd-list-logo" src="${esc(cfg.brandLogoUrl)}" alt="" />`
        : "";

      root.innerHTML = `
        <div class="jd-root">
          <div class="jd-wrapper">
            <div class="jd-left">
              <div class="jd-shell">
                ${listLogoHtml}
                <div class="jd-title">Customer Reviews</div>
                <p class="jd-subtitle">${esc(cfg.formSubtitle || `Reviews for ${productName || "this product"}.`)}</p>
                <div class="jd-tabs">
                  <button type="button" class="jd-tab active" data-tab="product">Product reviews (${productCount})</button>
                  <button type="button" class="jd-tab" data-tab="store">Store Reviews (${storeCount})</button>
                </div>
                <button type="button" class="jd-write-btn" id="jd-open-form">Write a Product Review</button>
                <div id="jd-reviews-list">${productHtml}</div>
              </div>
            </div>
            <div id="jd-flow-mount"></div>
          </div>
        </div>`;

      const flow = createReviewFlow({
        cfg,
        textContext,
        productImage,
        gap,
        pl,
        onSubmit: async ({ rating: reviewRating, author, comment, mediaFiles, reviewMode: mode }) => {
          const isStore = mode === "store";
          const submitProductId = isStore ? STORE_REVIEW_FLOW.productId : productId;
          const submitProductName = isStore ? STORE_REVIEW_FLOW.productName : productName;
          const submitProductImage = isStore ? undefined : productImage || undefined;
          let res;
          if (mediaFiles.length > 0) {
            const fd = new FormData();
            fd.set("shop", shop);
            fd.set("productId", submitProductId);
            fd.set("productName", submitProductName);
            if (submitProductImage) fd.set("productImage", submitProductImage);
            fd.set("rating", String(reviewRating));
            fd.set("author", author);
            fd.set("comment", comment);
            mediaFiles.forEach((f) => fd.append("media", f));
            res = await fetch(`${API}/api/public/reviews`, { method: "POST", body: fd });
          } else {
            res = await fetch(`${API}/api/public/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shop,
                productId: submitProductId,
                productName: submitProductName,
                productImage: submitProductImage,
                rating: reviewRating,
                author,
                comment,
              }),
            });
          }
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to submit review");
          }
        },
        onComplete: () => setTimeout(() => init(), 400),
      });

      flow.mount(root.querySelector("#jd-flow-mount"));

      const openBtn = root.querySelector("#jd-open-form");
      if (openBtn) {
        openBtn.onclick = () =>
          flow.open({ mode: activeTab === "store" ? "store" : "product" });
      }

      const listEl = root.querySelector("#jd-reviews-list");
      root.querySelectorAll(".jd-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          activeTab = tab.getAttribute("data-tab") || "product";
          root.querySelectorAll(".jd-tab").forEach((t) => {
            t.classList.toggle("active", t.getAttribute("data-tab") === activeTab);
          });
          if (listEl) {
            listEl.innerHTML = activeTab === "store" ? storeHtml : productHtml;
          }
          if (openBtn) {
            openBtn.textContent =
              activeTab === "store" ? "Write a Store Review" : "Write a Product Review";
          }
        });
      });

      fetch(`${API}/api/public/widget-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, event: "review_showcase_view", productId }),
      }).catch(() => {});

      if (textContext.autoOpen) {
        flow.open();
        stripAutoOpenParam();
      }

      window.JudgeMeMediaLightbox?.injectStyles?.();
      window.JudgeMeMediaLightbox?.bind?.(root);
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
