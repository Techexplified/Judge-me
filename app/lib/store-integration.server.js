import { data } from "react-router";
import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { linkStore, unlinkStore } from "./link-store.server.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export async function loadStoreIntegrationGroup(shop) {
  const shopNorm = normalizeShopDomain(shop);
  const link = await db.groupStoreLink.findUnique({
    where: { shop: shopNorm },
    include: {
      group: {
        include: {
          members: true,
        },
      },
    },
  });

  const group = link?.group
    ? {
        ...link.group,
        members: link.group.members.map((m) => {
          const memberShop = normalizeShopDomain(m.shop);
          return {
            ...m,
            shop: memberShop,
            isCurrent: memberShop === shopNorm,
          };
        }),
      }
    : null;

  return { group };
}

export function parseStoreIntegrationFlash(url) {
  return {
    linkedSuccess: url.searchParams.get("linked") === "1",
    unlinkedSuccess: url.searchParams.get("unlinked") === "1",
  };
}

export async function handleStoreIntegrationAction({
  request,
  session,
  admin,
  redirectPath,
  withTabParam = false,
}) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const targetShopRaw = formData.get("targetShop");
  const tabQuery = withTabParam ? "tab=integration&" : "";

  if (intent === "unlinkStore") {
    const result = await unlinkStore({ session, targetShopRaw });
    if (!result.ok) {
      return data({ error: result.error }, { status: 400 });
    }
    return embedRedirect(`${redirectPath}?${tabQuery}unlinked=1`, request);
  }

  const result = await linkStore({ session, admin, targetShopRaw });
  if (!result.ok) {
    return data({ error: result.error }, { status: 400 });
  }

  return embedRedirect(`${redirectPath}?${tabQuery}linked=1`, request);
}
