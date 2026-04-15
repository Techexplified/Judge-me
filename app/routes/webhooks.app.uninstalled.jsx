import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (app uninstalled)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
