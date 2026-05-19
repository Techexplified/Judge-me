/**
 * review-sync.server.js
 *
 * Automatically imports existing reviews from a store when the app is installed.
 * Supports reviews stored by:
 *   - Shopify Product Reviews app  (namespace: "spr",  key: "reviews")
 *   - Judge.me                     (namespace: "judgeme", key: "widget")
 *   - Loox                         (namespace: "loox",  key: "reviews")
 *   - Generic / custom apps        (namespace: "reviews", key: "data")
 */

import db from "../db.server.js";

// ─── GraphQL ────────────────────────────────────────────────────────────────

const PRODUCT_BY_ID_QUERY = `
  query GetProductReviewsMetafields($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      images(first: 1) {
        edges {
          node {
            url
          }
        }
      }
      spr: metafield(namespace: "spr", key: "reviews") {
        value
      }
      judgeme: metafield(namespace: "judgeme", key: "widget") {
        value
      }
      loox: metafield(namespace: "loox", key: "reviews") {
        value
      }
      generic: metafield(namespace: "reviews", key: "data") {
        value
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query GetProductsWithMetafields($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          spr: metafield(namespace: "spr", key: "reviews") {
            value
          }
          judgeme: metafield(namespace: "judgeme", key: "widget") {
            value
          }
          loox: metafield(namespace: "loox", key: "reviews") {
            value
          }
          generic: metafield(namespace: "reviews", key: "data") {
            value
          }
        }
      }
    }
  }
`;

// ─── Parsers ─────────────────────────────────────────────────────────────────

/**
 * Shopify Product Reviews app stores reviews as JSON like:
 * { reviews: [ { id, rating, title, body, author, email, created_at, ... } ] }
 */
function parseSprMetafield(raw, productId, productName, productImage, shop) {
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : (parsed.reviews ?? []);
    return items.map((r) => ({
      shop,
      productId,
      productName,
      productImage,
      rating: Number(r.rating) || 5,
      title: String(r.title ?? "").trim() || null,
      comment: String(r.body ?? r.content ?? r.comment ?? "").trim(),
      author: String(r.author ?? r.reviewer?.name ?? "Customer").trim(),
      email: r.email ?? r.reviewer?.email ?? null,
      status: "PUBLISHED",
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    })).filter((r) => r.comment.length > 0);
  } catch {
    return [];
  }
}

/**
 * Judge.me stores a pre-rendered HTML widget as a metafield value.
 * We extract individual reviews by parsing the embedded JSON-LD or data attributes.
 */
function parseJudgemeMetafield(raw, productId, productName, productImage, shop) {
  try {
    // Judge.me may also store JSON directly in some versions
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : (parsed.reviews ?? []);
    return items.map((r) => ({
      shop,
      productId,
      productName,
      productImage,
      rating: Number(r.rating) || 5,
      title: String(r.title ?? "").trim() || null,
      comment: String(r.body ?? r.review_content ?? "").trim(),
      author: String(r.reviewer?.name ?? r.author ?? "Customer").trim(),
      email: r.reviewer?.email ?? null,
      status: "PUBLISHED",
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    })).filter((r) => r.comment.length > 0);
  } catch {
    // Fallback: Judge.me HTML widget — skip (can't safely extract without a full parser)
    return [];
  }
}

/**
 * Loox stores reviews as a JSON array.
 */
function parseLooxMetafield(raw, productId, productName, productImage, shop) {
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((r) => ({
      shop,
      productId,
      productName,
      productImage,
      rating: Number(r.rating ?? r.score) || 5,
      title: String(r.title ?? "").trim() || null,
      comment: String(r.body ?? r.comment ?? "").trim(),
      author: String(r.reviewer_name ?? r.author ?? "Customer").trim(),
      email: r.email ?? null,
      status: "PUBLISHED",
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    })).filter((r) => r.comment.length > 0);
  } catch {
    return [];
  }
}

