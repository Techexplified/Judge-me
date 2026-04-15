import { useEffect, useState } from "react";

export default function ReviewWidget({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const shop = "demo-shop.myshopify.com";

  useEffect(() => {
    fetch(`http://localhost:5000/api/reviews?productId=${productId}&shop=${shop}`)
      .then(res => res.json())
      .then(setReviews);
  }, []);

  const submit = async () => {
    await fetch("http://localhost:5000/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        shop,
        rating,
        comment
      })
    });

    alert("Review submitted for approval!");
    setComment("");
  };

  return (
    <div style={{ borderTop: "2px solid black", paddingTop: 20 }}>
      <h3>Customer Reviews</h3>

      {reviews.map(r => (
        <div key={r.id}>
          {"⭐".repeat(r.rating)}
          <p>{r.comment}</p>
        </div>
      ))}

      <h4>Write a review</h4>

      <select onChange={e => setRating(+e.target.value)}>
        {[5,4,3,2,1].map(v => (
          <option key={v}>{v}</option>
        ))}
      </select>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      <button onClick={submit}>
        Submit Review
      </button>
    </div>
  );
}
