export const runtime = "nodejs";

import { authenticate, unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { syncReviewsForProduct } from "../lib/review-sync.server";

/** Webhook HMAC can succeed without an inline session; resolve admin for optional GraphQL work. */
async function resolveAdminForShop(shop, webhookAdmin) {
  if (webhookAdmin) return webhookAdmin;
  try {
    return (await unauthenticated.admin(shop)).admin;
  } catch (err) {
    console.warn(`[ProductIndex] No admin session for ${shop}, skipping review sync:`, err);
    return null;
  }
}

export const action = async ({ request }) => {
  try {
    const { topic, shop: shopRaw, admin: webhookAdmin, payload } =
      await authenticate.webhook(request);
    const shop = normalizeShopDomain(shopRaw);

    try {
      if (topic === "PRODUCTS_DELETE") {
        await prisma.productIndex.deleteMany({
          where: { shop, productId: payload.id.toString() },
        });
        console.log(`[ProductIndex] Deleted ${payload.id} from ${shop}`);
      } else if (topic === "PRODUCTS_CREATE" || topic === "PRODUCTS_UPDATE") {
        const variants = payload.variants || [];
        const primarySku =
          variants.find((v) => v.sku && v.sku.trim() !== "")?.sku || null;

        await prisma.productIndex.upsert({
          where: {
            shop_productId: {
              shop,
              productId: payload.id.toString(),
            },
          },
          create: {
            shop,
            productId: payload.id.toString(),
            handle: payload.handle,
            sku: primarySku,
            title: payload.title,
          },
          update: {
            handle: payload.handle,
            sku: primarySku,
            title: payload.title,
          },
        });
        console.log(`[ProductIndex] Upserted ${payload.id} (${primarySku}) from ${shop}`);

        const admin = await resolveAdminForShop(shop, webhookAdmin);
        if (admin) {
          syncReviewsForProduct(admin, shop, payload.id.toString()).catch((err) =>
            console.error(`[review-sync] webhook product ${payload.id} for ${shop}:`, err),
          );
        }
      }

      return new Response("Success", { status: 200 });
    } catch (error) {
      console.error(`[ProductIndex] Error processing ${topic} for ${shop}:`, error);
      // Acknowledge receipt so Shopify does not retry a flood of product webhooks.
      return new Response("Processed with errors", { status: 200 });
    }
  } catch (err) {
    console.error("Webhook auth/HMAC failed (products)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
