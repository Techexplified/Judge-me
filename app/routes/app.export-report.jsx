import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import {
  computeDashboardMetrics,
  filterReviewsByRangeStart,
  parseDashboardRange,
  rangeLabel,
  rangeStartFromKey,
} from "../utils/dashboard-metrics.server.js";
import { getResolvedOpenRouterKey, generatePlaybook } from "../lib/openrouter.server";
import { renderDashboardReportPdf } from "../utils/dashboard-pdf.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);
  const includePlaybook = url.searchParams.get("includePlaybook") !== "0";

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
    digestFingerprint,
    playbookPrintFingerprint,
  } = computeDashboardMetrics({
    shop,
    scopedReviews,
    reviewsAll,
    now,
    rangeKey,
  });

  let aiPanel = null;
  const cachedDigest = storedConfig.aiDigestCache;
  if (cachedDigest?.fingerprint === digestFingerprint && cachedDigest?.panel) {
    aiPanel = cachedDigest.panel;
  }

  let playbook = null;
  if (includePlaybook && scopedReviews.length > 0 && openRouterKey) {
    const pbCached = storedConfig.aiPlaybookCache;
    if (pbCached?.fingerprint === playbookPrintFingerprint && pbCached?.playbook) {
      playbook = pbCached.playbook;
    } else {
      const panel = aiPanel;
      const digestForPlaybook =
        panel?.topInsight
          ? {
              topInsight: panel.topInsight,
              urgent: { headline: panel.urgent?.headline || "", pickIds: [] },
              spotlightNote: panel.spotlightNote || "",
            }
          : null;
      const { playbook: pb, error } = await generatePlaybook({
        apiKey: openRouterKey,
        reviews: scopedReviews,
        digest: digestForPlaybook,
      });
      if (!error && pb) {
        playbook = pb;
        const newConfig = {
          ...storedConfig,
          aiPlaybookCache: {
            fingerprint: playbookPrintFingerprint,
            playbook: pb,
            rangeKey,
          },
        };
        await db.settings.upsert({
          where: { shop },
          update: { config: JSON.stringify(newConfig) },
          create: { shop, config: JSON.stringify(newConfig) },
        });
      }
    }
  }

  const pdfBuf = await renderDashboardReportPdf({
    shop,
    metricsRangeLabel: rangeLabel(rangeKey),
    kpis,
    products,
    scopedReviews,
    aiPanel,
    playbook,
  });

  const safeShop = shop.replace(/[^a-z0-9.-]+/gi, "_");
  const filename = `review-report-${safeShop}-${rangeKey}.pdf`;

  return new Response(pdfBuf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};

// No default export — this is a resource route.
// React Router sends the loader Response (PDF) directly to the browser
// without wrapping it in an HTML document.
