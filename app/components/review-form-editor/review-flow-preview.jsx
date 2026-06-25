/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control */
import { useState } from "react";
import { CheckCircle2, ImagePlus, Send, Shield, Star, Video } from "lucide-react";
import {
  fontStack,
  presetLayout,
  resolveFormText,
  resolveRatingPageTitleDisplay,
  resolveTextStyle,
  shadowCss,
  starCharacter,
  isStarActive,
  textStyleToCss,
} from "../../lib/review-form-config.shared.js";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";
import { FlowStepper, getVisibleFlowSteps } from "./flow-stepper.jsx";

const DEFAULT_PREVIEW_CONTEXT = {
  productName: "Preview product",
  productImage: null,
  orderNumber: "4521",
  orderDate: "Nov 22",
};

const DIVIDER = "#E8EEF3";

function PreviewStar({ index, displayRating, config }) {
  const active = isStarActive(index, displayRating, config);
  if (config.starStyle === "emoji") {
    return (
      <span
        style={{
          fontSize: config.starSize,
          lineHeight: 1,
          color: active ? config.starColor : config.inactiveStarColor,
        }}
      >
        {starCharacter(index, displayRating, config)}
      </span>
    );
  }

  const opacity = active ? 1 : config.starStyle === "outline" ? 0.85 : 0.45;
  return (
    <Star
      size={config.starSize}
      fill={active && config.starStyle === "filled" ? config.starColor : "none"}
      stroke={config.starColor}
      strokeWidth={2}
      style={{ opacity }}
    />
  );
}

function RatingStepPreview({
  config,
  gap,
  product,
  textContext,
  displayRating,
  onRatingChange,
  onHoverChange,
}) {
  const ratingTitle = resolveRatingPageTitleDisplay(config, textContext);
  const orderMetaLine = resolveFormText(config.orderMetaLine, textContext);
  const imageSize = Math.min(96, Math.max(72, config.starSize * 2.75));
  const ratingTitleStyle = textStyleToCss(resolveTextStyle(config, ratingTitle.styleSection));
  const orderMetaStyle = textStyleToCss(resolveTextStyle(config, "orderMetaLine"));
  const badgeStyle = textStyleToCss(resolveTextStyle(config, "verifiedPurchaseLabel"));
  const starHighStyle = textStyleToCss(resolveTextStyle(config, "starLabelHigh"));
  const starLowStyle = textStyleToCss(resolveTextStyle(config, "starLabelLow"));

  return (
    <>
      <div
        style={{
          border: `1px solid ${DIVIDER}`,
          borderRadius: config.borderRadius,
          background: config.cardBackgroundColor || "#FFFFFF",
          padding: "28px 24px 24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: Math.max(10, config.borderRadius - 2),
              background: "#F0F7F4",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {product.image ? (
              /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
              <img
                src={product.image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImagePlus size={34} color={config.primaryColor} />
            )}
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 999,
              background: "#ECFDF5",
              marginBottom: 12,
              ...badgeStyle,
            }}
          >
            <CheckCircle2 size={12} strokeWidth={2.5} />
            {config.verifiedPurchaseLabel}
          </span>

          <div
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: config.textColor || "#202223",
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {product.name}
          </div>
          <div style={{ ...orderMetaStyle, marginBottom: 20 }}>{orderMetaLine}</div>

          <div style={{ height: 1, background: DIVIDER, margin: "0 0 20px" }} />

          <p
            style={{
              textAlign: "center",
              margin: `0 0 ${gap + 4}px`,
              letterSpacing: "-0.01em",
              ...ratingTitleStyle,
            }}
          >
            {ratingTitle.text}
          </p>

          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 8,
            }}
            onMouseLeave={() => onHoverChange(0)}
          >
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onRatingChange(i)}
                  onMouseEnter={() => onHoverChange(i)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 2,
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                >
                  <PreviewStar index={i} displayRating={displayRating} config={config} />
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 4px",
                minWidth: config.starSize * 5 + 40,
                margin: "0 auto",
              }}
            >
              <span style={starLowStyle}>{config.starLabelLow}</span>
              <span style={starHighStyle}>{config.starLabelHigh}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: 18,
          paddingTop: 16,
          borderTop: `1px solid ${DIVIDER}`,
          fontSize: 12,
          color: EDITOR_TOKENS.textMuted,
        }}
      >
        <Shield size={13} strokeWidth={2} />
        {config.privacyFooterText || config.trustBadgeText}
      </div>
    </>
  );
}

