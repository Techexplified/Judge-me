/* eslint-disable react/prop-types -- dashboard uses many small presentational helpers */
import { useMemo, useState } from "react";
import {
  useLoaderData,
  useFetcher,
  Link,
  useLocation,
  useSearchParams,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import {
  computeDashboardMetrics,
  filterReviewsByRangeStart,
  parseDashboardRange,
  rangeLabel,
  rangeStartFromKey,
  playbookFingerprint,
} from "../utils/dashboard-metrics.server.js";
import {
  getResolvedOpenRouterKey,
  generateReviewDigest,
  generatePlaybook,
} from "../lib/openrouter.server";
import { getTrialStatus } from "../lib/trial.server";
import {
  syncExistingReviews,
  hasRunInitialSync,
  markInitialSyncDone,
} from "../lib/review-sync.server";
import {
  syncProductIndex,
  hasRunProductIndexSync,
  markProductIndexSyncDone,
} from "../lib/product-index.server";
import { getGroupShopList } from "../lib/store-group.server";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Crown,
  Download,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

function reviewsHref(productName, productId, extras = {}) {
  const q = new URLSearchParams();
  q.set("product", String(productName ?? "").trim());
  const pid =
    productId != null && String(productId).trim() !== ""
      ? String(productId).trim()
      : "";
  if (pid) q.set("pid", pid);
  if (extras.mode) q.set("mode", String(extras.mode));
  return `/app/reviews?${q.toString()}`;
}

function reviewFormHref(productName, productId) {
  const q = new URLSearchParams();
  const pid =
    productId != null && String(productId).trim() !== ""
      ? String(productId).trim()
      : "";
  if (pid) q.set("productId", pid);
  if (productName) q.set("productName", String(productName).trim());
  const qs = q.toString();
  return qs ? `/app/review-form?${qs}` : "/app/review-form";
}

function clipText(text, max) {
  const s = text ? String(text).trim() : "";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export async function action({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");

  if (intent === "aiPlaybook") {
    // Check trial status first
    const trialStatus = await getTrialStatus(shop);
    if (!trialStatus.isActive) {
      return { playbookError: "Your 7-day AI trial has ended. Upgrade to unlock AI insights \u0026 playbooks." };
    }

    const apiKey = getResolvedOpenRouterKey();
    if (!apiKey) {
      return { playbookError: "AI service is temporarily unavailable. Please try again later." };
    }

    const row = await db.settings.findUnique({ where: { shop } });
    let config = {};
    if (row?.config) {
      try {
        config = JSON.parse(row.config);
      } catch {
        config = {};
      }
    }

    const rangeRaw = fd.get("range");
    const rangeKey = ["7", "30", "90", "all"].includes(String(rangeRaw))
      ? String(rangeRaw)
      : "all";
    const now = new Date();
    const rangeStart = rangeStartFromKey(now, rangeKey);
    const targetShopsPlaybook = await getGroupShopList(shop);
    const reviewRows = await db.review.findMany({
      where: { shop: { in: targetShopsPlaybook } },
      orderBy: { createdAt: "desc" },
    });
    const scopedReviews = filterReviewsByRangeStart(reviewRows, rangeStart);
    if (!scopedReviews.length) {
      return { playbookError: "No reviews in this date range." };
    }
    const pbFp = playbookFingerprint(shop, rangeKey, scopedReviews);
    const cachedPb = config.aiPlaybookCache;
    if (cachedPb?.fingerprint === pbFp && cachedPb?.playbook) {
      return { playbook: cachedPb.playbook };
    }
    const panel = config.aiDigestCache?.panel;
    const digestForPlaybook =
      panel?.topInsight
        ? {
            topInsight: panel.topInsight,
            urgent: { headline: panel.urgent?.headline || "", pickIds: [] },
            spotlightNote: panel.spotlightNote || "",
          }
        : null;
    const { playbook, error } = await generatePlaybook({
      apiKey,
      reviews: scopedReviews,
      digest: digestForPlaybook,
    });
    if (error) return { playbookError: error };
    const newConfig = {
      ...config,
      aiPlaybookCache: { fingerprint: pbFp, playbook, rangeKey },
    };
    await db.settings.upsert({
      where: { shop },
      update: { config: JSON.stringify(newConfig) },
      create: { shop, config: JSON.stringify(newConfig) },
    });
    return { playbook };
  }

  return {};
}

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  // Auto-sync existing reviews on first install (fire-and-forget, runs once)
  try {
    const alreadySynced = await hasRunInitialSync(shop);
    if (!alreadySynced) {
      syncExistingReviews(admin, shop)
        .then(() => markInitialSyncDone(shop))
        .catch((err) => console.error("[review-sync] error:", err));
    }
  } catch (syncErr) {
    console.error("[review-sync] check failed:", syncErr);
  }

  try {
    const indexSynced = await hasRunProductIndexSync(shop);
    if (!indexSynced) {
      syncProductIndex(admin, shop)
        .then(() => markProductIndexSyncDone(shop))
        .catch((err) => console.error("[product-index] error:", err));
    }
  } catch (indexErr) {
    console.error("[product-index] check failed:", indexErr);
  }

  // Ensure shop record exists and get trial status
  const trialStatus = await getTrialStatus(shop);

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let storedConfig = {};
  if (settingsRow?.config) {
    try {
      storedConfig = JSON.parse(settingsRow.config);
    } catch {
      storedConfig = {};
    }
  }

  // AI features are available if trial is active AND env key is configured
  const openRouterKey = trialStatus.isActive ? getResolvedOpenRouterKey() : null;
  const aiEnabled = Boolean(openRouterKey);

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);

  const targetShops = await getGroupShopList(shop);

  const reviewsAll = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const rangeStart = rangeStartFromKey(now, rangeKey);
  const scopedReviews = filterReviewsByRangeStart(reviewsAll, rangeStart);

  const {
    kpis,
    products,
    urgentCandidates,
    urgentNeedsCount,
    spotlightCandidate,
    digestFingerprint: digestFp,
  } = computeDashboardMetrics({
    shop,
    scopedReviews,
    reviewsAll,
    now,
    rangeKey,
  });

  const totalReviews = scopedReviews.length;

  let aiPanel = null;
  let aiError = null;

  if (aiEnabled && totalReviews > 0) {
    const cached = storedConfig.aiDigestCache;
    if (cached?.fingerprint === digestFp && cached?.panel) {
      // Cache hit — use immediately, no API call
      aiPanel = cached.panel;
    } else {
      // Cache miss — try the AI call but with a strict timeout so we never
      // block the page render (the React stream timeout is 10 s).
      try {
        const AI_LOADER_TIMEOUT_MS = 8000;
        const aiPromise = (async () => {
          const stats = {
            totalReviews,
            avgRating: kpis.avgRating,
            negativeCount: scopedReviews.filter((r) => r.rating <= 2).length,
          };
          const { digest, error } = await generateReviewDigest({
            apiKey: openRouterKey,
            urgentCandidates,
            spotlightCandidate: spotlightCandidate
              ? {
                  excerpt: spotlightCandidate.quote,
                  author: spotlightCandidate.author,
                  rating: spotlightCandidate.rating,
                }
              : null,
            stats,
          });
          return { digest, error };
        })();

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ digest: null, error: "AI timed out" }), AI_LOADER_TIMEOUT_MS),
        );

        const { digest, error } = await Promise.race([aiPromise, timeoutPromise]);

        if (error) {
          aiError = error;
        } else if (digest) {
          const snippetRows = digest.urgent.pickIds
            .map((id) => urgentCandidates.find((c) => c.id === id))
            .filter(Boolean)
            .map((c) => ({
              id: c.id,
              text: c.excerpt,
              authorInitial: c.authorInitial,
            }));
          const fallbackSnippets = urgentCandidates.slice(0, 2).map((c) => ({
            id: c.id,
            text: c.excerpt,
            authorInitial: c.authorInitial,
          }));
          aiPanel = {
            topInsight: digest.topInsight,
            urgent: {
              headline: digest.urgent.headline,
              count: urgentNeedsCount,
              snippets: snippetRows.length > 0 ? snippetRows : fallbackSnippets,
            },
            spotlight:
              spotlightCandidate || {
                quote: "Once five-star reviews come in, a standout quote will appear here.",
                author: "Your customers",
                rating: 5,
                verified: false,
              },
            spotlightNote: digest.spotlightNote,
          };
          const newConfig = {
            ...storedConfig,
            aiDigestCache: { fingerprint: digestFp, panel: aiPanel },
          };
          await db.settings.upsert({
            where: { shop },
            update: { config: JSON.stringify(newConfig) },
            create: { shop, config: JSON.stringify(newConfig) },
          });
        }
      } catch (aiErr) {
        // Never let AI failures crash the page
        aiError = aiErr instanceof Error ? aiErr.message : "AI analysis failed";
        console.error("[dashboard-loader] AI digest error:", aiErr);
      }
    }
  }

  return {
    kpis,
    products,
    aiEnabled,
    totalReviews,
    aiPanel,
    aiError,
    urgentNeedsCount,
    rangeKey,
    metricsRangeLabel: rangeLabel(rangeKey),
    shop,
    trialStatus: {
      isActive: trialStatus.isActive,
      daysRemaining: trialStatus.daysRemaining === Infinity ? null : trialStatus.daysRemaining,
      planStatus: trialStatus.planStatus,
      trialEndsAt: trialStatus.trialEndsAt.toISOString(),
    },
  };
};

