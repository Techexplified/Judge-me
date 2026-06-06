/* eslint-disable react/prop-types */
import { Undo2, Redo2, Eye, Upload, CheckCircle2 } from "lucide-react";
import { CustomizerSidebar } from "./customizer-sidebar.jsx";
import { ReviewFormPreview } from "./review-form-preview.jsx";
import { TOKENS, UI_FONT } from "./customizer-styles.js";

export function CustomizerShell({
  config,
  updateConfig,
  patchConfig,
  replaceConfig,
  onReset,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSaving,
  showPublishToast,
  saveError,
  reviewContext,
  getConfig,
  actionData,
  onSubmitReview,
  onPreview,
  publishBlocked = false,
  publishBlockedMessage = "",
  widgetUsage = null,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        background: TOKENS.panelBg,
        fontFamily: UI_FONT,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          background: TOKENS.white,
          borderBottom: `1px solid ${TOKENS.border}`,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            color: TOKENS.text,
            letterSpacing: "-0.02em",
          }}
        >
          Review Form Widget Customization
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo" style={iconBtnStyle(!canUndo)}>
            <Undo2 size={17} />
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo" style={iconBtnStyle(!canRedo)}>
            <Redo2 size={17} />
          </button>
          <button type="button" onClick={onPreview} style={secondaryBtnStyle}>
            <Eye size={15} />
            Preview
          </button>
          {widgetUsage ? (
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              {widgetUsage.remaining}/{widgetUsage.limit} publishes left
            </span>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || publishBlocked}
            title={publishBlocked ? publishBlockedMessage : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: showPublishToast ? "#16a34a" : publishBlocked ? "#94a3b8" : TOKENS.green,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: isSaving ? "wait" : publishBlocked ? "not-allowed" : "pointer",
              fontFamily: UI_FONT,
            }}
          >
            {isSaving ? (
              "Publishing…"
            ) : showPublishToast ? (
              <>
                <CheckCircle2 size={16} /> Published
              </>
            ) : (
              <>
                <Upload size={16} />
                Save & Publish
              </>
            )}
          </button>
        </div>
      </header>

      {showPublishToast ? (
        <div
          style={{
            padding: "10px 24px",
            background: "#ecfdf5",
            color: "#047857",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "1px solid #a7f3d0",
            fontFamily: UI_FONT,
          }}
        >
          Published — your form is live on the storefront (refresh product pages to see changes).
        </div>
      ) : null}
      {publishBlocked && publishBlockedMessage && !saveError ? (
        <div
          style={{
            padding: "10px 24px",
            background: "#fffbeb",
            color: "#92400e",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "1px solid #fde68a",
            fontFamily: UI_FONT,
          }}
        >
          {publishBlockedMessage}
        </div>
      ) : null}
      {saveError ? (
        <div
          style={{
            padding: "10px 24px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "1px solid #fecaca",
            fontFamily: UI_FONT,
          }}
        >
          {saveError}
        </div>
      ) : null}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside
          style={{
            width: 400,
            minWidth: 360,
            background: TOKENS.panelBg,
            borderRight: `1px solid ${TOKENS.border}`,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <CustomizerSidebar
            config={config}
            getConfig={getConfig}
            updateConfig={updateConfig}
            patchConfig={patchConfig}
            replaceConfig={replaceConfig}
            onReset={onReset}
          />
        </aside>

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 48,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: config.backgroundColor,
          }}
        >
          <ReviewFormPreview
            config={config}
            reviewContext={reviewContext}
            isSaving={isSaving}
            actionData={actionData}
            onSubmitReview={onSubmitReview}
          />
        </main>
      </div>
    </div>
  );
}

function iconBtnStyle(disabled) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${TOKENS.border}`,
    background: TOKENS.white,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
    color: "#64748b",
  };
}

const secondaryBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  borderRadius: 10,
  border: `1px solid ${TOKENS.border}`,
  background: TOKENS.white,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  color: "#334155",
  fontFamily: UI_FONT,
};
