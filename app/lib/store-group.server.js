import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";

/**
 * Returns all shop domains in the current store's syndication group (including self).
 * @param {string} shop - Normalized shop domain
 * @returns {Promise<string[]>}
 */
export async function getGroupShopList(shop) {
  const shopNorm = normalizeShopDomain(shop);
  try {
    const link = await db.groupStoreLink.findUnique({
      where: { shop: shopNorm },
      include: { group: { include: { members: true } } },
    });
    if (link?.group?.members?.length) {
      return link.group.members.map((m) => normalizeShopDomain(m.shop));
    }
  } catch (e) {
    console.error("[store-group] Error fetching network shops:", e);
  }
  return [shopNorm];
}
