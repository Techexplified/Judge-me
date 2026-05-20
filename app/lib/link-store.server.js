import prisma from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.server.js";

/**
 * Link another Shopify store into the current shop's network.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export async function linkStore({ session, admin, targetShopRaw }) {
  const shop = normalizeShopDomain(session.shop);
  const targetShop = normalizeShopDomain(String(targetShopRaw ?? ""));

  if (!targetShop || !targetShop.endsWith(".myshopify.com")) {
    return { ok: false, error: "Enter a valid .myshopify.com domain." };
  }

  if (targetShop === shop) {
    return { ok: false, error: "You cannot link the same store to itself." };
  }

  const existingMember = await prisma.groupStoreLink.findUnique({
    where: { shop: targetShop },
  });
  if (existingMember) {
    return { ok: false, error: `${targetShop} is already in a store network.` };
  }

  const targetSession = await prisma.session.findFirst({
    where: { shop: { equals: targetShop, mode: "insensitive" } },
  });
  if (!targetSession) {
    return {
      ok: false,
      error:
        "That store must install this app first so we can sync its products and reviews.",
    };
  }

  let link = await prisma.groupStoreLink.findUnique({ where: { shop } });
  let groupId;

  if (!link) {
    const ownerEmail = session.email?.trim() || "unknown@merchant.local";
    const group = await prisma.storeGroup.create({
      data: {
        name: `${shop} Network`,
        ownerEmail,
        members: {
          create: { shop, role: "PRIMARY" },
        },
      },
    });
    groupId = group.id;
  } else {
    groupId = link.groupId;
  }

  try {
    await prisma.groupStoreLink.create({
      data: {
        groupId,
        shop: targetShop,
        role: "MEMBER",
      },
    });
  } catch {
    return {
      ok: false,
      error: `Could not link ${targetShop}. It may already be in a group.`,
    };
  }

  try {
    const {
      syncProductIndex,
      hasRunProductIndexSync,
      markProductIndexSyncDone,
    } = await import("./product-index.server.js");
    const indexDone = await hasRunProductIndexSync(shop);
    if (!indexDone && admin) {
      await syncProductIndex(admin, shop);
      await markProductIndexSyncDone(shop);
    } else if (admin) {
      await syncProductIndex(admin, shop);
    }
  } catch (err) {
    console.error("[link-store] product index refresh failed:", err);
  }

  return { ok: true };
}
