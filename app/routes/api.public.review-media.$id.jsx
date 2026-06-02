import db from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ params, request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const id = String(params.id || "").trim();
  if (!id) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const row = await db.reviewMedia.findUnique({
    where: { id },
    select: { data: true, mimeType: true, filename: true, type: true },
  });

  if (!row) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const body = Buffer.from(row.data);
  const headers = {
    ...corsHeaders,
    "Content-Type": row.mimeType || "application/octet-stream",
    "Content-Length": String(body.length),
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (row.filename) {
    headers["Content-Disposition"] = `inline; filename="${row.filename.replace(/"/g, "")}"`;
  }

  return new Response(body, { status: 200, headers });
}
