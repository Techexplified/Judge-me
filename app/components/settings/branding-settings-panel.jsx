/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  CORNER_PRESET_OPTIONS,
  TYPOGRAPHY_OPTIONS,
  deriveInactiveStarColor,
  normalizeHex,
  radiusFromPreset,
} from "../../lib/review-form-config.shared.js";
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
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e5ebe8",
    background: "#fff",
  },
  fieldBlock: {
    marginBottom: 22,
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
    maxWidth: 280,
    padding: "8px 12px",
    border: "1px solid #e5ebe8",
    borderRadius: 10,
    background: "#fff",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
    cursor: "pointer",
    border: "1px solid #e5ebe8",
    display: "block",
  },
  hexInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    fontFamily: APP_FONT,
    fontWeight: 500,
    color: "#202223",
    background: "transparent",
    minWidth: 0,
  },
  cornerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    maxWidth: 360,
  },
  select: {
    width: "100%",
    maxWidth: 360,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5ebe8",
    background: "#fff",
    fontSize: 14,
    fontFamily: APP_FONT,
    fontWeight: 500,
    color: "#202223",
    cursor: "pointer",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderTop: "1px solid #f0f2f1",
    marginTop: 4,
    paddingTop: 18,
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
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 8,
  },
};

function CornerPreview({ id, selected }) {
  const radiusById = {
    sharp: 0,
    slight: 5,
    default: 8,
    rounded: 999,
  };
  return (
    <span
      style={{
        width: 28,
        height: 28,
        border: `2px solid ${selected ? SHOPIFY_GREEN : "#94A3B8"}`,
        background: selected ? "#D1FAE5" : "#F8FAFC",
        borderRadius: radiusById[id] ?? 8,
        boxSizing: "border-box",
      }}
    />
  );
}

function LogoUploadBox({ logoUrl, uploading, onPick, onDrop, onRemove }) {
  return (
    <div>
      <button
        type="button"
        onClick={onPick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        disabled={uploading}
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: 120,
          padding: logoUrl ? 20 : 28,
          border: "2px dashed #d1d5db",
          borderRadius: 12,
          background: "#fafbfa",
          cursor: uploading ? "wait" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: APP_FONT,
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Brand logo"
            style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }}
          />
        ) : (
          <>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={18} color={SHOPIFY_GREEN} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#202223" }}>
              Upload your logo
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>PNG, SVG, JPG · Max 2MB</span>
          </>
        )}
      </button>
      {logoUrl ? (
        <button
          type="button"
          onClick={onRemove}
          style={{
            marginTop: 10,
            border: "none",
            background: "transparent",
            color: "#dc2626",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: APP_FONT,
            padding: 0,
          }}
        >
          Remove logo
        </button>
      ) : null}
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
  isSaving,
  isUploading,
  saveOk,
  error,
  onSave,
  onLogoUpload,
  onLogoRemove,
}) {
  const logoInputRef = useRef(null);
  const [draft, setDraft] = useState(() => ({
    brandLogoUrl: config.brandLogoUrl || null,
    starColor: config.starColor || "#F59E0B",
    radiusPreset: config.radiusPreset || "default",
    borderRadius: config.borderRadius ?? 12,
    typography: config.typography || "Inter (System)",
    hideJudgeMeBranding: config.hideJudgeMeBranding === true,
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
      hideJudgeMeBranding: config.hideJudgeMeBranding === true,
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
      hideJudgeMeBranding: draft.hideJudgeMeBranding === true,
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
              <span>Hide JudgeMe Reviews branding</span>
            </div>
            <Toggle
              active={draft.hideJudgeMeBranding === true}
              onToggle={() => {
                patchDraft({ hideJudgeMeBranding: !draft.hideJudgeMeBranding });
              }}
            />
          </div>
        </div>
      </section>

      <div style={styles.actions}>
        <PrimaryButton onClick={handleSave} loading={isSaving} disabled={isSaving || isUploading}>
          Save branding
        </PrimaryButton>
      </div>

      <style>{`
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
