/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  ExternalLink,
  Link2,
  Search,
  Send,
  Star,
  Store,
  CheckCircle2,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import {
  handleStoreIntegrationAction,
  loadStoreIntegrationGroup,
  parseStoreIntegrationFlash,
} from "../lib/store-integration.server.js";
import {
  handleReviewsManagementAction,
  loadReviewsManagementData,
} from "../lib/reviews-management.server.js";
import { resolveProductFromUrlParams, reviewsManagementShouldRevalidate, normalizeProductLookup } from "../lib/reviews-management.shared.js";
import { loadManageReviewsData } from "../utils/performance-metrics.server.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { IntegrationSettingsPanel } from "../components/settings/integration-settings-panel";
import { ProductReviewsModal } from "../components/manage-reviews/reviews-workspace.jsx";
import {
  PAGE_BG,
  SHOPIFY_GREEN,
  SURFACE_BORDER,
  Banner,
} from "../components/admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 30,
    fontWeight: 900,
    color: "#202223",
    letterSpacing: "-0.01em",
  },
  tab: (active) => ({
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? SHOPIFY_GREEN : "#6d7175",
  }),
  sectionTitle: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 750,
    color: "#202223",
  },
  body: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#202223",
  },
  bodyMuted: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
  },
  caption: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    color: "#6d7175",
  },
  label: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 600,
    color: "#6d7175",
    letterSpacing: "0.04em",
  },
  badge: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 600,
  },
  button: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
  },
  emptyTitle: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: 600,
    color: "#202223",
  },
};

const MANAGE_REVIEWS_TABS = new Set(["product", "store", "integration"]);

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);

  try {
    const [tableData, modalData, { group }] = await Promise.all([
      loadManageReviewsData({ request, session, admin }),
      loadReviewsManagementData({ request, session, billing }),
      loadStoreIntegrationGroup(shop),
    ]);

    return {
      ...tableData,
      storeReviews: modalData.storeReviews ?? [],
      reviewProducts: modalData.products ?? [],
      currentShop: modalData.currentShop,
      translation: modalData.translation,
      premium: modalData.premium,
      aiAvailable: modalData.aiAvailable,
      group,
      ...parseStoreIntegrationFlash(url),
    };
  } catch (error) {
    console.error("[manage-reviews] loader failed:", error);
    throw error;
  }
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    if (formData.has("intent")) {
      return handleStoreIntegrationAction({
        request,
        session,
        admin,
        redirectPath: "/app/manage-reviews",
        withTabParam: true,
        formData,
      });
    }

    return await handleReviewsManagementAction({ session, formData });
  } catch (error) {
    console.error("[manage-reviews] action failed:", error);
    return {
      ok: false,
      error: "Something went wrong. Please try again in a moment.",
    };
  }
};

export function shouldRevalidate(args) {
  return reviewsManagementShouldRevalidate(args);
}

