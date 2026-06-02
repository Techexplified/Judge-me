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
  if (rangeKey === "30") return 30;
  if (rangeKey === "90") return 90;
  if (rangeKey === "all") return null;
  return null;
}

export function rangeLabel(rangeKey) {
  if (rangeKey === "7") return "Last 7 days";
  if (rangeKey === "30") return "Last 30 days";
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
    let sentimentLabel = "Mixed";
    let iconTone = "indigo";
    if (avg >= 4) {
      sentimentLabel = "Positive";
      iconTone = "teal";
    } else if (avg < 3) {
      sentimentLabel = "Negative";
      iconTone = "orange";
    }
    const latest = list[0];
    const lastAt = new Date(latest.createdAt);
    
    // Determine the shop name (stripping .myshopify.com for cleaner UI)
    const originShop = latest.shop || shop;
    const originLabel = originShop.replace(".myshopify.com", "");

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
      originShop,
      originLabel,
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
      velocityLabel: computeVelocityLabel(reviewsAll, now),
    },
    products,
    urgentCandidates: pickUrgentCandidates(reviews),
    urgentNeedsCount: countUrgentNeeds(reviews),
    spotlightCandidate: pickSpotlight(reviews),
    digestFingerprint: fingerprintAiDigest(shop, reviews),
    playbookPrintFingerprint: playbookFingerprint(shop, rangeKey, reviews),
    rangeStart,
    miniCharts: buildMiniChartData(reviewsAll, now),
  };
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "it", "this", "that", "was", "were", "are", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may",
  "might", "must", "shall", "can", "need", "dare", "ought", "used", "i", "you", "he",
  "she", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "its",
  "our", "their", "mine", "yours", "hers", "ours", "theirs", "what", "which", "who",
  "whom", "whose", "where", "when", "why", "how", "all", "each", "every", "both",
  "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "don", "now", "get", "got", "one",
  "two", "product", "item", "buy", "bought", "order", "ordered", "review", "star",
]);

function dayKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function weekKey(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(dt);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return dayKey(monday);
}

function fillDailyBuckets(reviews, startDate, endDate) {
  const buckets = {};
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    buckets[dayKey(cur)] = { date: dayKey(cur), total: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
    cur.setDate(cur.getDate() + 1);
  }
  for (const r of reviews) {
    const k = dayKey(r.createdAt);
    if (!buckets[k]) continue;
    buckets[k].total += 1;
    const ratingKey = `r${r.rating}`;
    if (buckets[k][ratingKey] !== undefined) buckets[k][ratingKey] += 1;
  }
  return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
}

function fillWeeklyBuckets(reviews, startDate, endDate) {
  const buckets = {};
  for (const r of reviews) {
    const k = weekKey(r.createdAt);
    const d = new Date(r.createdAt);
    if (d < startDate || d > endDate) continue;
    if (!buckets[k]) buckets[k] = { week: k, total: 0, positive: 0, neutral: 0, negative: 0 };
    buckets[k].total += 1;
    if (r.rating >= 4) buckets[k].positive += 1;
    else if (r.rating <= 2) buckets[k].negative += 1;
    else buckets[k].neutral += 1;
  }
  return Object.values(buckets)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((b) => {
      const sum = b.total || 1;
      return {
        ...b,
        positivePct: Math.round((b.positive / sum) * 100),
        neutralPct: Math.round((b.neutral / sum) * 100),
        negativePct: Math.round((b.negative / sum) * 100),
      };
    });
}

