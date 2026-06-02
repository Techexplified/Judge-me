/* eslint-disable react/prop-types, jsx-a11y/label-has-associated-control, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useEffect, useRef, useState } from "react";
import { Star, Send, Shield, ImagePlus, Video, X } from "lucide-react";
import {
  MAX_REVIEW_IMAGES,
  MAX_REVIEW_VIDEOS,
  validateReviewMediaFile,
} from "../../lib/review-media.shared.js";
import {
  fontStack,
  presetLayout,
  shadowCss,
  starCharacter,
  isStarActive,
} from "../../lib/review-form-config.shared.js";

function PreviewStar({ index, displayRating, config }) {
  const active = isStarActive(index, displayRating, config);
  if (config.starStyle === "emoji") {
    return (
      <span style={{ fontSize: config.starSize, lineHeight: 1 }}>
        {starCharacter(index, displayRating, config)}
      </span>
    );
  }
  if (config.starStyle === "outline") {
    return (
      <Star
        size={config.starSize}
        fill={active ? config.starColor : "none"}
        stroke={active ? config.starColor : config.inactiveStarColor}
        strokeWidth={2}
      />
    );
  }
  return (
    <Star
      size={config.starSize}
      fill={active ? config.starColor : "none"}
      stroke={active ? config.starColor : config.inactiveStarColor}
      strokeWidth={active ? 0 : 2}
      style={{ opacity: active ? 1 : 0.4 }}
    />
  );
}

export function ReviewFormPreview({
  config,
  reviewContext,
  isSaving,
  actionData,
  onSubmitReview,
}) {
  const [previewRating, setPreviewRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [previewErrors, setPreviewErrors] = useState(null);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [showReviewToast, setShowReviewToast] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const ff = fontStack(config.typography);
  const pl = presetLayout(config);
  const gap = Math.round(config.spacing * pl.gapScale);
  const displayRating = hoverRating || previewRating;
  const allowImages = config.showPhotos !== false;
  const allowVideos = config.showVideos !== false;
  const showMediaUpload = allowImages || allowVideos;

  useEffect(() => {
    if (actionData?.reviewSaved) {
      setShowReviewToast(true);
      setAuthor("");
      setComment("");
      setPreviewRating(5);
      setMediaItems([]);
      const t = setTimeout(() => setShowReviewToast(false), 2800);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  useEffect(() => {
    const urls = mediaItems.map((item) => URL.createObjectURL(item.file));
    setMediaPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [mediaItems]);

  const addMediaFiles = (fileList) => {
    setMediaError("");
    const next = Array.from(fileList || []);
    if (!next.length) return;
    let imageCount = mediaItems.filter((m) => m.kind === "image").length;
    let videoCount = mediaItems.filter((m) => m.kind === "video").length;
    const accepted = [];
    for (const file of next) {
      const check = validateReviewMediaFile(file, {
        allowImages,
        allowVideos,
        imageCount,
        videoCount,
      });
      if (!check.ok) {
        setMediaError(check.error);
        return;
      }
      if (check.kind === "image") imageCount += 1;
      if (check.kind === "video") videoCount += 1;
      accepted.push({ file, kind: check.kind });
    }
    setMediaItems((p) => [...p, ...accepted]);
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
    onSubmitReview({
      rating: config.showRatings !== false ? previewRating : 5,
      author: config.showWrittenReviews !== false ? author.trim() : "Anonymous",
      comment: config.showWrittenReviews !== false ? comment.trim() : "—",
      mediaItems,
    });
  };

  const inputRadius = Math.max(8, config.borderRadius * 0.75);

  return (
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
        fontFamily: ff,
        color: config.textColor,
      }}
    >
      <div style={{ padding: pl.hideSubtitle ? gap : gap + 8, paddingBottom: gap + 4 }}>
        <div style={{ textAlign: "center", marginBottom: gap + 4 }}>
          {config.brandLogoUrl ? (
            /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
            <img
              src={config.brandLogoUrl}
              alt=""
              style={{
                maxHeight: 52,
                maxWidth: 120,
                objectFit: "contain",
                marginBottom: 14,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: config.primaryColor,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Star size={26} stroke="#fff" fill="none" strokeWidth={2.2} />
            </div>
          )}
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
          {!pl.hideSubtitle ? (
            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 380,
                color: "#94a3b8",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Share your experience with this product. Your feedback helps other shoppers decide.
            </p>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {config.showRatings ? (
            <div>
              <label style={{ fontWeight: 700, fontSize: 15, display: "block", marginBottom: 10 }}>
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
                    style={{ border: "none", background: "transparent", padding: 4, cursor: "pointer" }}
                  >
                    <PreviewStar index={i} displayRating={displayRating} config={config} />
                  </button>
                ))}
              </div>
              <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 13, color: "#94a3b8" }}>
                {previewRating} out of 5 stars
              </p>
              {previewErrors?.rating ? (
                <p style={{ color: "#dc2626", fontSize: 12, textAlign: "center" }}>{previewErrors.rating}</p>
              ) : null}
            </div>
          ) : null}

          {config.showWrittenReviews ? (
            <>
              <div>
                <label htmlFor="review-author" style={{ fontWeight: 700, fontSize: 14 }}>
                  Your Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  id="review-author"
                  type="text"
                  placeholder="e.g. Sarah M."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "12px 14px",
                    borderRadius: inputRadius,
                    border: "1px solid #e2e8f0",
                    boxSizing: "border-box",
                    fontFamily: ff,
                    fontSize: "inherit",
                  }}
                />
                {previewErrors?.author ? (
                  <p style={{ color: "#dc2626", fontSize: 12 }}>{previewErrors.author}</p>
                ) : null}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label htmlFor="review-comment" style={{ fontWeight: 700, fontSize: 14 }}>
                    Your Review <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{comment.length} / 500</span>
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
                    borderRadius: inputRadius,
                    border: `2px solid ${textareaFocused ? config.buttonColor : "#e2e8f0"}`,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: ff,
                    outline: "none",
                  }}
                />
                {previewErrors?.comment ? (
                  <p style={{ color: "#dc2626", fontSize: 12 }}>{previewErrors.comment}</p>
                ) : null}
              </div>
            </>
          ) : null}

          {showMediaUpload ? (
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, display: "block", marginBottom: 8 }}>
                {allowImages && allowVideos ? "Add Photos" : allowVideos ? "Add Videos" : "Add Photos"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  allowImages && allowVideos
                    ? "image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webm"
                    : allowVideos
                      ? "video/mp4,video/quicktime,video/webm"
                      : "image/png,image/jpeg,image/jpg,image/webp"
                }
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  addMediaFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  addMediaFiles(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  width: "100%",
                  border: "2px dashed #e2e8f0",
                  borderRadius: inputRadius,
                  padding: 20,
                  background: "#f8fafc",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {allowVideos ? (
                  <Video size={28} color={config.buttonColor} />
                ) : (
                  <ImagePlus size={28} color={config.buttonColor} />
                )}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Drag & drop or click to upload</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    PNG, JPG up to 5MB each
                  </div>
                </div>
              </button>
              {mediaError ? <p style={{ color: "#dc2626", fontSize: 12 }}>{mediaError}</p> : null}
              {mediaItems.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {mediaItems.map((item, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      {item.kind === "video" ? (
                        <video
                          src={mediaPreviewUrls[idx]}
                          muted
                          style={{ width: 88, height: 64, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
                        <img
                          src={mediaPreviewUrls[idx]}
                          alt=""
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaItems((p) => p.filter((_, i) => i !== idx))}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          border: "none",
                          borderRadius: "50%",
                          background: "#fff",
                          cursor: "pointer",
                        }}
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
              padding: "14px 20px",
              backgroundColor: config.buttonColor,
              color: "#fff",
              border: "none",
              borderRadius: inputRadius,
              fontWeight: 800,
              fontSize: 15,
              cursor: isSaving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Send size={18} />
            Post Review
          </button>

          {showReviewToast ? (
            <p style={{ textAlign: "center", color: "#16a34a", fontSize: 13, fontWeight: 700 }}>
              Review posted successfully.
            </p>
          ) : null}
          {actionData?.reviewError ? (
            <p style={{ textAlign: "center", color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
              {actionData.reviewError}
            </p>
          ) : null}

          {config.trustBadgeEnabled !== false ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              <Shield size={14} />
              {config.trustBadgeText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
