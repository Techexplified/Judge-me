/* eslint-disable react/prop-types */
import { Mail, FileText, Upload } from "lucide-react";
import { PAGE_BG, SHOPIFY_GREEN, SURFACE_BORDER } from "../admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const COLLECT_TABS = [
  { id: "widget", label: "On-site widget", icon: Mail },
  { id: "review-form", label: "Review Form", icon: FileText },
  { id: "import", label: "Import Reviews", icon: Upload },
];

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 600,
    color: "#202223",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
    lineHeight: 1.5,
  },
  tab: (active) => ({
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? "#202223" : "#6d7175",
  }),
};

export function CollectReviewsShell({
  activeTab,
  onTabChange,
  onSave,
  saveDisabled,
  saveLoading,
  children,
}) {
  return (
    <div style={{ padding: "20px 24px 32px", background: PAGE_BG, minHeight: "100vh", fontFamily: FONT }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, ...type.pageTitle }}>Collect Reviews</h1>
          <p style={{ margin: "6px 0 0", ...type.subtitle }}>
            Automate how and when review requests are sent to your customers.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || saveLoading}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: saveDisabled ? "#b5bcc2" : SHOPIFY_GREEN,
            color: "#fff",
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 600,
            cursor: saveDisabled ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {saveLoading ? "Saving..." : "Save"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          marginBottom: 24,
        }}
      >
        {COLLECT_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                padding: "0 0 12px",
                marginBottom: -1,
                borderBottom: active ? "2px solid #202223" : "2px solid transparent",
                cursor: "pointer",
                ...type.tab(active),
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.25 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}
