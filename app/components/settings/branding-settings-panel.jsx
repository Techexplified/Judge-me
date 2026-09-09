/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { Upload, RefreshCw, Trash2, Star } from "lucide-react";
import {
  CORNER_PRESET_OPTIONS,
  TYPOGRAPHY_OPTIONS,
  deriveInactiveStarColor,
  normalizeHex,
  radiusFromPreset,
} from "../../lib/review-form-config.shared.js";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { Banner, PrimaryButton, SHOPIFY_GREEN } from "../admin-ui";

const APP_FONT = "'Inter', system-ui, -apple-system, sans-serif";

/** Wireframe shows four corner styles (skip pill / custom). */
const BRANDING_CORNER_OPTIONS = CORNER_PRESET_OPTIONS.filter((o) =>
  ["sharp", "slight", "default", "rounded"].includes(o.id),
);

const styles = {
  page: {
    fontFamily: APP_FONT,
    color: "#202223",
  },
  heading: {
    margin: "0 0 28px",
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#202223",
  },
  section: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 220px) minmax(0, 1fr)",
    gap: "16px 40px",
    alignItems: "start",
    marginBottom: 40,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#202223",
  },
  sectionSub: {
    margin: "6px 0 0",
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.45,
    color: "#6d7175",
  },
  styleCard: {
    padding: 24,
    borderRadius: 14,
    border: "1px solid #e5ebe8",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  fieldBlock: {
    marginBottom: 24,
  },
  fieldLabel: {
    display: "block",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#6d7175",
  },
  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: 170,
    padding: "6px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fff",
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    display: "block",
  },
  hexInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    fontFamily: APP_FONT,
    fontWeight: 600,
    color: "#1e293b",
    background: "transparent",
    minWidth: 0,
    textTransform: "uppercase",
  },
  cornerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    maxWidth: 420,
  },
  select: {
    width: "100%",
    maxWidth: 380,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 14,
    fontFamily: APP_FONT,
    fontWeight: 500,
    color: "#202223",
    cursor: "pointer",
    outline: "none",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderTop: "1px solid #f0f2f1",
    marginTop: 6,
    paddingTop: 20,
  },
  footerLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    fontSize: 13,
    fontWeight: 600,
    color: "#202223",
  },
  proPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #fff 0%, #dbeafe 40%, #ede9fe 100%)",
    border: "1px solid #e5ebe8",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#475569",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 12,
  },
};

function CornerPreview({ id, selected }) {
  const radiusById = {
    sharp: 0,
    slight: 4,
    default: 8,
    rounded: 999,
  };
  return (
    <span
      style={{
        width: 26,
        height: 26,
        border: `2px solid ${selected ? SHOPIFY_GREEN : "#94a3b8"}`,
        background: selected ? "#d1fae5" : "#f8fafc",
        borderRadius: radiusById[id] ?? 8,
        boxSizing: "border-box",
      }}
    />
  );
}

function LogoUploadBox({ logoUrl, uploading, onPick, onDrop, onRemove }) {
  const [isDragOver, setIsDragOver] = useState(false);

  if (uploading) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          minHeight: 110,
          padding: 24,
          borderRadius: 14,
          border: "1px solid #e5ebe8",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: APP_FONT,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "3px solid #e5ebe8",
            borderTopColor: SHOPIFY_GREEN,
            borderRadius: "50%",
            animation: "jd-spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
          Uploading logo...
        </span>
      </div>
    );
  }

  if (logoUrl) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          border: "1px solid #e5ebe8",
          borderRadius: 14,
          padding: "16px 20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              src={logoUrl}
              alt="Brand logo"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                Brand Logo
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: SHOPIFY_GREEN,
                  background: "#ecfdf5",
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #d1fae5",
                }}
              >
                Active
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
              Shown on review forms & widgets
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onPick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              fontFamily: APP_FONT,
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            <RefreshCw size={13} />
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              fontSize: 13,
              fontWeight: 600,
              color: "#dc2626",
              cursor: "pointer",
              fontFamily: APP_FONT,
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.borderColor = "#f87171";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.borderColor = "#fecaca";
            }}
          >
            <Trash2 size={13} />
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onPick}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e);
      }}
      style={{
        width: "100%",
        maxWidth: 480,
        padding: "32px 24px",
        borderRadius: 14,
        border: `2px dashed ${isDragOver ? SHOPIFY_GREEN : "#d1d5db"}`,
        background: isDragOver ? "#f0fdf4" : "#fafbfa",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: APP_FONT,
        transition: "all 0.2s ease",
      }}
      onMouseOver={(e) => {
        if (!isDragOver) {
          e.currentTarget.style.background = "#f4f7f5";
          e.currentTarget.style.borderColor = "#9ca3af";
        }
      }}
      onMouseOut={(e) => {
        if (!isDragOver) {
          e.currentTarget.style.background = "#fafbfa";
          e.currentTarget.style.borderColor = "#d1d5db";
        }
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#ecfdf5",
          border: "1px solid #d1fae5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: SHOPIFY_GREEN,
        }}
      >
        <Upload size={20} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
          Click to upload or drag & drop
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          PNG, SVG, JPG or WebP (max 2MB)
        </p>
      </div>
    </div>
  );
}