function extractKeywords(reviews, limit = 10) {
  const freq = {};
  for (const r of reviews) {
    if (r.rating > 2) continue;
    const text = `${r.title || ""} ${r.comment || ""}`.toLowerCase();
    const words = text.match(/[a-z']{3,}/g) || [];
    for (const w of words) {
      if (STOP_WORDS.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function groupByProduct(reviews) {
  const grouped = {};
  for (const r of reviews) {
    const key = r.productId || r.productName || "Unknown";
    if (!grouped[key]) {
      grouped[key] = {
        productId: r.productId,
        productName: r.productName || "Unknown",
        list: [],
      };
    }
    grouped[key].list.push(r);
  }
  return Object.values(grouped);
}

/** Mini chart data for dashboard KPI cards (available to all users). */
export function buildMiniChartData(reviewsAll, now) {
  const fourteenAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recent = reviewsAll.filter((r) => new Date(r.createdAt) >= fourteenAgo);
  const daily = fillDailyBuckets(recent, fourteenAgo, now);
  const last7 = daily.slice(-7);
  const dailyVolume = last7.map((d) => d.total);
  const velocityWeekly = fillWeeklyBuckets(reviewsAll, new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000), now);
  return {
    dailyVolume: dailyVolume.length ? dailyVolume : [0],
    velocitySparkline: velocityWeekly.slice(-12).map((w) => w.total),
  };
}

/** Velocity label based on last-7 vs prior-7 review counts. */
export function computeVelocityLabel(reviewsAll, now) {
  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last7 = reviewsAll.filter((r) => new Date(r.createdAt) >= sevenAgo).length;
  const prev7 = reviewsAll.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= fourteenAgo && d < sevenAgo;
  }).length;
  if (last7 === 0 && prev7 === 0) return "Low";
  if (prev7 === 0) return last7 >= 3 ? "High" : "Medium";
  const ratio = last7 / prev7;
  if (ratio >= 1.25 || last7 >= 10) return "High";
  if (ratio >= 0.75) return "Medium";
  return "Low";
}

function velocityBadgeTone(label) {
  if (label === "High") return "green";
  if (label === "Medium") return undefined;
  return "red";
}

function periodComparison(reviewsAll, rangeStart, now) {
  const scoped = rangeStart
    ? reviewsAll.filter((r) => new Date(r.createdAt) >= rangeStart)
    : reviewsAll;
  let priorStart;
  let priorEnd;
  if (rangeStart) {
    const periodMs = now.getTime() - rangeStart.getTime();
    priorEnd = new Date(rangeStart.getTime());
    priorStart = new Date(rangeStart.getTime() - periodMs);
  } else {
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    priorStart = sixtyAgo;
    priorEnd = thirtyAgo;
  }
  const prior = reviewsAll.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= priorStart && d < priorEnd;
  });
  const currentCount = scoped.length;
  const priorCount = prior.length;
  const pct =
    priorCount === 0
      ? currentCount > 0
        ? 100
        : 0
      : Math.round(((currentCount - priorCount) / priorCount) * 100);
  return {
    currentCount,
    priorCount,
    changePct: pct,
    changeLabel: `${pct >= 0 ? "+" : ""}${pct}%`,
  };
}

function rollingRatingTrend(reviews, rangeStart, now) {
  const start = rangeStart || (reviews.length ? new Date(Math.min(...reviews.map((r) => new Date(r.createdAt).getTime()))) : now);
  const daily = fillDailyBuckets(reviews, start, now);
  const result = [];
  for (let i = 0; i < daily.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const windowDays = daily.slice(windowStart, i + 1);
    let totalRating = 0;
    let count = 0;
    for (const day of windowDays) {
      for (let star = 1; star <= 5; star++) {
        const c = day[`r${star}`] || 0;
        totalRating += star * c;
        count += c;
      }
    }
    result.push({
      date: daily[i].date,
      avg: count > 0 ? Math.round((totalRating / count) * 10) / 10 : null,
    });
  }
  return result.filter((r) => r.avg !== null);
}

/**
 * Full analytics payloads for premium drill-down modals and /app/analytics.
 * @param {{
 *   scopedReviews: Array<Record<string, unknown>>,
 *   reviewsAll: Array<Record<string, unknown>>,
 *   now: Date,
 *   rangeKey: string,
 *   rangeStart: Date | null,
 * }} opts
 */
export function computeAnalyticsDetail({ scopedReviews, reviewsAll, now, rangeKey, rangeStart }) {
  const reviews = scopedReviews;
  const effectiveStart =
    rangeStart ||
    (reviews.length
      ? new Date(Math.min(...reviews.map((r) => new Date(r.createdAt).getTime())))
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

  const dailyVolume = fillDailyBuckets(reviews, effectiveStart, now);
  const comparison = periodComparison(reviewsAll, rangeStart, now);

  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const productGroups = groupByProduct(reviews)
    .map((g) => ({
      productId: g.productId,
      productName: g.productName,
      reviewCount: g.list.length,
      avgRating:
        g.list.length > 0
          ? Math.round((g.list.reduce((a, r) => a + r.rating, 0) / g.list.length) * 10) / 10
          : 0,
    }))
    .filter((p) => p.reviewCount >= 1);

  const topMovers = [...productGroups]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  const minTwo = productGroups.filter((p) => p.reviewCount >= 2);
  const topRated = [...minTwo].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  const bottomRated = [...minTwo].sort((a, b) => a.avgRating - b.avgRating).slice(0, 5);

  const weeklyVelocity = fillWeeklyBuckets(reviews, effectiveStart, now);
  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last7Count = reviewsAll.filter((r) => new Date(r.createdAt) >= sevenAgo).length;
  const prev7Count = reviewsAll.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= fourteenAgo && d < sevenAgo;
  }).length;
  const wowPct =
    prev7Count === 0
      ? last7Count > 0
        ? 100
        : 0
      : Math.round(((last7Count - prev7Count) / prev7Count) * 100);

  const productVelocity = groupByProduct(
    reviewsAll.filter((r) => new Date(r.createdAt) >= sevenAgo),
  )
    .map((g) => ({
      productId: g.productId,
      productName: g.productName,
      reviewCount: g.list.length,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);

  const sentimentWeekly = fillWeeklyBuckets(reviews, effectiveStart, now);
  const negativeReviews = reviews.filter((r) => r.rating <= 2);
  const keywords = extractKeywords(negativeReviews);

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const neutral = reviews.length - positive - negative;
  const total = reviews.length || 1;

  const volumeInsights = [];
  if (comparison.changePct !== 0) {
    volumeInsights.push(
      `Reviews ${comparison.changeLabel} vs the prior ${rangeKey === "all" ? "30-day" : "period"}.`,
    );
  }
  if (topMovers.length >= 2) {
    const topShare = Math.round(
      ((topMovers[0].reviewCount + topMovers[1].reviewCount) / reviews.length) * 100,
    );
    if (topShare > 0) volumeInsights.push(`Top 2 products account for ${topShare}% of reviews.`);
  }

  const ratingInsights = [];
  const avgNow =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;
  if (ratingCounts[0].count + ratingCounts[1].count > 0) {
    const lowPct = Math.round(((ratingCounts[0].count + ratingCounts[1].count) / total) * 100);
    ratingInsights.push(`${lowPct}% of reviews are 1–2 stars.`);
  }
  if (bottomRated.length > 0) {
    ratingInsights.push(`Lowest rated: ${bottomRated[0].productName} (${bottomRated[0].avgRating}★).`);
  }

  const velocityLabel = computeVelocityLabel(reviewsAll, now);
  const velocityInsights = [
    `${last7Count} reviews in the last 7 days (${wowPct >= 0 ? "+" : ""}${wowPct}% vs prior week).`,
    `Velocity is ${velocityLabel.toLowerCase()} for your store.`,
  ];

  const sentimentInsights = [];
  if (negative > 0) {
    sentimentInsights.push(`${Math.round((negative / total) * 100)}% negative — ${negative} review${negative === 1 ? "" : "s"}.`);
  }
  if (keywords.length > 0) {
    sentimentInsights.push(`Top complaint theme: "${keywords[0].word}".`);
  }

  return {
    rangeKey,
    volume: {
      daily: dailyVolume,
      comparison,
      topMovers,
      insights: volumeInsights,
    },
    rating: {
      distribution: ratingCounts,
      trend: rollingRatingTrend(reviews, rangeStart, now),
      topRated,
      bottomRated,
      avgRating: avgNow > 0 ? avgNow.toFixed(1) : "0.0",
      insights: ratingInsights,
    },
    velocity: {
      weekly: weeklyVelocity,
      last7Count,
      prev7Count,
      wowPct,
      wowLabel: `${wowPct >= 0 ? "+" : ""}${wowPct}%`,
      label: velocityLabel,
      badgeTone: velocityBadgeTone(velocityLabel),
      productVelocity,
      insights: velocityInsights,
    },
    sentiment: {
      positivePct: Math.round((positive / total) * 100),
      neutralPct: Math.round((neutral / total) * 100),
      negativePct: Math.round((negative / total) * 100),
      weekly: sentimentWeekly,
      keywords,
      insights: sentimentInsights,
    },
  };
}
