/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  data,
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { CheckCircle2, AlertCircle, Store, Crown } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { linkStore } from "../lib/link-store.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import {
  Badge,
  Banner,
  Card,
  EmptyState,
  Page,
  PageHeader,
  PrimaryButton,
  ResourceRow,
  Stack,
  TextField,
} from "../components/admin-ui";

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
    appUrl: process.env.SHOPIFY_APP_URL || "",
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

  return embedRedirect("/app/linked-stores?linked=1", request);
};

export default function LinkedStores() {
  const { group, appUrl, linkedSuccess } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [, setSearchParams] = useSearchParams();

  const [targetShop, setTargetShop] = useState("");
  const [showLinkedBanner, setShowLinkedBanner] = useState(false);
  const [showThemeInfo, setShowThemeInfo] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!linkedSuccess) return;
    setShowLinkedBanner(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("linked");
        return next;
      },
      { replace: true },
    );
  }, [linkedSuccess, setSearchParams]);

  const handleLinkStore = () => {
    if (!targetShop || isSubmitting) return;
    submit({ targetShop }, { method: "post" });
  };

  return (
    <Page>
      <PageHeader
        title="Linked stores"
        subtitle="Share reviews across stores when product SKU or handle matches."
      />

      <Stack>
        {showLinkedBanner ? (
          <Banner tone="success" icon={<CheckCircle2 size={18} />}>
            Store linked successfully.
          </Banner>
        ) : null}

        {actionData?.error ? (
          <Banner tone="critical" icon={<AlertCircle size={18} />}>
            {actionData.error}
          </Banner>
        ) : null}

        {appUrl ? (
          <Banner tone="info">
            <div>
              <button
                type="button"
                onClick={() => setShowThemeInfo((v) => !v)}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  font: "inherit",
                  fontWeight: 800,
                  color: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Theme setup {showThemeInfo ? "▾" : "▸"}
              </button>
              {showThemeInfo ? (
                <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600 }}>
                  Theme block API base URL: <strong>{appUrl.replace(/\/$/, "")}</strong>
                </p>
              ) : null}
            </div>
          </Banner>
        ) : null}

        <Card
          title="Connect another store"
          description="Enter a .myshopify.com domain. That store must have this app installed."
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <TextField
                value={targetShop}
                onChange={(e) => setTargetShop(e.target.value)}
                placeholder="brand-uk.myshopify.com"
                disabled={isSubmitting}
              />
            </div>
            <PrimaryButton
              onClick={handleLinkStore}
              disabled={isSubmitting || !targetShop.trim()}
              loading={isSubmitting}
            >
              Connect store
            </PrimaryButton>
          </div>
        </Card>

        <Card title="Store network">
          {!group ? (
            <EmptyState
              icon={<Store size={32} color="#8c9196" />}
              title="No linked stores yet"
              description="Connect another store above to share reviews across your network."
            />
          ) : (
            <Stack>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
                {group.members.length} store{group.members.length === 1 ? "" : "s"} in this network.
              </p>
              {group.members.map((member) => (
                <ResourceRow
                  key={member.id}
                  title={member.shop}
                  icon={<Store size={16} color="#6d7175" />}
                  badges={
                    <>
                      {member.role === "PRIMARY" ? (
                        <Badge tone="warning">
                          <Crown size={11} /> Primary
                        </Badge>
                      ) : null}
                      {member.isCurrent ? (
                        <Badge tone="green">This store</Badge>
                      ) : (
                        <Badge tone="blue">Linked</Badge>
                      )}
                    </>
                  }
                />
              ))}
            </Stack>
          )}
        </Card>
      </Stack>
    </Page>
  );
}
