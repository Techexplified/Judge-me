/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useLoaderData, useLocation, useSearchParams } from "react-router";
import {
  Star,
  X,
  MessageSquare,
  ChevronRight,
  Edit2,
  Send,
  User,
  Store,
  TrendingUp,
  Inbox,
  CheckCircle2,
  Search,
  Clock,
  Mail,
} from "lucide-react";
import {
  Badge,
  Card,
  Page,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SHOPIFY_GREEN,
  Stack,
} from "../components/admin-ui";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { getGroupShopList } from "../lib/store-group.server";

function normalizeProductLookup(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Match `/app/reviews` deep links (`product`, optional `pid`) to loader products. */
function resolveProductFromUrlParams(products, productNameRaw, pidRaw) {
  const name = typeof productNameRaw === "string" ? productNameRaw.trim() : "";
  const pid = typeof pidRaw === "string" ? pidRaw.trim() : "";

  if (pid) {
    const byPid = products.find((p) =>
      (p.reviews || []).some((r) => String(r.productId ?? "") === pid),
    );
    if (byPid) return byPid;
  }

  if (name) {
    const exact = products.find((p) => String(p.productName ?? "") === name);
    if (exact) return exact;

    const key = normalizeProductLookup(name);
    const normalized = products.find((p) => normalizeProductLookup(p.productName) === key);
    if (normalized) return normalized;

    return (
      products.find((p) => {
        const pn = normalizeProductLookup(p.productName);
        return pn && (pn.startsWith(key) || key.startsWith(pn));
      }) ?? null
    );
  }

  return null;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const targetShops = await getGroupShopList(shop);

  const reviews = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const reviewsThisMonth = reviews.filter(
    (r) => new Date(r.createdAt) >= firstDayOfMonth,
  ).length;
  const reviewsLastMonth = reviews.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= firstDayOfLastMonth && d < firstDayOfMonth;
  }).length;

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const grouped = reviews.reduce((acc, review) => {
    const key = review.productName || review.productId || "Unknown";
    if (!acc[key]) {
      acc[key] = {
        productName: key,
        productImage: review.productImage,
        reviews: [],
        totalRating: 0,
      };
    }
    acc[key].reviews.push(review);
    acc[key].totalRating += review.rating;
    return acc;
  }, {});

  for (const p of Object.values(grouped)) {
    p.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const products = Object.values(grouped).map((p) => ({
    ...p,
    avgRating: (p.totalRating / p.reviews.length).toFixed(1),
    reviewCount: p.reviews.length,
    latestDate: p.reviews[0].createdAt,
  }));

  const totalGrowth = calculateGrowth(reviewsThisMonth, reviewsLastMonth);

  return {
    products,
    currentShop: shop,
    stats: {
      totalReviews,
      avgRating,
      reviewsThisMonth,
      reviewsGrowth: calculateGrowth(reviewsThisMonth, reviewsLastMonth),
      totalGrowth,
    },
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");

  if (!reviewId || typeof reply !== "string") {
    return { ok: false, error: "Missing review or reply." };
  }

  const trimmed = reply.trim();
  if (!trimmed) {
    return { ok: false, error: "Reply cannot be empty." };
  }

  const targetShops = await getGroupShopList(shop);
  const existing = await db.review.findFirst({
    where: { id: reviewId, shop: { in: targetShops } },
  });
  if (!existing) {
    return { ok: false, error: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { reply: trimmed, replyDate: new Date() },
  });
  return { ok: true, reviewId, reply: trimmed };
};

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status) {
  const s = String(status ?? "PENDING").toUpperCase();
  if (s === "APPROVED" || s === "PUBLISHED") return "green";
  if (s === "REJECTED" || s === "SPAM") return "red";
  return "warning";
}

