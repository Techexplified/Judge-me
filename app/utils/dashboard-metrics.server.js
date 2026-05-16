import { createHash } from "node:crypto";

const RANGE_KEYS = new Set(["7", "30", "90", "all"]);

/** @param {URLSearchParams | string} searchParams */
export function parseDashboardRange(searchParams) {
  const sp =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams.replace(/^\?/, ""))
      : searchParams;
  const r = sp.get("range");
  if (RANGE_KEYS.has(r)) return r;
  return "all";
}

/** @returns {number | null} days, or null for all-time */
export function rangeDaysForKey(rangeKey) {
  if (rangeKey === "7") return 7;
  if (rangeKey === "90") return 90;
  if (rangeKey === "all") return null;
  return null;
}

export function rangeLabel(rangeKey) {
  if (rangeKey === "7") return "Last 7 days";
  if (rangeKey === "90") return "Last 90 days";
  if (rangeKey === "all") return "All time";
  return "All time";
}

/** @param {Date | null} rangeStart */
export function filterReviewsByRangeStart(reviews, rangeStart) {
  if (!rangeStart) return reviews;
  return reviews.filter((r) => new Date(r.createdAt) >= rangeStart);
}

export function rangeStartFromKey(now, rangeKey) {
  const days = rangeDaysForKey(rangeKey);
  if (days == null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function clipText(text, max) {
  const s = text ? String(text).trim() : "";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function fingerprintAiDigest(shop, reviews) {
  const sig = reviews
    .map((r) => `${r.id}:${r.rating}:${r.reply ? String(r.reply).length : 0}`)
    .sort()
    .join("|");
  return createHash("sha256").update(`${shop}\0${sig}`).digest("hex");
}

export function playbookFingerprint(shop, rangeKey, reviews) {
  const sig = reviews.map((r) => r.id).sort().join("|");
  return createHash("sha256").update(`${shop}\0${rangeKey}\0${sig}`).digest("hex");
}

function needsReply(review) {
  return !review.reply || String(review.reply).trim() === "";
}

export function pickUrgentCandidates(reviews) {
  return reviews
    .filter((r) => (r.rating <= 3 && needsReply(r)) || r.rating <= 2)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      excerpt: clipText(r.comment, 110),
      authorInitial: (r.author && r.author[0] ? r.author[0] : "?").toUpperCase(),
      rating: r.rating,
    }));
}

export function countUrgentNeeds(reviews) {
  return reviews.filter((r) => (r.rating <= 3 && needsReply(r)) || r.rating <= 2).length;
}

export function pickSpotlight(reviews) {
  const good = reviews.filter((r) => r.rating >= 4 && r.comment && r.comment.trim().length > 15);
  if (!good.length) return null;
  const sorted = [...good].sort((a, b) => b.comment.length - a.comment.length);
  const r = sorted[0];
  return {
    quote: r.comment.trim(),
    author: r.author || "Customer",
    rating: r.rating,
    verified: true,
  };
}

/**
 * @param {{
 *   shop: string,
 *   scopedReviews: Array<Record<string, unknown>>,
 *   reviewsAll: Array<Record<string, unknown>>,
 *   now: Date,
 *   rangeKey: string,
 * }} opts
 */