function Toggle({ active, onToggle, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        backgroundColor: active ? SHOPIFY_GREEN : "#e5e7eb",
        position: "relative",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        padding: 0,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          backgroundColor: "#fff",
          borderRadius: "50%",
          position: "absolute",
          top: 2,
          left: active ? 22 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

/**
 * @param {{
 *   config: Record<string, unknown>,
 *   hasPro: boolean,
 *   isSaving: boolean,
 *   isUploading: boolean,
 *   saveOk?: boolean,
 *   error?: string | null,
 *   onSave: (patch: Record<string, unknown>) => void,
 *   onLogoUpload: (file: File) => void,
 *   onLogoRemove: () => void,
 * }} props
 */
export function BrandingSettingsPanel({
  config,
  hasPro,
  isSaving,
  isUploading,
  saveOk,
  error,
  onSave,
  onLogoUpload,
  onLogoRemove,
}) {
  const location = useLocation();
  const logoInputRef = useRef(null);
  const [draft, setDraft] = useState(() => ({
    brandLogoUrl: config.brandLogoUrl || null,
    starColor: config.starColor || "#F59E0B",
    radiusPreset: config.radiusPreset || "default",
    borderRadius: config.borderRadius ?? 12,
    typography: config.typography || "Inter (System)",
    hideVerdictBranding: config.hideVerdictBranding === true,
  }));
  const [hex, setHex] = useState(draft.starColor);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    setDraft({
      brandLogoUrl: config.brandLogoUrl || null,
      starColor: config.starColor || "#F59E0B",
      radiusPreset: config.radiusPreset || "default",
      borderRadius: config.borderRadius ?? 12,
      typography: config.typography || "Inter (System)",
      hideVerdictBranding: config.hideVerdictBranding === true,
    });
    setHex(config.starColor || "#F59E0B");
  }, [config]);

  const patchDraft = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const onLogoFile = (file) => {
    setLogoError("");
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be 2MB or less.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      setLogoError("Use PNG, JPG, SVG, or WebP.");
      return;
    }
    onLogoUpload(file);
  };

  const applyStarColor = (value) => {
    const normalized = normalizeHex(value) || value;
    setHex(normalized);
    patchDraft({ starColor: normalized });
  };

  const pricingHref = mergeShopifyEmbedParams("/app/settings", location.search);

  const handleSave = () => {
    const starColor = normalizeHex(draft.starColor) || draft.starColor;
    onSave({
      starColor,
      inactiveStarColor: deriveInactiveStarColor(starColor),
      radiusPreset: draft.radiusPreset,
      borderRadius:
        draft.radiusPreset === "custom"
          ? draft.borderRadius
          : radiusFromPreset(draft.radiusPreset, draft.borderRadius),
      typography: draft.typography,
      hideVerdictBranding: hasPro ? draft.hideVerdictBranding === true : false,
      brandLogoUrl: draft.brandLogoUrl,
    });
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Branding</h2>

      {error ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="critical">{error}</Banner>
        </div>
      ) : null}
      {saveOk ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="success">Branding settings saved.</Banner>
        </div>
      ) : null}
      {logoError ? (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="critical">{logoError}</Banner>
        </div>
      ) : null}

      <section className="jd-branding-section" style={styles.section}>
        <div>
          <p style={styles.sectionLabel}>Logo</p>
          <p style={styles.sectionSub}>Shown on your review form and storefront widgets.</p>
        </div>
        <div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              onLogoFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <LogoUploadBox
            logoUrl={draft.brandLogoUrl}
            uploading={isUploading}
            onPick={() => logoInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              onLogoFile(e.dataTransfer.files?.[0]);
            }}
            onRemove={() => {
              patchDraft({ brandLogoUrl: null });
              onLogoRemove();
            }}
          />
        </div>
      </section>

      <section className="jd-branding-section" style={styles.section}>
        <div>
          <p style={styles.sectionLabel}>Style</p>
          <p style={styles.sectionSub}>Colors, corners, and type for your review experience.</p>
        </div>
        <div style={styles.styleCard}>
          <div style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Star rating</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={styles.colorRow}>
                <label style={styles.colorSwatch}>
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#F59E0B"}
                    onChange={(e) => applyStarColor(e.target.value)}
                    style={{
                      width: 40,
                      height: 40,
                      margin: -4,
                      padding: 0,
                      border: "none",
                      cursor: "pointer",
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={hex}
                  aria-label="Star color hex code"
                  placeholder="Hex code"
                  onChange={(e) => setHex(e.target.value)}
                  onBlur={() => {
                    const n = normalizeHex(hex);
                    if (n) applyStarColor(n);
                    else setHex(draft.starColor);
                  }}
                  style={styles.hexInput}
                />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "7px 14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={draft.starColor || "#F59E0B"}
                    color={draft.starColor || "#F59E0B"}
                  />
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginLeft: 6 }}>
                  5.0 Preview
                </span>
              </div>
            </div>
          </div>

          <div style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Corner style</span>
            <div style={styles.cornerGrid}>
              {BRANDING_CORNER_OPTIONS.map((opt) => {
                const selected = draft.radiusPreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={opt.label}
                    aria-pressed={selected}
                    onClick={() =>
                      patchDraft({
                        radiusPreset: opt.id,
                        borderRadius: radiusFromPreset(opt.id),
                      })
                    }
                    style={{
                      minHeight: 64,
                      padding: "12px 8px",
                      borderRadius: 10,
                      border: `2px solid ${selected ? SHOPIFY_GREEN : "#e5ebe8"}`,
                      background: selected ? "#ecfdf5" : "#fff",
                      cursor: "pointer",
                      fontFamily: APP_FONT,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <CornerPreview id={opt.id} selected={selected} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: selected ? SHOPIFY_GREEN : "#6d7175",
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Main font</span>
            <select
              value={draft.typography}
              onChange={(e) => patchDraft({ typography: e.target.value })}
              style={styles.select}
            >
              {TYPOGRAPHY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.footerRow}>
            <div style={styles.footerLabel}>
              <span>Hide Verdict Product Reviews branding</span>
              <span style={styles.proPill}>Pro</span>
            </div>
            <Toggle
              active={draft.hideVerdictBranding === true}
              disabled={!hasPro}
              onToggle={() => {
                if (!hasPro) return;
                patchDraft({ hideVerdictBranding: !draft.hideVerdictBranding });
              }}
            />
          </div>
          {!hasPro ? (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6d7175", lineHeight: 1.45 }}>
              Remove “Powered by Verdict Product Reviews” from storefront widgets.{" "}
              <Link to={pricingHref} style={{ color: SHOPIFY_GREEN, fontWeight: 700 }}>
                Upgrade to Pro
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <div style={styles.actions}>
        <PrimaryButton onClick={handleSave} loading={isSaving} disabled={isSaving || isUploading}>
          Save branding
        </PrimaryButton>
      </div>

      <style>{`
        @keyframes jd-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 720px) {
          .jd-branding-section {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
