import { authenticate } from "../shopify.server";
import { markShopUninstalled } from "../lib/trial.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    // Mark the shop as uninstalled so we preserve trial data
    // but know the app is no longer active.
    await markShopUninstalled(shop);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app uninstalled)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
