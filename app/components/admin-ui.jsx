/* eslint-disable react/prop-types */
import { useState } from "react";

export const SHOPIFY_GREEN = "#008060";
export const SHOPIFY_GREEN_DARK = "#006e52";
/** Soft amber/yellow for upgrade, trial, and plan-limit notices — not error red. */
export const UPGRADE_NOTICE = {
  bg: "#fffbea",
  fg: "#7a6220",
  fgMuted: "#8a7340",
  bd: "#ede0b5",
  icon: "#b98900",
};
export const PAGE_BG = "#f3f7f5";
export const SURFACE_BG = "#fafcfb";
export const SURFACE_BORDER = "#e5ebe8";
export const SURFACE_MUTED = "#f5f9f7";
export const R = 8;
export const APP_FONT = "'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const ui = {
  page: {
    padding: "20px 24px 32px",
    background: PAGE_BG,
    minHeight: "100vh",
    fontFamily: APP_FONT,
    fontSize: 14,
    color: "#202223",
    boxSizing: "border-box",
  },
  pageNarrow: {
    maxWidth: 720,
    margin: "0 auto",
  },
  header: {
    marginBottom: 20,
  },
  h1: {
    margin: 0,
    fontSize: 30,
    fontWeight: 900,
    color: "#202223",
    fontFamily: APP_FONT,
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.5,
    fontFamily: APP_FONT,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    fontFamily: APP_FONT,
  },
  card: {
    background: SURFACE_BG,
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    padding: 16,
    boxSizing: "border-box",
    fontFamily: APP_FONT,
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 15,
    fontWeight: 800,
    color: "#202223",
    fontFamily: APP_FONT,
  },
  cardDesc: {
    margin: "0 0 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
    lineHeight: 1.5,
    fontFamily: APP_FONT,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: R,
    fontSize: 11,
    fontWeight: 800,
    border: "1px solid",
    whiteSpace: "nowrap",
    fontFamily: APP_FONT,
  },
  banner: {
    borderRadius: R,
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.5,
    border: "1px solid",
    fontFamily: APP_FONT,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#202223",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: R,
    border: "1px solid #c9cccf",
    fontSize: 13,
    fontWeight: 600,
    color: "#202223",
    fontFamily: APP_FONT,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: R,
    border: "1px solid #c9cccf",
    fontSize: 13,
    fontWeight: 600,
    color: "#202223",
    fontFamily: APP_FONT,
    boxSizing: "border-box",
    background: "#fff",
    cursor: "pointer",
  },
  field: {
    
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: R,
    border: "none",
    background: SHOPIFY_GREEN,
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: APP_FONT,
    whiteSpace: "nowrap",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: R,
    border: "1px solid #c9cccf",
    background: "#fff",
    color: "#202223",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: APP_FONT,
    whiteSpace: "nowrap",
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  resourceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: R,
    border: `1px solid ${SURFACE_BORDER}`,
    background: SURFACE_MUTED,
  },
  resourceMain: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  resourceTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#202223",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  resourceBadgeGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  empty: {
    textAlign: "center",
    padding: "28px 16px",
    borderRadius: R,
    border: `1px dashed ${SURFACE_BORDER}`,
    background: SURFACE_MUTED,
  },
  emptyTitle: {
    margin: "8px 0 4px",
    fontWeight: 800,
    fontSize: 14,
    color: "#202223",
  },
  emptyText: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#6d7175",
  },
  stepBar: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: "#e1e3e5",
  },
  stepDotActive: {
    background: SHOPIFY_GREEN,
  },
  wizardCard: {
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
  },
  wizardActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 20,
    flexWrap: "wrap",
  },
  infoBanner: {
    background: "#f6f6f7",
    borderColor: "#c9cccf",
    color: "#5c5f62",
  },
};

const badgeTones = {
  green: { bg: "#ecfdf3", fg: "#008060", bd: "#aee9d1" },
  blue: { bg: "#f1f8ff", fg: "#0369a1", bd: "#b3d4f0" },
  neutral: { bg: "#f6f6f7", fg: "#5c5f62", bd: "#e1e3e5" },
  warning: { bg: "#fff5ea", fg: "#b98900", bd: "#e4b06f" },
  red: { bg: "#fff4f4", fg: "#d72c0d", bd: "#fed3d1" },
};

