const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** BYOK: OpenRouter key only from shop `Settings.config` (set in admin UI). */
export function getResolvedOpenRouterKey(settingsConfig) {
  const k = settingsConfig?.openRouterApiKey;
  return typeof k === "string" && k.trim() ? k.trim() : null;
}

function truncate(text, max) {
  if (!text) return "";
  const s = String(text);
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function extractJsonObject(content) {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content.trim());
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

async function openRouterChat({ apiKey, userContent, temperature = 0.35 }) {
  const referer = process.env.SHOPIFY_APP_URL || "https://localhost";
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "JudgeMe Reviews AI",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    return { error: `OpenRouter error ${res.status}: ${truncate(raw, 200)}` };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "Invalid response from OpenRouter" };
  }

  const messageContent = data?.choices?.[0]?.message?.content;
  if (!messageContent || typeof messageContent !== "string") {
    return { error: "Empty model output" };
  }

  return { content: messageContent };
}

/**
 * @param {{ apiKey: string, reviews: Array<{ rating: number, comment: string, title?: string|null, productName?: string|null }> }} opts
 * @returns {Promise<{ items: Array<{ id: string, title: string, body: string }>, error?: string }>}
 */
export async function generateReviewInsights({ apiKey, reviews }) {
  const sample = reviews.slice(0, 40).map((r, i) => ({
    i: i + 1,
    rating: r.rating,
    product: r.productName || "Product",
    text: truncate(r.comment, 400),
  }));

  const userContent = `You analyze e-commerce product reviews for a merchant dashboard.
Return ONLY valid JSON (no markdown) with this shape:
{"insights":[{"id":"string","title":"short headline","body":"1-3 sentences actionable insight"}]}
Include exactly 3 insights: one on top positive themes, one on risks/complaints needing attention, one highlighting a standout quote or praise (paraphrase if needed).
If reviews are few, still give useful generic guidance tied to the data you have.

Reviews data:
${JSON.stringify(sample)}`;

  const out = await openRouterChat({ apiKey, userContent });
  if (out.error) return { items: [], error: out.error };

  const parsed = extractJsonObject(out.content);
  if (!parsed) return { items: [], error: "Could not parse model JSON" };

  const list = Array.isArray(parsed?.insights) ? parsed.insights : [];
  const items = list
    .slice(0, 3)
    .map((row, idx) => ({
      id: String(row.id || `insight-${idx}`),
      title: String(row.title || `Insight ${idx + 1}`),
      body: String(row.body || "").trim() || "No detail provided.",
    }))
    .filter((x) => x.title);

  return { items };
}

