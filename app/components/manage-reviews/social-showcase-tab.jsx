/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Check, ExternalLink, Link2, Send, Star } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BORDER } from "../admin-ui.jsx";
import {
  MAX_SHOWCASE_PHOTOS,
  MAX_SHOWCASE_REVIEWS,
  SOCIAL_SHOWCASE_ACCENT_PRESETS,
  serializeSocialShowcaseConfig,
} from "../../lib/social-showcase-config.shared.js";
import { SocialShowcasePreview } from "./social-showcase-preview.jsx";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const sectionLabel = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 700,
  color: "#6d7175",
  letterSpacing: "0.06em",
  margin: "0 0 12px",
};

const inputStyle = {
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 500,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #c9cccf",
  background: "#fff",
  color: "#202223",
};

function CounterBadge({ count, max }) {
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 999,
        background: count > 0 ? "#ecfdf5" : "#f6f6f7",
        color: count > 0 ? "#047857" : "#6d7175",
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {count} / {max} selected
    </span>
  );
}

function SectionCard({ title, badge, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <h3 style={sectionLabel}>{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function StarRow({ rating }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < r ? "#fbbf24" : "none"}
          stroke="#fbbf24"
          aria-hidden
        />
      ))}
    </span>
  );
}

export function SocialShowcaseTab({
  initialConfig,
  brandLogoUrl,
  shareUrl,
  reviewCandidates,
  photoCandidates,
  summary,
  formAction,
}) {
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const [config, setConfig] = useState(initialConfig);
  const [copied, setCopied] = useState(false);
  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (!initialConfig) return;
    setConfig((prev) => ({
      ...prev,
      ...initialConfig,
      // Preserve local text/color edits; always sync selections from server.
      storeName: prev.storeName || initialConfig.storeName,
      tagline: prev.tagline || initialConfig.tagline,
      bottomCtaHeading: prev.bottomCtaHeading || initialConfig.bottomCtaHeading,
      accentColor: prev.accentColor || initialConfig.accentColor,
      selectedReviewIds: initialConfig.selectedReviewIds ?? prev.selectedReviewIds,
      selectedMediaIds: initialConfig.selectedMediaIds ?? prev.selectedMediaIds,
    }));
  }, [initialConfig]);

  useEffect(() => {
    if (fetcher.data?.ok && fetcher.data.config) {
      setConfig(fetcher.data.config);
      shopify?.toast?.show?.("Social Showcase saved");
    } else if (fetcher.data?.error) {
      shopify?.toast?.show?.(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const updateConfig = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveConfig = useCallback(() => {
    fetcher.submit(
      {
        _intent: "saveSocialShowcase",
        config: serializeSocialShowcaseConfig(config),
      },
      { method: "post", action: formAction },
    );
  }, [config, fetcher, formAction]);

  const toggleReview = (reviewId) => {
    const ids = new Set(config.selectedReviewIds || []);
    if (ids.has(reviewId)) {
      ids.delete(reviewId);
    } else {
      if (ids.size >= MAX_SHOWCASE_REVIEWS) {
        shopify?.toast?.show?.(`You can showcase up to ${MAX_SHOWCASE_REVIEWS} reviews.`, {
          isError: true,
        });
        return;
      }
      ids.add(reviewId);
    }
    updateConfig({ selectedReviewIds: [...ids] });
  };

  const togglePhoto = (mediaId) => {
    const ids = new Set(config.selectedMediaIds || []);
    if (ids.has(mediaId)) {
      ids.delete(mediaId);
    } else {
      if (ids.size >= MAX_SHOWCASE_PHOTOS) {
        shopify?.toast?.show?.(`You can showcase up to ${MAX_SHOWCASE_PHOTOS} photos.`, {
          isError: true,
        });
        return;
      }
      ids.add(mediaId);
    }
    updateConfig({ selectedMediaIds: [...ids] });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      shopify?.toast?.show?.("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      shopify?.toast?.show?.("Could not copy link", { isError: true });
    }
  };

  const shareLink = async () => {
    fetcher.submit(
      {
        _intent: "saveSocialShowcase",
        config: serializeSocialShowcaseConfig(config),
      },
      { method: "post", action: formAction },
    );
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${config.storeName || "Store"} reviews`,
          url: shareUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  };

  const previewUrl = shareUrl;

  return (
    <div style={{ display: "flex", minHeight: 720, background: "#f6f6f7" }}>
      <div
        style={{
          flex: "1 1 420px",
          minWidth: 320,
          maxWidth: 520,
          overflowY: "auto",
          padding: 20,
          borderRight: `1px solid ${SURFACE_BORDER}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            type="button"
            onClick={saveConfig}
            disabled={isSaving}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: SHOPIFY_GREEN,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              cursor: isSaving ? "wait" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>

        <SectionCard title="CONTENT">
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ ...sectionLabel, letterSpacing: 0, fontSize: 12, display: "block", marginBottom: 6 }}>
              Store name
            </span>
            <input
              type="text"
              value={config.storeName || ""}
              onChange={(e) => updateConfig({ storeName: e.target.value })}
              style={inputStyle}
              maxLength={120}
            />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ ...sectionLabel, letterSpacing: 0, fontSize: 12, display: "block", marginBottom: 6 }}>
              Tagline
            </span>
            <input
              type="text"
              value={config.tagline || ""}
              onChange={(e) => updateConfig({ tagline: e.target.value })}
              style={inputStyle}
              maxLength={200}
              placeholder={`See why ${(summary?.total || 0).toLocaleString()} customers love us`}
            />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ ...sectionLabel, letterSpacing: 0, fontSize: 12, display: "block", marginBottom: 6 }}>
              Bottom CTA heading
            </span>
            <input
              type="text"
              value={config.bottomCtaHeading || ""}
              onChange={(e) => updateConfig({ bottomCtaHeading: e.target.value })}
              style={inputStyle}
              maxLength={120}
            />
          </label>
        </SectionCard>

        <SectionCard title="ACCENT COLOR">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {SOCIAL_SHOWCASE_ACCENT_PRESETS.map((color) => {
              const active = config.accentColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateConfig({ accentColor: color })}
                  aria-label={`Accent color ${color}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: active ? "2px solid #202223" : "2px solid transparent",
                    background: color,
                    cursor: "pointer",
                    boxShadow: active ? "0 0 0 2px #fff inset" : "none",
                  }}
                />
              );
            })}
          </div>
          <input
            type="text"
            value={config.accentColor || ""}
            onChange={(e) => updateConfig({ accentColor: e.target.value })}
            style={inputStyle}
            maxLength={7}
            placeholder="#1D9E75"
          />
        </SectionCard>

        <SectionCard
          title="TOP REVIEWS"
          badge={
            <CounterBadge
              count={(config.selectedReviewIds || []).length}
              max={MAX_SHOWCASE_REVIEWS}
            />
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
            {reviewCandidates.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>No published reviews yet.</p>
            ) : (
              reviewCandidates.map((review) => {
                const selected = (config.selectedReviewIds || []).includes(review.id);
                const atLimit =
                  !selected && (config.selectedReviewIds || []).length >= MAX_SHOWCASE_REVIEWS;
                return (
                  <label
                    key={review.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${selected ? SHOPIFY_GREEN : SURFACE_BORDER}`,
                      background: selected ? "#f0fdf8" : "#fff",
                      cursor: atLimit ? "not-allowed" : "pointer",
                      opacity: atLimit ? 0.55 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={atLimit}
                      onChange={() => toggleReview(review.id)}
                      style={{ marginTop: 3 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontFamily: FONT, fontSize: 13 }}>{review.author}</strong>
                        <StarRow rating={review.rating} />
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: FONT,
                          fontSize: 12,
                          color: "#6d7175",
                          lineHeight: 1.45,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {review.comment}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="TOP PHOTOS"
          badge={
            <CounterBadge
              count={(config.selectedMediaIds || []).length}
              max={MAX_SHOWCASE_PHOTOS}
            />
          }
        >
          {photoCandidates.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>No customer photos yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {photoCandidates.map((photo) => {
                const selected = (config.selectedMediaIds || []).includes(photo.id);
                const atLimit =
                  !selected && (config.selectedMediaIds || []).length >= MAX_SHOWCASE_PHOTOS;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => !atLimit && togglePhoto(photo.id)}
                    disabled={atLimit}
                    style={{
                      position: "relative",
                      padding: 0,
                      border: selected ? `2px solid ${SHOPIFY_GREEN}` : `1px solid ${SURFACE_BORDER}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      aspectRatio: "1",
                      cursor: atLimit ? "not-allowed" : "pointer",
                      opacity: atLimit ? 0.55 : 1,
                      background: "#f6f6f7",
                    }}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {selected ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: SHOPIFY_GREEN,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="SHARE">
          <button
            type="button"
            onClick={shareLink}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: SHOPIFY_GREEN,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            <Send size={16} />
            Share Instantly
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" readOnly value={shareUrl} style={{ ...inputStyle, flex: 1 }} />
            <button
              type="button"
              onClick={copyLink}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#202223",
                color: "#fff",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </SectionCard>
      </div>

      <div
        style={{
          flex: "1 1 360px",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#e8eaed",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            maxWidth: 375,
            marginBottom: 12,
          }}
        >
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "#fff",
              color: "#202223",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Preview in new tab
            <ExternalLink size={14} />
          </a>
        </div>
        <div
          style={{
            width: 375,
            maxWidth: "100%",
            borderRadius: 28,
            border: "8px solid #111",
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            background: "#fff",
          }}
        >
          <SocialShowcasePreview
            config={config}
            brandLogoUrl={brandLogoUrl}
            summary={summary}
            reviewCandidates={reviewCandidates}
            photoCandidates={photoCandidates}
          />
        </div>
      </div>
    </div>
  );
}
