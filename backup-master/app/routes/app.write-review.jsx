//app.write-review.jsx
import { useState } from "react";
import { useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import db from "../db.server";
import { Star, ShoppingBag } from "lucide-react";

/* ---------------- ACTION ---------------- */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const fd = await request.formData();

  await db.review.create({
    data: {
      shop: session.shop,
      productId: fd.get("productId"),
      productName: fd.get("productName"),
      productImage: fd.get("productImage"),
      rating: Number(fd.get("rating")),
      title: fd.get("title"),
      comment: fd.get("comment"),
      author: fd.get("author"),
      email: fd.get("email"),
      status: "PUBLISHED",
    },
  });

  return null;
};

/* ---------------- PAGE ---------------- */
export default function WriteReviewPage() {
  const submit = useSubmit();
  const nav = useNavigation();
  const shopify = useAppBridge();

  const [product, setProduct] = useState(null);
  const [review, setReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    author: "",
    email: "",
  });

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
    if (!product) return alert("Select product");

    const fd = new FormData();
    Object.entries(review).forEach(([k, v]) => fd.append(k, v));
    fd.append("productId", product.id);
    fd.append("productName", product.title);
    fd.append("productImage", product.image);

    submit(fd, { method: "post" });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Write a Review</h2>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Product</label>
          {product ? (
            <div style={styles.selectedProduct}>
              <img src={product.image} width={40} />
              <strong>{product.title}</strong>
              <button onClick={openPicker}>Change</button>
            </div>
          ) : (
            <button style={styles.buttonSecondary} onClick={openPicker}>
              <ShoppingBag size={16}/> Select Product
            </button>
          )}

          <label style={styles.label}>Rating</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                size={28}
                fill={i <= review.rating ? "#facc15" : "none"}
                color="#facc15"
                onClick={() => setReview({ ...review, rating: i })}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>

          <input
            placeholder="Title"
            style={styles.input}
            value={review.title}
            onChange={e => setReview({ ...review, title: e.target.value })}
          />

          <textarea
            placeholder="Comment"
            style={{ ...styles.input, height: 100 }}
            value={review.comment}
            onChange={e => setReview({ ...review, comment: e.target.value })}
          />

          <input
            placeholder="Name"
            style={styles.input}
            value={review.author}
            onChange={e => setReview({ ...review, author: e.target.value })}
          />

          <input
            placeholder="Email"
            style={styles.input}
            value={review.email}
            onChange={e => setReview({ ...review, email: e.target.value })}
          />

          <button
            style={styles.buttonPrimary}
            disabled={nav.state === "submitting"}
            onClick={submitReview}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    padding: "24px",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
  },
  header: {
    padding: "24px",
    borderBottom: "1px solid #f3f4f6",
  },
  title: { fontSize: "22px", fontWeight: "700" },
  form: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  label: { fontWeight: "600" },
  input: {
    border: "1px solid #d1d5db",
    padding: "12px",
    borderRadius: "6px",
  },
  buttonPrimary: {
    background: "#0f172a",
    color: "#fff",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
  },
  buttonSecondary: {
    border: "1px solid #d1d5db",
    padding: "10px",
    borderRadius: "6px",
    background: "#fff",
  },
  selectedProduct: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "#f9fafb",
    padding: 10,
    borderRadius: 6,
  },
};