export async function generateReviewDigest({
  apiKey,
  urgentCandidates,
  spotlightCandidate,
  stats,
}) {
  const allowedIds = urgentCandidates.map((c) => c.id);
  const userContent = `You summarize e-commerce review data for a merchant dashboard UI.
Return ONLY valid JSON (no markdown).

Required shape:
{
  "topInsight": {
    "headline": "one punchy sentence (max ~120 chars) about what customers care about most",
    "tags": [ { "label": "short theme name", "trend": "up" | "down" | "flat" } ]
  },
  "urgent": {
    "headline": "short headline about reviews needing replies or serious issues (use real counts from stats)",
    "pickIds": [ "id1", "id2" ]
  },
  "spotlightNote": "optional empty string or one short line praising the quoted review theme"
}

Rules:
- Include exactly 3 tags in topInsight.tags when possible (positive theme up, problem theme down, mixed logistics/neutral flat).
- pickIds MUST be a subset of these candidate ids only (max 2 entries): ${JSON.stringify(allowedIds)}
- If no candidates, use pickIds: [] and still write urgent.headline using stats.
- Use stats for counts; do not invent review counts.

stats: ${JSON.stringify(stats)}
urgentCandidates (excerpts are real; pickIds reference id only): ${JSON.stringify(
 urgentCandidates.map((c) => ({ id: c.id, excerpt: c.excerpt, rating: c.rating })),
  )}
spotlightCandidate (real review to highlight on storefront): ${JSON.stringify(
    spotlightCandidate
      ? {
          excerpt: truncate(spotlightCandidate.excerpt, 400),
          author: spotlightCandidate.author,
          rating: spotlightCandidate.rating,
        }
      : null,
  )}`;

  const out = await openRouterChat({ apiKey, userContent, temperature: 0.35 });
  if (out.error) return { error: out.error };

  const parsed = extractJsonObject(out.content);
  if (!parsed) return { error: "Could not parse model JSON" };

  const headline = String(parsed?.topInsight?.headline || "").trim() || "Review themes from your latest feedback.";
  const tagsRaw = Array.isArray(parsed?.topInsight?.tags) ? parsed.topInsight.tags : [];
  const tags = tagsRaw
    .slice(0, 5)
    .map((t) => ({
      label: String(t?.label || "Theme").trim() || "Theme",
      trend: ["up", "down", "flat"].includes(t?.trend) ? t.trend : "flat",
    }))
    .filter((t) => t.label);

  const urgentHeadline =
    String(parsed?.urgent?.headline || "").trim() ||
    (stats.negativeCount > 0
      ? `${stats.negativeCount} reviews need attention.`
      : "Stay on top of new reviews.");

  let pickIds = Array.isArray(parsed?.urgent?.pickIds) ? parsed.urgent.pickIds.map(String) : [];
  pickIds = pickIds.filter((id) => allowedIds.includes(id)).slice(0, 2);
  if (pickIds.length === 0 && urgentCandidates.length > 0) {
    pickIds = urgentCandidates.slice(0, 2).map((c) => c.id);
  }

  const spotlightNote =
    typeof parsed?.spotlightNote === "string" ? parsed.spotlightNote.trim() : "";

  const digest = {
    topInsight: { headline, tags: tags.length ? tags : [{ label: "Reviews", trend: "flat" }] },
    urgent: { headline: urgentHeadline, pickIds },
    spotlightNote,
  };

  return { digest };
}

export async function generatePlaybook({ apiKey, reviews, digest }) {
  const sample = reviews.slice(0, 45).map((r, i) => ({
    i: i + 1,
    rating: r.rating,
    product: r.productName || "Product",
    author: r.author || "Customer",
    text: truncate(r.comment, 350),
  }));

  const userContent = `You are a senior e-commerce CX and product advisor. Create an actionable playbook for the merchant based on their product reviews.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "summary": "2-4 sentences executive summary",
  "sections": [
    { "title": "section title", "bullets": ["concrete action1", "concrete action 2"] }
  ]
}

Include 5-7 sections covering where relevant: priorities this week; product & quality fixes; sizing/fit/content (PDP) improvements; shipping & delivery comms; negative review response workflow; turning promoters into social proof; metrics to track.
Be specific and practical; avoid generic fluff.

Prior digest (if useful): ${JSON.stringify(digest || null)}

Reviews sample:
${JSON.stringify(sample)}`;

  const out = await openRouterChat({ apiKey, userContent, temperature: 0.4 });
  if (out.error) return { error: out.error };

  const parsed = extractJsonObject(out.content);
  if (!parsed) return { error: "Could not parse model JSON" };

  const summary = String(parsed?.summary || "").trim() || "Playbook generated from your recent reviews.";
  const sectionsRaw = Array.isArray(parsed?.sections) ? parsed.sections : [];
  const sections = sectionsRaw
    .map((sec) => ({
      title: String(sec?.title || "Section").trim() || "Section",
      bullets: Array.isArray(sec?.bullets)
        ? sec.bullets.map((b) => String(b || "").trim()).filter(Boolean)
        : [],
    }))
    .filter((sec) => sec.title && sec.bullets.length > 0);

  if (sections.length === 0) {
    return { error: "Model returned an empty playbook" };
  }

  return { playbook: { summary, sections } };
}
