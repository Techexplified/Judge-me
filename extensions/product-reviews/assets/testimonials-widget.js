(function () {

    if (!document.getElementById("testimonials-widget-css")) {
        const style = document.createElement("style");
        style.id = "testimonials-widget-css";
        style.textContent = `
    #testimonials-widget-root { 
        --tw-accent:#6366f1; 
        --tw-text:#1e293b; 
        --tw-card-bg:#fff; 
        --tw-radius:16px; 
        max-width: 1200px;
        width: 100%; 
        margin: 0 auto;
        padding: 40px 0;
        box-sizing: border-box; 
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; 
    }

    .testimonials-heading { 
        font-size:28px; font-weight:700; color:var(--tw-text); text-align:center; margin:0 0 32px; 
        font-family: inherit;
    }
    
.testimonials-carousel { 
        position: relative; 
        display: block; 
        width: 100%; /* Reverts back to respecting the theme's container */
        padding: 0 50px; /* Safe space for navigation arrows */
        box-sizing: border-box;
        overflow: hidden;
    }
    
    .testimonials-track { 
        display: flex; 
        flex-wrap: nowrap;
        gap: 24px; 
        overflow-x: auto;
        scroll-behavior: smooth; 
        scroll-snap-type: x mandatory;
        -ms-overflow-style: none;
        scrollbar-width: none;
        
        /* Fixed: Use full width and control alignment dynamically */
        width: 100%; 
        justify-content: flex-start; 
        
        padding: 10px 0; 
        box-sizing: border-box; 
    }
    .testimonials-track::-webkit-scrollbar { display: none; }
    
    .testimonial-card { 
        flex: 0 0 calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view)); 
        width: calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view)); 
        max-width: calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view)); 
        scroll-snap-align: start;
        box-sizing: border-box; 
        background: var(--tw-card-bg); 
        border: 1px solid #f1f5f9; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.02); 
        border-radius: var(--tw-radius); 
        padding: 28px; 
        display: flex; 
        flex-direction: column; 
        position: relative; 
    }
    
    .testimonial-card::before { 
        content: "\u201c"; 
        position: absolute; 
        left: 28px; 
        top: 64px; 
        font-size: 48px; 
        font-family: Georgia, serif; 
        color: var(--tw-accent); 
        line-height: 1; 
        font-weight: bold; 
    }
    
    .stars { color: var(--tw-star,#6366f1); font-size: 16px; letter-spacing: 2px; margin-bottom: 12px; display: block; font-family: inherit; }
    
    .verified-badge { 
        position: absolute; 
        top: 28px; 
        right: 28px; 
        display: inline-flex; 
        align-items: center; 
        gap: 4px; 
        background: #f0fdf4; 
        color: #16a34a; 
        font-size: 13px; 
        font-weight: 600; 
        padding: 4px 12px; 
        border-radius: 999px; 
        margin: 0; 
        font-family: inherit;
    }
    
    .comment { color: #334155; font-size: 15px; line-height: 1.6; flex: 1; margin: 40px 0 24px 0; text-align: left; font-family: inherit; }
    .reviewer { display: flex; align-items: center; gap: 12px; border-top: 1px solid #f8fafc; padding-top: 20px; font-family: inherit; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0; font-family: inherit; }
    .name { font-weight: 700; color: var(--tw-text); font-size: 15px; margin-bottom: 2px; font-family: inherit; }
    .sub { color: #94a3b8; font-size: 13px; font-family: inherit; }
    
    .prev-btn, .next-btn { 
        position: absolute; 
        top: 50%; 
        transform: translateY(-50%); 
        z-index: 20; 
        width: 40px; height: 40px; border-radius: 50%; border: 1px solid #e2e8f0; 
        background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; 
        font-size: 16px; display: flex; align-items: center; justify-content: center; 
        transition: all 0.2s ease; 
    }
    .prev-btn { left: 10px; }
    .next-btn { right: 10px; }
    .prev-btn:hover, .next-btn:hover { background: #f8fafc; transform: translateY(-50%) scale(1.05); }
    
    .testimonial-dots { display:flex; justify-content:center; gap:8px; margin-top:28px; }
    .testimonial-dot { width:9px; height:9px; border-radius:50%; background:#cbd5e1; cursor:pointer; transition:all 0.2s ease; }
    .testimonial-dot.active { background:var(--tw-accent); transform:scale(1.1); }

    /* Store review write flow — mirrors review-widget's store review modal */
    .tw-review-btn { display:flex; align-items:center; gap:6px; margin:0 auto 24px; padding:10px 20px; border-radius:999px; border:1px solid var(--tw-accent); background:#fff; color:var(--tw-accent); font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; width:fit-content; }
    .tw-review-btn:hover { background:var(--tw-accent); color:#fff; }

    .tw-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); display:none; align-items:center; justify-content:center; z-index:9999; padding:20px; box-sizing:border-box; }
    .tw-modal-panel { background:#fff; border-radius:var(--tw-radius); max-width:420px; width:100%; padding:24px; position:relative; font-family:inherit; box-sizing:border-box; }
    .tw-modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .tw-modal-progress { font-size:13px; color:#94a3b8; margin:0; }
    .tw-modal-close { border:none; background:none; font-size:20px; cursor:pointer; color:#94a3b8; line-height:1; padding:0; }
    .tw-modal-close:hover { color:#64748b; }

    /* Rating step */
    .tw-rating-card { border:1px solid #E8EEF3; border-radius:calc(var(--tw-radius) - 4px); padding:28px 24px 24px; text-align:center; }
    .tw-rating-icon { width:72px; height:72px; border-radius:14px; background:#F0F7F4; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; }
    .tw-rating-name { font-weight:700; font-size:18px; color:var(--tw-text); margin:0 0 4px; letter-spacing:-0.01em; }
    .tw-rating-sub { margin:0 0 20px; font-size:13px; color:#6d7175; line-height:1.5; }
    .tw-divider { height:1px; background:#E8EEF3; margin:0 0 20px; }
    .tw-rating-title { text-align:center; margin:0 0 16px; font-size:16px; font-weight:700; color:var(--tw-text); letter-spacing:-0.01em; }
    .tw-star-row { display:flex; gap:6px; justify-content:center; margin:0 0 10px; }
    .tw-star-btn { background:none; border:none; cursor:pointer; font-size:32px; line-height:1; color:#cbd5e1; padding:0; }
    .tw-star-btn.filled { color:var(--tw-star,var(--tw-accent)); }
    .tw-star-labels { display:flex; justify-content:space-between; max-width:230px; margin:0 auto; font-size:11px; font-weight:500; color:#6d7175; }
    .tw-trust-footer { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:18px; padding-top:16px; border-top:1px solid #E8EEF3; font-size:12px; color:#6d7175; }
    .tw-powered { text-align:center; margin:14px 0 0; font-size:11px; color:#94a3b8; }

    /* Written step */
    .tw-form-title { margin:0 0 6px; font-size:18px; font-weight:800; color:var(--tw-text); }
    .tw-form-sub { margin:0 0 16px; font-size:14px; color:#6d7175; line-height:1.5; }
    .tw-label { display:block; font-weight:700; font-size:13px; color:var(--tw-text); margin:0 0 6px; }
    .tw-required { color:#dc2626; }
    .tw-input { width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; font-family:inherit; margin:0 0 16px; }

    /* Submit step */
    .tw-submit-title { margin:0 0 16px; font-size:18px; font-weight:800; color:var(--tw-text); }
    .tw-submit-sub { margin:0 0 4px; font-size:14px; color:#6d7175; line-height:1.5; }

    /* Confirmation */
    .tw-confirm-icon { font-size:40px; margin-bottom:12px; color:var(--tw-accent); }
    .tw-confirm-title { margin:0 0 12px; font-size:20px; font-weight:800; color:var(--tw-accent); }
    .tw-confirm-sub { margin:0 0 20px; font-size:14px; color:#6d7175; }

    .tw-modal-nav { display:flex; gap:10px; margin-top:8px; }
    .tw-modal-btn { padding:12px 18px; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; border:1px solid transparent; }
    .tw-modal-btn.next { flex:1; background:var(--tw-accent); color:#fff; border-color:var(--tw-accent); }
    .tw-modal-btn.back { background:#fff; color:#334155; border-color:#e2e8f0; }
    .tw-modal-msg { text-align:center; font-size:13px; margin-top:10px; min-height:16px; }
`;
        document.head.appendChild(style);
    }

    const SAMPLE_REVIEWS = [
        { id: "sample-1", author: "Sarah J.", rating: 5, comment: "Amazing quality and super fast delivery! Will definitely buy again." },
        { id: "sample-2", author: "David L.", rating: 5, comment: "The material is soft and the design is even better in person. Highly recommend!" },
        { id: "sample-3", author: "Olivia T.", rating: 5, comment: "Excellent product and great customer service. I'm in love with it!" },
    ];

    const STORE_REVIEW_COPY = {
        ratingTitle: "How was your experience?",
        ratingSubtitle: "Rate your experience with our store.",
        starLabelLow: "Dislike it",
        starLabelHigh: "Love it!",
        trustText: "Your data is secure and never shared.",
        formTitle: "Leave a store review",
        formSubtitle: "Share your experience shopping with us.",
        reviewPlaceholder: "What did you enjoy about our store? How was shipping, support, or packaging?",
        submitSubtitle: "Ready to share your review? Tap below to publish.",
        submitButtonText: "Post store review",
    };

    function esc(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    function isDesignMode() {
        return Boolean(window.Shopify?.designMode);
    }

    function getInitials({ name }) {
        return (name || "?").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    }

    function getPerView(root) {
        const width = root.offsetWidth;
        if (width < 640) return 1;
        if (width < 900) return 2;
        return 3;
    }

    function initCarousel(root, config) {
        const track = root.querySelector(".testimonials-track");
        if (!track) return;

        const cards = Array.from(track.children);
        const total = cards.length;
        let page = 0;
        let perView;

        function updateLayout() {
            perView = getPerView(root);
            root.style.setProperty("--per-view", perView);
            
            // Centering fix: If items don't fill the screen, center them safely
            if (total < perView) {
                track.style.justifyContent = "center";
            } else {
                track.style.justifyContent = "flex-start";
            }
        }

        function totalPages() {
            return Math.max(1, Math.ceil(total / perView));
        }

        function goToPage(p) {
            page = Math.min(Math.max(p, 0), totalPages() - 1);
            const cardIndex = page * perView;
            const card = cards[cardIndex];
            if (card) {
                track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
            }
            updateDots();
        }

        function renderDots() {
            const dotsWrap = root.querySelector(".testimonial-dots");
            if (!dotsWrap) return;
            if (!config.showDots) {
                dotsWrap.innerHTML = "";
                return;
            }
            dotsWrap.innerHTML = Array.from({ length: totalPages() })
                .map(() => `<span class="testimonial-dot"></span>`)
                .join("");
            dotsWrap.querySelectorAll(".testimonial-dot").forEach((dot, i) => {
                dot.addEventListener("click", () => goToPage(i));
            });
            updateDots();
        }

        function updateDots() {
            root.querySelectorAll(".testimonial-dot").forEach((d, i) => {
                d.classList.toggle("active", i === page);
            });
        }

        root.querySelector(".prev-btn")?.addEventListener("click", () => goToPage(page - 1));
        root.querySelector(".next-btn")?.addEventListener("click", () => goToPage(page + 1));

        updateLayout();
        renderDots();
        goToPage(0);

        const ro = new ResizeObserver(() => {
            updateLayout();
            renderDots();
            goToPage(0);
        });
        ro.observe(root);
    }

    function buildStarsHtml(rating) {
        const full = Math.round(rating) || 0;
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += i <= full ? "\u2605" : "\u2606";
        }
        return html;
    }

    // Store icon (house) — same glyph as review-widget's storeAvatarHtml
    function storeIconSvg() {
        return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-8.5Z" stroke="var(--tw-accent)" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    }

    function createStoreReviewFlow({ shop, storeName, API, onComplete }) {
        const steps = ["rating", "written", "submit"];
        let step = 0, rating = 0, author = "", comment = "";
        const els = {};

        function renderStars() {
            els.stars.innerHTML = "";
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "tw-star-btn" + (i <= rating ? " filled" : "");
                btn.textContent = i <= rating ? "\u2605" : "\u2606";
                btn.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
                btn.onclick = () => { rating = i; renderStars(); };
                els.stars.appendChild(btn);
            }
        }

        function renderStep() {
            const s = steps[step];

            if (s === "rating") {
                els.content.innerHTML = `
                    <div class="tw-rating-card">
                        <div class="tw-rating-icon">${storeIconSvg()}</div>
                        <div class="tw-rating-name">${esc(storeName)}</div>
                        <p class="tw-rating-sub">${esc(STORE_REVIEW_COPY.ratingSubtitle)}</p>
                        <div class="tw-divider"></div>
                        <p class="tw-rating-title">${esc(STORE_REVIEW_COPY.ratingTitle)}</p>
                        <div class="tw-star-row" id="tw-star-row"></div>
                        <div class="tw-star-labels">
                            <span>${esc(STORE_REVIEW_COPY.starLabelLow)}</span>
                            <span>${esc(STORE_REVIEW_COPY.starLabelHigh)}</span>
                        </div>
                    </div>
                    <div class="tw-trust-footer">🔒 ${esc(STORE_REVIEW_COPY.trustText)}</div>
                    ${window.__VERDICT__?.config?.hideVerdictBranding ? "" : '<p class="tw-powered">Powered by Verdict Product Reviews</p>'}
                `;
                els.stars = els.content.querySelector("#tw-star-row");
                renderStars();
            } else if (s === "written") {
                els.content.innerHTML = `
                    <h3 class="tw-form-title">${esc(STORE_REVIEW_COPY.formTitle)}</h3>
                    <p class="tw-form-sub">${esc(STORE_REVIEW_COPY.formSubtitle)}</p>
                    <label class="tw-label">Your Name <span class="tw-required">*</span></label>
                    <input class="tw-input" id="tw-author" value="${esc(author)}" placeholder="e.g. Sarah M." autocomplete="name" />
                    <label class="tw-label">Your Review <span class="tw-required">*</span></label>
                    <textarea class="tw-input" id="tw-comment" style="min-height:100px;resize:vertical" maxlength="500" placeholder="${esc(STORE_REVIEW_COPY.reviewPlaceholder)}">${esc(comment)}</textarea>`;
                els.content.querySelector("#tw-author").oninput = (e) => { author = e.target.value.trim(); if (els.msg) els.msg.textContent = ""; };
                els.content.querySelector("#tw-comment").oninput = (e) => { comment = e.target.value.trim(); if (els.msg) els.msg.textContent = ""; };
            } else if (s === "submit") {
                els.content.innerHTML = `
                    <h3 class="tw-submit-title">${esc(STORE_REVIEW_COPY.formTitle)}</h3>
                    <p class="tw-submit-sub">${esc(STORE_REVIEW_COPY.submitSubtitle)}</p>`;
            }
        }

        function validate() {
            const s = steps[step];
            els.msg.style.color = "#dc2626";
            if (s === "rating" && rating < 1) { els.msg.textContent = "Please select a rating."; return false; }
            if (s === "written" && (!author || !comment)) { els.msg.textContent = "Please fill in both fields."; return false; }
            els.msg.textContent = "";
            return true;
        }

        async function handleNext() {
            if (!validate()) return;

            // If not on the final step, just move forward in the UI
            if (step < steps.length - 1) {
                step++;
                renderStep();
                syncNav();
                return;
            }

            // Lock the button and show loading state
            els.next.disabled = true;
            els.msg.style.color = "#64748b";
            els.msg.textContent = "Submitting\u2026";

            try {
                // Post to the backend
                const res = await fetch(`${API}/api/public/reviews`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        shop,
                        productId: "store-review",
                        productName: "Store Review",
                        rating,
                        author,
                        comment
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to submit review");
                }

                // Show Success Screen
                els.content.innerHTML = `
                    <div style="text-align:center;padding:10px 0">
                        <div class="tw-confirm-icon">✓</div>
                        <h3 class="tw-confirm-title">Thank you!</h3>
                        <p class="tw-confirm-sub">Your review has been published.</p>
                        <div class="tw-trust-footer" style="border-top:none;margin-top:0;padding-top:0">🔒 ${esc(STORE_REVIEW_COPY.trustText)}</div>
                        ${window.__VERDICT__?.config?.hideVerdictBranding ? "" : '<p class="tw-powered">Powered by Verdict Product Reviews</p>'}
                    </div>`;

                // Update navigation controls to act as a Close button
                els.progress.textContent = "Review submitted";
                els.back.style.display = "none";
                els.next.textContent = "Close";
                els.next.disabled = false;
                els.msg.textContent = "";

                // Optimistic Data Handoff (Fires only when they click "Close")
                els.next.onclick = () => {
                    close();
                    if (typeof onComplete === "function") {
                        onComplete({
                            id: "optimistic-" + Date.now(),
                            author: author,
                            rating: rating,
                            comment: comment
                        });
                    }
                };
            } catch (err) {
                // Handle errors and unlock the button
                els.msg.style.color = "#dc2626";
                els.msg.textContent = err.message;
                els.next.disabled = false;
            }
        }

        function syncNav() {
            els.progress.textContent = `Step ${step + 1} of ${steps.length}`;
            els.back.style.display = step > 0 ? "inline-flex" : "none";
            els.next.innerHTML = steps[step] === "submit" ? `✓ ${esc(STORE_REVIEW_COPY.submitButtonText)}` : "Continue";
            els.next.onclick = handleNext;
        }

        function open() {
            step = 0; rating = 0; author = ""; comment = "";
            els.msg.textContent = "";
            els.next.disabled = false;
            renderStep();
            syncNav();
            els.overlay.style.display = "flex";
        }
        function close() { els.overlay.style.display = "none"; }

        function mount(container) {
            container.insertAdjacentHTML("beforeend", `
                <div class="tw-modal-overlay" id="tw-modal">
                    <div class="tw-modal-panel">
                        <div class="tw-modal-header">
                            <p class="tw-modal-progress" id="tw-modal-progress"></p>
                            <button type="button" class="tw-modal-close" id="tw-modal-close" aria-label="Close">&times;</button>
                        </div>
                        <div id="tw-modal-content"></div>
                        <div class="tw-modal-nav">
                            <button type="button" class="tw-modal-btn back" id="tw-modal-back">Back</button>
                            <button type="button" class="tw-modal-btn next" id="tw-modal-next">Continue</button>
                        </div>
                        <p class="tw-modal-msg" id="tw-modal-msg"></p>
                    </div>
                </div>`);
            els.overlay = container.querySelector("#tw-modal");
            els.content = container.querySelector("#tw-modal-content");
            els.progress = container.querySelector("#tw-modal-progress");
            els.back = container.querySelector("#tw-modal-back");
            els.next = container.querySelector("#tw-modal-next");
            els.msg = container.querySelector("#tw-modal-msg");
            container.querySelector("#tw-modal-close").onclick = close;
            els.overlay.onclick = (e) => { if (e.target === els.overlay) close(); };
            els.back.onclick = () => { if (step > 0) { step--; renderStep(); syncNav(); } };
        }

        return { mount, open };
    }

    function renderCard(review, config) {
        const stars = buildStarsHtml(review.rating);
        const initials = getInitials({ name: review.author });
        const badgeHtml = config.showVerifiedBadge
            ? `<span class="verified-badge">\u2713 ${config.verifiedBadgeText}</span>`
            : "";
        return `
            <div class="testimonial-card">
            <div class="stars">${stars}</div>
            ${badgeHtml}
            <p class="comment">${review.comment || ""}</p>
            <div class="reviewer">
                <div class="avatar">${initials}</div>
                <div>
                <div class="name">${review.author || "Anonymous"}</div>
                <div class="sub">Verified Buyer</div>
                </div>
            </div>
            </div>
        `;
    }

    function renderWidget({ root, reviews, heading, config }) {
        const cardsHtml = reviews.map((r) => renderCard(r, config)).join("");
        const arrowsHtml = config.showNavigationArrows
            ? `<button class="prev-btn">&lt;</button>`
            : "";
        const arrowsHtmlNext = config.showNavigationArrows
            ? `<button class="next-btn">&gt;</button>`
            : "";
        const carouselHtml = reviews.length
            ? `<div class="testimonials-carousel">${arrowsHtml}<div class="testimonials-track">${cardsHtml}</div>${arrowsHtmlNext}</div><div class="testimonial-dots"></div>`
            : "";

        root.innerHTML = `
                <h2 class="testimonials-heading">${heading || "Testimonials"}</h2>
                <button type="button" class="tw-review-btn" id="tw-write-review">Write a Store Review</button>
                ${carouselHtml}
            `;

        if (reviews.length) initCarousel(root, config);
    }

    function applyConfigVars(root, config) {
        root.style.setProperty("--tw-accent", config.accentColor);
        root.style.setProperty("--tw-star", config.starColor);
        root.style.setProperty("--tw-text", config.textColor);
        root.style.setProperty("--tw-radius", `${config.borderRadius}px`);
        if (config.fontFamily && config.fontFamily !== "inherit") {
            root.style.setProperty("font-family", config.fontFamily);
        }
        root.style.setProperty("padding", `${config.sectionPadding}px 20px`);
        const headingEl = root.querySelector(".testimonials-heading");
        if (headingEl) headingEl.style.fontSize = `${config.headingFontSize}px`;
    }

    function getAppConfig() {
        return window.__VERDICT__?.config?.testimonials || null;
    }

    async function resolveConfig(shop, API) {
        const fromCore = getAppConfig();
        if (fromCore) return fromCore;

        if (typeof window.__VERDICT__?.ensureConfig === "function") {
            try {
                const cfg = await Promise.race([
                    window.__VERDICT__.ensureConfig(),
                    new Promise((r) => setTimeout(() => r(null), 2000)),
                ]);
                if (cfg?.testimonials) return cfg.testimonials;
            } catch {
                /* fall through */
            }
        }

        if (window.__VERDICT__?.configReady) {
            try {
                await Promise.race([
                    window.__VERDICT__.configReady,
                    new Promise((r) => setTimeout(r, 1500)),
                ]);
                const waited = getAppConfig();
                if (waited) return waited;
            } catch {
                /* fall through */
            }
        }

        try {
            const res = await fetch(
                `${API}/api/public/settings?shop=${encodeURIComponent(shop)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data?.config) {
                window.__VERDICT__ = window.__VERDICT__ || {};
                window.__VERDICT__.config = {
                    ...(window.__VERDICT__.config || {}),
                    ...data.config,
                };
            }
            return data?.config?.testimonials || null;
        } catch (err) {
            console.error("Testimonials settings fetch failed:", err);
            return null;
        }
    }

    async function init() {
        const root = document.getElementById("testimonials-widget-root");
        if (!root) return;

        const shop = root.dataset.shop;
        const API = (root.dataset.apiBase || "").replace(/\/$/, "");
        const fallbackHeading = root.dataset.heading;
        const fallbackLimit = Number(root.dataset.limit) || 20;
        const storeName = root.dataset.storeName || shop?.split(".")[0] || "Our Store";

        if (!API || !shop) {
            console.error("Missing API or shop", { API, shop });
            return;
        }

        root.innerHTML = "<p>Loading Testimonials...</p>";

        // Fetch reviews immediately; config is best-effort and must not block.
        const reviewsPromise = fetch(
            `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=store&limit=${fallbackLimit}&lite=1`
        ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        const remoteConfigPromise = resolveConfig(shop, API).catch(() => null);

        try {
            const [data, remoteConfig] = await Promise.all([
                reviewsPromise,
                Promise.race([
                    remoteConfigPromise,
                    new Promise((r) => setTimeout(() => r(null), 2000)),
                ]),
            ]);

            const config = {
                heading: remoteConfig?.heading || fallbackHeading || "Testimonials",
                limit: remoteConfig?.limit || fallbackLimit,
                verifiedBadgeText: remoteConfig?.verifiedBadgeText || "Verified Buyer",
                showVerifiedBadge: remoteConfig?.showVerifiedBadge !== false,
                accentColor: remoteConfig?.accentColor || "#6366f1",
                starColor: remoteConfig?.starColor || "#6366f1",
                textColor: remoteConfig?.textColor || "#1e293b",
                fontFamily: remoteConfig?.fontFamily || "inherit",
                borderRadius: remoteConfig?.borderRadius ?? 16,
                sectionPadding: remoteConfig?.sectionPadding ?? 40,
                headingFontSize: remoteConfig?.headingFontSize ?? 28,
                cardMinWidth: remoteConfig?.cardMinWidth ?? 270,
                showNavigationArrows: remoteConfig?.showNavigationArrows !== false,
                showDots: remoteConfig?.showDots !== false,
            };

            applyConfigVars(root, config);

            let reviews = data.reviews || [];

            if (reviews.length === 0 && isDesignMode()) {
                reviews = SAMPLE_REVIEWS;
            }

            renderWidget({ root, reviews, heading: config.heading, config });
            applyConfigVars(root, config);

            const storeReviewFlow = createStoreReviewFlow({
                shop,
                storeName,
                API,
                onComplete: (newReview) => {
                    if (newReview) {
                        // Add the new review to the beginning of the array
                        reviews.unshift(newReview);
                        
                        // Keep the array length to the limit so we don't break the layout
                        if (reviews.length > config.limit) reviews.pop();
                        
                        // Re-render the widget with the updated array
                        renderWidget({ root, reviews, heading: config.heading, config });
                        
                        // Re-bind the click event to the "Write a Review" button since we overwrote the DOM
                        root.querySelector("#tw-write-review").onclick = () => storeReviewFlow.open();
                    }
                },
            });
            storeReviewFlow.mount(root);
            root.querySelector("#tw-write-review").onclick = () => storeReviewFlow.open();
        } catch (err) {
            console.error("Widget error:", err);
            root.innerHTML = "<p>Could not load testimonials.</p>";
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();