import PDFDocument from "pdfkit";

/* ── Unicode fallback map (PDFKit built-in fonts only support Latin-1) ────── */
const UNICODE_FALLBACKS = {
  "\u2022": "-",   "\u2023": ">",   "\u2043": "-",
  "\u25CF": "*",   "\u25CB": "o",
  "\u2013": "-",   "\u2014": "--",
  "\u2018": "'",   "\u2019": "'",
  "\u201C": '"',   "\u201D": '"',
  "\u2026": "...",
  "\u2605": "*",   "\u2606": "*",
  "\u2192": "->",  "\u2190": "<-",  "\u2191": "^", "\u2193": "v",
  "\u2714": "[x]", "\u2716": "[X]",
  "\u00B7": "-",   "\u2212": "-",
};

function safe(value) {
  return Array.from(String(value ?? ""))
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code === undefined) return "";
      if (code === 9 || code === 10 || code === 13) return ch;
      if (code >= 32 && code <= 126) return ch;
      if (code >= 160 && code <= 255) return ch;
      return UNICODE_FALLBACKS[ch] || "";
    })
    .join("");
}

/* ── Layout constants ──────────────────────────────────────────────────────── */
const MARGIN     = 48;
const PAGE_W     = 612;                       // LETTER width in pt
const CONTENT_W  = PAGE_W - MARGIN * 2;       // usable text width
const BRAND      = "#0d9488";                  // teal accent
const DARK       = "#0f172a";
const MID        = "#334155";
const LIGHT      = "#64748b";
const RULE_COLOR = "#e2e8f0";

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function ensureSpace(doc, need = 48) {
  const bottom = doc.page.height - MARGIN;
  if (doc.y + need > bottom) {
    doc.addPage();
    doc.y = MARGIN;
  }
}

function drawRule(doc) {
  const y = doc.y;
  doc.strokeColor(RULE_COLOR).lineWidth(0.75)
    .moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).stroke();
  doc.y = y + 10;
}

function sectionTitle(doc, title) {
  ensureSpace(doc, 60);
  doc.moveDown(0.6);
  drawRule(doc);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK)
    .text(safe(title).toUpperCase(), MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.45);
}

function label(doc, text, opts = {}) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(LIGHT)
    .text(safe(text).toUpperCase(), MARGIN, doc.y, { width: CONTENT_W, ...opts });
}

function body(doc, text, opts = {}) {
  doc.font("Helvetica").fontSize(10).fillColor(MID)
    .text(safe(text), MARGIN, doc.y, { width: CONTENT_W, lineGap: 2, ...opts });
}

function bodyBold(doc, text, opts = {}) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK)
    .text(safe(text), MARGIN, doc.y, { width: CONTENT_W, lineGap: 2, ...opts });
}

function bullet(doc, text) {
  ensureSpace(doc, 20);
  doc.font("Helvetica").fontSize(10).fillColor(MID)
    .text(`-  ${safe(text)}`, MARGIN + 14, doc.y, { width: CONTENT_W - 14, lineGap: 2 });
  doc.x = MARGIN; // Reset X for subsequent elements
}

