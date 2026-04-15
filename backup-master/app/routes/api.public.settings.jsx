//api.public.settings
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "No shop provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const settings = await db.settings.findUnique({
    where: { shop: shop },
  });

  const config = settings ? JSON.parse(settings.config) : null;

  return new Response(JSON.stringify({ config }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};