import db from "../db.server.js";

/** Public path for a shop asset (app origin, not storefront proxy). */
export function shopAssetPublicPath(assetId) {
  return `/api/public/shop-asset/${encodeURIComponent(assetId)}`;
}

/**
 * Absolute public URL for a shop asset.
 * If request is provided, uses its origin. Otherwise returns relative path.
 */
export function resolveShopAssetAbsoluteUrl(assetId, request) {
  const path = shopAssetPublicPath(assetId);
  if (request) {
    try {
      const origin = new URL(request.url).origin;
      return `${origin}${path}`;
    } catch {}
  }
  return path;
}

/**
 * @param {Request} [request]
 * @param {string} assetId
 */
export function shopAssetPublicUrl(request, assetId) {
  return resolveShopAssetAbsoluteUrl(assetId, request);
}

/**
 * Normalize a stored brandLogoUrl for display (admin or storefront).
 * Converts legacy proxy-relative paths (/apps/judgeme-reviews/..., /apps/verdict-product-reviews/..., https://.../shop-asset/...)
 * to a clean relative path for admin or absolute URL when request is provided.
 * @param {string | null | undefined} url
 * @param {Request} [request]
 */
export function normalizeBrandLogoUrl(url, request) {
  if (!url || typeof url !== "string") return url || null;
  if (url.startsWith("data:")) return url;

  // Extract asset id if this is any shop-asset URL format
  const match = url.match(/\/api\/public\/shop-asset\/([^/?#]+)/);
  if (match) {
    const assetId = match[1];
    const path = `/api/public/shop-asset/${assetId}`;
    if (request) {
      try {
        const origin = new URL(request.url).origin;
        return `${origin}${path}`;
      } catch {}
    }
    return path;
  }

  return url;
}

/**
 * Parse a data: URL into mime + buffer.
 * @param {string} dataUrl
 * @returns {{ mimeType: string, buffer: Buffer } | null}
 */
export function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return {
      mimeType: match[1].toLowerCase(),
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

/**
 * Store (or replace) a shop brand logo and return an absolute public URL.
 * @param {string} shop
 * @param {{ mimeType: string, buffer: Buffer, filename?: string } | string} input
 * @param {Request} [request]
 */
export async function saveShopBrandLogo(shop, input, request) {
  let mimeType;
  let buffer;
  let filename = "brand-logo";

  if (typeof input === "string") {
    const parsed = parseDataUrl(input);
    if (!parsed) throw new Error("Invalid logo data URL");
    mimeType = parsed.mimeType;
    buffer = parsed.buffer;
  } else {
    mimeType = String(input.mimeType || "application/octet-stream").toLowerCase();
    buffer = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);
    if (input.filename) filename = String(input.filename);
  }

  if (!buffer.length) throw new Error("Empty logo file");
  if (buffer.length > 2 * 1024 * 1024) throw new Error("Logo must be 2MB or less");

  const row = await db.shopAsset.upsert({
    where: { shop_key: { shop, key: "brandLogo" } },
    create: {
      shop,
      key: "brandLogo",
      mimeType,
      filename,
      data: buffer,
    },
    update: {
      mimeType,
      filename,
      data: buffer,
    },
    select: { id: true },
  });

  if (request) return shopAssetPublicUrl(request, row.id);
  return resolveShopAssetAbsoluteUrl(row.id);
}

/** @param {string} shop */
export async function deleteShopBrandLogo(shop) {
  await db.shopAsset.deleteMany({ where: { shop, key: "brandLogo" } });
}

/**
 * If config.brandLogoUrl is still a data: URL, move it to ShopAsset and return
 * updated config (does not persist). Returns null if no change needed.
 * @param {string} shop
 * @param {Record<string, unknown>} config
 * @param {Request} [request]
 */
export async function externalizeBrandLogoInConfig(shop, config, request) {
  const url = config?.brandLogoUrl;
  if (typeof url !== "string" || !url.startsWith("data:")) {
    return null;
  }
  const publicUrl = await saveShopBrandLogo(shop, url, request);
  return { ...config, brandLogoUrl: publicUrl };
}
