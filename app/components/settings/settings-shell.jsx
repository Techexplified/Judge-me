/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router";
import { mergeShopifyEmbedParams } from "../../utils/shopify-embed-nav.js";
import { Page, PageHeader } from "../admin-ui";
import { SETTINGS_TABS, getActiveSettingsTab } from "./settings-tabs.js";

const tabStyles = {
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tab: (active) => ({
    padding: "8px 14px",
    borderRadius: 999,
    border: active ? "1px solid #008060" : "1px solid #c9cccf",
    background: active ? "#ecfdf3" : "#fff",
    color: active ? "#008060" : "#202223",
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
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
    <div style={tabStyles.tabs} role="tablist" aria-label="Settings sections">
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
