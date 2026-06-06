import { data, useLoaderData, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { linkStore } from "../lib/link-store.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { IntegrationSettingsPanel } from "../components/settings/integration-settings-panel";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);
  const linkedSuccess = url.searchParams.get("linked") === "1";

  const link = await prisma.groupStoreLink.findUnique({
    where: { shop },
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
            isCurrent: memberShop === shop,
          };
        }),
      }
    : null;

  return {
    group,
    linkedSuccess,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const formData = await request.formData();
  const targetShopRaw = formData.get("targetShop");
  const result = await linkStore({ session, admin, targetShopRaw });

  if (!result.ok) {
    return data({ error: result.error }, { status: 400 });
  }

  return embedRedirect("/app/settings/integration?linked=1", request);
};

export default function SettingsIntegrationPage() {
  const { group, linkedSuccess } = useLoaderData();
  const actionData = useActionData();

  return (
    <IntegrationSettingsPanel
      group={group}
      linkedSuccess={linkedSuccess}
      actionError={actionData?.error}
    />
  );
}
