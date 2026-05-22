import db from "../db.server.js";

/**
 * Fingerprint for duplicate detection: author + first 60 chars of comment.
 */
export function reviewFingerprint(author, comment) {
  const a = String(author ?? "").trim().toLowerCase();
  const c = String(comment ?? "").trim().slice(0, 60).toLowerCase();
  return `${a}::${c}`;
}

/**
 * Load existing review fingerprints for a shop (all products).
 * @returns {Set<string>} keys of form "shop::productId::fingerprint"
 */
export async function getExistingFingerprints(shop) {
  const existing = await db.review.findMany({
    where: { shop },
    select: { productId: true, author: true, comment: true },
  });

  return new Set(
    existing.map(
      (r) => `${shop}::${r.productId}::${reviewFingerprint(r.author, r.comment)}`,
    ),
  );
}

/**
 * Insert review candidates, skipping duplicates within the same shop+productId.
 * @param {string} shop
 * @param {string} productId
 * @param {Array<object>} candidates - Prisma Review create objects
 * @returns {{ imported: number, skipped: number }}
 */
export async function insertReviewCandidates(shop, productId, candidates) {
  if (candidates.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  const existing = await db.review.findMany({
    where: { shop, productId },
    select: { author: true, comment: true },
  });

  const existingSet = new Set(
    existing.map((r) => reviewFingerprint(r.author, r.comment)),
  );

  const toInsert = candidates.filter((r) => {
    const key = reviewFingerprint(r.author, r.comment);
    return !existingSet.has(key);
  });

  if (toInsert.length > 0) {
    await db.review.createMany({ data: toInsert });
  }

  return {
    imported: toInsert.length,
    skipped: candidates.length - toInsert.length,
  };
}

/**
 * Batch insert reviews across multiple products with dedup.
 * @param {string} shop
 * @param {Array<object>} records - Prisma Review create objects (must include productId)
 * @param {Set<string>} [existingFingerprints] - optional pre-loaded fingerprint set
 * @returns {{ imported: number, skipped: number }}
 */
export async function batchInsertReviews(shop, records, existingFingerprints) {
  if (records.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  const fpSet =
    existingFingerprints ?? (await getExistingFingerprints(shop));

  const toInsert = [];
  let skipped = 0;

  for (const r of records) {
    const fpKey = `${shop}::${r.productId}::${reviewFingerprint(r.author, r.comment)}`;
    if (fpSet.has(fpKey)) {
      skipped += 1;
      continue;
    }
    fpSet.add(fpKey);
    toInsert.push(r);
  }

  const CHUNK = 250;
  let imported = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    await db.review.createMany({ data: chunk });
    imported += chunk.length;
  }

  return { imported, skipped };
}