export function ReviewFlowPreview({ config, shopDomain, reviewContext, activeStep, onStepChange }) {
  const [previewRating, setPreviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const ff = fontStack(config.typography);
  const pl = presetLayout(config);
  const gap = Math.round(config.spacing * pl.gapScale);
  const displayRating = hoverRating || previewRating;
  const steps = getVisibleFlowSteps(config);
  const step = activeStep || steps[0]?.id || "rating";
  const product = {
    name:
      reviewContext?.productName?.trim() ||
      DEFAULT_PREVIEW_CONTEXT.productName,
    image: reviewContext?.productImage || DEFAULT_PREVIEW_CONTEXT.productImage,
  };
  const textContext = {
    item: product.name,
    store: shopDomain?.replace(".myshopify.com", "").replace(/-/g, " ") || "",
    order: DEFAULT_PREVIEW_CONTEXT.orderNumber,
    date: DEFAULT_PREVIEW_CONTEXT.orderDate,
  };
  const inputRadius = Math.max(4, config.borderRadius * 0.75);

  return (
    <div style={{ width: "100%", maxWidth: 520, fontFamily: ff }}>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          boxShadow: shadowCss(config.shadowLevel),
          border: `1px solid ${DIVIDER}`,
          padding: step === "rating" ? "24px 24px 20px" : gap + 8,
          fontSize: config.fontSize,
          color: config.textColor,
        }}
      >
        {step === "rating" ? (
          <RatingStepPreview
            config={config}
            gap={gap}
            product={product}
            textContext={textContext}
            displayRating={displayRating}
            onRatingChange={setPreviewRating}
            onHoverChange={setHoverRating}
          />
        ) : null}

        {step === "written" ? (
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            <h3 style={{ margin: 0, fontSize: pl.titleSize, fontWeight: 800 }}>{config.formTitle}</h3>
            {!pl.hideSubtitle ? (
              <p style={{ margin: 0, color: EDITOR_TOKENS.textMuted, fontSize: 14 }}>{config.formSubtitle}</p>
            ) : null}
            <label style={{ fontWeight: 700 }}>{config.nameFieldLabel}</label>
            <input
              readOnly
              placeholder="e.g. Sarah M."
              style={{
                padding: "12px 14px",
                borderRadius: inputRadius,
                border: "1px solid #E2E8F0",
                fontFamily: ff,
              }}
            />
            <label style={{ fontWeight: 700 }}>{config.reviewFieldLabel}</label>
            <textarea
              readOnly
              placeholder={config.reviewFieldPlaceholder}
              style={{
                minHeight: 100,
                padding: "12px 14px",
                borderRadius: inputRadius,
                border: "1px solid #E2E8F0",
                fontFamily: ff,
                resize: "none",
              }}
            />
          </div>
        ) : null}

        {step === "photo" ? (
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>{config.photoPageTitle}</h3>
            <div
              style={{
                border: "2px dashed #E2E8F0",
                borderRadius: inputRadius,
                padding: 24,
                background: "#F8FAFC",
                marginTop: gap,
              }}
            >
              <ImagePlus size={32} color={config.primaryColor} style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 700 }}>{config.photoUploadTitle}</div>
              <div style={{ fontSize: 12, color: EDITOR_TOKENS.textMuted, marginTop: 6 }}>{config.photoUploadHint}</div>
            </div>
          </div>
        ) : null}

        {step === "video" ? (
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>{config.videoPageTitle}</h3>
            <div
              style={{
                border: "2px dashed #E2E8F0",
                borderRadius: inputRadius,
                padding: 24,
                background: "#F8FAFC",
                marginTop: gap,
              }}
            >
              <Video size={32} color={config.primaryColor} style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 700 }}>{config.videoUploadTitle}</div>
              <div style={{ fontSize: 12, color: EDITOR_TOKENS.textMuted, marginTop: 6 }}>{config.videoUploadHint}</div>
            </div>
            <button
              type="button"
              style={{
                marginTop: 12,
                border: "none",
                background: "transparent",
                color: EDITOR_TOKENS.textMuted,
                fontSize: 13,
                cursor: "default",
              }}
            >
              {config.videoSkipLabel}
            </button>
          </div>
        ) : null}

        {step === "submit" ? (
          <div style={{ textAlign: "center", padding: gap }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>{config.formTitle}</h3>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "14px 20px",
                background: config.buttonColor,
                color: "#fff",
                border: "none",
                borderRadius: inputRadius,
                fontWeight: 800,
                fontSize: 15,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "default",
              }}
            >
              <Send size={16} />
              {config.submitButtonText}
            </button>
          </div>
        ) : null}

        {step === "privacy" ? (
          <div style={{ textAlign: "center", padding: gap }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: EDITOR_TOKENS.textMuted,
                marginBottom: 16,
              }}
            >
              <Shield size={14} />
              {config.privacyFooterText || config.trustBadgeText}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Powered by JudgeMe Reviews</div>
          </div>
        ) : null}
      </div>

      {step === "rating" ? (
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#94A3B8", fontFamily: ff }}>
          Powered by JudgeMe Reviews
        </p>
      ) : null}

      <FlowStepper steps={steps} activeStep={step} onStepChange={onStepChange} />

      <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#94A3B8", fontFamily: UI_FONT }}>
        Using: {config.radiusPreset} ({config.borderRadius}px), {config.primaryColor}
      </p>
    </div>
  );
}