function parseFilenameFromContentDisposition(header) {
  if (!header || typeof header !== "string") return null;
  const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted) return quoted[1];
  const loose = /filename=([^;\n]+)/i.exec(header);
  if (loose) return loose[1].trim().replace(/^"|"$/g, "");
  return null;
}

async function blobLooksLikePdf(blob) {
  if (!blob || blob.size === 0) return false;
  const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
}

function scheduleRevokeObjectURL(url, ms = 120_000) {
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, ms);
}

function notifyExport(shopify, message, isError) {
  try {
    shopify?.toast?.show?.(message, isError ? { isError: true } : undefined);
  } catch {
    /* ignore */
  }
  if (isError && typeof window !== "undefined") {
    window.console?.error?.("[export-pdf]", message);
  }
}

/**
 * Saves PDF bytes without `blob:` in a child window (blocked by Shopify admin CSP) or
 * `about:blank` popups (stuck tab). Prefer native save picker when available.
 */
async function savePdfBlobToDisk(blob, filename, shopify) {
  if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "PDF",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(await blob.arrayBuffer());
      await writable.close();
      notifyExport(shopify, "PDF saved.");
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
      window.console?.warn?.("[export-pdf] showSaveFilePicker failed, falling back", e);
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.msSaveOrOpenBlob === "function") {
    navigator.msSaveOrOpenBlob(blob, filename);
    notifyExport(shopify, "PDF saved.");
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  scheduleRevokeObjectURL(objectUrl);
  notifyExport(shopify, "PDF download started.");
}