const bannerTones = {
  success: { bg: "#ecfdf3", fg: "#008060", bd: "#aee9d1" },
  critical: { bg: "#fff4f4", fg: "#d72c0d", bd: "#fed3d1" },
  info: { bg: "#f6f6f7", fg: "#5c5f62", bd: "#c9cccf" },
};

export function Page({ children, narrow }) {
  return (
    <div style={{ ...ui.page, ...(narrow ? ui.pageNarrow : {}) }}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <header style={ui.header}>
      <h1 style={ui.h1}>{title}</h1>
      {subtitle ? <p style={ui.subtitle}>{subtitle}</p> : null}
    </header>
  );
}

export function Stack({ children }) {
  return <div style={ui.stack}>{children}</div>;
}

export function Card({ title, description, children, style }) {
  return (
    <div style={{ ...ui.card, ...style }}>
      {title ? <h2 style={ui.cardTitle}>{title}</h2> : null}
      {description ? <p style={ui.cardDesc}>{description}</p> : null}
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const t = badgeTones[tone] || badgeTones.neutral;
  return (
    <span style={{ ...ui.badge, background: t.bg, color: t.fg, borderColor: t.bd }}>
      {children}
    </span>
  );
}

export function Banner({ tone = "info", children, icon }) {
  const t = bannerTones[tone] || bannerTones.info;
  return (
    <div style={{ ...ui.banner, background: t.bg, color: t.fg, borderColor: t.bd }}>
      {icon ? <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span> : null}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  name,
  helpText,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={ui.field}>
      {label ? <label style={ui.label}>{label}</label> : null}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...ui.input,
          ...(focused ? { borderColor: SHOPIFY_GREEN, boxShadow: "0 0 0 2px rgba(0,128,96,0.12)" } : {}),
          ...(disabled ? { opacity: 0.65, cursor: "not-allowed" } : {}),
        }}
      />
      {helpText ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div style={ui.field}>
      {label ? <label style={ui.label}>{label}</label> : null}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...ui.select,
          ...(disabled ? { opacity: 0.65, cursor: "not-allowed" } : {}),
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const OTHER_OPTION_VALUE = "other";

export function parseSelectOrTextValue(stored, options) {
  const presetValues = new Set(
    options.map((o) => o.value).filter((v) => v && v !== OTHER_OPTION_VALUE),
  );
  if (stored && presetValues.has(stored)) {
    return { select: stored, custom: "" };
  }
  if (stored) {
    return { select: OTHER_OPTION_VALUE, custom: stored };
  }
  return { select: "", custom: "" };
}

export function resolveSelectOrTextValue(select, custom, options) {
  if (!select) return "";
  if (select === OTHER_OPTION_VALUE) {
    return String(custom ?? "").trim();
  }
  const match = options.find((o) => o.value === select);
  return match?.value ?? "";
}

/** Dropdown with preset options; choosing "Other" reveals a text field. */
export function SelectOrTextField({
  label,
  selectValue,
  customValue,
  onSelectChange,
  onCustomChange,
  options,
  disabled,
  customPlaceholder,
  helpText,
}) {
  const showCustom = selectValue === OTHER_OPTION_VALUE;
  return (
    <div style={ui.field}>
      {label ? <label style={ui.label}>{label}</label> : null}
      <select
        value={selectValue}
        onChange={onSelectChange}
        disabled={disabled}
        style={{
          ...ui.select,
          ...(disabled ? { opacity: 0.65, cursor: "not-allowed" } : {}),
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {showCustom ? (
        <div style={{ marginTop: 8 }}>
          <TextField
            value={customValue}
            onChange={onCustomChange}
            placeholder={customPlaceholder ?? "Type your answer"}
            disabled={disabled}
          />
        </div>
      ) : null}
      {helpText ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button", loading }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...ui.btnPrimary,
        ...((disabled || loading) ? ui.btnDisabled : {}),
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, type = "button", loading }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...ui.btnSecondary,
        ...((disabled || loading) ? ui.btnDisabled : {}),
      }}
    >
      {children}
    </button>
  );
}

export function ProLockedButton({ children, onClick, title = "Upgrade to Pro to unlock" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        ...ui.btnSecondary,
        position: "relative",
        paddingRight: 52,
        cursor: "pointer",
        opacity: 0.88,
      }}
    >
      {children}
      <span
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          padding: "2px 7px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          background: "#f1f8ff",
          color: "#0369a1",
          border: "1px solid #b3d4f0",
        }}
      >
        Pro
      </span>
    </button>
  );
}export function ResourceRow({ title, badges, icon, actions }) {
  return (
    <div style={ui.resourceRow}>
      <div style={ui.resourceMain}>
        {icon ? <span style={{ flexShrink: 0 }}>{icon}</span> : null}
        <span style={ui.resourceTitle}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {badges ? <div style={ui.resourceBadgeGroup}>{badges}</div> : null}
        {actions ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{actions}</div> : null}
      </div>
    </div>
  );
}
export function EmptyState({ title, description, icon }) {
  return (
    <div style={ui.empty}>
      {icon}
      {title ? <p style={ui.emptyTitle}>{title}</p> : null}
      {description ? <p style={ui.emptyText}>{description}</p> : null}
    </div>
  );
}

