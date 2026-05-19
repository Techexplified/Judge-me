import { useState, useEffect } from "react";
import { data, useLoaderData, useSubmit, useActionData, useNavigation, redirect } from "react-router";
import {
  Link as LinkIcon,
  Plus,
  Store,
  Crown,
  CheckCircle2,
  AlertCircle,
  Network,
  Loader2,
  Globe,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

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
    shop,
    group,
    appUrl: process.env.SHOPIFY_APP_URL || "",
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const formData = await request.formData();
  const targetShopRaw = formData.get("targetShop");
  const targetShop = normalizeShopDomain(String(targetShopRaw ?? ""));

  if (!targetShop || !targetShop.endsWith(".myshopify.com")) {
    return data(
      { error: "Please enter a valid .myshopify.com domain." },
      { status: 400 },
    );
  }

  if (targetShop === shop) {
    return data({ error: "You cannot link the same store to itself." }, { status: 400 });
  }

  const existingMember = await prisma.groupStoreLink.findUnique({
    where: { shop: targetShop },
  });
  if (existingMember) {
    return data(
      { error: `${targetShop} is already in a store network.` },
      { status: 400 },
    );
  }

  const targetSession = await prisma.session.findFirst({
    where: { shop: { equals: targetShop, mode: "insensitive" } },
  });
  if (!targetSession) {
    return data(
      {
        error:
          "That store must install this app first so we can sync its products and reviews.",
      },
      { status: 400 },
    );
  }

  let link = await prisma.groupStoreLink.findUnique({ where: { shop } });
  let groupId;

  if (!link) {
    const ownerEmail =
      session.email?.trim() || "unknown@merchant.local";
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
    return data(
      { error: `Could not link ${targetShop}. It may already be in a group.` },
      { status: 400 },
    );
  }

  try {
    const {
      syncProductIndex,
      hasRunProductIndexSync,
      markProductIndexSyncDone,
    } = await import("../lib/product-index.server.js");
    const indexDone = await hasRunProductIndexSync(shop);
    if (!indexDone && admin) {
      await syncProductIndex(admin, shop);
      await markProductIndexSyncDone(shop);
    } else if (admin) {
      await syncProductIndex(admin, shop);
    }
  } catch (err) {
    console.error("[linked-stores] product index refresh failed:", err);
  }

  return redirect("/app/linked-stores?linked=1");
};

