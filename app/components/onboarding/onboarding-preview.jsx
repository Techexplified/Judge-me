/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useRef } from "react";
import { Star, Send, X } from "lucide-react";
import { SHOPIFY_GREEN } from "../admin-ui";
import { fontStack, presetLayout, shadowCss } from "../../lib/review-form-config.shared.js";
import { PreviewStar } from "../review-form/preview-star.jsx";

const LOGO_ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml,image/webp";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function OnboardingPreview({
  config,
  brandLogoUrl,
  storeName,
  onLogoFile,
  onLogoRemove,
  logoError,
  logoUploading,
}) {
  const fileInputRef = useRef(null);
  const ff = fontStack(config.typography);
  const pl = presetLayout(config);
  const rating = 4;
  const accent = config.buttonColor || config.primaryColor || "#0d9488";
  const logoRadius = config.layoutPreset === "minimal" ? 8 : 10;

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      onLogoFile(null, "Logo must be 2MB or less.");
      return;
    }
    const allowed = LOGO_ACCEPT.split(",");
    if (!allowed.includes(file.type)) {
      onLogoFile(null, "Use PNG, JPG, SVG, or WebP.");
      return;
    }
    onLogoFile(file, null);
  };

  return (
    <div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#6d7175",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Live preview
      </p>
      <div
        style={{
          background: "#faf8f5",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            background: config.backgroundColor || "#fff",
            borderRadius: config.borderRadius || 12,
            padding: "28px 24px",
            boxShadow: shadowCss(config.shadowLevel),
            fontFamily: ff,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt="Store logo"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: logoRadius,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: logoRadius,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Star size={22} color="#fff" fill="#fff" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <h3
            style={{
              margin: "0 0 6px",
              fontSize: pl.titleSize ? pl.titleSize * 0.75 : 18,
              fontWeight: 800,
              color: config.textColor || "#202223",
            }}
          >
            {storeName?.trim() || config.formTitle || "Write a Review"}
          </h3>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: config.fontSize || 14,
              color: config.secondaryColor || "#6d7175",
              fontWeight: 500,
              maxWidth: 260,
            }}
          >
            {storeName?.trim()
              ? `Share your experience shopping at ${storeName.trim()}`
              : config.formSubtitle || "Share your experience with this product"}
          </p>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 20,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <PreviewStar key={i} index={i} rating={rating} config={config} />
            ))}
          </div>
          <button
            type="button"
            style={{
              width: "100%",
              maxWidth: 280,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius:
                config.radiusPreset === "pill"
                  ? 999
                  : config.radiusPreset === "sharp"
                    ? 6
                    : 10,
              border: "none",
              background: accent,
              color: "#fff",
              fontWeight: 700,
              fontSize: config.fontSize || 14,
              fontFamily: ff,
              cursor: "default",
            }}
          >
            <Send size={16} />
            {config.submitButtonText || "Post Review"}
          </button>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={logoUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12,
                fontWeight: 700,
                color: SHOPIFY_GREEN,
                cursor: logoUploading ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: logoUploading ? 0.6 : 1,
              }}
            >
              {logoUploading ? "Uploading…" : brandLogoUrl ? "Change logo" : "Upload logo"}
            </button>
            {brandLogoUrl ? (
              <button
                type="button"
                disabled={logoUploading}
                onClick={onLogoRemove}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6d7175",
                  cursor: logoUploading ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                <X size={12} />
                Remove
              </button>
            ) : null}
          </div>
          {logoError ? (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#d72c0d", fontWeight: 600 }}>
              {logoError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
