//app.write-review.jsx
/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/alt-text */
import { useEffect, useState } from "react";
import {
  useSubmit,
  useNavigation,
  useActionData,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Star, ShoppingBag, CheckCircle2 } from "lucide-react";
import db from "../db.server";
import { normalizeShopifyProductId } from "../utils/product-id.shared.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { Banner, Page, Card } from "../components/admin-ui";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {};
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const rawPid = fd.get("productId");
  const productId =
    normalizeShopifyProductId(rawPid) || String(rawPid ?? "").trim();
  const author = String(fd.get("author") ?? "").trim();
  const comment = String(fd.get("comment") ?? "").trim();
  const rating = Number(fd.get("rating"));

  if (!productId) {
    return { ok: false, error: "Select a product first." };
  }
  if (!author || !comment) {
    return { ok: false, error: "Name and comment are required." };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choose a rating from 1 to 5 stars." };
  }

  const { canCreateReview } = await import("../lib/billing.server.js");
  const createCheck = await canCreateReview(shop);
  if (!createCheck.ok) {
    return { ok: false, error: createCheck.error };
  }

  try {
    let reviewData = {
      shop,
      productId,
      productName: String(fd.get("productName") ?? "").trim() || "Product",
      productImage: String(fd.get("productImage") ?? "").trim() || null,
      rating,
      title: String(fd.get("title") ?? "").trim() || null,
      comment,
      author,
      email: String(fd.get("email") ?? "").trim() || null,
      status: "PUBLISHED",
    };

    const { maybeAutoTranslateReviewData } = await import("../lib/review-translation.server.js");
    const { data: translatedData } = await maybeAutoTranslateReviewData(shop, reviewData);
    reviewData = translatedData;

    const created = await db.review.create({
      data: reviewData,
    });
    const { emitReviewCollectedFlowTrigger } = await import("../lib/flow-review-trigger.server.js");
    await emitReviewCollectedFlowTrigger(shop, created, { admin });
    return { ok: true };
  } catch (err) {
    console.error("[write-review]", err);
    return { ok: false, error: "Could not save the review. Try again." };
  }
};

export default function WriteReviewPage() {
  const submit = useSubmit();
  const nav = useNavigation();
  const actionData = useActionData();
  useLoaderData();
  const shopify = useAppBridge();

  const [product, setProduct] = useState(null);
  const [review, setReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    author: "",
    email: "",
  });

  useEffect(() => {
    if (actionData?.ok) {
      setReview({
        rating: 5,
        title: "",
        comment: "",
        author: "",
        email: "",
      });
      setProduct(null);
    }
  }, [actionData?.ok]);

  const openPicker = async () => {
    const res = await shopify.resourcePicker({ type: "product" });
    if (res?.[0]) {
      setProduct({
        id: res[0].id,
        title: res[0].title,
        image: res[0].images?.[0]?.originalSrc || "",
      });
    }
  };

  const submitReview = () => {
    if (!product) return;

    const fd = new FormData();
    Object.entries(review).forEach(([k, v]) => fd.append(k, v));
    fd.append("productId", product.id);
    fd.append("productName", product.title);
    fd.append("productImage", product.image);

    submit(fd, { method: "post" });
  };

  const busy = nav.state === "submitting";

  return (
    <Page narrow>
      <Card title="Write a review">
        {actionData?.ok ? (
          <div style={{ marginBottom: 16 }}>
            <Banner tone="success" icon={<CheckCircle2 size={18} />}>
              Review published.
            </Banner>
          </div>
        ) : null}
        {actionData?.error ? (
          <div style={{ marginBottom: 16 }}>
            <Banner tone="critical">{actionData.error}</Banner>
          </div>
        ) : null}

        <label style={styles.label}>Product</label>
        {product ? (
          <div style={styles.selectedProduct}>
            {product.image ? <img src={product.image} width={40} alt="" /> : null}
            <strong>{product.title}</strong>
            <button type="button" onClick={openPicker}>
              Change
            </button>
          </div>
        ) : (
          <button type="button" style={styles.buttonSecondary} onClick={openPicker}>
            <ShoppingBag size={16} /> Select product
          </button>
        )}

        <label style={styles.label}>Rating</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReview({ ...review, rating: i })}
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}
              aria-label={`${i} stars`}
            >
              <Star
                size={28}
                fill={i <= review.rating ? "#facc15" : "none"}
                color="#facc15"
              />
            </button>
          ))}
        </div>

        <input
          placeholder="Title (optional)"
          style={styles.input}
          value={review.title}
          onChange={(e) => setReview({ ...review, title: e.target.value })}
        />

        <textarea
          placeholder="Comment"
          style={{ ...styles.input, height: 100 }}
          value={review.comment}
          onChange={(e) => setReview({ ...review, comment: e.target.value })}
        />

        <input
          placeholder="Customer name"
          style={styles.input}
          value={review.author}
          onChange={(e) => setReview({ ...review, author: e.target.value })}
        />

        <input
          placeholder="Email (optional)"
          style={styles.input}
          value={review.email}
          onChange={(e) => setReview({ ...review, email: e.target.value })}
        />

        <button
          type="button"
          style={styles.buttonPrimary}
          disabled={busy || !product}
          onClick={submitReview}
        >
          {busy ? "Saving…" : "Submit review"}
        </button>
      </Card>
    </Page>
  );
}

const styles = {
  label: { fontWeight: 700, fontSize: 13, display: "block", marginBottom: 6 },
  input: {
    border: "1px solid #c9cccf",
    padding: "12px",
    borderRadius: 8,
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 13,
    marginBottom: 12,
  },
  buttonPrimary: {
    background: "#008060",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
  },
  buttonSecondary: {
    border: "1px solid #c9cccf",
    padding: "10px 14px",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  selectedProduct: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "#f6f6f7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
};