function ExportPdfLink({ rangeKey, disabled }) {
  const { search } = useLocation();
  const shopify = useAppBridge();
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState(null);

  const path = mergeShopifyEmbedParams(
    `/app/export-report?range=${encodeURIComponent(rangeKey)}&includePlaybook=1`,
    search,
  );

  if (disabled) {
    return (
      <span
        style={{
          ...s.pill,
          opacity: 0.55,
          cursor: "not-allowed",
          pointerEvents: "none",
        }}
        aria-disabled="true"
      >
        <Download size={14} /> Export PDF
      </span>
    );
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => {
          setExportError(null);
          void (async () => {
            setBusy(true);
            try {
              const url =
                typeof window !== "undefined"
                  ? new URL(path, window.location.origin).href
                  : path;

              /** App Bridge intercepts global `fetch` and adds the ID token for same-app requests. */
              const res = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
              });

              if (!res.ok) {
                const msg =
                  res.status === 401 || res.status === 403
                    ? "Could not authorize PDF export. Reload the app and try again."
                    : `Export failed (${res.status}). Try again.`;
                setExportError(msg);
                notifyExport(shopify, msg, true);
                return;
              }

              const blob = await res.blob();
              const contentType = (res.headers.get("Content-Type") || "").toLowerCase();
              const looksPdf =
                contentType.includes("application/pdf") || (await blobLooksLikePdf(blob));

              if (!looksPdf) {
                const msg = "Server did not return a PDF (try reloading the app).";
                setExportError(msg);
                notifyExport(shopify, msg, true);
                return;
              }

              const filename =
                parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ||
                `review-report-${rangeKey}.pdf`;

              await savePdfBlobToDisk(blob, filename, shopify);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Could not download the PDF.";
              setExportError(message);
              notifyExport(shopify, message, true);
            } finally {
              setBusy(false);
            }
          })();
        }}
        style={{
          ...s.pill,
          fontFamily: "inherit",
          border: "none",
          ...(busy ? { opacity: 0.75, cursor: "wait" } : {}),
        }}
      >
        <Download size={14} /> {busy ? "Exporting…" : "Export PDF"}
      </button>
      {exportError ? (
        <span style={{ fontSize: 12, color: "#b91c1c", maxWidth: 280, textAlign: "right" }} role="alert">
          {exportError}
        </span>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const {
    kpis,
    products,
    aiEnabled,
    totalReviews,
    aiPanel,
    aiError,
    urgentNeedsCount,
    rangeKey,
    metricsRangeLabel,
    shop,
    trialStatus,
  } = useLoaderData();
  const [, setSearchParams] = useSearchParams();
  const playbookFetcher = useFetcher();
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [sortKey, setSortKey] = useState("lastReview");
  const [sortDir, setSortDir] = useState("desc");

  const playbookBusy = playbookFetcher.state !== "idle";
  const totalReviewBars = buildTotalReviewBars(kpis.totalReviews);

  const filteredProducts = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    let list = products;
    if (q) {
      list = products.filter((p) => {
        const name = String(p.productName ?? "").toLowerCase();
        const pid = String(p.productId ?? "").toLowerCase();
        const sku = String(p.sku ?? "").toLowerCase();
        return name.includes(q) || pid.includes(q) || sku.includes(q);
      });
    }
    const mul = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === "name") return mul * String(a.productName).localeCompare(String(b.productName));
      if (sortKey === "rating") return mul * (Number.parseFloat(a.avgRating) - Number.parseFloat(b.avgRating));
      if (sortKey === "count") return mul * (a.reviewCount - b.reviewCount);
      return mul * (new Date(a.lastReviewAt).getTime() - new Date(b.lastReviewAt).getTime());
    });
  }, [products, tableSearch, sortKey, sortDir]);

  const runPlaybook = () => {
    setPlaybookOpen(true);
    playbookFetcher.submit(
      { _intent: "aiPlaybook", range: rangeKey },
      { method: "post" },
    );
  };

  const closePlaybook = () => {
    setPlaybookOpen(false);
  };

  return (
    <div style={s.page}>
      <style dangerouslySetInnerHTML={{ __html: responsive }} />

      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.metricsRangeHint}>Showing {metricsRangeLabel}</p>
        </div>
        <div style={s.headerActions}>
          <label style={s.rangeWrap}>
            <CalendarDays size={14} aria-hidden />
            <select
              aria-label="Report date range"
              value={rangeKey}
              onChange={(e) => {
                const v = e.target.value;
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("range", v);
                    return next;
                  },
                  { replace: true },
                );
              }}
              style={s.rangeSelect}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <ExportPdfLink rangeKey={rangeKey} disabled={totalReviews === 0} />
        </div>
      </div>

      <div style={s.body} className="dBody">
        <div style={s.left}>
          <div style={s.kpiWrap} className="dKpiWrap">
            <div style={s.kpiTopRow} className="dKpiTopRow">
              <div style={s.kpiTopCell}>
                <Card compact>
                  <div style={s.cardHeadCompact}>
                    <span style={{ ...s.cardIcon, ...s.cardIconCompact }}><MessageSquare size={15} /></span>
                    <Badge tone="green"><ArrowUpRight size={12} />{kpis.totalTrend}</Badge>
                  </div>
                  <div style={s.kpiMetricRowCompact}>
                    <div style={s.bigNumCompact}>{kpis.totalReviews}</div>
                    <MiniBarGraph values={totalReviewBars} />
                  </div>
                  <div style={s.cardLabelCompact}>Total Reviews</div>
                </Card>
              </div>

              <div style={s.kpiTopCell}>
                <Card compact>
                  <div style={s.cardHeadCompact}>
                    <span style={{ ...s.cardIcon, ...s.cardIconCompact, background: "#f6f6f7", color: "#b98900" }}><Star size={15} /></span>
                    <Badge tone="red"><ArrowUpRight size={12} />{kpis.avgDelta}</Badge>
                  </div>
                  <div style={s.bigNumCompact}>{kpis.avgRating}</div>
                  <div style={s.starsRowCompact} aria-hidden="true">{"★★★★☆"}</div>
                  <div style={s.cardLabelCompact}>Average Rating</div>
                </Card>
              </div>
            </div>

            <div style={s.kpiBottomRow} className="dKpiBottomRow">
              <div style={s.kpiVelCell}>
                <Card style={{ ...s.kpiChartCard, ...s.cardChartDense }}>
                  <div style={s.cardHead}>
                    <span style={{ ...s.cardIcon, background: "#ecfdf3", color: SHOPIFY_GREEN }}><TrendingUp size={16} /></span>
                    <Badge tone="green">High</Badge>
                  </div>
                  <div style={s.bigNum}>+{kpis.velocityPerWeek} / week</div>
                  <div style={s.cardLabel}>Review Velocity</div>
                  <VelocitySparkline />
                </Card>
              </div>

              <div style={s.kpiSentCell}>
                <SentimentCard sentiment={kpis.sentiment} />
              </div>
            </div>
          </div>

          <Card noPad>
            <div style={s.tableTop}>
              <div>
                <span style={s.tableH}>Product Reviews</span>
                <span style={s.totalBadge}>{kpis.totalReviews} in range</span>
              </div>
              <div style={s.tableTools}>
                <div style={s.searchBox}>
                  <Search size={14} />
                  <input
                    placeholder="Search products…"
                    style={{ ...s.searchInput, width: 160 }}
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    aria-label="Search products"
                  />
                </div>
                <label style={s.sortLabel}>
                  <span style={s.sortLabelText}>Sort</span>
                  <select
                    value={`${sortKey}:${sortDir}`}
                    onChange={(e) => {
                      const [k, d] = String(e.target.value).split(":");
                      setSortKey(k);
                      setSortDir(d);
                    }}
                    style={s.sortSelect}
                    aria-label="Sort products"
                  >
                    <option value="lastReview:desc">Newest activity</option>
                    <option value="lastReview:asc">Oldest activity</option>
                    <option value="name:asc">Product A–Z</option>
                    <option value="name:desc">Product Z–A</option>
                    <option value="rating:desc">Rating high → low</option>
                    <option value="rating:asc">Rating low → high</option>
                    <option value="count:desc">Most reviews</option>
                    <option value="count:asc">Fewest reviews</option>
                  </select>
                </label>
              </div>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Product</th>
                  <th style={s.th}>Rating</th>
                  <th style={s.th}>Reviews</th>
                  <th style={s.th}>Sentiment</th>
                  <th style={s.th}>Last Review</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.prodCell}>
                        {p.productImage ? (
                          <div style={{ ...s.prodDot, overflow: "hidden", backgroundColor: SURFACE_MUTED }}>
                            <img src={p.productImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          </div>
                        ) : (
                          <div style={{ ...s.prodDot, ...dotColor(p.iconTone) }} />
                        )}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={s.prodName}>{p.productName}</div>
                            {p.originShop !== shop && (
                              <Badge tone="blue">{p.originLabel}</Badge>
                            )}
                          </div>
                          <div style={s.prodSku}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.ratingCell}><Star size={13} fill="#b98900" stroke="#b98900" /> {p.avgRating}</div>
                    </td>
                    <td style={s.td}>{p.reviewCount}</td>
                    <td style={s.td}><SentimentChip v={p.sentiment} /></td>
                    <td style={{ ...s.td, color: "#8c9196" }}>{p.lastReview}</td>
                    <td style={{ ...s.td, textAlign: "right", position: "relative", zIndex: 2 }}>
                      <div style={s.actRow}>
                        <ActionLink to={reviewsHref(p.productName, p.productId)}>
                          View
                        </ActionLink>
                        <ActionLink to={reviewsHref(p.productName, p.productId, { mode: "reply" })}>
                          Reply
                        </ActionLink>
                        <ActionLink
                          to={reviewFormHref(p.productName, p.productId)}
                          feature
                        >
                          Widget
                        </ActionLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <aside style={s.aside} className="dAside">
          {/* ── Trial status banner ─────────────────────────────── */}
          <TrialBanner trialStatus={trialStatus} />

          <div style={s.asideStack}>
            {!trialStatus.isActive ? (
              <div style={s.aiErrorCard}>
                <p style={s.aiErrorTitle}>AI trial ended</p>
                <p style={s.aiErrorBody}>
                  AI-powered insights, playbooks, and analysis require an upgrade. All other features (reviews, widgets, editor) continue to work.
                </p>
              </div>
            ) : totalReviews === 0 ? (
              <div style={s.aiEmptyCard}>
                <p style={s.aiEmptyTitle}>Start collecting reviews</p>
                <p style={s.aiEmptyText}>
                  Add the theme block to product pages or use Write a review in the app—then analysis will appear here.
                </p>
              </div>
            ) : aiError ? (
              <div style={s.aiErrorCard}>
                <p style={s.aiErrorTitle}>Analysis unavailable</p>
                <p style={s.aiErrorBody}>{clipText(aiError, 280)}</p>
              </div>
            ) : aiPanel ? (
              <>
                <TopInsightCard
                  panel={aiPanel}
                  onViewFullAnalysis={runPlaybook}
                  disabled={playbookBusy}
                />
                <UrgentCard panel={aiPanel} urgentNeedsCount={urgentNeedsCount} />
                <SpotlightCard panel={aiPanel} />
              </>
            ) : (
              <div style={s.aiEmptyCard}>
                <p style={s.aiEmptyText}>Loading analysis…</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {playbookOpen ? (
        <PlaybookModal
          playbook={playbookFetcher.data?.playbook}
          error={playbookFetcher.data?.playbookError}
          busy={playbookBusy}
          onClose={closePlaybook}
        />
      ) : null}
    </div>
  );
}

