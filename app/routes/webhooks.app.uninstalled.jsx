export const runtime = "nodejs";

import { authenticate } from "../shopify.server";
import { markShopUninstalled } from "../lib/billing.server.js";
import { resetOnboardingState } from "../lib/onboarding.server.js";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";

export const action = async ({ request }) => {
  try {
    const { shop: shopRaw, session, topic } = await authenticate.webhook(request);
    const shop = normalizeShopDomain(shopRaw);

    console.log(`Received ${topic} webhook for ${shop}`);

    await db.groupStoreLink.deleteMany({ where: { shop } });
    await db.productIndex.deleteMany({ where: { shop } });
    await resetOnboardingState(shop);

    if (session) {
      await db.session.deleteMany({ where: { shop } });
    }

    // Mark the shop as uninstalled so we preserve trial data
    // but know the app is no longer active.
    await markShopUninstalled(shop);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app uninstalled)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
