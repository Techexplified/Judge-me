/* eslint-disable react/prop-types */
import { useState } from "react";
import { CheckCircle2, Eye, Monitor, Redo2, Smartphone, Undo2 } from "lucide-react";
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import { EditorRootMenu } from "./editor-root-menu.jsx";
import { PanelStyleColor } from "./panel-style-color.jsx";
import { PanelText } from "./panel-text.jsx";
import { PanelPreferences } from "./panel-preferences.jsx";
import { BrowserPreviewFrame } from "./browser-preview-frame.jsx";
import { ReviewFlowPreview } from "./review-flow-preview.jsx";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

export function ReviewFormEditorShell({
  config,
  updateConfig,
  patchConfig,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSaving,
  showSaveToast,
  saveError,
  onPreview,
  onLogoUpload,
  onAutofill,
  autofillLoading,
  autofillError,
  shopDomain,
  publishBlocked = false,
  publishBlockedMessage = "",
}) {
  const embedNavigate = useEmbedNavigate();
  const [activePanel, setActivePanel] = useState(null);
  const [viewport, setViewport] = useState("desktop");
  const [previewStep, setPreviewStep] = useState("rating");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        background: EDITOR_TOKENS.panelBg,
        fontFamily: UI_FONT,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: EDITOR_TOKENS.white,
          borderBottom: `1px solid ${EDITOR_TOKENS.border}`,
          flexShrink: 0,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => embedNavigate("/app/collect-reviews?tab=review-form")}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: EDITOR_TOKENS.textMuted,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontFamily: UI_FONT,
            padding: 0,
          }}
        >
          ← Collect Reviews
        </button>

        <div
          style={{
            display: "inline-flex",
            border: `1px solid ${EDITOR_TOKENS.border}`,
            borderRadius: 10,
            overflow: "hidden",
            background: EDITOR_TOKENS.white,
          }}
        >
          {[
            { id: "desktop", label: "Desktop", icon: Monitor },
            { id: "mobile", label: "Mobile", icon: Smartphone },
          ].map((item) => {
            const Icon = item.icon;
            const active = viewport === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewport(item.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  border: "none",
                  background: active ? "#ECFDF5" : EDITOR_TOKENS.white,
                  color: active ? EDITOR_TOKENS.themeGreen : EDITOR_TOKENS.textMuted,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: UI_FONT,
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onUndo} disabled={!canUndo} style={iconBtnStyle}>
            <Undo2 size={16} />
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo} style={iconBtnStyle}>
            <Redo2 size={16} />
          </button>
          <button type="button" onClick={onPreview} style={secondaryBtnStyle}>
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || publishBlocked}
            title={publishBlocked ? publishBlockedMessage : undefined}
            style={{
              ...primaryBtnStyle,
              opacity: isSaving || publishBlocked ? 0.6 : 1,
              cursor: isSaving || publishBlocked ? "not-allowed" : "pointer",
            }}
          >
            <CheckCircle2 size={16} />
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {(showSaveToast || saveError || publishBlockedMessage) && (
        <div style={{ padding: "0 20px", flexShrink: 0 }}>
          {showSaveToast ? (
            <div style={{ ...bannerStyle, background: "#ECFDF5", color: EDITOR_TOKENS.themeGreen }}>
              Changes saved successfully.
            </div>
          ) : null}
          {saveError ? (
            <div style={{ ...bannerStyle, background: "#FEF2F2", color: "#DC2626" }}>{saveError}</div>
          ) : null}
          {publishBlocked && publishBlockedMessage ? (
            <div style={{ ...bannerStyle, background: "#FFFBEB", color: "#92400E" }}>{publishBlockedMessage}</div>
          ) : null}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <        aside
          style={{
            width: activePanel === "style" ? 400 : 360,
            minWidth: 300,
            maxWidth: "100%",
            background: EDITOR_TOKENS.sidebarBg,
            borderRight: `1px solid ${EDITOR_TOKENS.border}`,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {!activePanel ? (
            <EditorRootMenu onSelect={setActivePanel} />
          ) : null}
          {activePanel === "style" ? (
            <PanelStyleColor
              config={config}
              updateConfig={updateConfig}
              patchConfig={patchConfig}
              onBack={() => setActivePanel(null)}
            />
          ) : null}
          {activePanel === "text" ? (
            <PanelText
              config={config}
              updateConfig={updateConfig}
              onBack={() => setActivePanel(null)}
              onAutofill={onAutofill}
              autofillLoading={autofillLoading}
              autofillError={autofillError}
            />
          ) : null}
          {activePanel === "preferences" ? (
            <PanelPreferences
              config={config}
              updateConfig={updateConfig}
              patchConfig={patchConfig}
              onBack={() => setActivePanel(null)}
              onLogoUpload={onLogoUpload}
            />
          ) : null}
        </aside>

        <BrowserPreviewFrame shopDomain={shopDomain} viewport={viewport}>
          <ReviewFlowPreview
            config={config}
            shopDomain={shopDomain}
            activeStep={previewStep}
            onStepChange={setPreviewStep}
          />
        </BrowserPreviewFrame>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  background: EDITOR_TOKENS.white,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: EDITOR_TOKENS.textMuted,
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  background: EDITOR_TOKENS.white,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: UI_FONT,
  color: EDITOR_TOKENS.text,
};

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: EDITOR_TOKENS.themeGreen,
  color: EDITOR_TOKENS.white,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: UI_FONT,
};

const bannerStyle = {
  marginTop: 10,
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
};
