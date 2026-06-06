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
import {
  getShopPlanStatus,
  hasProAccess,
  requireFeatureUsage,
  formatProRequiredMessage,
} from "../lib/billing.server.js";
import { getGroupShopList } from "../lib/store-group.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);
  const includePlaybook = url.searchParams.get("includePlaybook") !== "0";

  const planStatus = await getShopPlanStatus(shop);
  if (!hasProAccess(planStatus)) {
    return new Response(formatProRequiredMessage("export_pdf_csv"), { status: 403 });
  }

  const exportUsage = await requireFeatureUsage(planStatus, "export_pdf_csv");
  if (!exportUsage.ok) {
    return new Response(exportUsage.message, { status: 403 });
  }

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let storedConfig = {};
  if (settingsRow?.config) {
    try {
      storedConfig = JSON.parse(settingsRow.config);
    } catch {
      storedConfig = {};
    }
  }

  const openRouterKey = getResolvedOpenRouterKey();

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
    const playbookUsage = await requireFeatureUsage(planStatus, "ai_insights_playbook");
    if (!playbookUsage.ok) {
      return new Response(playbookUsage.message, { status: 403 });
    }

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
