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

function parseRange(rangeHeader, size) {
  if (!rangeHeader || typeof rangeHeader !== "string") return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;
  const start = match[1] === "" ? null : Number(match[1]);
  const end = match[2] === "" ? null : Number(match[2]);
  if (start == null && end == null) return null;
  if (start == null) {
    const length = Math.min(end, size);
    return { start: Math.max(0, size - length), end: size - 1 };
  }
  if (Number.isNaN(start) || start < 0 || start >= size) return null;
  const safeEnd = end == null || Number.isNaN(end) || end >= size ? size - 1 : end;
  if (safeEnd < start) return null;
  return { start, end: safeEnd };
}

function mediaHeaders(row, { contentLength, cacheHit = false } = {}) {
  const headers = {
    ...corsHeaders,
    "Content-Type": row.mimeType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: `"${row.id}"`,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "X-Verdict-Media-Cache": cacheHit ? "HIT" : "MISS",
  };
  if (contentLength != null) {
    headers["Content-Length"] = String(contentLength);
  }
  if (row.filename) {
    headers["Content-Disposition"] = `inline; filename="${row.filename.replace(/"/g, "")}"`;
  }
  return headers;
}

async function loadMediaRow(id) {
  const cached = getCachedMediaBlob(id);
  if (cached) {
    return {
      id,
      data: cached.buffer,
      mimeType: cached.mimeType,
      filename: cached.filename,
      type: cached.type,
      cacheHit: true,
    };
  }

  const row = await db.reviewMedia.findUnique({
    where: { id },
    select: { id: true, data: true, mimeType: true, filename: true, type: true },
  });
  if (!row) return null;

  setCachedMediaBlob(id, row);
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
      // 304 without touching Neon — ETag is the media UUID.
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: `"${id}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  const row = await loadMediaRow(id);
  if (!row) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const body = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  const size = body.length;
  const meta = {
    id: row.id,
    mimeType: row.mimeType,
    filename: row.filename,
  };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: mediaHeaders(meta, {
        contentLength: size,
        cacheHit: row.cacheHit,
      }),
    });
  }

  const range = parseRange(request.headers.get("Range"), size);
  if (range) {
    const chunk = body.subarray(range.start, range.end + 1);
    const headers = mediaHeaders(meta, {
      contentLength: chunk.length,
      cacheHit: row.cacheHit,
    });
    headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
    return new Response(chunk, { status: 206, headers });
  }

  return new Response(body, {
    status: 200,
    headers: mediaHeaders(meta, {
      contentLength: size,
      cacheHit: row.cacheHit,
    }),
  });
}