function kpiRow(doc, labelText, valueText) {
  const startY = doc.y;
  doc.font("Helvetica").fontSize(10).fillColor(LIGHT)
    .text(safe(labelText), MARGIN, startY, { width: 220 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK)
    .text(safe(valueText), MARGIN + 230, startY, { width: CONTENT_W - 230 });
  doc.x = MARGIN; // Reset X
  doc.y = Math.max(doc.y, startY + 16);
}

/* ── Main renderer ─────────────────────────────────────────────────────────── */
/**
 * @param {{
 *   shop: string,
 *   metricsRangeLabel: string,
 *   kpis: Record<string, unknown>,
 *   products: Array<Record<string, unknown>>,
 *   scopedReviews: Array<Record<string, unknown>>,
 *   aiPanel: Record<string, unknown> | null,
 *   playbook: { summary: string, sections: Array<{ title: string, bullets: string[] }> } | null,
 * }} payload
 */
export function renderDashboardReportPdf(payload) {
  const {
    shop,
    metricsRangeLabel,
    kpis,
    products,
    scopedReviews,
    aiPanel,
    playbook,
  } = payload;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "LETTER" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* ── HEADER BAR ──────────────────────────────────────────────── */
    doc.rect(0, 0, PAGE_W, 80).fill(BRAND);
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff")
      .text("REVIEW INSIGHTS REPORT", MARGIN, 24, { width: CONTENT_W });
    doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.85)")
      .text(safe(`${shop}  |  ${metricsRangeLabel}  |  Generated ${new Date().toISOString().slice(0, 10)}`),
        MARGIN, 52, { width: CONTENT_W });
    doc.y = 100;

    /* ── KEY METRICS ─────────────────────────────────────────────── */
    sectionTitle(doc, "Key Metrics");
    const sentiment = kpis.sentiment || {};
    kpiRow(doc, "Total Reviews", String(kpis.totalReviews));
    kpiRow(doc, "Volume Trend", String(kpis.totalTrend) + " vs prior period");
    kpiRow(doc, "Average Rating", `${kpis.avgRating} (${kpis.avgDelta} vs prior)`);
    kpiRow(doc, "Positive / Neutral / Negative",
      `${sentiment.positivePct}% / ${sentiment.neutralPct}% / ${sentiment.negativePct}%`);
    kpiRow(doc, "Weekly Velocity", `${kpis.velocityPerWeek} reviews / week`);
    doc.moveDown(0.3);

    /* ── AI DIGEST ───────────────────────────────────────────────── */
    if (aiPanel?.topInsight) {
      sectionTitle(doc, "AI Digest");

      label(doc, "Top Insight");
      doc.moveDown(0.15);
      bodyBold(doc, aiPanel.topInsight.headline || "");
      const tags = aiPanel.topInsight.tags || [];
      if (tags.length) {
        doc.moveDown(0.15);
        const tagLine = tags.map((t) => `${t.label} (${t.trend})`).join("  |  ");
        body(doc, tagLine);
      }
      doc.moveDown(0.5);

      if (aiPanel.urgent?.headline) {
        label(doc, "Urgent");
        doc.moveDown(0.15);
        body(doc, aiPanel.urgent.headline);
        doc.moveDown(0.5);
      }

      if (aiPanel.spotlight?.quote) {
        label(doc, "Spotlight Review");
        doc.moveDown(0.15);
        doc.font("Helvetica-Oblique").fontSize(10).fillColor(MID)
          .text(`"${safe(aiPanel.spotlight.quote)}"`, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
        doc.font("Helvetica").fontSize(9).fillColor(LIGHT)
          .text(safe(`-- ${aiPanel.spotlight.author || "Customer"}, ${aiPanel.spotlight.rating || 5} stars`), MARGIN, doc.y);
        doc.moveDown(0.3);
      }

      if (aiPanel.spotlightNote) {
        body(doc, String(aiPanel.spotlightNote));
      }
    }

    /* ── PRODUCTS TABLE ───────────────────────────────────────────── */
    sectionTitle(doc, "Products Overview");

    // Table header
    const colX = [MARGIN, MARGIN + 200, MARGIN + 270, MARGIN + 340, MARGIN + 420];
    const colW = [195, 65, 65, 75, CONTENT_W - 420];
    const headers = ["PRODUCT", "RATING", "REVIEWS", "SENTIMENT", "LAST REVIEW"];

    ensureSpace(doc, 30);
    const headerY = doc.y;
    doc.rect(MARGIN, headerY - 2, CONTENT_W, 18).fill("#f1f5f9");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(LIGHT);
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 4, headerY + 2, { width: colW[i], lineBreak: false });
    });
    doc.y = headerY + 20;

    // Table rows
    for (const p of products) {
      ensureSpace(doc, 22);
      const rowY = doc.y;
      doc.font("Helvetica").fontSize(9).fillColor(DARK)
        .text(safe(p.productName), colX[0] + 4, rowY, { width: colW[0], lineBreak: false });
      doc.fillColor(MID)
        .text(safe(`${p.avgRating} *`), colX[1] + 4, rowY, { width: colW[1], lineBreak: false })
        .text(safe(String(p.reviewCount)), colX[2] + 4, rowY, { width: colW[2], lineBreak: false })
        .text(safe(p.sentiment), colX[3] + 4, rowY, { width: colW[3], lineBreak: false })
        .text(safe(p.lastReview), colX[4] + 4, rowY, { width: colW[4], lineBreak: false });
      doc.x = MARGIN; // Reset X
      doc.y = rowY + 18;
      // light row divider
      doc.strokeColor(RULE_COLOR).lineWidth(0.5)
        .moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).stroke();
      doc.y += 4;
    }
    doc.moveDown(0.3);

    /* ── PLAYBOOK ─────────────────────────────────────────────────── */
    if (playbook?.summary) {
      sectionTitle(doc, "Improvement Playbook");
      body(doc, playbook.summary);
      doc.moveDown(0.5);

      for (const sec of playbook.sections || []) {
        ensureSpace(doc, 50);
        bodyBold(doc, sec.title || "Section");
        doc.moveDown(0.2);
        for (const b of sec.bullets || []) {
          bullet(doc, b);
        }
        doc.moveDown(0.45);
      }
    }

    /* ── REVIEW DETAIL ────────────────────────────────────────────── */
    sectionTitle(doc, "Review Detail");

    const byProduct = new Map();
    const sorted = [...scopedReviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const r of sorted) {
      const key = r.productName || r.productId || "Unknown";
      if (!byProduct.has(key)) byProduct.set(key, []);
      byProduct.get(key).push(r);
    }

    for (const [productName, list] of byProduct.entries()) {
      ensureSpace(doc, 50);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK)
        .text(safe(String(productName)), MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.25);

      for (const r of list) {
        ensureSpace(doc, 60);

        // Review meta line
        const date = new Date(r.createdAt).toISOString().slice(0, 10);
        const stars = "*".repeat(Math.min(5, Math.max(0, r.rating || 0)));
        const author = r.author || "Customer";
        doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK)
          .text(safe(`${stars}  ${author}`), { width: CONTENT_W, continued: true });
        doc.font("Helvetica").fontSize(9).fillColor(LIGHT)
          .text(safe(`   ${date}`));

        // Comment
        if (r.comment) {
          doc.font("Helvetica").fontSize(9.5).fillColor(MID)
            .text(safe(r.comment), MARGIN, doc.y, { width: CONTENT_W, lineGap: 1.5 });
        }

        // Reply
        if (r.reply) {
          doc.moveDown(0.15);
          const rd = r.replyDate ? new Date(r.replyDate).toISOString().slice(0, 10) : "";
          doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND)
            .text(safe(`Store Reply${rd ? ` (${rd})` : ""}:`), MARGIN, doc.y, { width: CONTENT_W });
          doc.font("Helvetica").fontSize(9.5).fillColor(MID)
            .text(safe(r.reply), MARGIN, doc.y, { width: CONTENT_W, lineGap: 1.5 });
        }

        doc.moveDown(0.4);
        // subtle divider between reviews
        doc.strokeColor(RULE_COLOR).lineWidth(0.4)
          .moveTo(MARGIN, doc.y).lineTo(MARGIN + 120, doc.y).stroke();
        doc.y += 6;
      }
      doc.moveDown(0.4);
    }

    /* ── FOOTER ────────────────────────────────────────────────────── */
    ensureSpace(doc, 40);
    drawRule(doc);
    doc.font("Helvetica").fontSize(8).fillColor(LIGHT)
      .text(safe(`Report generated by JudgeMe Reviews  |  ${shop}  |  ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`),
        MARGIN, doc.y, { width: CONTENT_W, align: "center" });

    doc.end();
  });
}
