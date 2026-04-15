/* eslint-disable react/prop-types -- small preview widget */
import { useEffect, useState } from "react";

/** Dev/admin preview: uses same-origin public API as the storefront widget. */
export default function ReviewWidget({ productId = "" }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const shop = "demo-shop.myshopify.com";

  useEffect(() => {
    fetch(
      `/api/public/reviews?productId=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}`,
    )
      .then((res) => res.json())
      .then(setReviews);
  }, [productId]);

  const submit = async () => {
    await fetch("/api/public/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        shop,
        rating,
        comment,
      }),
    });

    alert("Review submitted for approval!");
    setComment("");
  };

  return (
    <div style={{ borderTop: "2px solid black", paddingTop: 20 }}>
      <h3>Customer Reviews</h3>

      {reviews.map((r) => (
        <div key={r.id}>
          {"⭐".repeat(r.rating)}
          <p>{r.comment}</p>
        </div>
      ))}

      <h4>Write a review</h4>

      <select onChange={(e) => setRating(+e.target.value)}>
        {[5, 4, 3, 2, 1].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} />

      <button type="button" onClick={submit}>
        Submit Review
      </button>
    </div>
  );
}
