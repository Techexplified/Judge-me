import { authenticate } from "../shopify.server";
import { markShopUninstalled } from "../lib/trial.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";

export const action = async ({ request }) => {
  try {
    const { shop: shopRaw, topic } = await authenticate.webhook(request);
    const shop = normalizeShopDomain(shopRaw);

    console.log(`Received ${topic} webhook for ${shop}`);

    await db.groupStoreLink.deleteMany({ where: { shop } });
    await db.productIndex.deleteMany({ where: { shop } });

    // Mark the shop as uninstalled so we preserve trial data
    // but know the app is no longer active.
    await markShopUninstalled(shop);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app uninstalled)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
