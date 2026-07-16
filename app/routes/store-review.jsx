import { normalizeShopDomain } from "../utils/shop.server";

const STORE_PRODUCT_ID = "store-review";

function htmlPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { color: #64748b; line-height: 1.5; }
    label { display: block; font-weight: 600; font-size: 13px; margin: 16px 0 6px; }
    input, textarea, select { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font: inherit; }
    textarea { min-height: 100px; resize: vertical; }
    button { margin-top: 20px; width: 100%; padding: 12px; border: none; border-radius: 8px; background: #008060; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
    .msg { margin-top: 12px; font-size: 14px; font-weight: 600; }
    .ok { color: #008060; }
    .err { color: #dc2626; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopRaw = url.searchParams.get("shop");
  const shop = shopRaw ? normalizeShopDomain(shopRaw) : "";

  const form = `
    <div class="card">
      <h1>Leave a store review</h1>
      <p>Share your experience shopping with us.</p>
      <form id="store-review-form">
        <input type="hidden" name="shop" value="${shop.replace(/"/g, "&quot;")}" />
        <input type="hidden" name="productId" value="${STORE_PRODUCT_ID}" />
        <input type="hidden" name="productName" value="Store Review" />
        <label for="author">Your name</label>
        <input id="author" name="author" required maxlength="120" />
        <label for="rating">Rating</label>
        <select id="rating" name="rating" required>
          <option value="5">5 — Excellent</option>
          <option value="4">4 — Good</option>
          <option value="3">3 — Average</option>
          <option value="2">2 — Poor</option>
          <option value="1">1 — Terrible</option>
        </select>
        <label for="comment">Your review</label>
        <textarea id="comment" name="comment" required maxlength="5000"></textarea>
        <button type="submit">Submit review</button>
        <p class="msg" id="msg" hidden></p>
      </form>
    </div>
    <script>
      const form = document.getElementById('store-review-form');
      const msg = document.getElementById('msg');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.hidden = true;
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.rating = Number(payload.rating);
        try {
          const res = await fetch('/apps/verdict-product-reviews/api/public/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Could not submit review');
          msg.textContent = 'Thank you! Your review was submitted.';
          msg.className = 'msg ok';
          msg.hidden = false;
          form.reset();
        } catch (err) {
          msg.textContent = err.message || 'Something went wrong.';
          msg.className = 'msg err';
          msg.hidden = false;
        }
      });
    </script>`;

  return new Response(htmlPage("Store Review", form), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
