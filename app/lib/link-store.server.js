import prisma from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.server.js";
import { FREE_LINKED_STORES, PRO_LINKED_STORES } from "./plan-features.shared.js";
import { hasProAccess } from "./trial.shared.js";

/**
 * Attempt to resolve a custom domain to its shopname.myshopify.com domain
 * by fetching the storefront and extracting the myshopify domain from HTML.
 */
async function resolveCustomShopDomain(domain) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const match = html.match(/[a-zA-Z0-9-]+\.myshopify\.com/i);
    if (match) {
      return match[0].toLowerCase();
    }
  } catch (err) {
    console.error(`[resolveCustomShopDomain] Failed to resolve ${domain}:`, err.message);
  }
  return null;
}

/**
 * Link another Shopify store into the current shop's network.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export async function linkStore({ session, admin, targetShopRaw }) {
  const shop = normalizeShopDomain(session.shop);
  let targetShop = normalizeShopDomain(String(targetShopRaw ?? ""));

  if (targetShop && !targetShop.endsWith(".myshopify.com")) {
    const resolved = await resolveCustomShopDomain(targetShop);
    if (resolved) {
      targetShop = resolved;
    }
  }

  if (!targetShop || !targetShop.endsWith(".myshopify.com")) {
    return { ok: false, error: "Enter a valid Shopify store domain." };
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

  let link = await prisma.groupStoreLink.findUnique({
    where: { shop },
    include: { group: { include: { members: true } } },
  });
  let groupId;

  const { getShopPlanStatus } = await import("./billing.server.js");
  const planStatus = await getShopPlanStatus(shop);
  const maxStores = hasProAccess(planStatus) ? PRO_LINKED_STORES : FREE_LINKED_STORES;

  if (link?.group) {
    const currentCount = link.group.members.length;
    if (currentCount >= maxStores) {
      return {
        ok: false,
        error: hasProAccess(planStatus)
          ? `Your plan allows up to ${maxStores} linked stores. Remove a store or upgrade.`
          : `Free plan allows ${FREE_LINKED_STORES} linked stores. Upgrade to Pro for up to ${PRO_LINKED_STORES}.`,
      };
    }
  }

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

/**
 * Unlink a store from a network, or dismantle the network if the primary store leaves.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export async function unlinkStore({ session, targetShopRaw }) {
  const shop = normalizeShopDomain(session.shop);
  const targetShop = normalizeShopDomain(String(targetShopRaw ?? ""));

  if (!targetShop) {
    return { ok: false, error: "Invalid store to unlink." };
  }

  const currentLink = await prisma.groupStoreLink.findUnique({
    where: { shop },
  });

  if (!currentLink) {
    return { ok: false, error: "Your store is not part of any network." };
  }

  const targetLink = await prisma.groupStoreLink.findUnique({
    where: { shop: targetShop },
  });

  if (!targetLink || targetLink.groupId !== currentLink.groupId) {
    return { ok: false, error: "That store is not in your network." };
  }

  if (currentLink.role === "MEMBER") {
    if (targetShop !== shop) {
      return { ok: false, error: "As a member store, you can only unlink (remove) yourself." };
    }
    await prisma.groupStoreLink.delete({
      where: { shop: targetShop },
    });
  } else {
    // Current store is PRIMARY
    if (targetShop === shop) {
      // Dismantle network
      await prisma.storeGroup.delete({
        where: { id: currentLink.groupId },
      });
    } else {
      // Remove member
      await prisma.groupStoreLink.delete({
        where: { shop: targetShop },
      });
    }
  }

  return { ok: true };
}
