(function () {

    if (!document.getElementById("testimonials-widget-css")) {
        const style = document.createElement("style");
        style.id = "testimonials-widget-css";
        style.textContent = `
            #testimonials-widget-root { --tw-accent:#6366f1; --tw-text:#1e293b; --tw-card-bg:#fff; --tw-radius:16px; width:100%; padding:40px 20px; box-sizing:border-box; position:relative; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
            .testimonials-heading { font-size:28px; font-weight:700; color:var(--tw-text); text-align:left; margin:0 0 32px; }
            .testimonials-carousel { display:flex; align-items:center; gap:12px; width:100%; position:relative; }
            .testimonials-track { display:flex; gap:24px; overflow-x:hidden; scroll-behavior:smooth; flex:1; width:100%; padding:10px 0; scroll-snap-type:x mandatory; justify-content:flex-start; }
            .testimonial-card { flex:0 0 calc((100% - 48px)/3); min-width:270px; box-sizing:border-box; background:var(--tw-card-bg); border:1px solid #f1f5f9; box-shadow:0 4px 20px rgba(0,0,0,0.02); border-radius:var(--tw-radius); padding:24px; display:grid; grid-template-columns:1fr auto; row-gap:14px; align-items:center; scroll-snap-align:start; transform:translate3d(0,0,0); }
            .stars { grid-column:1; color:#6366f1; font-size:16px; letter-spacing:2px; }
            .verified-badge { grid-column:2; display:inline-flex; align-items:center; gap:4px; background:#f0fdf4; color:#16a34a; font-size:13px; font-weight:600; padding:4px 12px; border-radius:999px; margin:0; width:fit-content; white-space:nowrap; }
            .comment { grid-column:span 2; color:#334155; font-size:15px; line-height:1.6; margin:0; text-align:left; position:relative; padding-top:36px; min-height:60px; }
            .comment::before { content:"“"; position:absolute; left:0; top:0; font-size:48px; font-family:Georgia,serif; color:var(--tw-accent); line-height:1; font-weight:bold; }
            .reviewer { grid-column:span 2; display:flex; align-items:center; gap:12px; border-top:1px solid #f8fafc; padding-top:16px; margin-top:4px; }
            .avatar { width:44px; height:44px; border-radius:50%; background:#e2e8f0; color:#475569; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14px; flex-shrink:0; }
            .name { font-weight:700; color:var(--tw-text); font-size:15px; margin-bottom:2px; }
            .sub { color:#94a3b8; font-size:13px; }
            .prev-btn,.next-btn { flex-shrink:0; width:40px; height:40px; border-radius:50%; border:1px solid #e2e8f0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.04); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease; z-index:2; }
            .prev-btn:hover,.next-btn:hover { background:#f8fafc; transform:scale(1.05); }
            .testimonial-dots { display:flex; justify-content:center; gap:8px; margin-top:28px; }
            .testimonial-dot { width:9px; height:9px; border-radius:50%; background:#cbd5e1; cursor:pointer; transition:all 0.2s ease; }
            .testimonial-dot.active { background:var(--tw-accent); transform:scale(1.1); }
            @media (max-width:1023px){ .testimonial-card { flex:0 0 calc((100% - 24px)/2); } }
            @media (max-width:639px){ .testimonial-card { flex:0 0 100%; } }
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
        if (width < 1024) return 2;
        return 3;
    }

    function initCarousel(root) {
        const track = root.querySelector(".testimonials-track");
        if (!track) return;

        const cards = Array.from(track.children);
        const total = cards.length;
        let perView = getPerView(root);
        let page = 0;

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
            dotsWrap.innerHTML = Array.from({ length: totalPages() })
                .map(() => `<span class="testimonial-dot></span>`)
                .join("");
            dotsWrap.querySelectorAll(".testimonial-dot").forEach((dot, i) => {
                dot.addEventListener("click", () => goToPage(i));
            })
            updateDots();
        }

        function updateDots() {
            root.querySelectorAll(".testimonial-dot").forEach((d, i) => {
                d.classList.toggle("active", i === page);
            });
        }

        root.querySelector(".prev-btn")?.addEventListener("click", () => goToPage(page - 1));
        root.querySelector(".next-btn")?.addEventListener("click", () => goToPage(page + 1));

        renderDots();
        goToPage(0);

        window.addEventListener("resize", () => {
            perView = getPerView(root);
            renderDots();
            goToPage(0);
        });
    }


    function buildStarsHtml(rating) {
    const full = Math.round(rating) || 0;
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += i <= full ? "★" : "☆";
    }
    return html;
}

function renderCard(review) {
    const stars = buildStarsHtml(review.rating);
    const initials = getInitials({name:review.author});
    return `
            <div class="testimonial-card">
            <div class="stars">${stars}</div>
            <span class="verified-badge">✓ Verified</span>
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

function renderWidget({ root, reviews, heading }) {
    if (reviews.length === 0) {
        root.innerHTML = "";
        return;
    }
    const cardsHtml = reviews.map(renderCard).join("");

    root.innerHTML = `
                <h2 class="testimonials-heading">${heading || "Testimonials"}</h2>
                <div class="testimonials-carousel">
                <button class="prev-btn">&lt;</button>
                <div class="testimonials-track">${cardsHtml}</div>
                <button class="next-btn">&gt;</button>
                </div>
                <div class="testimonial-dots"></div>
            `;

    initCarousel(root);
}

async function init() {
    const root = document.getElementById("testimonials-widget-root");
    if (!root) return;

    const shop = root.dataset.shop;
    const API = (root.dataset.apiBase || "").replace(/\/$/, "");
    const heading = root.dataset.heading;

    if (!API || !shop) {
        console.error("Missing API or shop", { API, shop });
        return;
    }

    root.innerHTML = "<p>Loading Testimonials...</p>";

    try {
        const res = await fetch(
            `${API}/api/public/widget-reviews?shop=${encodeURIComponent(shop)}&scope=store&limit=20&t=${Date.now()}`
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        let reviews = data.reviews || [];

        if (reviews.length === 0 && isDesignMode()) {
            reviews = SAMPLE_REVIEWS;
        }

        renderWidget({ root, reviews, heading });
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
}) ();