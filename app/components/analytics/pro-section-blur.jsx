/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Lock, Sparkles } from "lucide-react";
import { SURFACE_BORDER, APP_FONT } from "../admin-ui";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";

const PRO_PILL = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 6px",
  borderRadius: 999,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "#f1f8ff",
  color: "#0369a1",
  border: "1px solid #b3d4f0",
  flexShrink: 0,
};

function useSettingsHref() {
  const location = useLocation();
  return mergeShopifyEmbedParams("/app/settings", location.search);
}

function HoverUnlockOverlay({ visible, label = "Unlock Pro" }) {
  const settingsHref = useSettingsHref();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: visible ? "rgba(250, 251, 251, 0.92)" : "transparent",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.18s ease, background 0.18s ease",
        borderRadius: 8,
        zIndex: 3,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Link
        to={settingsHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 8,
          background: "#202223",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: APP_FONT,
          textDecoration: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: "transform 0.18s ease",
        }}
      >
        <Sparkles size={15} />
        {label}
      </Link>
    </div>
  );
}

function ChartSkeleton({ variant = "area" }) {
  if (variant === "table") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
        {[1, 2, 3, 4].map((row) => (
          <div key={row} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eceeee", flexShrink: 0 }} />
            <div style={{ flex: 1, height: 10, borderRadius: 999, background: "#eceeee" }} />
            <div style={{ width: 48, height: 10, borderRadius: 999, background: "#eceeee" }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
        {[5, 4, 3, 2, 1].map((row) => (
          <div key={row} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 72, height: 8, borderRadius: 999, background: "#eceeee" }} />
            <div style={{ flex: 1, height: 10, borderRadius: 999, background: "#eceeee" }} />
            <div style={{ width: 56, height: 8, borderRadius: 999, background: "#eceeee" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 200, padding: "12px 0" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 28,
          height: 1,
          background: "#eceeee",
        }}
      />
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ width: "100%", height: 160, display: "block" }}>
        <path
          d="M0,120 C40,100 80,130 120,90 C160,50 200,80 240,60 C280,40 320,70 400,30 L400,160 L0,160 Z"
          fill="#eceeee"
        />
        <path
          d="M0,140 C60,120 100,135 160,110 C220,85 280,100 400,80"
          fill="none"
          stroke="#dfe1e3"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

/** Locked toolbar row — buttons stay visible, unlock CTA appears on hover. */
export function ProLockedToolbar({ locked, children }) {
  const [hovered, setHovered] = useState(false);

  if (!locked) return children;

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          opacity: hovered ? 0.55 : 0.72,
          transition: "opacity 0.18s ease",
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {children}
      </div>
      <HoverUnlockOverlay visible={hovered} label="Unlock Pro" />
    </div>
  );
}

/** Locked panel body — title stays outside; skeleton placeholder + hover unlock. */
export function ProLockedPanel({ locked, children, skeleton = "area", minHeight = 240 }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const settingsHref = useSettingsHref();

  if (!locked) return children;

  const goToSettings = () => navigate(settingsHref);

  return (
    <div
      style={{
        position: "relative",
        minHeight,
        borderRadius: 8,
        border: `1px dashed ${hovered ? "#b5babf" : "#d2d5d8"}`,
        background: hovered ? "#fafbfb" : "#f6f6f7",
        transition: "border-color 0.18s ease, background 0.18s ease",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={goToSettings}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSettings();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Pro feature — unlock in Settings"
    >
      <div style={{ padding: "16px 20px", opacity: 0.9 }}>
        <ChartSkeleton variant={skeleton} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 700,
          color: "#8c9196",
          zIndex: 2,
          pointerEvents: "none",
          opacity: hovered ? 0 : 1,
          transition: "opacity 0.18s ease",
        }}
      >
        <Lock size={12} />
        <span style={PRO_PILL}>Pro</span>
      </div>
      <HoverUnlockOverlay visible={hovered} label="Unlock Pro" />
    </div>
  );
}

/** Locked ghost button for toolbar items. */
export function ProLockedToolButton({ icon: Icon, label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${SURFACE_BORDER}`,
        background: "#fff",
        fontSize: 13,
        fontWeight: 700,
        color: "#8c9196",
      }}
    >
      <Icon size={16} />
      {label}
      <span style={PRO_PILL}>Pro</span>
    </span>
  );
}

/** @deprecated Use ProLockedPanel or ProLockedToolbar */
export function ProSectionBlur({ locked, children }) {
  return <ProLockedPanel locked={locked}>{children}</ProLockedPanel>;
}
