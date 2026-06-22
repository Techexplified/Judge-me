/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useCallback, useEffect, useMemo, useState } from "react";
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
  MoreHorizontal,
  Search,
  Send,
  Star,
  Store,
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
import { normalizeShopDomain } from "../utils/shop.js";
import { IntegrationSettingsPanel } from "../components/settings/integration-settings-panel";
import { ProductReviewsModal } from "../components/manage-reviews/reviews-workspace.jsx";
import {
  PAGE_BG,
  SHOPIFY_GREEN,
  SURFACE_BORDER,
} from "../components/admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 600,
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
    fontWeight: 600,
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
  const [tableData, modalData, { group }] = await Promise.all([
    loadManageReviewsData({ request, session, admin }),
    loadReviewsManagementData({ request, session, billing }),
    loadStoreIntegrationGroup(shop),
  ]);

  return {
    ...tableData,
    storeReviews: modalData.storeReviews,
    reviewProducts: modalData.products,
    currentShop: modalData.currentShop,
    translation: modalData.translation,
    premium: modalData.premium,
    aiAvailable: modalData.aiAvailable,
    group,
    ...parseStoreIntegrationFlash(url),
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.has("intent")) {
    return handleStoreIntegrationAction({
      request,
      session,
      admin,
      redirectPath: "/app/manage-reviews",
      withTabParam: true,
    });
  }

  return handleReviewsManagementAction(request);
};

export function shouldRevalidate(args) {
  return reviewsManagementShouldRevalidate(args);
}

function SentimentBadge({ label, tone }) {
  const styles = {
    positive: { bg: "#ecfdf5", fg: "#047857", dot: SHOPIFY_GREEN },
    negative: { bg: "#f1f2f3", fg: "#202223", dot: "#202223" },
    mixed: { bg: "#f1f2f3", fg: "#616161", dot: "#616161" },
  };
  const c = styles[tone] || styles.mixed;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        ...type.badge,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {label}
    </span>
  );
}

function StoreReviewsEmpty({ storeReviewLink }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

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
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <StoreIllustration />
      </div>
      <h2 style={{ margin: "0 0 10px", ...type.emptyTitle }}>
        No store reviews yet
      </h2>
      <p
        style={{
          margin: "0 auto 28px",
          maxWidth: 420,
          lineHeight: 1.6,
          ...type.bodyMuted,
        }}
      >
        Share your store review link with your customers and start building trust.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
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
    </div>
  );
}

function StoreIllustration() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <path d="M20 95 H160" stroke="#202223" strokeWidth="1.5" />
      <rect x="55" y="45" width="70" height="50" rx="2" stroke="#202223" strokeWidth="1.5" fill="#fff" />
      <path d="M50 45 L65 30 H115 L130 45" stroke={SHOPIFY_GREEN} strokeWidth="2" fill="#ecfdf5" />
      <rect x="68" y="18" width="44" height="16" rx="2" fill={SHOPIFY_GREEN} />
      {[72, 80, 88, 96, 104].map((x) => (
        <path
          key={x}
          d={`M${x} 28 l2 2 -2 2 -2 -2 z`}
          fill="#fff"
        />
      ))}
      <circle cx="35" cy="78" r="10" stroke="#202223" strokeWidth="1.2" fill="none" />
      <path d="M35 68 v20 M30 78 h10" stroke="#202223" strokeWidth="1.2" />
      <circle cx="145" cy="82" r="6" stroke="#202223" strokeWidth="1.2" fill="none" />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    MANAGE_REVIEWS_TABS.has(tabFromUrl) ? tabFromUrl : "product",
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [modalProduct, setModalProduct] = useState(null);
  const [modalReplyMode, setModalReplyMode] = useState(false);

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
    const tab = searchParams.get("tab");
    const productKey = normalizeProductLookup(productParam);
    const isStoreDeepLink =
      tab === "store" ||
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
    let list = [...products];
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
      <h1 style={{ margin: "0 0 12px", ...type.pageTitle }}>Manage reviews</h1>

      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${SURFACE_BORDER}`, marginBottom: 20 }}>
        {[
          { id: "product", label: "Product reviews" },
          { id: "store", label: "Store reviews" },
          { id: "integration", label: "Store integration" },
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
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontFamily: FONT }}>
                    <thead>
                      <tr style={{ background: "#f6f6f7" }}>
                        {["PRODUCT", "RATING", "REVIEWS", "SENTIMENT", "LAST REVIEW", "ACTIONS"].map(
                          (col) => (
                            <th
                              key={col}
                              style={{
                                textAlign: "left",
                                padding: "12px 16px",
                                textTransform: "uppercase",
                                ...type.label,
                              }}
                            >
                              {col}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={`${product.productId}-${product.handle}`} style={{ borderTop: `1px solid ${SURFACE_BORDER}` }}>
                          <td style={{ padding: "14px 16px", minWidth: 240 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {product.productName}
                                </div>
                                <div
                                  style={{
                                    ...type.caption,
                                    marginTop: 2,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {product.handle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...type.body, fontWeight: 600 }}>
                              <Star size={14} fill={SHOPIFY_GREEN} color={SHOPIFY_GREEN} />
                              {product.avgRating}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", ...type.body, fontWeight: 600 }}>{product.reviewCount}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <SentimentBadge label={product.sentiment} tone={product.sentimentTone} />
                          </td>
                          <td style={{ padding: "14px 16px", ...type.body, fontWeight: 500 }}>
                            {product.lastReview}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                              <button
                                type="button"
                                aria-label="More actions"
                                style={{
                                  padding: 6,
                                  borderRadius: 8,
                                  border: `1px solid ${SURFACE_BORDER}`,
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <MoreHorizontal size={16} color="#6d7175" />
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
          ) : storeReviews.length > 0 ? (
            <div style={{ padding: 20 }}>
              <p style={type.bodyMuted}>
                {storeReviews.length} store review{storeReviews.length === 1 ? "" : "s"} collected.
              </p>
              <button
                type="button"
                onClick={() => openStoreModal(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: SHOPIFY_GREEN,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  ...type.button,
                }}
              >
                View store reviews <ExternalLink size={14} />
              </button>
            </div>
          ) : (
            <StoreReviewsEmpty storeReviewLink={storeReviewLink} />
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
