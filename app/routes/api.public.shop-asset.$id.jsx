import db from "../db.server";
import {
  getCachedMediaBlob,
  setCachedMediaBlob,
} from "../lib/media-blob-cache.server.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range, If-None-Match",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, ETag",
};

function assetHeaders(row, { contentLength, cacheHit = false } = {}) {
  const headers = {
    ...corsHeaders,
    "Content-Type": row.mimeType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: `"${row.id}"`,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "X-Verdict-Asset-Cache": cacheHit ? "HIT" : "MISS",
  };
  if (contentLength != null) headers["Content-Length"] = String(contentLength);
  if (row.filename) {
    headers["Content-Disposition"] = `inline; filename="${row.filename.replace(/"/g, "")}"`;
  }
  return headers;
}

async function loadAsset(id) {
  const cacheKey = `asset:${id}`;
  const cached = getCachedMediaBlob(cacheKey);
  if (cached) {
    return {
      id,
      data: cached.buffer,
      mimeType: cached.mimeType,
      filename: cached.filename,
      cacheHit: true,
    };
  }

  const row = await db.shopAsset.findUnique({
    where: { id },
    select: { id: true, data: true, mimeType: true, filename: true },
  });
  if (!row) return null;

  setCachedMediaBlob(cacheKey, row);
  return { ...row, cacheHit: false };
}

export async function loader({ params, request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const id = String(params.id || "").trim();
  if (!id) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch) {
    const tags = ifNoneMatch.split(",").map((t) => t.trim().replace(/^W\//, ""));
    if (tags.includes(`"${id}"`) || tags.includes(id)) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: `"${id}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const row = await loadAsset(id);
  if (!row) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const body = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  const meta = { id: row.id, mimeType: row.mimeType, filename: row.filename };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: assetHeaders(meta, {
        contentLength: body.length,
        cacheHit: row.cacheHit,
      }),
    });
  }

  return new Response(body, {
    status: 200,
    headers: assetHeaders(meta, {
      contentLength: body.length,
      cacheHit: row.cacheHit,
    }),
  });
}
