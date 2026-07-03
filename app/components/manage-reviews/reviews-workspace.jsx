/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useLocation, useNavigate, useRevalidator, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
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
  Upload,
  Languages,
  Eye,
  Sparkles,
  Pin,
} from "lucide-react";
import {
  Badge,
  Banner,
  Card,
  Page,
  PageHeader,
  PrimaryButton,
  ProLockedButton,
  SecondaryButton,
  SHOPIFY_GREEN,
  Stack,
} from "../admin-ui";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import {
  languageLabel,
  reviewHasTranslation,
} from "../../lib/review-translation.shared.js";
import {
  isStoreReviewProduct,
  normalizeProductLookup,
  resolveProductFromUrlParams,
} from "../../lib/reviews-management.shared.js";

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

export function ReviewsWorkspace({
  scope = "product",
  embedded = false,
  products,
  storeReviews = [],
  storeReviewLink,
  stats,
  currentShop,
  translation,
  premium,
  aiAvailable,
  storeEmptyState,
}) {
  const scopedProducts = useMemo(() => {
    if (scope === "store") return [];
    return (products ?? []).filter((p) => !isStoreReviewProduct(p));
  }, [products, scope]);

  const storeProduct = useMemo(() => {
    if (scope !== "store" || !storeReviews?.length) return null;
    const totalRating = storeReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      productName: "Store reviews",
      productImage: null,
      reviews: storeReviews,
      avgRating: (totalRating / storeReviews.length).toFixed(1),
      reviewCount: storeReviews.length,
      latestDate: storeReviews[0]?.createdAt,
    };
  }, [scope, storeReviews]);

  const location = useLocation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const productParam = searchParams.get("product");
  const pidParam = searchParams.get("pid");
  const modeReply = searchParams.get("mode") === "reply";

  const urlIntentKey = useMemo(
    () => `${productParam ?? ""}|${pidParam ?? ""}|${modeReply ? "1" : ""}`,
    [productParam, pidParam, modeReply],
  );

  const productFromUrl = useMemo(() => {
    return resolveProductFromUrlParams(scopedProducts, productParam, pidParam);
  }, [productParam, pidParam, scopedProducts]);

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
    if (!q) return scopedProducts;
    return scopedProducts.filter((p) => {
      const name = String(p.productName ?? "").toLowerCase();
      const pid = String(p.reviews?.[0]?.productId ?? "").toLowerCase();
      return name.includes(q) || pid.includes(q);
    });
  }, [scopedProducts, listSearch]);

  const pendingReplyTotal = useMemo(() => {
    const source =
      scope === "store"
        ? storeReviews
        : scopedProducts.flatMap((p) => p.reviews ?? []);
    return source.filter((r) => !r.reply || !String(r.reply).trim()).length;
  }, [scope, scopedProducts, storeReviews]);

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

  const importHref = mergeShopifyEmbedParams("/app/collect-reviews?tab=import", location.search);

  const goToImport = useCallback(() => {
    if (typeof shopify?.navigate === "function") {
      shopify.navigate(importHref);
    } else {
      navigate(importHref);
    }
  }, [shopify, importHref, navigate]);

  const storeStats = useMemo(() => {
    if (scope !== "store" || !storeReviews?.length) {
      return { totalReviews: 0, avgRating: "0.0", pending: 0 };
    }
    const total = storeReviews.length;
    const avg = (storeReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
    const pending = storeReviews.filter((r) => !r.reply || !String(r.reply).trim()).length;
    return { totalReviews: total, avgRating: avg, pending };
  }, [scope, storeReviews]);

  const workspaceBody = (
    <Stack>
      {importBanner ? (
        <Banner tone="success" icon={<CheckCircle2 size={18} />}>
          Successfully imported {importBanner.imported.toLocaleString()} review
          {importBanner.imported === 1 ? "" : "s"}.
          {importBanner.skipped > 0
            ? ` ${importBanner.skipped.toLocaleString()} duplicate or skipped row${importBanner.skipped === 1 ? "" : "s"}.`
            : ""}
        </Banner>
      ) : null}

      {!embedded ? (
        <div style={styles.statsGrid}>
          <StatCard
            title={scope === "store" ? "Store reviews" : "Total reviews"}
            value={
              scope === "store"
                ? storeStats.totalReviews.toLocaleString()
                : stats.totalReviews.toLocaleString()
            }
            icon={<Inbox size={20} color={SHOPIFY_GREEN} />}
            subtitle={
              scope === "store"
                ? `${storeStats.pending} awaiting reply`
                : `${stats.totalGrowth}% vs last month`
            }
            trend={scope === "store" ? undefined : Number(stats.totalGrowth) >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Average rating"
            value={scope === "store" ? storeStats.avgRating : stats.avgRating}
            isRating
            icon={<Star size={20} color="#f59e0b" fill="#f59e0b" />}
            subtitle={scope === "store" ? "Across store reviews" : "Across all products"}
          />
          {scope !== "store" ? (
            <StatCard
              title="New this month"
              value={stats.reviewsThisMonth}
              icon={<TrendingUp size={20} color={SHOPIFY_GREEN} />}
              subtitle={`${stats.reviewsGrowth}% growth`}
              trend={stats.reviewsGrowth >= 0 ? "up" : "down"}
            />
          ) : null}
        </div>
      ) : null}

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
          {pendingReplyTotal === 1 ? "" : "s"} still need{pendingReplyTotal === 1 ? "s" : ""} a store reply.
        </div>
      ) : null}

      {scope === "store" ? (
        storeReviews.length === 0 ? (
          storeEmptyState ?? (
            <Card>
              <p style={{ margin: 0, padding: 24, textAlign: "center", color: "#6d7175", fontWeight: 600 }}>
                No store reviews yet.
              </p>
            </Card>
          )
        ) : (
          <Card>
            <ProductReviewsPanel
              product={storeProduct}
              currentShop={currentShop}
              modeReply={modeReply}
              translation={translation}
              premium={premium}
              aiAvailable={aiAvailable}
              variant="inline"
            />
          </Card>
        )
      ) : (
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
                      {scopedProducts.length === 0
                        ? "No product reviews yet. Reviews will appear here once customers start leaving feedback."
                        : "No products match your search."}
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
      )}
    </Stack>
  );

  if (embedded) {
    return (
      <>
        {workspaceBody}
        {selectedProduct && scope !== "store" ? (
          <ProductReviewsModal
            product={selectedProduct}
            currentShop={currentShop}
            modeReply={modeReply}
            onClose={closeModal}
            translation={translation}
            premium={premium}
            aiAvailable={aiAvailable}
          />
        ) : null}
      </>
    );
  }

  return (
    <Page>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <PageHeader
          title="Reviews"
          subtitle="Monitor customer feedback, reply to reviews, and keep your catalog trusted."
        />
        <div style={{ marginTop: 8, flexShrink: 0 }}>
          <PrimaryButton onClick={goToImport}>
            <Upload size={16} />
            Import Reviews
          </PrimaryButton>
        </div>
      </div>

      {workspaceBody}

      {selectedProduct && scope !== "store" ? (
        <ProductReviewsModal
          product={selectedProduct}
          currentShop={currentShop}
          modeReply={modeReply}
          onClose={closeModal}
          translation={translation}
          premium={premium}
          aiAvailable={aiAvailable}
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

export function ProductReviewsModal({
  product,
  currentShop,
  modeReply,
  onClose,
  translation,
  premium,
  aiAvailable,
  formAction,
  showcaseReviewIds = [],
}) {
  return (
    <div style={modalStyles.overlay} onClick={onClose} role="presentation">
      <div
        style={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="reviews-modal-title"
      >
        <ProductReviewsPanel
          product={product}
          currentShop={currentShop}
          modeReply={modeReply}
          translation={translation}
          premium={premium}
          aiAvailable={aiAvailable}
          onClose={onClose}
          variant="modal"
          formAction={formAction}
          showcaseReviewIds={showcaseReviewIds}
        />
      </div>
    </div>
  );
}

function ProductReviewsPanel({
  product,
  currentShop,
  modeReply,
  translation,
  premium,
  aiAvailable,
  variant = "inline",
  onClose,
  formAction,
  showcaseReviewIds = [],
}) {
  const scrollAreaRef = useRef(null);
  const bulkFetcher = useFetcher();
  const showcaseFetcher = useFetcher();
  const shopify = useAppBridge();
  const revalidator = useRevalidator();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [localShowcaseIds, setLocalShowcaseIds] = useState(() => new Set(showcaseReviewIds));
  const [localReviews, setLocalReviews] = useState(product.reviews ?? []);
  const needsReplyCount = localReviews.filter(
    (r) => !r.reply || !String(r.reply).trim(),
  ).length;

  useEffect(() => {
    setLocalReviews(product.reviews ?? []);
    setSelectedIds(new Set());
  }, [product]);

  useEffect(() => {
    setLocalShowcaseIds(new Set(showcaseReviewIds));
  }, [showcaseReviewIds]);

  useEffect(() => {
    if (showcaseFetcher.state !== "idle" || !showcaseFetcher.data) return;
    if (showcaseFetcher.data.ok && showcaseFetcher.data.config) {
      setLocalShowcaseIds(new Set(showcaseFetcher.data.config.selectedReviewIds || []));
      shopify?.toast?.show?.("Showcase selection updated");
    } else if (showcaseFetcher.data.error) {
      shopify?.toast?.show?.(showcaseFetcher.data.error, { isError: true });
    }
  }, [showcaseFetcher.state, showcaseFetcher.data, shopify]);

  useEffect(() => {
    if (bulkFetcher.state !== "idle" || !bulkFetcher.data?.ok) return;
    if (bulkFetcher.data.intent === "translateReviews") {
      setSelectedIds(new Set());
      revalidator.revalidate();
    }
  }, [bulkFetcher.state, bulkFetcher.data, revalidator]);

  const toggleReview = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleShowcase = (reviewId) => {
    const pinned = localShowcaseIds.has(reviewId);
    showcaseFetcher.submit(
      {
        _intent: "toggleShowcaseReview",
        reviewId,
        selected: pinned ? "false" : "true",
      },
      { method: "post", action: formAction },
    );
  };

  const handleBulkTranslate = () => {
    if (selectedIds.size === 0) return;
    bulkFetcher.submit(
      {
        _intent: "translateReviews",
        reviewIds: [...selectedIds].join(","),
      },
      { method: "post", action: formAction },
    );
  };

  const canTranslate = premium && aiAvailable;

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

  const headerContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
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
      {variant === "modal" ? (
        <button type="button" onClick={onClose} style={modalStyles.closeBtn} aria-label="Close">
          <X size={20} color="#5c5f62" />
        </button>
      ) : null}
    </>
  );

  const toolbarContent =
    canTranslate && localReviews.length > 0 ? (
      <div
        style={{
          padding: variant === "modal" ? "10px 20px" : "12px 16px",
          borderBottom: "1px solid #e5ebe8",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          background: "#fafcfb",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6d7175" }}>
          {selectedIds.size} selected
        </span>
        <SecondaryButton
          onClick={handleBulkTranslate}
          disabled={selectedIds.size === 0 || bulkFetcher.state !== "idle"}
          loading={bulkFetcher.state !== "idle"}
        >
          <Languages size={14} />
          Translate selected to {languageLabel(translation.targetLanguage)}
        </SecondaryButton>
        {bulkFetcher.data?.ok && bulkFetcher.data.intent === "translateReviews" ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#008060" }}>
            {bulkFetcher.data.translated} translated
          </span>
        ) : null}
        {bulkFetcher.data?.error ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#d72c0d" }}>
            {bulkFetcher.data.error}
          </span>
        ) : null}
      </div>
    ) : null;

  const reviewsContent = (
    <div
      ref={scrollAreaRef}
      style={
        variant === "modal"
          ? modalStyles.scrollArea
          : {
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              backgroundColor: "#f3f7f5",
            }
      }
    >
      {localReviews.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6d7175", fontWeight: 600, margin: "24px 0" }}>
          No reviews yet.
        </p>
      ) : (
        localReviews.map((rev) => (
          <div key={`${rev.id}-${rev.reply ?? ""}`} data-review-thread={rev.id}>
                <ReviewDetailCard
                  review={rev}
                  currentShop={currentShop}
                  translation={translation}
                  premium={premium}
                  aiAvailable={aiAvailable}
                  selectable={canTranslate}
                  selected={selectedIds.has(rev.id)}
                  onToggleSelect={() => toggleReview(rev.id)}
                  showcasePinned={localShowcaseIds.has(rev.id)}
                  onToggleShowcase={() => toggleShowcase(rev.id)}
                  showcaseLoading={
                    showcaseFetcher.state !== "idle" &&
                    showcaseFetcher.formData?.get("reviewId") === rev.id
                  }
                  onTranslated={(updated) => {
                    setLocalReviews((rows) =>
                      rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
                    );
                  }}
                  formAction={formAction}
                />
          </div>
        ))
      )}
    </div>
  );

  if (variant === "modal") {
    return (
      <>
        <div style={modalStyles.header}>{headerContent}</div>
        {toolbarContent}
        {reviewsContent}
      </>
    );
  }

  return (
    <>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5ebe8",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#fafcfb",
        }}
      >
        {headerContent}
      </div>
      {toolbarContent}
      {reviewsContent}
    </>
  );
}

