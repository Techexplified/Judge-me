(async () => {
  const root = document.getElementById("app-reviews-root");
  if (!root) return;

  /* ---------------- SETTINGS FROM ADMIN ---------------- */
  const productId = root.dataset.productId;
  const productName = root.dataset.productName;
  const shop = root.dataset.shop;

  const title = root.dataset.title || "Customer Reviews";
  const buttonText = root.dataset.buttonText || "Submit Review";
  const accentColor = root.dataset.accentColor || "#facc15";
  const buttonColor = root.dataset.buttonColor || "#111827";
  const showAuthor = root.dataset.showAuthor === "true";

  const API = "https://judgme.onrender.com";

  /* ---------------- LOAD REVIEWS ---------------- */
  const res = await fetch(
    `${API}/api/public/reviews?productId=${productId}&shop=${shop}`
  );
  const reviews = await res.json();

  /* ---------------- RENDER ---------------- */
  root.innerHTML = `
    <div style="max-width:600px;margin-top:32px;font-family:Arial,sans-serif">
      <h3 style="font-size:22px;margin-bottom:4px">${title}</h3>
      <p style="color:#6b7280;font-size:14px">Reviews for <strong>${productName}</strong></p>

      ${
        reviews.length === 0
          ? `<p style="color:#6b7280;margin-top:12px">No reviews yet</p>`
          : reviews
              .map(
                r => `
                <div style="border-bottom:1px solid #e5e7eb;padding:12px 0">
                  <strong>${r.author}</strong>
                  <div style="color:${accentColor};font-size:14px">
                    ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
                  </div>
                  <p style="margin-top:4px">${r.comment}</p>
                </div>
              `
              )
              .join("")
      }

      <div style="margin-top:24px;padding-top:16px;border-top:2px solid #e5e7eb">
        <h4 style="font-size:18px;margin-bottom:12px">Write a review</h4>

        <div id="stars" style="font-size:26px;color:${accentColor};cursor:pointer">
          ${[1,2,3,4,5].map(i => `<span data-v="${i}">★</span>`).join("")}
        </div>

        ${
          showAuthor
            ? `<input id="author" placeholder="Your name"
                 style="width:100%;margin-top:12px;padding:10px;border:1px solid #d1d5db;border-radius:6px" />`
            : ""
        }

        <textarea
          id="comment"
          placeholder="Write your review..."
          style="width:100%;margin-top:12px;padding:10px;height:90px;border:1px solid #d1d5db;border-radius:6px"
        ></textarea>

        <button
          id="submitReview"
          style="margin-top:12px;background:${buttonColor};color:white;padding:10px 16px;border:none;border-radius:6px;cursor:pointer"
        >
          ${buttonText}
        </button>

        <p id="msg" style="margin-top:8px;color:#16a34a"></p>
      </div>
    </div>
  `;

  /* ---------------- STAR LOGIC ---------------- */
  let rating = 5;
  const stars = root.querySelectorAll("#stars span");

  stars.forEach(star => {
    star.onclick = () => {
      rating = Number(star.dataset.v);
      stars.forEach(s => {
        s.style.opacity = s.dataset.v <= rating ? "1" : "0.3";
      });
    };
  });

  /* ---------------- SUBMIT ---------------- */
  document.getElementById("submitReview").onclick = async () => {
    const authorInput = document.getElementById("author");
    const comment = document.getElementById("comment").value;
    const author = authorInput ? authorInput.value : "Anonymous";

    if (!comment) {
      alert("Please write a review");
      return;
    }

    const resp = await fetch(`${API}/api/public/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        productId,
        productName,
        rating,
        author,
        comment
      }),
    });

    if (resp.ok) {
      document.getElementById("msg").innerText =
        "Thanks for your review!";
      document.getElementById("comment").value = "";
    } else {
      alert("Failed to submit review");
    }
  };
})();