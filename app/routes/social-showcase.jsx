import { normalizeShopDomain } from "../utils/shop.server";
import { resolveSocialShowcasePublicData } from "../lib/social-showcase.server.js";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function starsHtml(rating) {
  const full = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  let out = "";
  for (let i = 1; i <= 5; i += 1) {
    out += `<span class="star ${i <= full ? "filled" : ""}">★</span>`;
  }
  return out;
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderPage(data, shop) {
  const { config, brandLogoUrl, shopUrl, selectedReviews, selectedPhotos, summary, hideVerdictBranding } = data;
  const accent = esc(config.accentColor);
  const storeName = esc(config.storeName);
  const tagline = esc(config.tagline);
  const bottomHeading = esc(config.bottomCtaHeading);
  const verifiedText = esc(config.verifiedBadgeText);
  const shopNowLabel = esc(config.shopNowLabel);
  const avg = summary.average || 0;
  const total = summary.total || 0;
  const logoInitials = esc(initials(config.storeName));

  const photosHtml =
    selectedPhotos.length > 0
      ? selectedPhotos
          .map(
            (photo) => `
        <div class="photo-card">
          <img src="${esc(photo.url)}" alt="Customer photo" loading="lazy" />
          <span class="photo-rating">★ ${Number(photo.rating || 0).toFixed(1)}</span>
        </div>`,
          )
          .join("")
      : `<div class="empty-photos">No customer photos selected yet.</div>`;

  const reviewsHtml =
    selectedReviews.length > 0
      ? selectedReviews
          .map(
            (review) => `
        <article class="review-card">
          <div class="review-head">
            <strong>${esc(review.author)}</strong>
            <div class="stars">${starsHtml(review.rating)}</div>
          </div>
          <span class="verified">${verifiedText}</span>
          <p class="review-text">${esc(review.comment)}</p>
          <div class="review-meta">
            ${review.productName ? `<span class="product-tag">${esc(review.productName)}</span>` : ""}
            <span class="review-date">${esc(review.formattedDate)}</span>
          </div>
        </article>`,
          )
          .join("")
      : `<div class="empty-reviews">No featured reviews yet.</div>`;

  const logoHtml = brandLogoUrl
    ? `<img src="${esc(brandLogoUrl)}" alt="${storeName}" class="logo-img" />`
    : `<div class="logo-fallback">${logoInitials}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${storeName} — Reviews</title>
  <meta name="description" content="${tagline || `${storeName} customer reviews`}" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f6f7f8;
      color: #202223;
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 430px; margin: 0 auto; background: #fff; min-height: 100vh; }
    .top-label {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #8c9196;
      padding: 16px 20px 0;
    }
    .hero { padding: 20px 20px 8px; text-align: center; }
    .logo-img, .logo-fallback {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      margin: 0 auto 14px;
      object-fit: cover;
    }
    .logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 24px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; line-height: 1.15; }
    .hero p { margin: 0; color: #6d7175; font-size: 15px; line-height: 1.5; }
    .rating-block { text-align: center; padding: 18px 20px 8px; }
    .rating-value { font-size: 42px; font-weight: 900; line-height: 1; margin-bottom: 6px; }
    .stars { color: #fbbf24; letter-spacing: 1px; font-size: 18px; }
    .star { color: #e5e7eb; }
    .star.filled { color: #fbbf24; }
    .rating-caption { margin-top: 8px; color: #6d7175; font-size: 14px; font-weight: 500; }
    .cta-wrap { padding: 16px 20px 24px; }
    .shop-btn {
      display: block;
      width: 100%;
      border: none;
      border-radius: 999px;
      padding: 16px 20px;
      background: ${accent};
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
    }
    .section { padding: 8px 0 24px; }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px 12px;
    }
    .section-head h2 {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #6d7175;
    }
    .photos-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 0 20px 4px;
      scroll-snap-type: x mandatory;
    }
    .photo-card {
      position: relative;
      flex: 0 0 160px;
      height: 200px;
      border-radius: 14px;
      overflow: hidden;
      scroll-snap-align: start;
      background: #eceff1;
    }
    .photo-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-rating {
      position: absolute;
      left: 10px;
      bottom: 10px;
      background: rgba(0,0,0,0.72);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
    }
    .reviews-section { padding: 0 20px 24px; }
    .reviews-section .section-head { padding: 0 0 12px; }
    .review-card {
      border: 1px solid #e1e3e5;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      background: #fff;
    }
    .review-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .review-head strong { font-size: 15px; }
    .verified {
      display: inline-block;
      background: #e8f5ef;
      color: ${accent};
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .review-text {
      margin: 0 0 12px;
      font-size: 14px;
      line-height: 1.55;
      color: #202223;
    }
    .review-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: #6d7175;
    }
    .product-tag {
      background: #f1f2f3;
      color: #454f5b;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 600;
    }
    .bottom-cta {
      background: #f6f7f8;
      padding: 28px 20px 32px;
      text-align: center;
    }
    .bottom-cta h2 { margin: 0 0 10px; font-size: 24px; font-weight: 800; }
    .bottom-cta p {
      margin: 0 auto 18px;
      max-width: 320px;
      color: #6d7175;
      font-size: 14px;
      line-height: 1.55;
    }
    .bottom-summary {
      margin-top: 14px;
      color: #6d7175;
      font-size: 13px;
      font-weight: 600;
    }
    .powered {
      margin-top: 18px;
      font-size: 11px;
      color: #8c9196;
      letter-spacing: 0.02em;
    }
    .empty-photos, .empty-reviews {
      padding: 0 20px;
      color: #8c9196;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-label">VERDICT PRODUCT REVIEWS</div>
    <section class="hero">
      ${logoHtml}
      <h1>${storeName}</h1>
      ${tagline ? `<p>${tagline}</p>` : ""}
    </section>
    <section class="rating-block">
      <div class="rating-value">${avg.toFixed(1)}</div>
      <div class="stars">${starsHtml(avg)}</div>
      <div class="rating-caption">${total.toLocaleString()} verified reviews</div>
    </section>
    <div class="cta-wrap">
      <a class="shop-btn" href="${esc(shopUrl)}" rel="noopener">${shopNowLabel}</a>
    </div>
    <section class="section">
      <div class="section-head">
        <h2>CUSTOMER PHOTOS</h2>
      </div>
      <div class="photos-scroll">${photosHtml}</div>
    </section>
    <section class="reviews-section">
      <div class="section-head">
        <h2>WHAT CUSTOMERS SAY</h2>
        <span class="rating-caption">${total.toLocaleString()} reviews</span>
      </div>
      ${reviewsHtml}
    </section>
    <section class="bottom-cta">
      <h2>${bottomHeading}</h2>
      <p>Join thousands of happy customers who trust ${storeName} for quality products and great service.</p>
      <a class="shop-btn" href="${esc(shopUrl)}" rel="noopener">${shopNowLabel}</a>
      <div class="bottom-summary">${avg.toFixed(1)} average across ${total.toLocaleString()} reviews</div>
      ${hideVerdictBranding ? "" : '<div class="powered">Powered by Verdict Product Reviews</div>'}
    </section>
  </div>
  <script>
    (function () {
      var shop = ${JSON.stringify(shop)};
      if (!shop) return;
      try {
        var key = 'jd_social_' + shop;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch (e) {}
      fetch('/apps/verdict-product-reviews/api/public/widget-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: shop, event: 'social_showcase_view' }),
        keepalive: true,
      }).catch(function () {});
    })();
  </script>
</body>
</html>`;
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopRaw = url.searchParams.get("shop");
  const shop = shopRaw ? normalizeShopDomain(shopRaw) : "";

  if (!shop) {
    return new Response("Missing shop parameter", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const data = await resolveSocialShowcasePublicData({ shop, request });
  const html = renderPage(data, shop);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow short CDN/browser cache — page embeds many media URLs; no-store forced full re-download.
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