function StarRating({ rating, size = 14 }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }} aria-label={`${r} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < r ? "#f59e0b" : "none"}
          stroke="#f59e0b"
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function ReviewsManagement() {
  const { products, stats, currentShop } = useLoaderData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const productParam = searchParams.get("product");
  const pidParam = searchParams.get("pid");
  const modeReply = searchParams.get("mode") === "reply";

  const urlIntentKey = useMemo(
    () => `${productParam ?? ""}|${pidParam ?? ""}|${modeReply ? "1" : ""}`,
    [productParam, pidParam, modeReply],
  );

  const productFromUrl = useMemo(() => {
    return resolveProductFromUrlParams(products, productParam, pidParam);
  }, [productParam, pidParam, products]);

  /** When the iframe URL lags or fails to strip deep-link params, avoid immediately re-opening the modal. */
  const [urlModalSuppress, setUrlModalSuppress] = useState(null);

  useEffect(() => {
    setUrlModalSuppress((prev) => {
      if (!prev) return null;
      if (prev.navigationKey !== location.key || prev.intentKey !== urlIntentKey) {
        return null;
      }
      return prev;
    });
  }, [location.key, urlIntentKey]);

  const productFromUrlVisible = useMemo(() => {
    if (!productFromUrl) return null;
    if (
      urlModalSuppress &&
      urlModalSuppress.navigationKey === location.key &&
      urlModalSuppress.intentKey === urlIntentKey
    ) {
      return null;
    }
    return productFromUrl;
  }, [productFromUrl, urlModalSuppress, location.key, urlIntentKey]);

  const [pickedProduct, setPickedProduct] = useState(null);
  const selectedProduct = pickedProduct ?? productFromUrlVisible;

  const [listSearch, setListSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p.productName ?? "").toLowerCase();
      const pid = String(p.reviews?.[0]?.productId ?? "").toLowerCase();
      return name.includes(q) || pid.includes(q);
    });
  }, [products, listSearch]);

  const closeModal = useCallback(() => {
    setPickedProduct(null);
    setUrlModalSuppress({ navigationKey: location.key, intentKey: urlIntentKey });
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
  }, [setSearchParams, location.key, urlIntentKey]);

  const pendingReplyTotal = useMemo(
    () =>
      products.reduce(
        (n, p) =>
          n + (p.reviews?.filter((r) => !r.reply || !String(r.reply).trim()).length ?? 0),
        0,
      ),
    [products],
  );

  return (
    <Page>
      <PageHeader
        title="Reviews"
        subtitle="Monitor customer feedback, reply to reviews, and keep your catalog trusted."
      />

      <Stack>
        <div style={styles.statsGrid}>
          <StatCard
            title="Total reviews"
            value={stats.totalReviews.toLocaleString()}
            icon={<Inbox size={20} color={SHOPIFY_GREEN} />}
            subtitle={`${stats.totalGrowth}% vs last month`}
            trend={Number(stats.totalGrowth) >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Average rating"
            value={stats.avgRating}
            isRating
            icon={<Star size={20} color="#f59e0b" fill="#f59e0b" />}
            subtitle="Across all products"
          />
          <StatCard
            title="New this month"
            value={stats.reviewsThisMonth}
            icon={<TrendingUp size={20} color={SHOPIFY_GREEN} />}
            subtitle={`${stats.reviewsGrowth}% growth`}
            trend={stats.reviewsGrowth >= 0 ? "up" : "down"}
          />
        </div>

        {pendingReplyTotal > 0 ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "#fff5ea",
              border: "1px solid #e4b06f",
              fontSize: 13,
              fontWeight: 600,
              color: "#5c5f62",
            }}
          >
            <strong style={{ color: "#b98900" }}>{pendingReplyTotal}</strong> review
            {pendingReplyTotal === 1 ? "" : "s"} still need a store reply.
          </div>
        ) : null}

        <Card>
          <div style={styles.tableToolbar}>
            <div style={styles.searchWrap}>
              <Search size={16} color="#6d7175" aria-hidden />
              <input
                type="search"
                placeholder="Search by product name or ID…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                style={styles.searchField}
                aria-label="Search products"
              />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f5f9f7" }}>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Reviews</th>
                  <th style={styles.th}>Latest</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ ...styles.td, textAlign: "center", color: "#6d7175", padding: "32px" }}
                    >
                      No products match your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const needsReply = p.reviews?.filter(
                      (r) => !r.reply || !String(r.reply).trim(),
                    ).length;
                    return (
                      <tr key={p.productName} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={styles.imgPlaceholder}>
                              {p.productImage ? (
                                <img src={p.productImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                              ) : (
                                <MessageSquare size={18} color="#6d7175" />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#202223" }}>{p.productName}</div>
                              {needsReply > 0 ? (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#b98900" }}>
                                  {needsReply} need{needsReply === 1 ? "s" : ""} reply
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <StarRating rating={p.avgRating} size={12} />
                            <span style={{ fontWeight: 800 }}>{p.avgRating}</span>
                          </div>
                        </td>
                        <td style={styles.td}>{p.reviewCount}</td>
                        <td style={{ ...styles.td, color: "#6d7175", fontSize: 12 }}>
                          {formatDateTime(p.latestDate)}
                        </td>
                        <td style={styles.td}>
                          <SecondaryButton onClick={() => setPickedProduct(p)}>
                            View details <ChevronRight size={14} />
                          </SecondaryButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Stack>

      {selectedProduct ? (
        <ProductReviewsModal
          product={selectedProduct}
          currentShop={currentShop}
          modeReply={modeReply}
          onClose={closeModal}
        />
      ) : null}
    </Page>
  );
}

function StatCard({ title, value, icon, subtitle, trend, isRating }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#6d7175", fontSize: 13, margin: "0 0 8px", fontWeight: 600 }}>{title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#202223" }}>{value}</h3>
            {isRating ? <Star size={18} fill="#f59e0b" stroke="#f59e0b" aria-hidden /> : null}
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12,
              color: trend === "up" ? SHOPIFY_GREEN : "#d72c0d",
              fontWeight: 700,
            }}
          >
            {subtitle}
          </p>
        </div>
        <div style={styles.statIconBox}>{icon}</div>
      </div>
    </div>
  );
}

function ProductReviewsModal({ product, currentShop, modeReply, onClose }) {
  const scrollAreaRef = useRef(null);
  const needsReplyCount = product.reviews?.filter(
    (r) => !r.reply || !String(r.reply).trim(),
  ).length ?? 0;

  useEffect(() => {
    if (!modeReply || !scrollAreaRef.current || !product.reviews?.length) return;
    const firstNeedReply = product.reviews.find(
      (r) => !r.reply || String(r.reply).trim() === "",
    );
    if (!firstNeedReply?.id) return;
    window.requestAnimationFrame(() => {
      const root = scrollAreaRef.current;
      if (!root) return;
      const el = root.querySelector(`[data-review-thread="${firstNeedReply.id}"]`);
      el?.scrollIntoView({ behavior: "auto", block: "center" });
      const textarea = el?.querySelector?.("textarea");
      if (textarea && typeof textarea.focus === "function") {
        textarea.focus({ preventScroll: true });
      }
    });
  }, [modeReply, product]);

  return (
    <div style={modalStyles.overlay} onClick={onClose} role="presentation">
      <div
        style={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="reviews-modal-title"
      >
        <div style={modalStyles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={modalStyles.productThumb}>
              {product.productImage ? (
                <img src={product.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <MessageSquare size={22} color={SHOPIFY_GREEN} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 id="reviews-modal-title" style={modalStyles.productTitle}>
                {product.productName}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 6 }}>
                <StarRating rating={product.avgRating} size={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6d7175" }}>
                  {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
                </span>
                {needsReplyCount > 0 ? (
                  <Badge tone="warning">{needsReplyCount} need reply</Badge>
                ) : (
                  <Badge tone="green">All replied</Badge>
                )}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={modalStyles.closeBtn} aria-label="Close">
            <X size={20} color="#5c5f62" />
          </button>
        </div>

        <div ref={scrollAreaRef} style={modalStyles.scrollArea}>
          {product.reviews.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6d7175", fontWeight: 600, margin: "24px 0" }}>
              No reviews for this product yet.
            </p>
          ) : (
            product.reviews.map((rev) => (
              <div key={`${rev.id}-${rev.reply ?? ""}`} data-review-thread={rev.id}>
                <ReviewDetailCard review={rev} currentShop={currentShop} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewDetailCard({ review, currentShop }) {
  const storeLabel =
    review.shop && review.shop !== currentShop
      ? review.shop.replace(".myshopify.com", "")
      : null;
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(!review.reply);
  const [replyText, setReplyText] = useState(review.reply || "");
  const [savedReply, setSavedReply] = useState(review.reply || "");
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.ok && fetcher.data.reviewId === review.id) {
      setSavedReply(fetcher.data.reply ?? replyText);
      setIsEditing(false);
      setSaveError(null);
    } else if (fetcher.data.error) {
      setSaveError(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, review.id, replyText]);

  const handleSave = () => {
    if (!replyText.trim()) {
      setSaveError("Reply cannot be empty.");
      return;
    }
    setSaveError(null);
    fetcher.submit({ reviewId: review.id, reply: replyText }, { method: "POST" });
  };

  const displayedReply = savedReply || review.reply;
  const hasReply = Boolean(displayedReply && String(displayedReply).trim());

  return (
    <article style={detailStyles.card}>
      <div style={detailStyles.cardHeader}>
        <div style={detailStyles.authorRow}>
          <div style={detailStyles.avatar}>
            <User size={16} color="#6d7175" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={detailStyles.authorName}>{review.author || "Customer"}</span>
              <Badge tone={statusTone(review.status)}>
                {String(review.status ?? "PENDING")}
              </Badge>
              {storeLabel ? <Badge tone="blue">{storeLabel}</Badge> : null}
            </div>
            <div style={detailStyles.metaRow}>
              <Clock size={12} aria-hidden />
              <span>{formatDateTime(review.createdAt)}</span>
              {review.email ? (
                <>
                  <Mail size={12} aria-hidden />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{review.email}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {review.title ? <h3 style={detailStyles.reviewTitle}>{review.title}</h3> : null}
      <p style={detailStyles.reviewBody}>{review.comment}</p>

      <div style={detailStyles.replySection}>
        <div style={detailStyles.replyLabel}>
          <Store size={14} color={SHOPIFY_GREEN} />
          <span>Store reply</span>
          {hasReply && review.replyDate ? (
            <span style={detailStyles.replyDate}>· {formatDateTime(review.replyDate)}</span>
          ) : null}
        </div>

        {isEditing ? (
          <div>
            <textarea
              style={detailStyles.replyInput}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a helpful, on-brand reply for this customer…"
              rows={4}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <PrimaryButton
                onClick={handleSave}
                disabled={fetcher.state === "submitting"}
                loading={fetcher.state === "submitting"}
              >
                <Send size={14} /> Save reply
              </PrimaryButton>
              {hasReply ? (
                <SecondaryButton onClick={() => { setIsEditing(false); setReplyText(displayedReply); setSaveError(null); }}>
                  Cancel
                </SecondaryButton>
              ) : null}
            </div>
            {saveError ? (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#d72c0d", fontWeight: 600 }}>{saveError}</p>
            ) : null}
          </div>
        ) : hasReply ? (
          <div style={detailStyles.replyBubble}>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{displayedReply}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: SHOPIFY_GREEN, fontWeight: 700 }}>
                <CheckCircle2 size={12} /> Published
              </span>
              <button type="button" onClick={() => setIsEditing(true)} style={detailStyles.textBtn}>
                <Edit2 size={12} /> Edit reply
              </button>
            </div>
          </div>
        ) : (
          <div style={detailStyles.replyEmpty}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6d7175", fontWeight: 600 }}>
              No reply yet — customers trust stores that respond.
            </p>
            <PrimaryButton onClick={() => setIsEditing(true)}>Write reply</PrimaryButton>
          </div>
        )}
      </div>
    </article>
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  statCard: {
    backgroundColor: "#fafcfb",
    padding: 20,
    borderRadius: 8,
    border: "1px solid #e5ebe8",
  },
  statIconBox: {
    padding: 10,
    backgroundColor: "#ecfdf3",
    borderRadius: 8,
    height: "fit-content",
  },
  tableToolbar: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #c9cccf",
    backgroundColor: "#fff",
    minWidth: 280,
    maxWidth: 420,
    flex: 1,
  },
  searchField: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    color: "#202223",
    minWidth: 0,
  },
  th: {
    padding: "12px 16px",
    fontSize: 11,
    color: "#6d7175",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  td: { padding: "14px 16px", fontSize: 13, color: "#202223", fontWeight: 600 },
  tr: { borderBottom: "1px solid #e5ebe8" },
  imgPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: "#f5f9f7",
    borderRadius: 8,
    border: "1px solid #e5ebe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(32, 34, 35, 0.55)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    width: "min(760px, 100%)",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    border: "1px solid #e5ebe8",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e5ebe8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "#fafcfb",
  },
  productThumb: {
    width: 52,
    height: 52,
    backgroundColor: "#ecfdf3",
    borderRadius: 8,
    border: "1px solid #aee9d1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  productTitle: { margin: 0, fontSize: 18, fontWeight: 900, color: "#202223" },
  scrollArea: {
    padding: 20,
    overflowY: "auto",
    flex: 1,
    backgroundColor: "#f3f7f5",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #c9cccf",
    backgroundColor: "#fff",
    cursor: "pointer",
    flexShrink: 0,
  },
};

const detailStyles = {
  card: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5ebe8",
    padding: 18,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  authorRow: { display: "flex", gap: 12, flex: 1, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#f5f9f7",
    border: "1px solid #e5ebe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  authorName: { fontSize: 14, fontWeight: 800, color: "#202223" },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px 12px",
    alignItems: "center",
    marginTop: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#6d7175",
  },
  reviewTitle: {
    margin: "0 0 8px",
    fontSize: 15,
    fontWeight: 800,
    color: "#202223",
  },
  reviewBody: {
    margin: "0 0 16px",
    fontSize: 14,
    lineHeight: 1.55,
    color: "#202223",
    fontWeight: 500,
  },
  replySection: {
    borderTop: "1px solid #e5ebe8",
    paddingTop: 14,
    marginTop: 4,
  },
  replyLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 800,
    color: SHOPIFY_GREEN,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  replyDate: { fontWeight: 600, color: "#6d7175", textTransform: "none", letterSpacing: 0 },
  replyInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: `2px solid ${SHOPIFY_GREEN}`,
    fontSize: 13,
    outline: "none",
    resize: "vertical",
    minHeight: 88,
    fontFamily: "inherit",
    fontWeight: 600,
    boxSizing: "border-box",
  },
  replyBubble: {
    padding: "14px 16px",
    backgroundColor: "#ecfdf3",
    border: "1px solid #aee9d1",
    borderRadius: 8,
    color: "#004d3a",
  },
  replyEmpty: {
    padding: 14,
    borderRadius: 8,
    border: "1px dashed #c9cccf",
    background: "#f6f6f7",
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#6d7175",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
};
