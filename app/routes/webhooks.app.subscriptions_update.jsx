export const runtime = "nodejs";

import { authenticate } from "../shopify.server";
import {
  downgradeShopToFree,
  resolveManagedPlanTier,
  syncSubscriptionFromShopify,
} from "../lib/billing.server.js";
import { normalizeShopDomain } from "../utils/shop.js";

const ACTIVE_STATUSES = new Set(["ACTIVE", "ACCEPTED"]);

export const action = async ({ request }) => {
  try {
    const { shop: shopRaw, topic, payload } = await authenticate.webhook(request);
    const shop = normalizeShopDomain(shopRaw);

    console.log(`Received ${topic} webhook for ${shop}`);

    const rawSub = payload?.app_subscription ?? payload;
    const status = rawSub?.status ?? payload?.status;

    if (status && ACTIVE_STATUSES.has(status)) {
      const tier = resolveManagedPlanTier(rawSub, { hasActivePayment: true });
      if (tier === "pro") {
        await syncSubscriptionFromShopify(
          shop,
          {
            hasActivePayment: true,
            appSubscriptions: [rawSub],
          },
          { planHandle: rawSub?.plan_handle ?? rawSub?.planHandle },
        );
      } else {
        await downgradeShopToFree(shop);
      }
    } else {
      await downgradeShopToFree(shop);
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app subscriptions update)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