export function computeDashboardMetrics({ shop, scopedReviews, reviewsAll, now, rangeKey }) {
  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rangeStart = rangeStartFromKey(now, rangeKey);

  const reviews = scopedReviews;
  const totalReviews = reviews.length;

  let lastPeriod;
  let prevPeriod;
  if (rangeKey === "all") {
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    lastPeriod = reviewsAll.filter((r) => new Date(r.createdAt) >= thirtyAgo);
    prevPeriod = reviewsAll.filter((r) => {
      const d = new Date(r.createdAt);
      return d >= sixtyAgo && d < thirtyAgo;
    });
  } else {
    const days = rangeDaysForKey(rangeKey);
    const periodMs = days * 24 * 60 * 60 * 1000;
    const boundary = new Date(now.getTime() - periodMs);
    const boundary2 = new Date(now.getTime() - 2 * periodMs);
    lastPeriod = reviewsAll.filter((r) => new Date(r.createdAt) >= boundary);
    prevPeriod = reviewsAll.filter((r) => {
      const d = new Date(r.createdAt);
      return d >= boundary2 && d < boundary;
    });
  }

  const totalLast = lastPeriod.length;
  const totalPrev = prevPeriod.length;
  const totalTrendPct =
    totalPrev === 0 ? (totalLast > 0 ? 100 : 0) : Math.round(((totalLast - totalPrev) / totalPrev) * 100);
  const totalTrend = `${totalTrendPct >= 0 ? "+" : ""}${totalTrendPct}%`;

  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const avgLast =
    totalLast > 0 ? lastPeriod.reduce((a, r) => a + r.rating, 0) / totalLast : 0;
  const avgPrev =
    totalPrev > 0 ? prevPeriod.reduce((a, r) => a + r.rating, 0) / totalPrev : 0;
  const avgDeltaVal = totalPrev === 0 ? 0 : Math.round((avgLast - avgPrev) * 10) / 10;
  const avgDelta = `${avgDeltaVal >= 0 ? "+" : ""}${avgDeltaVal}`;

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const neutral = reviews.length - positive - negative;
  const sentiment = {
    positivePct: totalReviews ? String(Math.round((positive / totalReviews) * 100)) : "0",
    neutralPct: totalReviews ? String(Math.round((neutral / totalReviews) * 100)) : "0",
    negativePct: totalReviews ? String(Math.round((negative / totalReviews) * 100)) : "0",
  };

  const velocityCutoff =
    rangeStart && sevenAgo.getTime() < rangeStart.getTime() ? rangeStart : sevenAgo;
  const last7Scoped = reviewsAll.filter((r) => new Date(r.createdAt) >= velocityCutoff);
  const velocityPerWeek = String(last7Scoped.length);

  const grouped = {};
  for (const review of reviews) {
    const key = review.productName || review.productId || "Unknown";
    if (!grouped[key]) {
      grouped[key] = { productName: key, productId: review.productId, productImage: review.productImage, list: [] };
    }
    grouped[key].list.push(review);
  }

  const products = Object.values(grouped).map((g) => {
    const list = [...g.list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const avg = list.reduce((a, r) => a + r.rating, 0) / list.length;
    const pos = list.filter((r) => r.rating >= 4).length;
    const neg = list.filter((r) => r.rating <= 2).length;
    let sentimentLabel = "Mixed";
    let iconTone = "indigo";
    if (pos / list.length >= 0.5) {
      sentimentLabel = "Positive";
      iconTone = "teal";
    } else if (neg / list.length >= 0.5) {
      sentimentLabel = "Negative";
      iconTone = "orange";
    }
    const latest = list[0];
    const lastAt = new Date(latest.createdAt);
    return {
      id: `${g.productId}-${g.productName}`,
      productName: g.productName,
      productId: g.productId ?? null,
      productImage: g.productImage ?? null,
      sku: "—",
      avgRating: avg.toFixed(1),
      reviewCount: list.length,
      sentiment: sentimentLabel,
      lastReview: lastAt.toLocaleDateString(),
      lastReviewAt: lastAt.toISOString(),
      iconTone,
    };
  });

  return {
    kpis: {
      totalReviews: String(totalReviews),
      totalTrend,
      avgRating,
      avgDelta,
      sentiment,
      velocityPerWeek,
    },
    products,
    urgentCandidates: pickUrgentCandidates(reviews),
    urgentNeedsCount: countUrgentNeeds(reviews),
    spotlightCandidate: pickSpotlight(reviews),
    digestFingerprint: fingerprintAiDigest(shop, reviews),
    playbookPrintFingerprint: playbookFingerprint(shop, rangeKey, reviews),
    rangeStart,
  };
}
