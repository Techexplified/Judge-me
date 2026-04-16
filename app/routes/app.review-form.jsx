/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control, react-hooks/set-state-in-effect, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useState, useEffect, useRef, useCallback } from "react";
import { useSubmit, useLoaderData, useNavigation, useActionData } from "react-router";
import {
  Star,
  RotateCcw,
  Ruler,
  Palette,
  CheckCircle2,
  Save,
  Eye,
  MessageSquare,
  GitBranch,
  Lock,
  Send,
  Shield,
  ImagePlus,
  X,
  Plus,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { normalizeShopifyProductId } from "../utils/product-id.server";

const ACCENT = "#23B5B5";

const TYPOGRAPHY_OPTIONS = [
  { value: "Inter (System)", stack: "'Inter', system-ui, -apple-system, sans-serif" },
  { value: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { value: "System UI", stack: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { value: "Monospace", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const SHADOW_LEVELS = ["low", "medium", "high"];

const defaultConfig = {
  primaryColor: ACCENT,
  secondaryColor: "#64748b",
  textColor: "#0f172a",
  starColor: "#F59E0B",
  buttonColor: "#23B5B5",
  backgroundColor: "#F8FAFC",
  showPhotos: true,
  showRatings: true,
  showWrittenReviews: true,
  borderRadius: 8,
  spacing: 16,
  shadowLevel: "medium",
  fontSize: 14,
  typography: "Inter (System)",
  flowRules: ["After delivery", "Physical products only"],
  layoutPreset: "compact",
};

function mergeWithDefaults(saved) {
  const base = { ...defaultConfig, ...(saved && typeof saved === "object" ? saved : {}) };
  if (!Array.isArray(base.flowRules)) base.flowRules = [...defaultConfig.flowRules];
  if (!SHADOW_LEVELS.includes(base.shadowLevel)) base.shadowLevel = "medium";
  const validPresets = ["compact", "brandLed", "minimal"];
  if (!validPresets.includes(base.layoutPreset)) base.layoutPreset = "compact";
  return base;
}

function shadowCss(level) {
  if (level === "low") return "0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)";
  if (level === "high") return "0 16px 48px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.08)";
  return "0 8px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)";
}

function fontStack(typographyLabel) {
  const opt = TYPOGRAPHY_OPTIONS.find((o) => o.value === typographyLabel);
  return opt?.stack ?? TYPOGRAPHY_OPTIONS[0].stack;
}

function normalizeHex(input) {
  let s = String(input || "").trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  return null;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);
  const rawProductId = url.searchParams.get("productId");
  const productId =
    normalizeShopifyProductId(rawProductId) ||
    (typeof rawProductId === "string" && rawProductId.trim()) ||
    "manual-product";
  const productName = url.searchParams.get("productName")?.trim() || "Manual Review Product";
  const productImage = url.searchParams.get("productImage")?.trim() || null;
  const settings = await db.settings.findUnique({ where: { shop } });
  let parsed = {};
  if (settings?.config) {
    try {
      parsed = JSON.parse(settings.config);
    } catch {
      parsed = {};
    }
  }
  return {
    savedConfig: mergeWithDefaults(parsed),
    reviewContext: {
      productId,
      productName,
      productImage,
    },
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = fd.get("_intent");
  if (intent === "postReview") {
    const rating = Number(fd.get("rating"));
    const author = String(fd.get("author") || "").trim();
    const comment = String(fd.get("comment") || "").trim();
    const rawProductId = String(fd.get("productId") || "").trim();
    const productId = normalizeShopifyProductId(rawProductId) || rawProductId || "manual-product";
    const productName = String(fd.get("productName") || "").trim() || "Manual Review Product";
    const productImage = String(fd.get("productImage") || "").trim() || null;
    const title = String(fd.get("title") || "").trim() || null;
    const email = String(fd.get("email") || "").trim() || null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !author || !comment) {
      return { reviewError: "Please add rating, name, and review before posting." };
    }

    await db.review.create({
      data: {
        shop,
        productId,
        productName,
        productImage,
        rating,
        title,
        comment,
        author,
        email,
        status: "PUBLISHED",
      },
    });
    return { reviewSaved: true };
  }
  const configRaw = fd.get("config");
  if (typeof configRaw !== "string") {
    return { ok: false };
  }
  await db.settings.upsert({
    where: { shop },
    update: { config: configRaw },
    create: { shop, config: configRaw },
  });
  return { ok: true };
};

export default function ReviewEditor() {
  const { savedConfig, reviewContext } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [config, setConfig] = useState(() => mergeWithDefaults(savedConfig));
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showReviewToast, setShowReviewToast] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  const [previewRating, setPreviewRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [previewErrors, setPreviewErrors] = useState(null);
  const [flowDraft, setFlowDraft] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);

  const fileInputRef = useRef(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (actionData?.ok) {
      setShowSaveToast(true);
      const t = setTimeout(() => setShowSaveToast(false), 2500);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.reviewSaved) {
      setShowReviewToast(true);
      setAuthor("");
      setComment("");
      setPreviewRating(5);
      setPhotos([]);
      const t = setTimeout(() => setShowReviewToast(false), 2800);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  const updateConfig = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveConfig = useCallback(() => {
    submit({ config: JSON.stringify(config) }, { method: "POST" });
  }, [submit, config]);

  const resetConfig = useCallback(() => {
    setConfig(mergeWithDefaults(defaultConfig));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving) saveConfig();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSaving, saveConfig]);

  const isMobile = width < 768;
  const ff = fontStack(config.typography);
  const displayRating = hoverRating || previewRating;
  const maxPhotosBytes = 5 * 1024 * 1024;

  const addPhotos = (fileList) => {
    setPhotoError("");
    const next = Array.from(fileList || []);
    for (const f of next) {
      if (f.size > maxPhotosBytes) {
        setPhotoError("Each file must be 5MB or less (PNG, JPG).");
        return;
      }
      if (!/^image\/(png|jpeg|jpg)$/i.test(f.type)) {
        setPhotoError("Use PNG or JPG only.");
        return;
      }
    }
    setPhotos((p) => [...p, ...next]);
  };

  const removePhoto = (idx) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const submitReview = () => {
    const err = {};
    if (config.showRatings && previewRating < 1) err.rating = "Select a rating.";
    if (config.showWrittenReviews) {
      if (!author.trim()) err.author = "Name is required.";
      if (!comment.trim()) err.comment = "Review is required.";
    }
    if (Object.keys(err).length) {
      setPreviewErrors(err);
      return;
    }
    setPreviewErrors(null);
    const fd = new FormData();
    fd.set("_intent", "postReview");
    fd.set("rating", String(previewRating));
    fd.set("author", author.trim());
    fd.set("comment", comment.trim());
    fd.set("productId", reviewContext.productId || "manual-product");
    fd.set("productName", reviewContext.productName || "Manual Review Product");
    if (reviewContext.productImage) {
      fd.set("productImage", reviewContext.productImage);
    }
    submit(fd, { method: "POST" });
  };

  const presetLayout = () => {
    const p = config.layoutPreset;
    if (p === "brandLed") {
      return { titleSize: 28, gapScale: 1.1, hideSubtitle: false };
    }
    if (p === "minimal") {
      return { titleSize: 22, gapScale: 0.92, hideSubtitle: true };
    }
    return { titleSize: 24, gapScale: 1, hideSubtitle: false };
  };
  const pl = presetLayout();
  const gap = Math.round(config.spacing * pl.gapScale);

  const pageBg = config.backgroundColor;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: "100vh",
        maxHeight: "100vh",
        minHeight: 0,
        backgroundColor: pageBg,
        fontFamily: ff,
        color: config.textColor,
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: isMobile ? "100%" : "400px",
          minWidth: isMobile ? undefined : "320px",
          backgroundColor: "#ffffff",
          borderRight: isMobile ? "none" : "1px solid #e2e8f0",
          borderBottom: isMobile ? "1px solid #e2e8f0" : "none",
          display: "flex",
          flexDirection: "column",
          zIndex: 20,
          minHeight: 0,
          maxHeight: isMobile ? "50vh" : "100%",
          height: isMobile ? undefined : "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: config.textColor }}>
              JudgeMe Product Reviews
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>
              Shopify Theme v2.4
            </p>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#ecfdf5",
              color: "#16a34a",
              fontSize: "12px",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            Live
          </span>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            padding: "20px 24px",
          }}
        >
          <PanelSection
            title="Visibility"
            titleRight="Expanded"
            icon={<Eye size={14} color={ACCENT} />}
          >
            <ToggleRow
              label="Show star ratings"
              icon={<Star size={16} color="#64748b" />}
              active={config.showRatings}
              onToggle={() => updateConfig("showRatings", !config.showRatings)}
              accent={ACCENT}
            />
            <ToggleRow
              label="Show written reviews"
              icon={<MessageSquare size={16} color="#64748b" />}
              active={config.showWrittenReviews}
              onToggle={() => updateConfig("showWrittenReviews", !config.showWrittenReviews)}
              accent={ACCENT}
            />
          </PanelSection>

          <PanelSection title="Theming" icon={<Palette size={14} color={ACCENT} />}>
            <ColorRow
              label="Star color"
              value={config.starColor}
              onColor={(v) => updateConfig("starColor", v)}
              onHex={(v) => {
                const h = normalizeHex(v);
                if (h) updateConfig("starColor", h);
              }}
            />
            <ColorRow
              label="Button color"
              value={config.buttonColor}
              onColor={(v) => updateConfig("buttonColor", v)}
              onHex={(v) => {
                const h = normalizeHex(v);
                if (h) updateConfig("buttonColor", h);
              }}
            />
            <ColorRow
              label="Background"
              value={config.backgroundColor}
              onColor={(v) => updateConfig("backgroundColor", v)}
              onHex={(v) => {
                const h = normalizeHex(v);
                if (h) updateConfig("backgroundColor", h);
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Typography</span>
              <select
                value={config.typography}
                onChange={(e) => updateConfig("typography", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  fontWeight: 600,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {TYPOGRAPHY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value}
                  </option>
                ))}
              </select>
            </div>
          </PanelSection>

          <PanelSection title="Geometry" icon={<Ruler size={14} color={ACCENT} />}>
            <GeomSlider
              label="Corner radius"
              min={0}
              max={24}
              value={config.borderRadius}
              display={`${config.borderRadius}px`}
              onChange={(v) => updateConfig("borderRadius", v)}
              accent={ACCENT}
            />
            <GeomSlider
              label="Spacing"
              min={8}
              max={32}
              value={config.spacing}
              display={`${config.spacing}px`}
              onChange={(v) => updateConfig("spacing", v)}
              accent={ACCENT}
            />
            <GeomSlider
              label="Elevation / shadow"
              min={0}
              max={2}
              value={SHADOW_LEVELS.indexOf(config.shadowLevel)}
              display={config.shadowLevel.charAt(0).toUpperCase() + config.shadowLevel.slice(1)}
              onChange={(idx) => updateConfig("shadowLevel", SHADOW_LEVELS[idx])}
              accent={ACCENT}
            />
          </PanelSection>

          <PanelSection
            title="Review flow rules"
            icon={<GitBranch size={14} color={ACCENT} />}
            headerAction={
              <button
                type="button"
                onClick={() => {
                  const t = flowDraft.trim() || window.prompt("Rule label");
                  if (t) {
                    updateConfig("flowRules", [...config.flowRules, t]);
                    setFlowDraft("");
                  }
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: ACCENT,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={14} /> Add
              </button>
            }
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {config.flowRules.map((rule, i) => (
                <span
                  key={`${rule}-${i}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${ACCENT}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#334155",
                    background: "#fff",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
                  {rule}
                  <button
                    type="button"
                    aria-label={`Remove ${rule}`}
                    onClick={() =>
                      updateConfig(
                        "flowRules",
                        config.flowRules.filter((_, j) => j !== i),
                      )
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      color: "#94a3b8",
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={flowDraft}
              onChange={(e) => setFlowDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && flowDraft.trim()) {
                  e.preventDefault();
                  updateConfig("flowRules", [...config.flowRules, flowDraft.trim()]);
                  setFlowDraft("");
                }
              }}
              placeholder="Add condition…"
              style={{
                width: "100%",
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
                fontSize: 13,
              }}
            />
          </PanelSection>

          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: ACCENT,
                marginBottom: 12,
                textTransform: "uppercase",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              Layout presets
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { id: "compact", label: "Compact" },
                { id: "brandLed", label: "Brand-led" },
                { id: "minimal", label: "Minimal" },
                { id: "premium", label: "Premium (Pro)", locked: true },
              ].map((item) => {
                const selected = config.layoutPreset === item.id && !item.locked;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.locked}
                    onClick={() => !item.locked && updateConfig("layoutPreset", item.id)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 8,
                      border: selected ? `2px solid ${ACCENT}` : "1px solid #e2e8f0",
                      background: item.locked ? "#f1f5f9" : "#fff",
                      cursor: item.locked ? "not-allowed" : "pointer",
                      fontSize: 11,
                      fontWeight: 800,
                      color: item.locked ? "#94a3b8" : "#334155",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      opacity: item.locked ? 0.75 : 1,
                    }}
                  >
                    {item.locked ? <Lock size={16} color="#94a3b8" /> : null}
                    {item.label}
                    {selected ? (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
                    ) : (
                      <span style={{ height: 6 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={resetConfig}
            title="Reset to defaults"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RotateCcw size={18} color="#475569" />
          </button>
          <button
            type="button"
            onClick={saveConfig}
            disabled={isSaving}
            title="Save (Ctrl+S)"
            style={{
              flex: 3,
              padding: "12px 16px",
              backgroundColor: showSaveToast ? "#16a34a" : config.buttonColor,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 800,
              cursor: isSaving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 14,
            }}
          >
            {isSaving ? (
              "Saving…"
            ) : showSaveToast ? (
              <>
                <CheckCircle2 size={18} /> Saved
              </>
            ) : (
              <>
                <Save size={18} /> Save changes
              </>
            )}
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? `${config.spacing}px` : `${Math.max(40, config.spacing * 2)}px`,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: pageBg,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            backgroundColor: "#ffffff",
            borderRadius: config.borderRadius,
            boxShadow: shadowCss(config.shadowLevel),
            border: "1px solid #e8eef3",
            fontSize: config.fontSize,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: pl.hideSubtitle ? gap : gap + 8, paddingBottom: gap + 4 }}>
            <div
              style={{
                textAlign: "center",
                marginBottom: gap + 4,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: config.buttonColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Star size={26} stroke="#fff" fill="none" strokeWidth={2.2} />
              </div>
              <h2
                style={{
                  fontSize: pl.titleSize,
                  fontWeight: 800,
                  color: config.textColor,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Write a Review
              </h2>
              {!pl.hideSubtitle && (
                <p
                  style={{
                    margin: "10px auto 0",
                    maxWidth: 380,
                    color: "#94a3b8",
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Share your experience with this product. Your feedback helps other shoppers decide.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap }} data-layout-preset={config.layoutPreset}>
              {config.showRatings ? (
                <div>
                  <label
                    style={{
                      fontWeight: 700,
                      color: config.textColor,
                      fontSize: 15,
                      display: "block",
                      marginBottom: 10,
                    }}
                  >
                    How would you rate this product?
                  </label>
                  <div
                    style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 4,
                          cursor: "pointer",
                          lineHeight: 0,
                        }}
                        aria-label={`${i} stars`}
                      >
                        <Star
                          size={36}
                          fill={i <= displayRating ? config.starColor : "none"}
                          stroke={config.starColor}
                          strokeWidth={i <= displayRating ? 0 : 2}
                          style={{ opacity: i <= displayRating ? 1 : 0.35 }}
                        />
                      </button>
                    ))}
                  </div>
                  <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 13, color: "#94a3b8" }}>
                    {previewRating} out of 5 stars
                  </p>
                  {previewErrors?.rating ? (
                    <p style={{ color: "#dc2626", fontSize: 12, margin: "6px 0 0", textAlign: "center" }}>
                      {previewErrors.rating}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {config.showWrittenReviews ? (
                <>
                  <div>
                    <label
                      htmlFor="review-author"
                      style={{ fontWeight: 700, color: config.textColor, fontSize: 14 }}
                    >
                      Your Name <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      id="review-author"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Sarah M."
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 8,
                        padding: "12px 14px",
                        borderRadius: Math.max(8, config.borderRadius * 0.75),
                        border: "1px solid #e2e8f0",
                        fontSize: "inherit",
                        boxSizing: "border-box",
                        color: config.textColor,
                        fontFamily: ff,
                      }}
                    />
                    {previewErrors?.author ? (
                      <p style={{ color: "#dc2626", fontSize: 12, margin: "6px 0 0" }}>{previewErrors.author}</p>
                    ) : null}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <label
                        htmlFor="review-comment"
                        style={{ fontWeight: 700, color: config.textColor, fontSize: 14 }}
                      >
                        Your Review <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                        {comment.length} / 500
                      </span>
                    </div>
                    <textarea
                      id="review-comment"
                      maxLength={500}
                      placeholder="What did you love about this product? How has it helped you? Any tips for others?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onFocus={() => setTextareaFocused(true)}
                      onBlur={() => setTextareaFocused(false)}
                      style={{
                        width: "100%",
                        marginTop: 8,
                        minHeight: 120,
                        padding: "12px 14px",
                        borderRadius: Math.max(8, config.borderRadius * 0.75),
                        border: `2px solid ${textareaFocused ? config.buttonColor : "#e2e8f0"}`,
                        fontSize: "inherit",
                        resize: "vertical",
                        boxSizing: "border-box",
                        color: config.textColor,
                        fontFamily: ff,
                        outline: "none",
                      }}
                    />
                    {previewErrors?.comment ? (
                      <p style={{ color: "#dc2626", fontSize: 12, margin: "6px 0 0" }}>{previewErrors.comment}</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, margin: 0 }}>
                  Written reviews are hidden for this widget preview.
                </p>
              )}

              {config.showPhotos ? (
                <div>
                  <span style={{ fontWeight: 700, color: config.textColor, fontSize: 14, display: "block", marginBottom: 8 }}>
                    Add Photos
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      addPhotos(e.dataTransfer.files);
                    }}
                    style={{
                      width: "100%",
                      border: "2px dashed #e2e8f0",
                      borderRadius: Math.max(8, config.borderRadius * 0.75),
                      padding: 20,
                      background: "#f8fafc",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 14,
                      fontFamily: ff,
                    }}
                  >
                    <ImagePlus size={28} color={config.buttonColor} strokeWidth={2} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 700, color: config.textColor, fontSize: 14 }}>
                        Drag & drop or click to upload
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>PNG, JPG up to 5MB each</div>
                    </div>
                  </button>
                  {photoError ? (
                    <p style={{ color: "#dc2626", fontSize: 12, margin: "8px 0 0" }}>{photoError}</p>
                  ) : null}
                  {photos.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {photos.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} style={{ position: "relative" }}>
                          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                          <img
                            src={photoPreviewUrls[idx]}
                            alt=""
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              border: "none",
                              borderRadius: "50%",
                              background: "#fff",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                              cursor: "pointer",
                              padding: 2,
                              display: "flex",
                            }}
                            aria-label="Remove photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={submitReview}
                disabled={isSaving}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "14px 20px",
                  backgroundColor: config.buttonColor,
                  color: "#fff",
                  border: "none",
                  borderRadius: Math.max(8, config.borderRadius * 0.75),
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: isSaving ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: ff,
                }}
              >
                <Send size={18} />
                Post Review
              </button>

              {showReviewToast ? (
                <p style={{ textAlign: "center", color: "#16a34a", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Review posted successfully. It now appears on your dashboard.
                </p>
              ) : null}
              {actionData?.reviewError ? (
                <p style={{ textAlign: "center", color: "#dc2626", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {actionData.reviewError}
                </p>
              ) : null}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 8,
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                <Shield size={14} />
                Protected by SSL. We never share your info.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PanelSection({ title, icon, titleRight, headerAction, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: ACCENT,
            textTransform: "uppercase",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.06em",
          }}
        >
          {icon}
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {titleRight ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{titleRight}</span>
          ) : null}
          {headerAction}
        </div>
      </div>
      <div
        style={{
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 10,
          border: "1px solid #eef2f6",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, icon, active, onToggle, accent }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "12px 10px",
        border: "1px solid #f1f5f9",
        borderRadius: 8,
        background: "#fafcff",
        cursor: "pointer",
        gap: 12,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", textAlign: "left" }}>{label}</span>
      </span>
      <span
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          backgroundColor: active ? accent : "#e2e8f0",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            backgroundColor: "#fff",
            borderRadius: "50%",
            position: "absolute",
            top: 2,
            left: active ? 20 : 2,
            transition: "left 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          }}
        />
      </span>
    </button>
  );
}

function ColorRow({ label, value, onColor, onHex }) {
  const [hex, setHex] = useState(value);
  useEffect(() => {
    setHex(value);
  }, [value]);
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#F59E0B";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={safeColor}
          onChange={(e) => {
            onColor(e.target.value);
            setHex(e.target.value);
          }}
          style={{
            width: 40,
            height: 40,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 0,
            cursor: "pointer",
            background: "#fff",
          }}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={() => {
            const h = normalizeHex(hex);
            if (h) onHex(h);
            else setHex(value);
          }}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            fontFamily: "ui-monospace, monospace",
            fontWeight: 600,
          }}
        />
      </div>
    </div>
  );
}

function GeomSlider({ label, min, max, value, display, onChange, accent }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 6 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ fontWeight: 800, color: accent }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
      />
    </div>
  );
}
