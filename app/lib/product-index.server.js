/**
 * Builds and maintains ProductIndex rows for SKU/handle-based cross-store syndication.
 */

import db from "../db.server.js";
import { normalizeShopifyProductId } from "../utils/product-id.server.js";

const PRODUCTS_INDEX_QUERY = `
  query ProductIndexSync($cursor: String) {
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
          variants(first: 100) {
            edges {
              node {
                sku
              }
            }
          }
        }
      }
    }
  }
`;

function primarySkuFromVariants(variants) {
  const edges = variants?.edges ?? [];
  for (const { node } of edges) {
    const sku = node?.sku?.trim();
    if (sku) return sku;
  }
  return null;
}

/**
 * @param {object} admin - Shopify admin GraphQL client
 * @param {string} shop - Normalized shop domain
 */
export async function syncProductIndex(admin, shop) {
  let cursor = null;
  let hasNextPage = true;
  let upserted = 0;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCTS_INDEX_QUERY, {
      variables: { cursor },
    });
    const data = await response.json();
    const productsData = data?.data?.products;
    if (!productsData) break;

    hasNextPage = productsData.pageInfo.hasNextPage;
    cursor = productsData.pageInfo.endCursor;

    for (const edge of productsData.edges) {
      const node = edge.node;
      const productId = normalizeShopifyProductId(node.id) || node.id.split("/").pop();
      const sku = primarySkuFromVariants(node.variants);

      await db.productIndex.upsert({
        where: {
          shop_productId: { shop, productId },
        },
        create: {
          shop,
          productId,
          handle: node.handle,
          sku,
          title: node.title,
        },
        update: {
          handle: node.handle,
          sku,
          title: node.title,
        },
      });
      upserted += 1;
    }
  }

  console.log(`[product-index] shop=${shop} upserted=${upserted}`);
  return { upserted };
}

export async function hasRunProductIndexSync(shop, preloadedConfig) {
  if (preloadedConfig !== undefined) {
    return Boolean(preloadedConfig?.productIndexSyncDone);
  }
  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) return false;
  try {
    const config = JSON.parse(row.config);
    return Boolean(config.productIndexSyncDone);
  } catch {
    return false;
  }
}

export async function markProductIndexSyncDone(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = {};
    }
  }
  config.productIndexSyncDone = true;
  config.productIndexSyncAt = new Date().toISOString();

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(config) },
    create: { shop, config: JSON.stringify(config) },
  });
}