function ReviewMediaGallery({ media }) {
  if (!media?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 16px" }}>
      {media.map((item) =>
        item.type === "video" ? (
          <video
            key={item.id}
            src={item.url}
            controls
            playsInline
            style={{
              width: 160,
              maxWidth: "100%",
              height: 96,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#0f172a",
            }}
          />
        ) : (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block" }}
          >
            <img
              src={item.url}
              alt={item.filename || "Review photo"}
              style={{
                width: 72,
                height: 72,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            />
          </a>
        ),
      )}
    </div>
  );
}

function ReviewDetailCard({
  review,
  currentShop,
  translation,
  premium,
  aiAvailable,
  selectable = false,
  selected = false,
  onToggleSelect,
  showcasePinned = false,
  onToggleShowcase,
  showcaseLoading = false,
  onTranslated,
  formAction,
}) {
  const storeLabel =
    review.shop && review.shop !== currentShop
      ? review.shop.replace(".myshopify.com", "")
      : null;
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const settingsHref = mergeShopifyEmbedParams("/app/settings", location.search);
  const goToUpgrade = () => navigate(settingsHref);
  const [isEditing, setIsEditing] = useState(!review.reply);
  const [replyText, setReplyText] = useState(review.reply || "");
  const [savedReply, setSavedReply] = useState(review.reply || "");
  const [saveError, setSaveError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [reviewText, setReviewText] = useState({
    title: review.title,
    comment: review.comment,
    originalTitle: review.originalTitle,
    originalComment: review.originalComment,
    translatedLang: review.translatedLang,
  });

  useEffect(() => {
    setReviewText({
      title: review.title,
      comment: review.comment,
      originalTitle: review.originalTitle,
      originalComment: review.originalComment,
      translatedLang: review.translatedLang,
    });
  }, [review]);

  const isSuggesting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("_intent") === "suggestReply";

  const handleSuggestReply = () => {
    setSaveError(null);
    fetcher.submit(
      {
        _intent: "suggestReply",
        reviewId: review.id,
        draftReply: replyText,
      },
      { method: "POST", action: formAction },
    );
  };

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.intent === "suggestReply" && fetcher.data.reviewId === review.id) {
      if (fetcher.data.ok && fetcher.data.suggestedReply) {
        setReplyText(fetcher.data.suggestedReply);
        setIsEditing(true);
        setSaveError(null);
      } else if (fetcher.data.error) {
        setSaveError(fetcher.data.error);
      }
      return;
    }
    if (fetcher.data.intent === "translateReview" && fetcher.data.reviewId === review.id) {
      if (fetcher.data.ok && fetcher.data.review) {
        setReviewText({
          title: fetcher.data.review.title,
          comment: fetcher.data.review.comment,
          originalTitle: fetcher.data.review.originalTitle,
          originalComment: fetcher.data.review.originalComment,
          translatedLang: fetcher.data.review.translatedLang,
        });
        setShowOriginal(true);
        setSaveError(null);
        onTranslated?.(fetcher.data.review);
      } else if (fetcher.data.error) {
        setSaveError(fetcher.data.error);
      }
      return;
    }
    if (fetcher.data.ok && fetcher.data.reviewId === review.id) {
      setSavedReply(fetcher.data.reply ?? replyText);
      setIsEditing(false);
      setSaveError(null);
    } else if (fetcher.data.error) {
      setSaveError(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, review.id]);

  const handleSave = () => {
    if (!replyText.trim()) {
      setSaveError("Reply cannot be empty.");
      return;
    }
    setSaveError(null);
    fetcher.submit({ reviewId: review.id, reply: replyText }, { method: "POST", action: formAction });
  };

  const handleTranslate = () => {
    setSaveError(null);
    fetcher.submit(
      { _intent: "translateReview", reviewId: review.id },
      { method: "POST", action: formAction },
    );
  };

  const hasStoredTranslation = reviewHasTranslation(reviewText);
  const isTranslatedToTarget = reviewText.translatedLang === translation.targetLanguage;
  const canUseTranslate = premium && aiAvailable;
  const canUseSuggestReply = premium && aiAvailable;
  const isTranslating =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("_intent") === "translateReview";

  const displayTitle = showOriginal
    ? reviewText.originalTitle ?? reviewText.title
    : reviewText.title;
  const displayComment = showOriginal
    ? reviewText.originalComment ?? reviewText.comment
    : reviewText.comment;

  const displayedReply = savedReply || review.reply;
  const hasReply = Boolean(displayedReply && String(displayedReply).trim());

  return (
    <article style={detailStyles.card}>
      <div style={detailStyles.cardHeader}>
        <div style={detailStyles.authorRow}>
          {selectable ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select review by ${review.author || "customer"}`}
              style={{ marginTop: 4, flexShrink: 0 }}
            />
          ) : null}
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
              {hasStoredTranslation && reviewText.translatedLang ? (
                <Badge tone="green">
                  Translated · {languageLabel(reviewText.translatedLang)}
                </Badge>
              ) : null}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {onToggleShowcase ? (
            <button
              type="button"
              onClick={onToggleShowcase}
              disabled={showcaseLoading}
              title={showcasePinned ? "Remove from Social Showcase" : "Add to Social Showcase"}
              aria-label={showcasePinned ? "Remove from Social Showcase" : "Add to Social Showcase"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                border: showcasePinned ? "1px solid #008060" : "1px solid #e1e3e5",
                background: showcasePinned ? "#ecfdf5" : "#fff",
                color: showcasePinned ? "#008060" : "#6d7175",
                cursor: showcaseLoading ? "wait" : "pointer",
                opacity: showcaseLoading ? 0.6 : 1,
              }}
            >
              <Pin size={14} fill={showcasePinned ? "#008060" : "none"} />
            </button>
          ) : null}
          <StarRating rating={review.rating} />
        </div>
      </div>

      {displayTitle ? <h3 style={detailStyles.reviewTitle}>{displayTitle}</h3> : null}
      <p style={detailStyles.reviewBody}>{displayComment}</p>
      <ReviewMediaGallery media={review.media} />

      {(canUseTranslate || !premium || hasStoredTranslation) ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {canUseTranslate ? (
            <SecondaryButton
              onClick={handleTranslate}
              disabled={isTranslating}
              loading={isTranslating}
            >
              <Languages size={14} />
              {isTranslatedToTarget ? "Retranslate" : "Translate"}
            </SecondaryButton>
          ) : !premium ? (
            <ProLockedButton onClick={goToUpgrade}>
              <Languages size={14} />
              Translate
            </ProLockedButton>
          ) : null}
          {hasStoredTranslation ? (
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              style={detailStyles.textBtn}
            >
              <Eye size={12} />
              {showOriginal ? "View storefront translation" : "Show original"}
            </button>
          ) : null}
        </div>
      ) : null}

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
              placeholder="Write a helpful, on brand reply for this customer…"
              rows={4}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {canUseSuggestReply ? (
                <SecondaryButton
                  onClick={handleSuggestReply}
                  disabled={isSuggesting || fetcher.state === "submitting"}
                  loading={isSuggesting}
                >
                  <Sparkles size={14} />
                  {isSuggesting ? "Suggesting…" : "Suggest reply"}
                </SecondaryButton>
              ) : !premium ? (
                <ProLockedButton onClick={goToUpgrade}>
                  <Sparkles size={14} />
                  Suggest reply
                </ProLockedButton>
              ) : null}
              <PrimaryButton
                onClick={handleSave}
                disabled={fetcher.state === "submitting"}
                loading={fetcher.state === "submitting" && !isSuggesting}
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
              No reply yet. Customers trust stores that respond.
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
