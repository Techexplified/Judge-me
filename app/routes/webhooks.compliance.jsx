export const runtime = "nodejs";

import { authenticate } from "../shopify.server";
import { handleComplianceWebhook } from "../lib/compliance.server.js";

export const action = async ({ request }) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);
    await handleComplianceWebhook({ shop, topic, payload });

    return new Response(null, { status: 200 });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Webhook auth/HMAC failed (compliance)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