function StoreReviewsTab({ storeReviewLink, reviewCount = 0, onViewReviews, onReplyToReviews }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);
  const hasReviews = reviewCount > 0;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeReviewLink);
      setCopied(true);
      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Store review link copied");
      }
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Could not copy link");
      }
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Leave us a store review",
          url: storeReviewLink,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  };

  return (
    <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", minHeight: 400 }}>
      <div style={{ marginBottom: 24 }}>
        <StoreIllustration />
      </div>
      <h2 style={{ margin: "0 0 10px", ...type.emptyTitle }}>
        {hasReviews ? "Store reviews" : "No store reviews yet"}
      </h2>
      <p
        style={{
          margin: "0 auto 28px",
          maxWidth: 420,
          lineHeight: 1.6,
          ...type.bodyMuted,
        }}
      >
        {hasReviews
          ? `${reviewCount} store review${reviewCount === 1 ? "" : "s"} collected. Share your link to collect more.`
          : "Share your store review link with your customers and start building trust."}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: hasReviews ? 20 : 0 }}>
        <button
          type="button"
          onClick={copyLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 8,
            border: "1px solid #c9cccf",
            background: "#fff",
            color: "#202223",
            cursor: "pointer",
            ...type.button,
          }}
        >
          <Link2 size={15} />
          {copied ? "Link copied" : "Get store review link"}
        </button>
        <button
          type="button"
          onClick={shareLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 8,
            border: "none",
            background: SHOPIFY_GREEN,
            color: "#fff",
            cursor: "pointer",
            ...type.button,
          }}
        >
          Share link
          <Send size={15} />
        </button>
      </div>
      {hasReviews ? (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginTop: "auto" }}>
          <button
            type="button"
            onClick={onViewReviews}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "#fff",
              color: "#202223",
              cursor: "pointer",
              ...type.button,
            }}
          >
            View store reviews
            <ExternalLink size={14} />
          </button>
          <button
            type="button"
            onClick={onReplyToReviews}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              border: "none",
              background: SHOPIFY_GREEN,
              color: "#fff",
              cursor: "pointer",
              ...type.button,
            }}
          >
            Reply to reviews
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StoreIllustration() {
  return (
    <svg width="300" height="160" viewBox="0 0 300 160" fill="none" aria-hidden="true">
      {/* Base line with dashed section under the tree */}
      <path d="M 40 140 H 52 M 60 140 H 72 M 80 140 H 260" stroke="#202223" strokeWidth="1.5" strokeLinecap="round" />

      {/* Left Tree */}
      <path d="M 60 105 V 140" stroke="#202223" strokeWidth="1.5" />
      <ellipse cx="60" cy="85" rx="12" ry="20" fill="#fff" stroke="#202223" strokeWidth="1.5" />

      {/* Main Building Background */}
      <rect x="95" y="70" width="110" height="70" fill="#fff" stroke="#202223" strokeWidth="1.5" />

      {/* Door */}
      <rect x="110" y="105" width="20" height="35" fill="#fff" stroke="#202223" strokeWidth="1.5" />
      <circle cx="114" cy="122.5" r="1" fill="#202223" />

      {/* Window */}
      <rect x="145" y="95" width="45" height="30" fill="#fff" stroke="#202223" strokeWidth="1.5" />

      {/* Right Bush */}
      <path
        d="M 215 140 A 6 6 0 0 1 223 132 A 8 8 0 0 1 237 132 A 6 6 0 0 1 245 140 Z"
        fill="#fff"
        stroke="#202223"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Awning Flaps */}
      <g stroke="#202223" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M 90 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#004c3f" />
        <path d="M 110 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#ffffff" />
        <path d="M 130 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#003d32" />
        <path d="M 150 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#006e52" />
        <path d="M 170 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#1a9e77" />
        <path d="M 190 60 h 20 v 18 a 10 10 0 0 1 -20 0 z" fill="#006e52" />
      </g>

      {/* Sign Supports */}
      <path d="M 120 45 V 60 M 180 45 V 60" stroke="#202223" strokeWidth="1.5" />

      {/* Sign Board */}
      <rect x="105" y="28" width="90" height="22" rx="1" fill="#004c3f" stroke="#202223" strokeWidth="1.5" />

      {/* Sign Stars */}
      {[115, 132.5, 150, 167.5, 185].map((x) => (
        <path
          key={x}
          transform={`translate(${x}, 39)`}
          d="M0 -4 L1.2 -1.2 L4.2 -1.2 L1.8 0.6 L2.6 3.6 L0 1.8 L-2.6 3.6 L-1.8 0.6 L-4.2 -1.2 L-1.2 -1.2 Z"
          fill="#fff"
        />
      ))}

      {/* Sparkles / Ambient Decor */}
      <path d="M 68 35 h 4 M 70 33 v 4" stroke="#004c3f" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38" cy="78" r="1.5" fill="#003d32" />
      <path d="M 230 45 L 232 48 L 230 51 L 228 48 Z" fill="#004c3f" />
      <circle cx="250" cy="82" r="1.5" fill="#1a9e77" />
    </svg>
  );
}

function buildStoreModalProduct(storeReviews) {
  if (!storeReviews?.length) return null;
  const totalRating = storeReviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    productName: "Store reviews",
    productImage: null,
    reviews: storeReviews,
    avgRating: (totalRating / storeReviews.length).toFixed(1),
    reviewCount: storeReviews.length,
  };
}