function trendArrow(trend) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "↔";
}

function tagStyle(trend) {
  if (trend === "up") {
    return { background: "#ecfdf3", color: "#008060", borderColor: "#aee9d1" };
  }
  if (trend === "down") {
    return { background: "#fff4f4", color: "#d72c0d", borderColor: "#fed3d1" };
  }
  return { background: "#f6f6f7", color: "#5c5f62", borderColor: "#e1e3e5" };
}

function TopInsightCard({ panel, onViewFullAnalysis, disabled }) {
  const headline = panel.topInsight?.headline || "";
  const tags = panel.topInsight?.tags || [];
  return (
    <div style={s.aiTopCard}>
      <div style={s.aiTopCardHead}>
        <span style={s.aiTopIcon}>
          <Sparkles size={16} color="#008060" />
        </span>
        <span style={s.aiTopBadge}>Top Insight</span>
      </div>
      <h2 style={s.aiTopHeadline}>{headline}</h2>
      <div style={s.aiTagRow}>
        {tags.map((t) => (
          <span
            key={`${t.label}-${t.trend}`}
            style={{ ...s.aiTag, ...tagStyle(t.trend) }}
          >
            {t.label} {trendArrow(t.trend)}
          </span>
        ))}
      </div>
      <div style={s.aiTopDivider} />
      <button
        type="button"
        style={{
          ...s.aiTopLink,
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? "wait" : "pointer",
        }}
        onClick={onViewFullAnalysis}
        disabled={disabled}
      >
        <Lightbulb size={15} color="#008060" />
        {disabled ? "Opening playbook…" : "View full analysis"}
      </button>
    </div>
  );
}

function UrgentCard({ panel, urgentNeedsCount }) {
  const { search } = useLocation();
  const snippets = panel.urgent.snippets || [];
  const headline =
    urgentNeedsCount > 0
      ? `${urgentNeedsCount} review${urgentNeedsCount === 1 ? "" : "s"} need${urgentNeedsCount === 1 ? "s" : ""} a response.`
      : "You're caught up on urgent replies.";

  return (
    <div style={s.aiUrgentCard}>
      <div style={s.aiUrgentHead}>
        <span style={s.aiUrgentIcon}>
          <AlertTriangle size={16} color="#d72c0d" />
        </span>
        <span style={s.aiUrgentBadge}>
          <span style={s.aiUrgentDot} />
          Urgent
        </span>
      </div>
      <h2 style={s.aiUrgentTitle}>{headline}</h2>
      <div style={s.aiSnippetStack}>
        {snippets.length === 0 ? (
          <p style={s.aiSnippetEmpty}>No urgent review snippets right now.</p>
        ) : (
          snippets.slice(0, 2).map((sn) => (
            <div key={sn.id} style={s.aiSnippet}>
              <span style={s.aiSnippetAv}>{sn.authorInitial}</span>
              <span style={s.aiSnippetText}>&ldquo;{clipText(sn.text, 90)}&rdquo;</span>
            </div>
          ))
        )}
      </div>
      <Link to={mergeShopifyEmbedParams("/app/reviews", search)} style={s.aiUrgentCta}>
        <MessageCircle size={18} color="#fff" />
        Respond now
      </Link>
    </div>
  );
}

