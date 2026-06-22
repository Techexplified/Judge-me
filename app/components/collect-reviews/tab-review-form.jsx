/* eslint-disable react/prop-types */
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import { SURFACE_BG, SURFACE_BORDER } from "../admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function TabReviewForm() {
  const embedNavigate = useEmbedNavigate();

  return (
    <div>
      <h3
        style={{
          margin: "0 0 16px",
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          color: "#202223",
        }}
      >
        Form Customization
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 22px",
          background: SURFACE_BG,
          border: `1px solid ${SURFACE_BORDER}`,
          borderRadius: 12,
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px", fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#202223" }}>
            Edit Review Form
          </p>
          <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
            Customize the form your customers use to leave a review
          </p>
        </div>
        <button
          type="button"
          onClick={() => embedNavigate("/app/collect-reviews/customize")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            background: "#fff",
            color: "#202223",
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
