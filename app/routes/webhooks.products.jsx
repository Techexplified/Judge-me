import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";

export const action = async ({ request }) => {
  const { topic, shop: shopRaw, admin, payload } = await authenticate.webhook(request);
  const shop = normalizeShopDomain(shopRaw);

  if (!admin) {
    // The webhook request is not valid
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    if (topic === "PRODUCTS_DELETE") {
      // Clean up the index when a product is removed from Shopify
      await prisma.productIndex.deleteMany({
        where: { shop, productId: payload.id.toString() }
      });
      console.log(`[ProductIndex] Deleted ${payload.id} from ${shop}`);
    } 
    else if (topic === "PRODUCTS_CREATE" || topic === "PRODUCTS_UPDATE") {
      // Extract the primary SKU from the first variant that has one
      const variants = payload.variants || [];
      const primarySku = variants.find(v => v.sku && v.sku.trim() !== "")?.sku || null;

      await prisma.productIndex.upsert({
        where: {
          shop_productId: {
            shop,
            productId: payload.id.toString()
          }
        },
        create: {
          shop,
          productId: payload.id.toString(),
          handle: payload.handle,
          sku: primarySku,
          title: payload.title
        },
        update: {
          handle: payload.handle,
          sku: primarySku,
          title: payload.title
        }
      });
      console.log(`[ProductIndex] Upserted ${payload.id} (${primarySku}) from ${shop}`);
    }

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error(`[ProductIndex] Error processing ${topic} for ${shop}:`, error);
    // Returning 200 to acknowledge receipt and prevent Shopify from retrying excessively 
    // if the failure was non-recoverable, though ideally we might return 500 for temporary DB issues.
    return new Response("Processed with errors", { status: 200 });
  }
};