function SpotlightCard({ panel }) {
  const sp = panel.spotlight || {
    quote: "",
    author: "Customer",
    rating: 5,
    verified: false,
  };
  const n = Math.min(5, Math.max(0, Number(sp.rating) || 0));
  return (
    <div style={s.aiSpotCard}>
      <div style={s.aiSpotHead}>
        <span style={s.aiSpotIcon}>
          <Crown size={16} color="#b98900" />
        </span>
        <div style={s.aiSpotStars} aria-label={`${n} of 5 stars`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={15}
              fill={i <= n ? "#b98900" : "none"}
              stroke="#b98900"
            />
          ))}
        </div>
      </div>
      <div style={s.aiSpotQuoteBox}>
        <div style={s.aiSpotQuoteMark}>&ldquo;</div>
        <p style={s.aiSpotQuote}>{clipText(sp.quote, 320)}</p>
        <div style={s.aiSpotAttr}>
          <span style={s.aiSpotAv}>{(sp.author && sp.author[0] ? sp.author[0] : "?").toUpperCase()}</span>
          <span style={s.aiSpotName}>
            {sp.author}
            {sp.verified ? <span style={s.aiSpotVerified}> • Verified</span> : null}
          </span>
        </div>
      </div>
      {panel.spotlightNote ? (
        <p style={s.aiSpotNote}>{panel.spotlightNote}</p>
      ) : null}
    </div>
  );
}

function TrialBanner({ trialStatus }) {
  if (!trialStatus) return null;

  const { isActive, daysRemaining, planStatus } = trialStatus;

  if (planStatus === "active") {
    return (
      <div style={s.trialCard}>
        <div style={s.trialHead}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: SHOPIFY_GREEN, flexShrink: 0 }} />
          <span style={s.trialHeadText}>AI Pro — Active</span>
        </div>
        <p style={s.trialSubtext}>AI insights, playbooks & analysis are enabled.</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div style={s.trialExpiredCard}>
        <div style={s.trialHead}>
          <AlertTriangle size={16} color={CRITICAL_RED} />
          <span style={{ ...s.trialHeadText, color: "#8e1f0b" }}>AI trial ended</span>
        </div>
        <p style={{ ...s.trialSubtext, color: "#8e1f0b" }}>
          Your 7-day AI trial has ended. Reviews, widgets & all other features still work — only AI insights & playbooks are disabled.
        </p>
      </div>
    );
  }

  const daysText = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;

  return (
    <div style={s.trialActiveCard}>
      <div style={s.trialHead}>
        <Sparkles size={16} color="#008060" />
        <span style={s.trialHeadText}>AI trial</span>
        <span style={s.trialBadge}>{daysText} left</span>
      </div>
      <p style={s.trialSubtext}>
        AI insights, playbooks & analysis are active. All other features are always free.
      </p>
      <div style={s.trialBarTrack}>
        <div style={{ ...s.trialBarFill, width: `${Math.max(5, (daysRemaining / 7) * 100)}%` }} />
      </div>
    </div>
  );
}

