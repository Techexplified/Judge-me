/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { Page, PageHeader } from "../admin-ui";
import { SETTINGS_TABS, getActiveSettingsTab } from "./settings-tabs.js";

const tabStyles = {
  bar: {
    borderBottom: "1px solid #e1e3e5",
    marginBottom: 24,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 28,
    margin: 0,
    padding: 0,
  },
  tab: (active) => ({
    padding: "12px 2px",
    marginBottom: -1,
    border: "none",
    borderBottom: active ? "2px solid #008060" : "2px solid transparent",
    background: "transparent",
    color: active ? "#008060" : "#6d7175",
    fontSize: 13,
    fontWeight: active ? 800 : 600,
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "color 0.15s ease, border-color 0.15s ease",
  }),
};

const fullscreenPage = {
  padding: 0,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const fullscreenHeader = {
  padding: "20px 24px 0",
  flexShrink: 0,
};

const fullscreenContent = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

export function SettingsShell({ children, variant = "default" }) {
  const location = useLocation();
  const activeTab = getActiveSettingsTab(location.pathname);
  const search = location.search;

  const tabBar = (
    <nav style={tabStyles.bar} aria-label="Settings sections">
      <div style={tabStyles.tabs} role="tablist">
        {SETTINGS_TABS.map((tab) => {
          const href = mergeShopifyEmbedParams(tab.path, search);
          const active = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              to={href}
              role="tab"
              aria-selected={active}
              style={tabStyles.tab(active)}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  if (variant === "fullscreen") {
    return (
      <div
        style={{
          ...fullscreenPage,
          background: "#f3f7f5",
          fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
          fontSize: 14,
          color: "#202223",
        }}
      >
        <div style={fullscreenHeader}>
          <PageHeader
            title="Settings"
            subtitle="Manage your plan, integrations, translations, and storefront widgets."
          />
          {tabBar}
        </div>
        <div style={fullscreenContent}>{children}</div>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Settings"
        subtitle="Manage your plan, integrations, translations, and storefront widgets."
      />
      {tabBar}
      {children}
    </Page>
  );
}