export default function LinkedStores() {
  const { shop, group, appUrl } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [targetShop, setTargetShop] = useState("");
  const isSubmitting = navigation.state === "submitting";

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [linkedBanner, setLinkedBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("linked") === "1") {
        setLinkedBanner(true);
        window.history.replaceState({}, "", "/app/linked-stores");
      }
    }
  }, []);

  const handleLinkStore = () => {
    if (!targetShop || isSubmitting) return;
    submit({ targetShop }, { method: "post" });
  };

  useEffect(() => {
    if (actionData?.success) {
      setTargetShop("");
    }
  }, [actionData]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.headerIconContainer}>
            <Network size={28} color="#008060" />
          </div>
          <div>
            <h1 style={styles.title}>Store Syndication & Links</h1>
            <p style={styles.subtitle}>
              Aggregate and share product reviews seamlessly across multiple Shopify storefronts.
            </p>
            {appUrl ? (
              <p style={{ ...styles.subtitle, marginTop: "8px", fontSize: "12px" }}>
                Theme block API base URL should be: <strong>{appUrl.replace(/\/$/, "")}</strong>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div style={styles.grid}>
        {linkedBanner && (
          <div style={{ ...styles.banner, ...styles.bannerSuccess }}>
            <CheckCircle2 size={20} style={styles.bannerIcon} />
            <div style={styles.bannerContent}>Store linked successfully.</div>
          </div>
        )}

        {actionData?.error && (
          <div style={{ ...styles.banner, ...styles.bannerError }}>
            <AlertCircle size={20} style={styles.bannerIcon} />
            <div style={styles.bannerContent}>{actionData.error}</div>
          </div>
        )}
        {actionData?.success && (
          <div style={{ ...styles.banner, ...styles.bannerSuccess }}>
            <CheckCircle2 size={20} style={styles.bannerIcon} />
            <div style={styles.bannerContent}>{actionData.message}</div>
          </div>
        )}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <LinkIcon size={20} color="#008060" /> Connect a New Store
          </h2>
          <p style={styles.cardDesc}>
            Enter the Shopify domain of another store you own. That store must have this app
            installed. Reviews syndicate when product SKUs (or handles) match.
          </p>

          <div style={styles.inputGroup}>
            <div style={styles.inputWrapper}>
              <Globe size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="e.g., brand-uk.myshopify.com"
                value={targetShop}
                onChange={(e) => setTargetShop(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                disabled={isSubmitting}
                style={{
                  ...styles.input,
                  ...(isInputFocused ? styles.inputFocused : {}),
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleLinkStore}
              disabled={isSubmitting || !targetShop}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              style={{
                ...styles.button,
                ...(isSubmitting || !targetShop ? styles.buttonDisabled : {}),
                ...(isButtonHovered && targetShop && !isSubmitting ? styles.buttonHovered : {}),
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={styles.spin} /> Connecting...
                </>
              ) : (
                <>
                  <Plus size={16} /> Connect Store
                </>
              )}
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Store size={20} color="#008060" /> Active Store Network
          </h2>

          {!group ? (
            <div style={styles.emptyState}>
              <Network size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <p style={styles.emptyText}>You have not linked any stores yet.</p>
              <p style={{ ...styles.emptyText, fontSize: "13px", marginTop: "4px" }}>
                Connect a sister store above to establish your shared review network.
              </p>
            </div>
          ) : (
            <div>
              <p style={styles.networkDesc}>
                Reviews are syndicated across these stores when SKUs or handles match:
              </p>

              <ul style={styles.list}>
                {group.members.map((member) => (
                  <li
                    key={member.id}
                    onMouseEnter={() => setHoveredItemId(member.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    style={{
                      ...styles.listItem,
                      ...(hoveredItemId === member.id ? styles.listItemHovered : {}),
                    }}
                  >
                    <div style={styles.listShopInfo}>
                      <div style={styles.shopIconBox}>
                        <Store size={16} color="#475569" />
                      </div>
                      <span
                        style={{
                          ...styles.shopDomain,
                          ...(member.isCurrent
                            ? { fontWeight: "700", color: "#008060" }
                            : {}),
                        }}
                      >
                        {member.shop}
                      </span>
                    </div>

                    <div style={styles.badgeGroup}>
                      {member.role === "PRIMARY" && (
                        <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                          <Crown size={12} /> Primary Owner
                        </span>
                      )}
                      {member.isCurrent ? (
                        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>
                          This Store
                        </span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          Linked Sister
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styling Object (unchanged from original)
const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    marginBottom: "36px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "24px",
  },
  headerIconContainer: {
    padding: "12px",
    backgroundColor: "#e6f2f0",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0",
  },
  subtitle: {
    color: "#64748b",
    margin: "6px 0 0 0",
    fontSize: "14px",
    fontWeight: "500",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    maxWidth: "850px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 10px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cardDesc: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
    alignItems: "stretch",
  },
  inputWrapper: {
    position: "relative",
    flex: 1,
  },
  inputIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    outline: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    transition: "all 0.2s ease-in-out",
    fontFamily: "inherit",
  },
  inputFocused: {
    borderColor: "#008060",
    boxShadow: "0 0 0 4px rgba(0, 128, 96, 0.12)",
    backgroundColor: "#fff",
  },
  button: {
    padding: "14px 28px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#008060",
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },
  buttonHovered: {
    backgroundColor: "#006e52",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0, 128, 96, 0.15)",
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    border: "1.5px dashed #cbd5e1",
    textAlign: "center",
  },
  emptyText: {
    margin: 0,
    fontWeight: "600",
    color: "#475569",
    fontSize: "15px",
  },
  networkDesc: {
    color: "#64748b",
    fontSize: "14px",
    margin: "0 0 20px 0",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "0",
    margin: "0",
    listStyle: "none",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease-in-out",
  },
  listItemHovered: {
    backgroundColor: "#fff",
    borderColor: "#00806033",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    transform: "translateX(4px)",
  },
  listShopInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  shopIconBox: {
    padding: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shopDomain: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "14px",
  },
  badgeGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  badge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  badgePrimary: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  badgeInfo: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
  },
  banner: {
    borderRadius: "14px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    lineHeight: "1.5",
    fontSize: "14px",
    animation: "fadeIn 0.3s ease-out",
  },
  bannerSuccess: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
  },
  bannerError: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
  },
  bannerIcon: {
    marginTop: "2px",
    flexShrink: 0,
  },
  bannerContent: {
    flex: 1,
    fontWeight: "600",
  },
  spin: {
    animation: "spin 1s linear infinite",
  },
};