function PlaybookModal({ playbook, error, busy, onClose }) {
  return (
    <div style={s.modalRoot} role="dialog" aria-modal="true" aria-labelledby="playbook-title">
      <button type="button" style={s.modalBackdrop} aria-label="Close" onClick={onClose} />
      <div style={s.modalPanel}>
        <div style={s.modalHead}>
          <h2 id="playbook-title" style={s.modalTitle}>
            Improvement playbook
          </h2>
          <button type="button" style={s.modalClose} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {busy ? <p style={s.modalHint}>Generating your playbook…</p> : null}
        {error ? (
          <p style={s.modalError}>{error}</p>
        ) : null}
        {playbook ? (
          <div style={s.modalBody}>
            <p style={s.modalSummary}>{playbook.summary}</p>
            {(playbook.sections ?? []).map((sec) => (
              <div key={sec.title} style={s.modalSection}>
                <h3 style={s.modalSectionTitle}>{sec.title}</h3>
                <ul style={s.modalList}>
                  {(sec.bullets ?? []).map((b) => (
                    <li key={b} style={s.modalLi}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({ children, noPad, style, compact }) {
  return (
    <div
      style={{
        ...s.card,
        ...(compact ? s.cardCompact : {}),
        ...(noPad ? { padding: 0 } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone }) {
  const bg = tone === "green" ? "#ecfdf3" : tone === "red" ? "#fff4f4" : "#f6f6f7";
  const fg = tone === "green" ? "#008060" : tone === "red" ? "#d72c0d" : "#5c5f62";
  const bd = tone === "green" ? "#aee9d1" : tone === "red" ? "#fed3d1" : "#e1e3e5";
  return <span style={{ ...s.badge, background: bg, color: fg, borderColor: bd }}>{children}</span>;
}

function ActionLink({ children, feature, to }) {
  const { search } = useLocation();
  const shopify = useAppBridge();
  const target = mergeShopifyEmbedParams(to, search);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof shopify.navigate === "function") {
          shopify.navigate(target);
        } else {
          open(target, "_self");
        }
      }}
      style={{
        ...(feature ? s.actFeature : s.actBtn),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: 1.2,
        boxSizing: "border-box",
        margin: 0,
        position: "relative",
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      {children}
    </button>
  );
}

const SHOPIFY_GREEN = "#008060";
const SHOPIFY_GREEN_DARK = "#006e52";
const NEUTRAL_SEGMENT = "#d89b00";
const CRITICAL_RED = "#d72c0d";
const PAGE_BG = "#f3f7f5";
const SURFACE_BG = "#fafcfb";
const SURFACE_BORDER = "#e5ebe8";
const SURFACE_MUTED = "#f5f9f7";

function sentimentConicGradient(sentiment) {
  const p = Number.parseFloat(String(sentiment.positivePct).replace(/[^\d.-]/g, ""));
  const n = Number.parseFloat(String(sentiment.neutralPct).replace(/[^\d.-]/g, ""));
  const neg = Number.parseFloat(String(sentiment.negativePct).replace(/[^\d.-]/g, ""));
  const sum = p + n + neg;
  if (![p, n, neg].every((x) => Number.isFinite(x)) || sum <= 0) {
    return `conic-gradient(${SHOPIFY_GREEN} 0 33.33%, ${NEUTRAL_SEGMENT} 33.33% 66.66%, ${CRITICAL_RED} 66.66% 100%)`;
  }
  const a = (p / sum) * 100;
  const b = a + (n / sum) * 100;
  return `conic-gradient(${SHOPIFY_GREEN} 0% ${a}%, ${NEUTRAL_SEGMENT} ${a}% ${b}%, ${CRITICAL_RED} ${b}% 100%)`;
}

function SentimentCard({ sentiment }) {
  const c = sentimentConicGradient(sentiment);
  return (
    <Card style={{ ...s.kpiChartCard, ...s.cardChartDense }}>
      <div style={s.sentCardHeadCompact}>
        <span style={s.sentTitle}>Sentiment Split</span>
        <span style={{ ...s.cardIcon, background: "#f6f6f7", color: "#5c5f62" }}><Sparkles size={16} /></span>
      </div>
      <div style={s.sentRowSent}>
        <div style={{ ...s.donutSent, backgroundImage: c }}>
          <div style={s.donutInnerSent}>
            <div style={s.donutPctSent}>{sentiment.positivePct}%</div>
            <div style={s.donutLabelSent}>Positive</div>
          </div>
        </div>
        <div style={s.sentLegendSent}>
          <Dot color={SHOPIFY_GREEN} label={`Positive ${sentiment.positivePct}%`} compact />
          <Dot color={NEUTRAL_SEGMENT} label={`Neutral ${sentiment.neutralPct}%`} compact />
          <Dot color={CRITICAL_RED} label={`Negative ${sentiment.negativePct}%`} compact />
        </div>
      </div>
    </Card>
  );
}

function sparkPoints(values, w, h, padX, padY) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = padX + (i / (values.length - 1)) * (w - 2 * padX);
      const y = padY + (1 - (v - min) / span) * (h - 2 * padY);
      return `${x},${y}`;
    })
    .join(" ");
}

function VelocitySparkline({ values = [4, 12, 7, 18, 9, 22, 11, 26, 14, 30, 16, 24] }) {
  const w = 300;
  const h = 46;
  const padX = 5;
  const padY = 6;
  const pts = sparkPoints(values, w, h, padX, padY);

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={s.sparkSvgVelocity}
      aria-hidden
    >
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#e1e3e5" strokeWidth="1" />
      <polyline
        fill="none"
        stroke={SHOPIFY_GREEN}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

function Dot({ color, label, compact }) {
  return (
    <div style={s.legendRow}>
      <span style={{ ...s.legendDot, background: color }} />
      <span style={compact ? s.legendLabelSent : s.legendLabel}>{label}</span>
    </div>
  );
}

function buildTotalReviewBars(totalReviews) {
  const n = Number.parseInt(String(totalReviews), 10) || 0;
  const base = Math.max(1, Math.min(6, n));
  return [0.24, 0.42, 0.32, 0.58, 0.46, 0.74, 0.62].map((v, idx) => {
    const scaled = v + base * 0.02 + idx * 0.005;
    return Math.max(0.2, Math.min(1, scaled));
  });
}

function MiniBarGraph({ values }) {
  return (
    <div style={s.miniBarWrap} aria-hidden="true">
      {values.map((v, idx) => (
        <span key={`${idx}-${v}`} style={{ ...s.miniBar, height: `${Math.round(v * 100)}%` }} />
      ))}
    </div>
  );
}

function SentimentChip({ v }) {
  const t =
    v === "Positive"
      ? { bg: "#ecfdf3", fg: "#008060", dot: "#008060" }
      : v === "Negative"
        ? { bg: "#fff4f4", fg: "#d72c0d", dot: "#d72c0d" }
        : { bg: "#f6f6f7", fg: "#5c5f62", dot: "#8c9196" };
  return (
    <span style={{ ...s.chip, background: t.bg, color: t.fg }}>
      <span style={{ ...s.chipDot, background: t.dot }} />
      {v}
    </span>
  );
}

function dotColor(t) {
  if (t === "teal") return { background: "#e8f5f0", borderColor: "#aee9d1" };
  if (t === "indigo") return { background: "#f1f2f4", borderColor: "#c9cccf" };
  if (t === "orange") return { background: "#fff5ea", borderColor: "#e4b06f" };
  return { background: "#f6f6f7", borderColor: "#c9cccf" };
}

const responsive = `
  @media(max-width:1180px){
    .dBody{grid-template-columns:1fr!important;}
    .dAside{position:relative!important;top:0!important;}
    .dKpiWrap{gap:16px!important;}
    .dKpiTopRow{gap:16px!important;}
    .dKpiBottomRow{gap:16px!important;}
  }
  @media(max-width:720px){
    .dKpiBottomRow{grid-template-columns:1fr!important;}
  }
  @media(max-width:640px){
    .dKpiTopRow,
    .dKpiBottomRow{grid-template-columns:1fr!important;}
  }
`;

const R = 8;
const shadow = "none";

const s = {
  page: {
    padding: "20px 24px 32px",
    background: PAGE_BG,
    minHeight: "100vh",
    fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    fontSize: 14,
    color: "#202223",
  },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 20 },
  h1: { margin: 0, fontSize: 30, fontWeight: 900, color: "#202223" },
  metricsRangeHint: { margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175" },
  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  rangeWrap: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: R,
    border: "1px solid #c9cccf",
    background: "#fff",
    boxShadow: "none",
    cursor: "pointer",
  },
  rangeSelect: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontWeight: 700,
    fontSize: 13,
    color: "#202223",
    cursor: "pointer",
    fontFamily: "inherit",
    maxWidth: 140,
  },

  pill: { display: "inline-flex", gap: 6, alignItems: "center", padding: "7px 12px", borderRadius: R, border: "1px solid #c9cccf", background: "#fff", fontWeight: 700, fontSize: 13, color: "#202223", cursor: "pointer", boxShadow: "none" },
  pillPrimary: { display: "inline-flex", gap: 6, alignItems: "center", padding: "7px 12px", borderRadius: R, border: "none", background: SHOPIFY_GREEN, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "none" },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start", minWidth: 0 },
  left: { display: "grid", gap: 16, minWidth: 0 },
  aside: { position: "sticky", top: 16 },

  kpiWrap: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },
  kpiTopRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.22fr) minmax(0, 0.82fr)",
    gap: 16,
    minWidth: 0,
    width: "100%",
    alignItems: "stretch",
  },
  kpiBottomRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.22fr) minmax(0, 0.82fr)",
    gap: 16,
    minWidth: 0,
    width: "100%",
    alignItems: "stretch",
  },
  kpiTopCell: { minWidth: 0, display: "flex", alignItems: "stretch" },
  kpiVelCell: { minWidth: 0, maxWidth: "100%", display: "flex", flexDirection: "column" },
  kpiSentCell: { minWidth: 0, maxWidth: "100%", display: "flex", flexDirection: "column" },
  kpiChartCard: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  cardChartDense: { padding: "16px" },

  card: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    padding: "16px",
    boxShadow: shadow,
    boxSizing: "border-box",
  },
  cardCompact: {
    padding: "16px",
    borderRadius: R,
    width: "100%",
    minHeight: 118,
    display: "flex",
    flexDirection: "column",
  },

  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardHeadCompact: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardIcon: { width: 28, height: 28, borderRadius: 6, background: SURFACE_MUTED, color: "#5c5f62", display: "grid", placeItems: "center" },
  cardIconCompact: { width: 28, height: 28, borderRadius: 6 },
  cardLabel: { fontSize: 12, fontWeight: 700, color: "#6d7175", marginTop: 2 },
  cardLabelCompact: { fontSize: 11, fontWeight: 700, color: "#6d7175", marginTop: 1 },
  kpiMetricRowCompact: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 4,
    width: "100%",
  },
  miniBarWrap: {
    width: 176,
    height: 36,
    display: "flex",
    alignItems: "flex-end",
    gap: 6,
    opacity: 0.9,
    flexShrink: 0,
    borderBottom: "1px solid #d2e8dc",
    paddingBottom: 2,
  },
  miniBar: {
    width: 12,
    borderRadius: "3px 3px 0 0",
    background: SHOPIFY_GREEN,
    display: "block",
  },

  bigNum: { fontSize: 28, fontWeight: 900, color: "#202223", lineHeight: 1.1, margin: "6px 0 0" },
  bigNumCompact: { fontSize: 26, fontWeight: 900, color: "#202223", lineHeight: 1.1, margin: "4px 0 0" },
  starsRow: { color: "#b98900", fontSize: 13, letterSpacing: "0.08em", marginBottom: 2 },
  starsRowCompact: { color: "#b98900", fontSize: 12, letterSpacing: "0.08em", marginBottom: 0 },

  badge: { display: "inline-flex", gap: 4, alignItems: "center", padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 11, border: "1px solid" },

  sentCardHeadCompact: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sentTitle: { fontSize: 13, fontWeight: 800, color: "#6d7175", letterSpacing: "0.02em" },
  sentRowSent: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginTop: 0,
    flexWrap: "wrap",
    width: "100%",
    minWidth: 0,
  },
  donutSent: { width: 88, height: 88, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 },
  donutInnerSent: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: SURFACE_BG,
    border: `2px solid ${SURFACE_BORDER}`,
    display: "grid",
    placeItems: "center",
    padding: "2px",
  },
  donutPctSent: { fontSize: 15, fontWeight: 900, color: "#202223", lineHeight: 1 },
  donutLabelSent: { fontSize: 9, fontWeight: 800, color: "#6d7175" },
  sentLegendSent: { display: "grid", gap: 5, flex: "1 1 0", minWidth: 0 },
  legendRow: { display: "flex", gap: 10, alignItems: "center", minWidth: 0 },
  legendDot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  legendLabel: { fontSize: 13, fontWeight: 700, color: "#5c5f62" },
  legendLabelSent: { fontSize: 12, fontWeight: 700, color: "#5c5f62", overflowWrap: "anywhere" },

  sparkSvgVelocity: { marginTop: 12, display: "block", flexShrink: 0, maxWidth: "100%" },

  tableTop: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: `1px solid ${SURFACE_BORDER}`, gap: 16 },
  tableH: { fontSize: 19, fontWeight: 900, color: "#202223", marginRight: 12 },
  totalBadge: { padding: "5px 12px", borderRadius: 999, background: "#ecfdf3", color: "#008060", fontWeight: 900, fontSize: 12, border: "1px solid #aee9d1" },
  tableTools: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  sortLabel: { display: "inline-flex", gap: 8, alignItems: "center" },
  sortLabelText: { fontSize: 12, fontWeight: 800, color: "#6d7175", textTransform: "uppercase", letterSpacing: "0.06em" },
  sortSelect: {
    padding: "7px 12px",
    borderRadius: R,
    border: "1px solid #c9cccf",
    background: "#fff",
    fontWeight: 700,
    fontSize: 13,
    color: "#202223",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  searchBox: { display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 12px", borderRadius: R, border: "1px solid #c9cccf", background: "#fff", color: "#8c9196" },
  searchInput: { border: "none", outline: "none", fontWeight: 600, fontSize: 13, width: 140, background: "transparent" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 24px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6d7175", fontWeight: 800, background: SURFACE_MUTED },
  tr: { borderBottom: `1px solid ${SURFACE_BORDER}` },
  td: { padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#202223" },

  prodCell: { display: "flex", gap: 12, alignItems: "center" },
  prodDot: { width: 36, height: 36, borderRadius: R, border: "1px solid", flexShrink: 0 },
  prodName: { fontSize: 13, fontWeight: 800, color: "#202223" },
  prodSku: { fontSize: 11, fontWeight: 600, color: "#8c9196", marginTop: 2 },

  ratingCell: { display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 800 },

  chip: { display: "inline-flex", gap: 6, alignItems: "center", padding: "5px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12 },
  chipDot: { width: 7, height: 7, borderRadius: 999 },

  actRow: { display: "inline-flex", gap: 6, position: "relative", zIndex: 2 },
  actBtn: { background: "#fff", border: "1px solid #c9cccf", padding: "6px 12px", borderRadius: R, fontWeight: 800, fontSize: 12, cursor: "pointer", color: "#202223" },
  actFeature: { background: "#fff", border: "1px solid #c9cccf", padding: "6px 12px", borderRadius: R, fontWeight: 800, fontSize: 12, cursor: "pointer", color: "#008060" },

  byokCard: {
    background: "#fff",
    borderRadius: R,
    border: "1px solid #e1e3e5",
    boxShadow: shadow,
    padding: "18px 20px",
    marginBottom: 16,
    display: "grid",
    gap: 10,
  },
  byokHead: { display: "flex", alignItems: "center", gap: 8 },
  byokHeadText: { fontSize: 14, fontWeight: 900, color: "#202223" },
  byokForm: { display: "grid", gap: 8 },
  byokInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #c9cccf",
    fontSize: 13,
    fontWeight: 600,
  },
  byokGuideLink: {
    fontSize: 12,
    fontWeight: 700,
    color: SHOPIFY_GREEN,
    textDecoration: "none",
  },
  byokBtn: {
    marginTop: 4,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: SHOPIFY_GREEN,
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,128,96,0.18)",
  },
  byokChangeBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #c9cccf",
    background: "#f6f6f7",
    fontWeight: 700,
    fontSize: 12,
    color: SHOPIFY_GREEN,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  byokCancelBtn: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    padding: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#8c9196",
    borderRadius: 6,
  },
  byokRemoveBtn: {
    width: "100%",
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #fed3d1",
    background: "#fff4f4",
    color: CRITICAL_RED,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  asideStack: { display: "grid", gap: 16 },

  aiEmptyCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: shadow,
    padding: "16px",
  },
  aiEmptyTitle: { fontSize: 14, fontWeight: 900, color: "#202223", margin: "0 0 8px" },
  aiEmptyText: { fontSize: 13, fontWeight: 600, color: "#6d7175", lineHeight: 1.5, margin: 0 },

  aiErrorCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: "1px solid #fed3d1",
    boxShadow: shadow,
    padding: "16px",
  },
  aiErrorTitle: { fontSize: 14, fontWeight: 900, color: "#8e1f0b", margin: "0 0 8px" },
  aiErrorBody: { fontSize: 13, fontWeight: 600, color: "#8e1f0b", lineHeight: 1.45, margin: 0 },

  aiTopCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: shadow,
    padding: "16px",
    display: "grid",
    gap: 12,
  },
  aiTopCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiTopIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: SURFACE_MUTED,
    display: "grid",
    placeItems: "center",
  },
  aiTopBadge: {
    fontSize: 11,
    fontWeight: 900,
    color: "#6d7175",
    background: "#f6f6f7",
    border: "1px solid #e1e3e5",
    padding: "4px 12px",
    borderRadius: 999,
  },
  aiTopHeadline: { fontSize: 16, fontWeight: 900, color: "#202223", lineHeight: 1.35, margin: 0 },
  aiTagRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  aiTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
  },
  aiTopDivider: { height: 1, background: "#e1e3e5", margin: "2px 0" },
  aiTopLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    color: SHOPIFY_GREEN,
    textAlign: "left",
  },

  aiUrgentCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    borderLeft: `3px solid ${CRITICAL_RED}`,
    boxShadow: shadow,
    padding: "16px",
    display: "grid",
    gap: 12,
  },
  aiUrgentHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiUrgentIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: SURFACE_MUTED,
    display: "grid",
    placeItems: "center",
  },
  aiUrgentBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 900,
    color: CRITICAL_RED,
    background: "#fff4f4",
    border: "1px solid #fed3d1",
    padding: "4px 12px",
    borderRadius: 999,
  },
  aiUrgentDot: { width: 6, height: 6, borderRadius: 999, background: CRITICAL_RED },
  aiUrgentTitle: { fontSize: 15, fontWeight: 900, color: "#202223", lineHeight: 1.35, margin: 0 },
  aiSnippetStack: { display: "grid", gap: 8 },
  aiSnippet: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    background: SURFACE_MUTED,
  },
  aiSnippetAv: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#f6f6f7",
    color: "#5c5f62",
    fontWeight: 900,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  aiSnippetText: { fontSize: 12, fontWeight: 600, color: "#5c5f62", lineHeight: 1.4, margin: 0 },
  aiSnippetEmpty: { fontSize: 12, fontWeight: 600, color: "#8e1f0b", margin: 0, lineHeight: 1.4 },
  aiUrgentCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    padding: "12px 16px",
    borderRadius: R,
    background: CRITICAL_RED,
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    textDecoration: "none",
    boxShadow: "none",
  },

  aiSpotCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: shadow,
    padding: "16px",
    display: "grid",
    gap: 12,
  },
  aiSpotHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiSpotIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "#f6f6f7",
    display: "grid",
    placeItems: "center",
  },
  aiSpotStars: { display: "flex", gap: 2 },
  aiSpotQuoteBox: {
    border: `1px solid ${SURFACE_BORDER}`,
    borderRadius: R,
    padding: "12px",
    background: SURFACE_MUTED,
    position: "relative",
  },
  aiSpotQuoteMark: { fontSize: 28, fontWeight: 900, color: "#c9cccf", lineHeight: 1, marginBottom: 4 },
  aiSpotQuote: { fontSize: 13, fontWeight: 600, color: "#5c5f62", lineHeight: 1.5, margin: "0 0 10px" },
  aiSpotAttr: { display: "flex", alignItems: "center", gap: 10 },
  aiSpotAv: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#f6f6f7",
    color: "#5c5f62",
    fontWeight: 900,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
  },
  aiSpotName: { fontSize: 12, fontWeight: 800, color: "#202223" },
  aiSpotVerified: { fontWeight: 600, color: "#6d7175" },
  aiSpotNote: { fontSize: 12, fontWeight: 600, color: "#6d7175", margin: 0, lineHeight: 1.45 },

  modalRoot: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    border: "none",
    padding: 0,
    margin: 0,
    background: "rgba(32,34,35,0.45)",
    cursor: "pointer",
  },
  modalPanel: {
    position: "relative",
    width: "min(560px, 100%)",
    maxHeight: "min(85vh, 720px)",
    overflow: "auto",
    background: "#fff",
    borderRadius: R,
    boxShadow: "0 24px 48px rgba(32,34,35,0.18)",
    border: "1px solid #e1e3e5",
    padding: "24px 28px",
    zIndex: 1,
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 950, color: "#202223", margin: 0, lineHeight: 1.2 },
  modalClose: {
    border: "none",
    background: "#f6f6f7",
    borderRadius: 10,
    padding: 8,
    cursor: "pointer",
    color: "#5c5f62",
    display: "grid",
    placeItems: "center",
  },
  modalHint: { fontSize: 13, fontWeight: 600, color: "#6d7175", margin: "0 0 12px" },
  modalError: { fontSize: 13, fontWeight: 700, color: CRITICAL_RED, margin: "0 0 12px", lineHeight: 1.45 },
  modalBody: { display: "grid", gap: 20 },
  modalSummary: { fontSize: 14, fontWeight: 600, color: "#5c5f62", lineHeight: 1.55, margin: 0 },
  modalSection: { display: "grid", gap: 10 },
  modalSectionTitle: { fontSize: 15, fontWeight: 900, color: "#202223", margin: 0 },
  modalList: { margin: 0, paddingLeft: 20, display: "grid", gap: 8 },
  modalLi: { fontSize: 13, fontWeight: 600, color: "#5c5f62", lineHeight: 1.45 },

  /* ── Trial banner styles ──────────────────────────────── */
  trialCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: shadow,
    padding: "16px",
    marginBottom: 16,
    display: "grid",
    gap: 6,
  },
  trialActiveCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    boxShadow: shadow,
    padding: "16px",
    marginBottom: 16,
    display: "grid",
    gap: 8,
  },
  trialExpiredCard: {
    background: SURFACE_BG,
    borderRadius: R,
    border: "1px solid #fed3d1",
    boxShadow: shadow,
    padding: "16px",
    marginBottom: 16,
    display: "grid",
    gap: 6,
  },
  trialHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  trialHeadText: {
    fontSize: 14,
    fontWeight: 900,
    color: "#202223",
  },
  trialSubtext: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6d7175",
    margin: 0,
    lineHeight: 1.45,
  },
  trialBadge: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 900,
    color: "#6d7175",
    background: "#f6f6f7",
    border: "1px solid #e1e3e5",
    padding: "3px 10px",
    borderRadius: 999,
  },
  trialBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    background: "#e1e3e5",
    overflow: "hidden",
    marginTop: 2,
  },
  trialBarFill: {
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${SHOPIFY_GREEN}, ${SHOPIFY_GREEN_DARK})`,
    transition: "width 0.4s ease",
  },
};