const actionBtnStyle = {
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${SURFACE_BORDER}`,
  background: "#fff",
  color: "#202223",
  cursor: "pointer",
  ...type.button,
  fontSize: 12,
};

const PRODUCT_TABLE_COLUMNS = [
  { key: "product", label: "Product", width: "40%", align: "left" },
  { key: "rating", label: "Rating", width: "12%", align: "center" },
  { key: "reviews", label: "Reviews", width: "10%", align: "center" },
  { key: "lastReview", label: "Last review", width: "10%", align: "center" },
  { key: "actions", label: "Actions", width: "10%", align: "center" },
];

function tableHeadCellStyle(align) {
  return {
    textAlign: align,
    padding: "12px 16px",
    verticalAlign: "middle",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    ...type.label,
  };
}

function tableBodyCellStyle(align) {
  return {
    textAlign: align,
    padding: "14px 16px",
    verticalAlign: "middle",
  };
}

export default function ManageReviews() {
  const {
    products,
    storeReviews,
    storeReviewLink,
    reviewProducts,
    currentShop,
    translation,
    premium,
    aiAvailable,
    group,
    linkedSuccess,
    unlinkedSuccess,
  } = useLoaderData();
  const actionData = useActionData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    MANAGE_REVIEWS_TABS.has(tabFromUrl) ? tabFromUrl : "product",
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [modalProduct, setModalProduct] = useState(null);
  const [modalReplyMode, setModalReplyMode] = useState(false);
  const [importBanner, setImportBanner] = useState(null);
  const importProcessed = useRef(false);

  useEffect(() => {
    if (importProcessed.current) return;
    const imported = searchParams.get("imported");
    if (imported == null) return;
    importProcessed.current = true;
    setImportBanner({
      imported: Number(imported),
      skipped: Number(searchParams.get("skipped") ?? 0),
    });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("imported");
        next.delete("skipped");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (MANAGE_REVIEWS_TABS.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const findModalProduct = useCallback(
    (tableProduct) =>
      resolveProductFromUrlParams(
        reviewProducts ?? [],
        tableProduct?.productName,
        tableProduct?.productId,
      ),
    [reviewProducts],
  );

  const openProductModal = useCallback(
    (tableProduct, replyMode = false) => {
      const found = findModalProduct(tableProduct);
      if (!found) return;
      setModalProduct(found);
      setModalReplyMode(replyMode);
    },
    [findModalProduct],
  );

  const openStoreModal = useCallback((replyMode = false) => {
    const product = buildStoreModalProduct(storeReviews);
    if (!product) return;
    setModalProduct(product);
    setModalReplyMode(replyMode);
  }, [storeReviews]);

  const closeModal = useCallback(() => {
    setModalProduct(null);
    setModalReplyMode(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("product");
        next.delete("pid");
        next.delete("mode");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    const productParam = searchParams.get("product");
    const pidParam = searchParams.get("pid");
    const modeReply = searchParams.get("mode") === "reply";
    const productKey = normalizeProductLookup(productParam);
    const isStoreDeepLink =
      productKey === "store review" ||
      productKey === "store reviews" ||
      String(pidParam ?? "").trim().toLowerCase() === "store";

    if (isStoreDeepLink && storeReviews?.length) {
      openStoreModal(modeReply);
      return;
    }

    if (!productParam && !pidParam) return;

    const fromUrl = resolveProductFromUrlParams(reviewProducts ?? [], productParam, pidParam);
    if (fromUrl) {
      setModalProduct(fromUrl);
      setModalReplyMode(modeReply);
    }
  }, [searchParams, reviewProducts, storeReviews, openStoreModal]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...(products ?? [])];
    if (q) {
      list = list.filter(
        (p) =>
          String(p.productName).toLowerCase().includes(q) ||
          String(p.handle).toLowerCase().includes(q),
      );
    }
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.lastReviewAt || 0) - new Date(a.lastReviewAt || 0));
    } else if (sortBy === "most") {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === "rating-high") {
      list.sort((a, b) => Number(b.avgRating) - Number(a.avgRating));
    } else if (sortBy === "rating-low") {
      list.sort((a, b) => Number(a.avgRating) - Number(b.avgRating));
    }
    return list;
  }, [products, search, sortBy]);

  const inRangeTotal = filteredProducts.length;
  const replyFormAction = mergeShopifyEmbedParams("/app/manage-reviews", location.search);

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabId === "product") {
          next.delete("tab");
        } else {
          next.set("tab", tabId);
        }
        next.delete("product");
        next.delete("pid");
        next.delete("mode");
        return next;
      },
      { replace: true },
    );
    setModalProduct(null);
    setModalReplyMode(false);
  };

  return (
    <div style={{ ...pageStyle, background: PAGE_BG, fontFamily: FONT }}>
      <h1 style={{ margin: "0 0 12px", ...type.pageTitle }}>Manage Reviews</h1>

      {importBanner ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="success" icon={<CheckCircle2 size={18} />}>
            Successfully imported {importBanner.imported.toLocaleString()} review
            {importBanner.imported === 1 ? "" : "s"}.
            {importBanner.skipped > 0
              ? ` ${importBanner.skipped.toLocaleString()} duplicate or skipped row${importBanner.skipped === 1 ? "" : "s"}.`
              : ""}
          </Banner>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${SURFACE_BORDER}`, marginBottom: 20 }}>
        {[
          { id: "product", label: "Product Reviews" },
          { id: "store", label: "Store Reviews" },
          { id: "integration", label: "Store Integration" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "0 0 12px",
                marginBottom: -1,
                borderBottom: active ? `2px solid ${SHOPIFY_GREEN}` : "2px solid transparent",
                cursor: "pointer",
                ...type.tab(active),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "integration" ? (
        <IntegrationSettingsPanel
          group={group}
          linkedSuccess={linkedSuccess}
          unlinkedSuccess={unlinkedSuccess}
          actionError={actionData?.error}
        />
      ) : (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${SURFACE_BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          {activeTab === "product" ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: `1px solid ${SURFACE_BORDER}`,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={type.sectionTitle}>Product Reviews</span>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "#ecfdf5",
                      color: "#047857",
                      ...type.badge,
                    }}
                  >
                    {inRangeTotal} in range
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={16}
                      color="#6d7175"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="search"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        padding: "9px 12px 9px 36px",
                        borderRadius: 8,
                        border: `1px solid ${SURFACE_BORDER}`,
                        minWidth: 220,
                        background: "#fff",
                        outline: "none",
                        ...type.input,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={type.caption}>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: `1px solid ${SURFACE_BORDER}`,
                        background: "#fff",
                        ...type.input,
                      }}
                    >
                      <option value="newest">Newest activity</option>
                      <option value="most">Most reviews</option>
                      <option value="rating-high">Highest rating</option>
                      <option value="rating-low">Lowest rating</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", ...type.bodyMuted }}>
                  No product reviews yet. Reviews will appear here once customers start leaving feedback.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed",
                      minWidth: 680,
                      fontFamily: FONT,
                    }}
                  >
                    <colgroup>
                      {PRODUCT_TABLE_COLUMNS.map((col) => (
                        <col key={col.key} style={{ width: col.width }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr style={{ background: "#f6f6f7" }}>
                        {PRODUCT_TABLE_COLUMNS.map((col) => (
                          <th key={col.key} style={tableHeadCellStyle(col.align)}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr
                          key={`${product.productId}-${product.handle}`}
                          style={{ borderTop: `1px solid ${SURFACE_BORDER}` }}
                        >
                          <td style={tableBodyCellStyle("left")}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                              {product.productImage ? (
                                <img
                                  src={product.productImage}
                                  alt=""
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    objectFit: "cover",
                                    border: `1px solid ${SURFACE_BORDER}`,
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    background: "#f6f6f7",
                                    border: `1px solid ${SURFACE_BORDER}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Store size={16} color="#8c9196" />
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    ...type.body,
                                    fontWeight: 600,
                                    lineHeight: 1.3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {product.productName}
                                </div>
                                <div
                                  style={{
                                    ...type.caption,
                                    marginTop: 2,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {product.handle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={tableBodyCellStyle("center")}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                ...type.body,
                                fontWeight: 600,
                              }}
                            >
                              <Star size={14} fill={SHOPIFY_GREEN} color={SHOPIFY_GREEN} />
                              {product.avgRating}
                            </span>
                          </td>
                          <td style={{ ...tableBodyCellStyle("center"), ...type.body, fontWeight: 600 }}>
                            {product.reviewCount}
                          </td>
                          <td style={{ ...tableBodyCellStyle("center"), ...type.body, fontWeight: 500 }}>
                            {product.lastReview}
                          </td>
                          <td style={tableBodyCellStyle("right")}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 8,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => openProductModal(product, false)}
                                style={actionBtnStyle}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => openProductModal(product, true)}
                                style={actionBtnStyle}
                              >
                                Reply
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <StoreReviewsTab
              storeReviewLink={storeReviewLink}
              reviewCount={(storeReviews ?? []).length}
              onViewReviews={() => openStoreModal(false)}
              onReplyToReviews={() => openStoreModal(true)}
            />
          )}
        </div>
      )}

      {modalProduct ? (
        <ProductReviewsModal
          product={modalProduct}
          currentShop={currentShop}
          modeReply={modalReplyMode}
          onClose={closeModal}
          translation={translation}
          premium={premium}
          aiAvailable={aiAvailable}
          formAction={replyFormAction}
        />
      ) : null}
    </div>
  );
}

const pageStyle = {
  padding: "20px 24px 32px",
  minHeight: "100vh",
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  color: "#202223",
  boxSizing: "border-box",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};
