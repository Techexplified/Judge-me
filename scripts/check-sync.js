import db from "../app/db.server.js";

async function checkReviews() {
  const reviews = await db.review.findMany({ orderBy: { createdAt: "desc" } });
  console.log("Total reviews in DB:", reviews.length);
  if (reviews.length > 0) {
    console.log("Latest review:", reviews[0]);
  }
}

checkReviews()
  .catch(console.error)
  .finally(() => process.exit(0));
