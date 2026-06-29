import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Monitor, Redo2, Smartphone, Undo2 } from "lucide-react";
import { useEmbedNavigate } from "../../hooks/use-embed-navigate.js";
import { EDITOR_TOKENS, UI_FONT } from "../review-form-editor/editor-tokens.js";

/* eslint-disable react/prop-types */
export function WidgetCustomizeShell({
  title,
  backHref = "/app/widgets",
  children,
  preview,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSaving,
  showSaveToast,
  saveError,
  onAddToTheme,
  addToThemeDisabled,
  addToThemeLabel = "Add to theme",
  proGateBanner,
}) {
  const embedNavigate = useEmbedNavigate();
  const [viewport, setViewport] = useState("desktop");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo?.();
      } else if (key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) onRedo?.();
      } else if (key === "y") {
        e.preventDefault();
        if (canRedo) onRedo?.();
      } else if (key === "s") {
        e.preventDefault();
        if (!isSaving) onSave?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo, onSave, isSaving]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => embedNavigate(backHref)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${EDITOR_TOKENS.border}`,
              background: EDITOR_TOKENS.white,
              fontSize: 13,
              fontWeight: 700,
              color: EDITOR_TOKENS.text,
              cursor: "pointer",
              fontFamily: UI_FONT,
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.25} />
            Back
          </button>
          {title ? (
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: EDITOR_TOKENS.text }}>{title}</h1>
          ) : null}
        </div>

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
          {onUndo ? (
            <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" style={iconBtnStyle(!canUndo)}>
              <Undo2 size={16} />
            </button>
          ) : null}
          {onRedo ? (
            <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo" style={iconBtnStyle(!canRedo)}>
              <Redo2 size={16} />
            </button>
          ) : null}
          {onAddToTheme ? (
            <button
              type="button"
              onClick={onAddToTheme}
              disabled={addToThemeDisabled}
              style={{
                ...secondaryBtnStyle,
                opacity: addToThemeDisabled ? 0.6 : 1,
                cursor: addToThemeDisabled ? "not-allowed" : "pointer",
              }}
            >
              {addToThemeLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            style={{
              ...primaryBtnStyle,
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            <CheckCircle2 size={16} />
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {(showSaveToast || saveError || proGateBanner) && (
        <div style={{ padding: "0 20px", flexShrink: 0 }}>
          {showSaveToast ? (
            <div style={{ ...bannerStyle, background: "#ECFDF5", color: EDITOR_TOKENS.themeGreen }}>
              Changes saved successfully.
            </div>
          ) : null}
          {saveError ? (
            <div style={{ ...bannerStyle, background: "#FEF2F2", color: "#DC2626" }}>{saveError}</div>
          ) : null}
          {proGateBanner ? (
            <div style={{ ...bannerStyle, background: "#FFFBEB", color: "#92400E" }}>{proGateBanner}</div>
          ) : null}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside
          style={{
            width: 360,
            minWidth: 300,
            maxWidth: "100%",
            background: EDITOR_TOKENS.sidebarBg,
            borderRight: `1px solid ${EDITOR_TOKENS.border}`,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {children}
        </aside>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: viewport === "mobile" ? "24px 16px" : "24px 32px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: "#E8EAED",
          }}
        >
          <div
            style={{
              width: viewport === "mobile" ? 375 : "100%",
              maxWidth: viewport === "mobile" ? 375 : 900,
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${EDITOR_TOKENS.border}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              overflow: "hidden",
              minHeight: viewport === "mobile" ? 520 : 400,
            }}
          >
            {typeof preview === "function" ? preview(viewport) : preview}
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = (disabled = false) => ({
  width: 36,
  height: 36,
  borderRadius: 8,
  border: `1px solid ${EDITOR_TOKENS.border}`,
  background: EDITOR_TOKENS.white,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "not-allowed" : "pointer",
  color: disabled ? "#C9CCCF" : EDITOR_TOKENS.textMuted,
  opacity: disabled ? 0.55 : 1,
});

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

export function WidgetCustomizeField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#202223", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6d7175", lineHeight: 1.4 }}>{hint}</p>
      ) : null}
    </div>
  );
}

export function WidgetCustomizeSection({ title, children }) {
  return (
    <div style={{ padding: "16px 18px", borderBottom: `1px solid ${EDITOR_TOKENS.border}` }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#202223" }}>{title}</h2>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #c9cccf",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const rangeRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export function useWidgetCustomizeSave({ submit, serializeConfig, config }) {
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveError, setSaveError] = useState("");

  const saveConfig = useCallback(() => {
    submit({ config: serializeConfig(config) }, { method: "POST" });
  }, [submit, serializeConfig, config]);

  return { saveConfig, showSaveToast, setShowSaveToast, saveError, setSaveError };
}