function collectCandidatesFromProductNode(node, shop) {
  const gid = node.id;
  const productId = gid.split("/").pop();
  const productName = node.title;
  const productImage = node.images?.edges?.[0]?.node?.url ?? null;

  const candidates = [
    ...(node.spr?.value
      ? parseSprMetafield(node.spr.value, productId, productName, productImage, shop)
      : []),
    ...(node.judgeme?.value
      ? parseJudgemeMetafield(node.judgeme.value, productId, productName, productImage, shop)
      : []),
    ...(node.loox?.value
      ? parseLooxMetafield(node.loox.value, productId, productName, productImage, shop)
      : []),
    ...(node.generic?.value
      ? parseSprMetafield(node.generic.value, productId, productName, productImage, shop)
      : []),
  ];

  return { productId, candidates };
}

/**
 * @returns {{ imported: number, skipped: number }}
 */
async function insertReviewCandidates(shop, productId, candidates) {
  if (candidates.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  const existing = await db.review.findMany({
    where: { shop, productId },
    select: { author: true, comment: true },
  });

  const existingSet = new Set(
    existing.map((r) => `${r.author.toLowerCase()}::${r.comment.slice(0, 60).toLowerCase()}`),
  );

  const toInsert = candidates.filter((r) => {
    const key = `${r.author.toLowerCase()}::${r.comment.slice(0, 60).toLowerCase()}`;
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
 * Import review metafields for one product (e.g. after products/create or products/update).
 * @param {object} admin
 * @param {string} shop
 * @param {string} productIdNumeric - Shopify numeric product id
 */
export async function syncReviewsForProduct(admin, shop, productIdNumeric) {
  const id = String(productIdNumeric).trim();
  if (!id) return { imported: 0, skipped: 0 };

  const response = await admin.graphql(PRODUCT_BY_ID_QUERY, {
    variables: { id: `gid://shopify/Product/${id}` },
  });
  const data = await response.json();
  const node = data?.data?.product;
  if (!node) return { imported: 0, skipped: 0 };

  const { productId, candidates } = collectCandidatesFromProductNode(node, shop);
  const result = await insertReviewCandidates(shop, productId, candidates);
  if (result.imported > 0) {
    console.log(
      `[review-sync] product=${productId} shop=${shop} imported=${result.imported} skipped=${result.skipped}`,
    );
  }
  return result;
}

// ─── Main sync function ───────────────────────────────────────────────────────

/**
 * Pulls existing reviews from ALL products in the store and inserts them
 * into the Prisma database. Skips reviews that already exist (idempotent).
 *
 * @param {object} admin  - Shopify admin GraphQL client (from authenticate.admin)
 * @param {string} shop   - Normalised shop domain
 * @returns {{ imported: number, skipped: number, products: number }}
 */
export async function syncExistingReviews(admin, shop) {
  let imported = 0;
  let skipped = 0;
  let totalProducts = 0;
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCTS_QUERY, {
      variables: { cursor },
    });

    const data = await response.json();
    const productsData = data?.data?.products;

    if (!productsData) break;

    hasNextPage = productsData.pageInfo.hasNextPage;
    cursor = productsData.pageInfo.endCursor;

    for (const edge of productsData.edges) {
      const node = edge.node;
      totalProducts++;

      const { productId, candidates } = collectCandidatesFromProductNode(node, shop);
      if (candidates.length === 0) continue;

      const result = await insertReviewCandidates(shop, productId, candidates);
      imported += result.imported;
      skipped += result.skipped;
    }
  }

  console.log(
    `[review-sync] shop=${shop} products=${totalProducts} imported=${imported} skipped=${skipped}`
  );

  return { imported, skipped, products: totalProducts };
}

/**
 * Checks if a sync has already been run for this shop.
 * We store a flag in the Settings config to avoid re-syncing on every page load.
 */
export async function hasRunInitialSync(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) return false;
  try {
    const config = JSON.parse(row.config);
    return Boolean(config.initialSyncDone);
  } catch {
    return false;
  }
}

/**
 * Marks the initial sync as completed so it never runs again for this shop.
 */
export async function markInitialSyncDone(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try { config = JSON.parse(row.config); } catch { config = {}; }
  }
  config.initialSyncDone = true;
  config.initialSyncAt = new Date().toISOString();

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(config) },
    create: { shop, config: JSON.stringify(config) },
  });
}
