import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app scopes_update)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