export function StepIndicator({ current, total = 4 }) {
  return (
    <div style={ui.stepBar} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            ...ui.stepDot,
            ...(i < current ? ui.stepDotActive : {}),
          }}
        />
      ))}
    </div>
  );
}

export function WizardShell({ step, total = 5, children, actions }) {
  return (
    <Page narrow>
      <StepIndicator current={step} total={total} />
      <Card style={ui.wizardCard}>{children}</Card>
      {actions ? <div style={ui.wizardActions}>{actions}</div> : null}
    </Page>
  );
}

export function ProBadge({ style = {} }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background:
          "linear-gradient(135deg, #ffffff 0%, #dbeafe 35%, #ede9fe 65%, #fee2e2 100%)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow:
          "0 2px 8px rgba(59,130,246,.15), inset 0 1px 1px rgba(255,255,255,.8)",
        backdropFilter: "blur(6px)",
        color: "#334155",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        userSelect: "none",
        pointerEvents: "none",

        ...style,
      }}
    >
      PRO
    </span>
  );
}

export const INDUSTRY_OPTIONS = [
  { value: "", label: "Select industry" },
  { value: "fashion", label: "Fashion & apparel" },
  { value: "beauty", label: "Beauty & cosmetics" },
  { value: "food", label: "Food & beverage" },
  { value: "home", label: "Home & garden" },
  { value: "electronics", label: "Electronics" },
  { value: "health", label: "Health & wellness" },
  { value: "other", label: "Other" },
];

export const GOAL_OPTIONS = [
  { value: "", label: "Select goal" },
  { value: "collect_reviews", label: "Collect more reviews" },
  { value: "share_stores", label: "Share reviews across stores" },
  { value: "ai_insights", label: "Improve with AI insights" },
];

export const MULTI_STORE_OPTIONS = [
  { value: "", label: "Select one" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const IMPORT_FROM_APP_OPTIONS = [
  { value: "", label: "Select one" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const JUDGE_ME_GOAL_OPTIONS = [
  { value: "", label: "Select your main goal" },
  { value: "collect_reviews", label: "Collect more product reviews" },
  { value: "display_reviews", label: "Display reviews on my storefront" },
  { value: "import_reviews", label: "Import reviews from another app" },
  { value: "share_stores", label: "Share reviews across multiple stores" },
  { value: "boost_seo", label: "Improve SEO with review rich snippets" },
  { value: "ai_insights", label: "Use AI to analyze customer feedback" },
  { value: "migrate_app", label: "Migrate from another review app" },
  { value: "other", label: "Other (type your own)" },
];

export const DISCOVERY_SOURCE_OPTIONS = [
  { value: "", label: "Select how you found us" },
  { value: "shopify_app_store", label: "Shopify App Store" },
  { value: "google_search", label: "Google search" },
  { value: "social_media", label: "Social media (Instagram, Facebook, etc.)" },
  { value: "youtube", label: "YouTube or video content" },
  { value: "referral_friend", label: "Friend or colleague recommendation" },
  { value: "referral_agency", label: "Agency or developer recommendation" },
  { value: "blog_article", label: "Blog or online article" },
  { value: "email_newsletter", label: "Email or newsletter" },
  { value: "other", label: "Other (type your own)" },
];
