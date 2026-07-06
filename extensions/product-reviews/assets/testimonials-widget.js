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
        width: 100%; 
        margin: 0 auto;
        padding: 40px 0; /* Vertical padding only */
        box-sizing: border-box; 
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; 
    }

    .testimonials-heading { font-size:28px; font-weight:700; color:var(--tw-text); text-align:center; margin:0 0 32px;font-family: inherit !important; }
    
.testimonials-carousel {
    position: relative;
    width: 100%;
    padding: 0 60px;
    box-sizing: border-box;
    overflow: hidden;          /* NEW: viewport clips here */
}
    
.testimonials-track {
    display: flex;
    flex-wrap: nowrap;
    gap: 24px;
    overflow-x: auto;          /* CHANGED: was hidden, now scrolls */
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;   /* NEW */
    -ms-overflow-style: none;
    scrollbar-width: none;
    width: 100%;
    padding: 10px 0;
    margin: 0;
    box-sizing: border-box;
}
.testimonials-track::-webkit-scrollbar { display: none; }  /* NEW: hide scrollbar */
    
  .testimonial-card {
    flex: 0 0 calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view));
    width: calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view));
    max-width: calc((100% - ((var(--per-view) - 1) * 24px)) / var(--per-view));
    scroll-snap-align: start;   /* NEW */
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
    
    /* Original Card Styling Restored */
    .testimonial-card::before { 
        content: "?"; 
        position: absolute; 
        left: 28px; 
        top: 64px; 
        font-size: 48px; 
        font-family: Georgia, serif; 
        color: var(--tw-accent); 
        line-height: 1; 
        font-weight: bold; 
    }
    
    .stars { color: var(--tw-star,#6366f1); font-size: 16px; letter-spacing: 2px; margin-bottom: 12px; display: block; }
    
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
    }
    
    .comment { color: #334155; font-size: 15px; line-height: 1.6; flex: 1; margin: 40px 0 24px 0; text-align: left; }
    .reviewer { display: flex; align-items: center; gap: 12px; border-top: 1px solid #f8fafc; padding-top: 20px; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0; }
    .name { font-weight: 700; color: var(--tw-text); font-size: 15px; margin-bottom: 2px; }
    .sub { color: #94a3b8; font-size: 13px; }
    
    /* Arrow Positioning */
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
`;
        document.head.appendChild(style);
    }

    const SAMPLE_REVIEWS = [
        { id: "sample-1", author: "Sarah J.", rating: 5, comment: "Amazing quality and super fast delivery! Will definitely buy again." },
        { id: "sample-2", author: "David L.", rating: 5, comment: "The material is soft and the design is even better in person. Highly recommend!" },
        { id: "sample-3", author: "Olivia T.", rating: 5, comment: "Excellent product and great customer service. I'm in love with it!" },
    ];

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
        return 3;   // CHANGED: cap at 3 instead of jumping to 4
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
            html += i <= full ? "?" : "?";
        }
        return html;
    }

    function renderCard(review, config) {
        const stars = buildStarsHtml(review.rating);
        const initials = getInitials({ name: review.author });
        const badgeHtml = config.showVerifiedBadge
            ? `<span class="verified-badge">? ${config.verifiedBadgeText}</span>`
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
        if (reviews.length === 0) {
            root.innerHTML = "";
            return;
        }
        const cardsHtml = reviews.map((r) => renderCard(r, config)).join("");
        const arrowsHtml = config.showNavigationArrows
            ? `<button class="prev-btn">&lt;</button>`
            : "";
        const arrowsHtmlNext = config.showNavigationArrows
            ? `<button class="next-btn">&gt;</button>`
            : "";

        root.innerHTML = `
                <h2 class="testimonials-heading">${heading || "Testimonials"}</h2>
                <div class="testimonials-carousel">
                ${arrowsHtml}
                <div class="testimonials-track">${cardsHtml}</div>
                ${arrowsHtmlNext}
                </div>
                <div class="testimonial-dots"></div>
            `;

        initCarousel(root, config);
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
        return window.__JUDGEME__?.config?.testimonials || null;
    }

    async function resolveConfig(shop, API) {
        const fromCore = getAppConfig();
        if (fromCore) return fromCore;

        try {
            const res = await fetch(
                `${API}/api/public/settings?shop=${encodeURIComponent(shop)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
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

        if (!API || !shop) {
            console.error("Missing API or shop", { API, shop });
            return;
        }

        root.innerHTML = "<p>Loading Testimonials...</p>";

        const remoteConfig = await resolveConfig(shop, API);
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

        try {
            const res = await fetch(
                `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=store&limit=${config.limit}`
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            let reviews = data.reviews || [];

            if (reviews.length === 0 && isDesignMode()) {
                reviews = SAMPLE_REVIEWS;
            }

            renderWidget({ root, reviews, heading: config.heading, config });
            applyConfigVars(root, config);
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