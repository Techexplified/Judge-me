/* eslint-disable react/prop-types */
import {
  STAR_PATH,
  resolveStarDisplay,
} from "../../lib/review-form-config.shared.js";

/** Star SVG for editor/onboarding previews — matches storefront review-widget.js */
export function PreviewStar({ index, rating, config }) {
  const star = resolveStarDisplay(index, rating, config);
  const size = Math.round(config.starSize * (star.fontSizeScale || 1));
  const path = star.path || STAR_PATH;
  const fill = star.svgFill ?? star.color;
  const stroke = star.svgStroke ?? "none";
  const strokeWidth = star.svgStrokeWidth ?? 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        display: "block",
        opacity: star.opacity,
        filter: star.svgFilter || undefined,
      }}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
