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

function clipText(text, max) {
  const s = text ? String(text).trim() : "";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");

  if (intent === "aiPlaybook") {
    const row = await db.settings.findUnique({ where: { shop } });
    let config = {};
    if (row?.config) {
      try {
        config = JSON.parse(row.config);
      } catch {
        config = {};
      }
    }
    const apiKey = getResolvedOpenRouterKey(config);
    if (!apiKey) {
      return { playbookError: "Add your OpenRouter API key first." };
    }
    const rangeRaw = fd.get("range");
    const rangeKey = ["7", "30", "90", "all"].includes(String(rangeRaw))
      ? String(rangeRaw)
      : "30";
    const now = new Date();
    const rangeStart = rangeStartFromKey(now, rangeKey);
    const reviewRows = await db.review.findMany({
      where: { shop },
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

  if (intent !== "openRouter") {
    return {};
  }

  const clear = fd.get("clearOpenRouterKey") === "on";
  const key = fd.get("openRouterApiKey");
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = {};
    }
  }
  if (clear) {
    delete config.openRouterApiKey;
    delete config.aiDigestCache;
    delete config.aiPlaybookCache;
  } else if (typeof key === "string" && key.trim()) {
    config.openRouterApiKey = key.trim();
  }
  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(config) },
    create: { shop, config: JSON.stringify(config) },
  });
  // Return a plain response. React Router automatically revalidates all
  // active loaders after any fetcher action completes — no redirect or
  // manual revalidation needed.
  return { openRouterSaved: true };
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let storedConfig = {};
  if (settingsRow?.config) {
    try {
      storedConfig = JSON.parse(settingsRow.config);
    } catch {
      storedConfig = {};
    }
  }
  const openRouterKey = getResolvedOpenRouterKey(storedConfig);
  const hasOpenRouterKeyFromDb = Boolean(openRouterKey);

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);

  const reviewsAll = await db.review.findMany({
    where: { shop },
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

  if (hasOpenRouterKeyFromDb && totalReviews > 0) {
    const cached = storedConfig.aiDigestCache;
    if (cached?.fingerprint === digestFp && cached?.panel) {
      // Cache hit — use immediately, no API call
      aiPanel = cached.panel;
    } else {
      // Cache miss — try the AI call but with a strict timeout so we never
      // block the page render (the React stream timeout is only 5 s).
      try {
        const AI_LOADER_TIMEOUT_MS = 4000;
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
    hasOpenRouterKeyFromDb,
    totalReviews,
    aiPanel,
    aiError,
    urgentNeedsCount,
    rangeKey,
    metricsRangeLabel: rangeLabel(rangeKey),
    shop,
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
    hasOpenRouterKeyFromDb,
    totalReviews,
    aiPanel,
    aiError,
    urgentNeedsCount,
    rangeKey,
    metricsRangeLabel,
  } = useLoaderData();
  const [, setSearchParams] = useSearchParams();
  const openRouterFetcher = useFetcher();
  const playbookFetcher = useFetcher();
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [sortKey, setSortKey] = useState("lastReview");
  const [sortDir, setSortDir] = useState("desc");
  // Whether to show the change-key form when a key is already configured
  const [showChangeKey, setShowChangeKey] = useState(false);

  const OpenRouterForm = openRouterFetcher.Form;
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
          <div style={s.eyebrow}>Insights Dashboard</div>
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
                    <span style={{ ...s.cardIcon, ...s.cardIconCompact, background: "#fffbeb", color: "#d97706" }}><Star size={15} /></span>
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
                    <span style={{ ...s.cardIcon, background: "rgba(35,181,181,0.14)", color: "#23b5b5" }}><TrendingUp size={16} /></span>
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
                        <div style={{ ...s.prodDot, ...dotColor(p.iconTone) }} />
                        <div>
                          <div style={s.prodName}>{p.productName}</div>
                          <div style={s.prodSku}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.ratingCell}><Star size={13} fill="#fbbf24" stroke="#fbbf24" /> {p.avgRating}</div>
                    </td>
                    <td style={s.td}>{p.reviewCount}</td>
                    <td style={s.td}><SentimentChip v={p.sentiment} /></td>
                    <td style={{ ...s.td, color: "#94a3b8" }}>{p.lastReview}</td>
                    <td style={{ ...s.td, textAlign: "right", position: "relative", zIndex: 2 }}>
                      <div style={s.actRow}>
                        <ActionLink to={reviewsHref(p.productName, p.productId)}>
                          View
                        </ActionLink>
                        <ActionLink to={reviewsHref(p.productName, p.productId, { mode: "reply" })}>
                          Reply
                        </ActionLink>
                        <ActionLink to="/app/editor" feature>
                          Feature
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
          {/* ── API key card ─────────────────────────────────────── */}
          {!hasOpenRouterKeyFromDb ? (
            /* No key yet → show the add-key form */
            <div style={s.byokCard}>
              <div style={s.byokHead}>
                <Sparkles size={16} />
                <span style={s.byokHeadText}>Your API key</span>
              </div>
              <OpenRouterForm method="post" style={s.byokForm}>
                <input type="hidden" name="_intent" value="openRouter" />
                <input
                  id="dash-openrouter-key"
                  name="openRouterApiKey"
                  type="password"
                  autoComplete="off"
                  placeholder="Paste OpenRouter key…"
                  style={s.byokInput}
                  aria-label="OpenRouter API key"
                />
                <a
                  href="https://openrouter.ai/docs/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.byokGuideLink}
                >
                  How to get an OpenRouter API key →
                </a>
                <button
                  type="submit"
                  style={s.byokBtn}
                  disabled={openRouterFetcher.state !== "idle"}
                >
                  {openRouterFetcher.state !== "idle" ? "Saving…" : "Save key"}
                </button>
              </OpenRouterForm>
            </div>
          ) : showChangeKey ? (
            /* Key is set but user clicked Change — show update form */
            <div style={s.byokCard}>
              <div style={s.byokHead}>
                <Sparkles size={16} />
                <span style={s.byokHeadText}>Update API key</span>
                <button
                  type="button"
                  onClick={() => setShowChangeKey(false)}
                  style={s.byokCancelBtn}
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
              <OpenRouterForm method="post" style={s.byokForm}>
                <input type="hidden" name="_intent" value="openRouter" />
                <input
                  id="dash-openrouter-key-change"
                  name="openRouterApiKey"
                  type="password"
                  autoComplete="off"
                  placeholder="Paste new OpenRouter key…"
                  style={s.byokInput}
                  aria-label="New OpenRouter API key"
                />
                <a
                  href="https://openrouter.ai/docs/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.byokGuideLink}
                >
                  How to get an OpenRouter API key →
                </a>
                <button
                  type="submit"
                  style={s.byokBtn}
                  disabled={openRouterFetcher.state !== "idle"}
                >
                  {openRouterFetcher.state !== "idle" ? "Saving…" : "Update key"}
                </button>
              </OpenRouterForm>
              {/* Remove key */}
              <OpenRouterForm method="post" style={{ marginTop: 8 }}>
                <input type="hidden" name="_intent" value="openRouter" />
                <input type="hidden" name="clearOpenRouterKey" value="on" />
                <button
                  type="submit"
                  style={s.byokRemoveBtn}
                  disabled={openRouterFetcher.state !== "idle"}
                >
                  Remove key &amp; disable AI
                </button>
              </OpenRouterForm>
            </div>
          ) : (
            /* Key is set and not editing → show status + change button */
            <div style={{ ...s.byokCard, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>AI key configured</span>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeKey(true)}
                style={s.byokChangeBtn}
              >
                Change key
              </button>
            </div>
          )}

          <div style={s.asideStack}>
            {!hasOpenRouterKeyFromDb ? (
              <div style={s.aiEmptyCard}>
                <p style={s.aiEmptyText}>
                  Save your OpenRouter key in the card above to generate AI analysis from your reviews.
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
    return { background: "#0d9488", color: "#fff", borderColor: "#0f766e" };
  }
  if (trend === "down") {
    return { background: "#fce7f3", color: "#9d174d", borderColor: "#f9a8d4" };
  }
  return { background: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" };
}

function TopInsightCard({ panel, onViewFullAnalysis, disabled }) {
  const headline = panel.topInsight?.headline || "";
  const tags = panel.topInsight?.tags || [];
  return (
    <div style={s.aiTopCard}>
      <div style={s.aiTopCardHead}>
        <span style={s.aiTopIcon}>
          <Sparkles size={16} color="#0d9488" />
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
        <Lightbulb size={15} color="#0d9488" />
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
          <AlertTriangle size={16} color="#dc2626" />
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
          <Crown size={16} color="#ca8a04" />
        </span>
        <div style={s.aiSpotStars} aria-label={`${n} of 5 stars`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={15}
              fill={i <= n ? "#fbbf24" : "none"}
              stroke="#fbbf24"
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
            {playbook.sections.map((sec) => (
              <div key={sec.title} style={s.modalSection}>
                <h3 style={s.modalSectionTitle}>{sec.title}</h3>
                <ul style={s.modalList}>
                  {sec.bullets.map((b) => (
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
  const bg = tone === "green" ? "#ecfdf5" : tone === "red" ? "#fef2f2" : "#f1f5f9";
  const fg = tone === "green" ? "#16a34a" : tone === "red" ? "#ef4444" : "#475569";
  const bd = tone === "green" ? "#bbf7d0" : tone === "red" ? "#fecaca" : "#e2e8f0";
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

const NEUTRAL_SEGMENT = "#fbbf24";

function sentimentConicGradient(sentiment) {
  const p = Number.parseFloat(String(sentiment.positivePct).replace(/[^\d.-]/g, ""));
  const n = Number.parseFloat(String(sentiment.neutralPct).replace(/[^\d.-]/g, ""));
  const neg = Number.parseFloat(String(sentiment.negativePct).replace(/[^\d.-]/g, ""));
  const sum = p + n + neg;
  if (![p, n, neg].every((x) => Number.isFinite(x)) || sum <= 0) {
    return `conic-gradient(#23b5b5 0 33.33%, ${NEUTRAL_SEGMENT} 33.33% 66.66%, #ef4444 66.66% 100%)`;
  }
  const a = (p / sum) * 100;
  const b = a + (n / sum) * 100;
  return `conic-gradient(#23b5b5 0% ${a}%, ${NEUTRAL_SEGMENT} ${a}% ${b}%, #ef4444 ${b}% 100%)`;
}

function SentimentCard({ sentiment }) {
  const c = sentimentConicGradient(sentiment);
  return (
    <Card style={{ ...s.kpiChartCard, ...s.cardChartDense }}>
      <div style={s.sentCardHeadCompact}>
        <span style={s.sentTitle}>Sentiment Split</span>
        <span style={{ ...s.cardIcon, background: "#f1f5f9", color: "#0f172a" }}><Sparkles size={16} /></span>
      </div>
      <div style={s.sentRowSent}>
        <div style={{ ...s.donutSent, backgroundImage: c }}>
          <div style={s.donutInnerSent}>
            <div style={s.donutPctSent}>{sentiment.positivePct}%</div>
            <div style={s.donutLabelSent}>Positive</div>
          </div>
        </div>
        <div style={s.sentLegendSent}>
          <Dot color="#23b5b5" label={`Positive ${sentiment.positivePct}%`} compact />
          <Dot color={NEUTRAL_SEGMENT} label={`Neutral ${sentiment.neutralPct}%`} compact />
          <Dot color="#ef4444" label={`Negative ${sentiment.negativePct}%`} compact />
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
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#e2e8f0" strokeWidth="1" />
      <polyline
        fill="none"
        stroke="#23b5b5"
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
      ? { bg: "#ecfdf5", fg: "#16a34a", dot: "#22c55e" }
      : v === "Negative"
        ? { bg: "#fef2f2", fg: "#ef4444", dot: "#ef4444" }
        : { bg: "#f1f5f9", fg: "#475569", dot: "#94a3b8" };
  return (
    <span style={{ ...s.chip, background: t.bg, color: t.fg }}>
      <span style={{ ...s.chipDot, background: t.dot }} />
      {v}
    </span>
  );
}

function dotColor(t) {
  if (t === "teal") return { background: "#ccfbf1", borderColor: "#5eead4" };
  if (t === "indigo") return { background: "#e0e7ff", borderColor: "#a5b4fc" };
  if (t === "orange") return { background: "#ffedd5", borderColor: "#fdba74" };
  return { background: "#f1f5f9", borderColor: "#cbd5e1" };
}

const responsive = `
  @media(max-width:1180px){
    .dBody{grid-template-columns:1fr!important;}
    .dAside{position:relative!important;top:0!important;}
    .dKpiWrap{gap:20px!important;}
    .dKpiTopRow{gap:20px!important;}
    .dKpiBottomRow{gap:22px!important;}
  }
  @media(max-width:720px){
    .dKpiBottomRow{grid-template-columns:1fr!important;}
  }
  @media(max-width:640px){
    .dKpiTopRow,
    .dKpiBottomRow{grid-template-columns:1fr!important;}
  }
`;

const R = 20;
const shadow = "0 8px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)";

const s = {
  page: { padding: "36px 40px", background: "#ffffff", minHeight: "100vh", fontFamily: "'Inter',system-ui,-apple-system,sans-serif", fontSize: 14 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 28 },
  eyebrow: { fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" },
  h1: { margin: "4px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" },
  metricsRangeHint: { margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: "#64748b" },
  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  rangeWrap: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cursor: "pointer",
  },
  rangeSelect: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontWeight: 700,
    fontSize: 13,
    color: "#1e293b",
    cursor: "pointer",
    fontFamily: "inherit",
    maxWidth: 140,
  },

  pill: { display: "inline-flex", gap: 6, alignItems: "center", padding: "9px 16px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 13, color: "#1e293b", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  pillPrimary: { display: "inline-flex", gap: 6, alignItems: "center", padding: "9px 16px", borderRadius: 999, border: "none", background: "#14b8a6", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 6px 20px rgba(20,184,166,0.25)" },

  body: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start", minWidth: 0 },
  left: { display: "grid", gap: 28, minWidth: 0 },
  aside: { position: "sticky", top: 20 },

  kpiWrap: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },
  kpiTopRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.22fr) minmax(0, 0.82fr)",
    gap: 24,
    minWidth: 0,
    width: "100%",
    alignItems: "stretch",
  },
  kpiBottomRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.22fr) minmax(0, 0.82fr)",
    gap: 20,
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
  cardChartDense: { padding: "16px 20px" },

  card: { background: "#fff", borderRadius: R, border: "1px solid #e6edf5", padding: "22px 24px", boxShadow: shadow, boxSizing: "border-box" },
  cardCompact: {
    padding: "14px 18px",
    borderRadius: R,
    width: "100%",
    minHeight: 126,
    display: "flex",
    flexDirection: "column",
  },

  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardHeadCompact: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardIcon: { width: 32, height: 32, borderRadius: 12, background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" },
  cardIconCompact: { width: 28, height: 28, borderRadius: 10 },
  cardLabel: { fontSize: 12, fontWeight: 700, color: "#94a3b8", marginTop: 2 },
  cardLabelCompact: { fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 1 },
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
    borderBottom: "1px solid #ccfbf1",
    paddingBottom: 2,
  },
  miniBar: {
    width: 12,
    borderRadius: "3px 3px 0 0",
    background: "#23b5b5",
    display: "block",
  },

  bigNum: { fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, margin: "6px 0 0" },
  bigNumCompact: { fontSize: 26, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, margin: "4px 0 0" },
  starsRow: { color: "#fbbf24", fontSize: 13, letterSpacing: "0.08em", marginBottom: 2 },
  starsRowCompact: { color: "#fbbf24", fontSize: 12, letterSpacing: "0.08em", marginBottom: 0 },

  badge: { display: "inline-flex", gap: 4, alignItems: "center", padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 11, border: "1px solid" },

  sentCardHeadCompact: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sentTitle: { fontSize: 13, fontWeight: 800, color: "#64748b", letterSpacing: "0.02em" },
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
    background: "#fff",
    border: "2px solid #e2e8f0",
    display: "grid",
    placeItems: "center",
    padding: "2px",
  },
  donutPctSent: { fontSize: 15, fontWeight: 900, color: "#0f172a", lineHeight: 1 },
  donutLabelSent: { fontSize: 9, fontWeight: 800, color: "#64748b" },
  sentLegendSent: { display: "grid", gap: 5, flex: "1 1 0", minWidth: 0 },
  legendRow: { display: "flex", gap: 10, alignItems: "center", minWidth: 0 },
  legendDot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  legendLabel: { fontSize: 13, fontWeight: 700, color: "#334155" },
  legendLabelSent: { fontSize: 12, fontWeight: 700, color: "#334155", overflowWrap: "anywhere" },

  sparkSvgVelocity: { marginTop: 8, display: "block", flexShrink: 0, maxWidth: "100%" },

  tableTop: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 26px", borderBottom: "1px solid #f1f5f9", gap: 16 },
  tableH: { fontSize: 19, fontWeight: 900, color: "#0f172a", marginRight: 12 },
  totalBadge: { padding: "5px 12px", borderRadius: 999, background: "#ecfdf5", color: "#16a34a", fontWeight: 900, fontSize: 12, border: "1px solid #bbf7d0" },
  tableTools: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  sortLabel: { display: "inline-flex", gap: 8, alignItems: "center" },
  sortLabelText: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" },
  sortSelect: {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 700,
    fontSize: 13,
    color: "#1e293b",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  searchBox: { display: "inline-flex", gap: 8, alignItems: "center", padding: "9px 14px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", color: "#94a3b8" },
  searchInput: { border: "none", outline: "none", fontWeight: 600, fontSize: 13, width: 140, background: "transparent" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 24px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontWeight: 800, background: "#fafcff" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#1e293b" },

  prodCell: { display: "flex", gap: 14, alignItems: "center" },
  prodDot: { width: 40, height: 40, borderRadius: 12, border: "2px solid", flexShrink: 0 },
  prodName: { fontSize: 13, fontWeight: 800, color: "#0f172a" },
  prodSku: { fontSize: 11, fontWeight: 600, color: "#94a3b8", marginTop: 2 },

  ratingCell: { display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 800 },

  chip: { display: "inline-flex", gap: 6, alignItems: "center", padding: "5px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12 },
  chipDot: { width: 7, height: 7, borderRadius: 999 },

  actRow: { display: "inline-flex", gap: 8, position: "relative", zIndex: 2 },
  actBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: "pointer", color: "#334155" },
  actFeature: { background: "#ecfdf5", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: "pointer", color: "#16a34a" },

  byokCard: {
    background: "#fff",
    borderRadius: R,
    border: "1px solid #e6edf5",
    boxShadow: shadow,
    padding: "18px 20px",
    marginBottom: 16,
    display: "grid",
    gap: 10,
  },
  byokHead: { display: "flex", alignItems: "center", gap: 8 },
  byokHeadText: { fontSize: 14, fontWeight: 900, color: "#0f172a" },
  byokForm: { display: "grid", gap: 8 },
  byokInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 600,
  },
  byokGuideLink: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0d9488",
    textDecoration: "none",
  },
  byokBtn: {
    marginTop: 4,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#14b8a6",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(20,184,166,0.25)",
  },
  byokChangeBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontWeight: 700,
    fontSize: 12,
    color: "#0d9488",
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
    color: "#94a3b8",
    borderRadius: 6,
  },
  byokRemoveBtn: {
    width: "100%",
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  asideStack: { display: "grid", gap: 14 },

  aiEmptyCard: {
    background: "#fff",
    borderRadius: R,
    border: "1px solid #e6edf5",
    boxShadow: shadow,
    padding: "18px 20px",
  },
  aiEmptyTitle: { fontSize: 14, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" },
  aiEmptyText: { fontSize: 13, fontWeight: 600, color: "#64748b", lineHeight: 1.5, margin: 0 },

  aiErrorCard: {
    background: "#fef2f2",
    borderRadius: R,
    border: "1px solid #fecaca",
    boxShadow: shadow,
    padding: "18px 20px",
  },
  aiErrorTitle: { fontSize: 14, fontWeight: 900, color: "#991b1b", margin: "0 0 8px" },
  aiErrorBody: { fontSize: 13, fontWeight: 600, color: "#7f1d1d", lineHeight: 1.45, margin: 0 },

  aiTopCard: {
    background: "#f0fdfa",
    borderRadius: R,
    border: "1px solid #99f6e4",
    boxShadow: shadow,
    padding: "18px 20px",
    display: "grid",
    gap: 12,
  },
  aiTopCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiTopIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#ccfbf1",
    display: "grid",
    placeItems: "center",
  },
  aiTopBadge: {
    fontSize: 11,
    fontWeight: 900,
    color: "#0d9488",
    background: "#ccfbf1",
    border: "1px solid #5eead4",
    padding: "4px 12px",
    borderRadius: 999,
  },
  aiTopHeadline: { fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.35, margin: 0 },
  aiTagRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  aiTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
  },
  aiTopDivider: { height: 1, background: "#99f6e4", margin: "4px 0" },
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
    color: "#0d9488",
    textAlign: "left",
  },

  aiUrgentCard: {
    background: "#fffafb",
    borderRadius: R,
    border: "1px solid #fbcfe8",
    boxShadow: shadow,
    padding: "18px 20px",
    display: "grid",
    gap: 12,
  },
  aiUrgentHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiUrgentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#fdf2f8",
    display: "grid",
    placeItems: "center",
  },
  aiUrgentBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 900,
    color: "#e11d48",
    background: "#fffafc",
    border: "1px solid #fecdd3",
    padding: "4px 12px",
    borderRadius: 999,
  },
  aiUrgentDot: { width: 6, height: 6, borderRadius: 999, background: "#fb7185" },
  aiUrgentTitle: { fontSize: 15, fontWeight: 900, color: "#0f172a", lineHeight: 1.35, margin: 0 },
  aiSnippetStack: { display: "grid", gap: 8 },
  aiSnippet: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #fbcfe8",
    background: "#fffdff",
  },
  aiSnippetAv: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#fdf2f8",
    color: "#be185d",
    fontWeight: 900,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  aiSnippetText: { fontSize: 12, fontWeight: 600, color: "#9f1239", lineHeight: 1.4, margin: 0 },
  aiSnippetEmpty: { fontSize: 12, fontWeight: 600, color: "#be185d", margin: 0, lineHeight: 1.4 },
  aiUrgentCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
    padding: "12px 16px",
    borderRadius: 12,
    background: "#f472b6",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(244,114,182,0.22)",
  },

  aiSpotCard: {
    background: "#fff",
    borderRadius: R,
    border: "1px solid #bae6fd",
    boxShadow: shadow,
    padding: "18px 20px",
    display: "grid",
    gap: 12,
  },
  aiSpotHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  aiSpotIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#fef9c3",
    display: "grid",
    placeItems: "center",
  },
  aiSpotStars: { display: "flex", gap: 2 },
  aiSpotQuoteBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "14px 16px",
    background: "#fafcff",
    position: "relative",
  },
  aiSpotQuoteMark: { fontSize: 28, fontWeight: 900, color: "#7dd3fc", lineHeight: 1, marginBottom: 4 },
  aiSpotQuote: { fontSize: 13, fontWeight: 600, color: "#334155", lineHeight: 1.5, margin: "0 0 12px" },
  aiSpotAttr: { display: "flex", alignItems: "center", gap: 10 },
  aiSpotAv: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#ccfbf1",
    color: "#0d9488",
    fontWeight: 900,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
  },
  aiSpotName: { fontSize: 12, fontWeight: 800, color: "#0f172a" },
  aiSpotVerified: { fontWeight: 600, color: "#64748b" },
  aiSpotNote: { fontSize: 12, fontWeight: 600, color: "#64748b", margin: 0, lineHeight: 1.45 },

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
    background: "rgba(15,23,42,0.45)",
    cursor: "pointer",
  },
  modalPanel: {
    position: "relative",
    width: "min(560px, 100%)",
    maxHeight: "min(85vh, 720px)",
    overflow: "auto",
    background: "#fff",
    borderRadius: R,
    boxShadow: "0 24px 48px rgba(15,23,42,0.2)",
    border: "1px solid #e2e8f0",
    padding: "24px 28px",
    zIndex: 1,
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 950, color: "#0f172a", margin: 0, lineHeight: 1.2 },
  modalClose: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: 10,
    padding: 8,
    cursor: "pointer",
    color: "#475569",
    display: "grid",
    placeItems: "center",
  },
  modalHint: { fontSize: 13, fontWeight: 600, color: "#64748b", margin: "0 0 12px" },
  modalError: { fontSize: 13, fontWeight: 700, color: "#b91c1c", margin: "0 0 12px", lineHeight: 1.45 },
  modalBody: { display: "grid", gap: 20 },
  modalSummary: { fontSize: 14, fontWeight: 600, color: "#334155", lineHeight: 1.55, margin: 0 },
  modalSection: { display: "grid", gap: 10 },
  modalSectionTitle: { fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 },
  modalList: { margin: 0, paddingLeft: 20, display: "grid", gap: 8 },
  modalLi: { fontSize: 13, fontWeight: 600, color: "#475569", lineHeight: 1.45 },
};
