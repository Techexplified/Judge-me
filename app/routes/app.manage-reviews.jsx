/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useEffect, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Link2, Send, Store, Upload } from "lucide-react";
import { authenticate } from "../shopify.server";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { normalizeShopDomain } from "../utils/shop.js";
import {
  handleStoreIntegrationAction,
  loadStoreIntegrationGroup,
  parseStoreIntegrationFlash,
} from "../lib/store-integration.server.js";
import {
  handleReviewsManagementAction,
  loadReviewsManagementData,
} from "../lib/reviews-management.server.js";
import { reviewsManagementShouldRevalidate } from "../lib/reviews-management.shared.js";
import { IntegrationSettingsPanel } from "../components/settings/integration-settings-panel";
import { ReviewsWorkspace } from "../components/manage-reviews/reviews-workspace.jsx";
import {
  PAGE_BG,
  PrimaryButton,
  SHOPIFY_GREEN,
  SURFACE_BORDER,
} from "../components/admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const type = {
  pageTitle: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 600,
    color: "#202223",
    letterSpacing: "-0.01em",
  },
  tab: (active) => ({
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? SHOPIFY_GREEN : "#6d7175",
  }),
  bodyMuted: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    color: "#6d7175",
  },
  emptyTitle: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: 600,
    color: "#202223",
  },
  button: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
  },
};

const MANAGE_REVIEWS_TABS = new Set(["product", "store", "integration"]);

export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);
  const [reviewsData, { group }] = await Promise.all([
    loadReviewsManagementData({ request, session, billing }),
    loadStoreIntegrationGroup(shop),
  ]);

  return {
    ...reviewsData,
    group,
    ...parseStoreIntegrationFlash(url),
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.has("intent")) {
    return handleStoreIntegrationAction({
      request,
      session,
      admin,
      redirectPath: "/app/manage-reviews",
      withTabParam: true,
    });
  }

  return handleReviewsManagementAction(request);
};

export function shouldRevalidate(args) {
  return reviewsManagementShouldRevalidate(args);
}

function StoreReviewsEmpty({ storeReviewLink }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeReviewLink);
      setCopied(true);
      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Store review link copied");
      }
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      if (typeof shopify?.toast?.show === "function") {
        shopify.toast.show("Could not copy link");
      }
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Leave us a store review",
          url: storeReviewLink,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  };

  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <StoreIllustration />
      </div>
      <h2 style={{ margin: "0 0 10px", ...type.emptyTitle }}>
        No store reviews yet
      </h2>
      <p
        style={{
          margin: "0 auto 28px",
          maxWidth: 420,
          lineHeight: 1.6,
          ...type.bodyMuted,
        }}
      >
        Share your store review link with your customers and start building trust.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={copyLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 8,
            border: "1px solid #c9cccf",
            background: "#fff",
            color: "#202223",
            cursor: "pointer",
            ...type.button,
          }}
        >
          <Link2 size={15} />
          {copied ? "Link copied" : "Get store review link"}
        </button>
        <button
          type="button"
          onClick={shareLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 8,
            border: "none",
            background: SHOPIFY_GREEN,
            color: "#fff",
            cursor: "pointer",
            ...type.button,
          }}
        >
          Share link
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function StoreIllustration() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <path d="M20 95 H160" stroke="#202223" strokeWidth="1.5" />
      <rect x="55" y="45" width="70" height="50" rx="2" stroke="#202223" strokeWidth="1.5" fill="#fff" />
      <path d="M50 45 L65 30 H115 L130 45" stroke={SHOPIFY_GREEN} strokeWidth="2" fill="#ecfdf5" />
      <rect x="68" y="18" width="44" height="16" rx="2" fill={SHOPIFY_GREEN} />
      {[72, 80, 88, 96, 104].map((x) => (
        <path
          key={x}
          d={`M${x} 28 l2 2 -2 2 -2 -2 z`}
          fill="#fff"
        />
      ))}
      <circle cx="35" cy="78" r="10" stroke="#202223" strokeWidth="1.2" fill="none" />
      <path d="M35 68 v20 M30 78 h10" stroke="#202223" strokeWidth="1.2" />
      <circle cx="145" cy="82" r="6" stroke="#202223" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default function ManageReviews() {
  const {
    products,
    storeReviews,
    storeReviewLink,
    stats,
    currentShop,
    translation,
    premium,
    aiAvailable,
    group,
    linkedSuccess,
    unlinkedSuccess,
  } = useLoaderData();
  const actionData = useActionData();
  const location = useLocation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    MANAGE_REVIEWS_TABS.has(tabFromUrl) ? tabFromUrl : "product",
  );

  useEffect(() => {
    if (MANAGE_REVIEWS_TABS.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabId === "product") {
          next.delete("tab");
        } else {
          next.set("tab", tabId);
        }
        next.delete("product");
        next.delete("pid");
        next.delete("mode");
        return next;
      },
      { replace: true },
    );
  };

  const importHref = mergeShopifyEmbedParams("/app/collect-reviews?tab=import", location.search);

  const goToImport = () => {
    if (typeof shopify?.navigate === "function") {
      shopify.navigate(importHref);
    } else {
      navigate(importHref);
    }
  };

  const workspaceProps = {
    embedded: true,
    products,
    storeReviews,
    storeReviewLink,
    stats,
    currentShop,
    translation,
    premium,
    aiAvailable,
  };

  return (
    <div style={{ ...pageStyle, background: PAGE_BG, fontFamily: FONT }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0, ...type.pageTitle }}>Manage reviews</h1>
        {activeTab === "product" ? (
          <PrimaryButton onClick={goToImport}>
            <Upload size={16} />
            Import Reviews
          </PrimaryButton>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${SURFACE_BORDER}`, marginBottom: 20 }}>
        {[
          { id: "product", label: "Product reviews" },
          { id: "store", label: "Store reviews" },
          { id: "integration", label: "Store integration" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "0 0 12px",
                marginBottom: -1,
                borderBottom: active ? `2px solid ${SHOPIFY_GREEN}` : "2px solid transparent",
                cursor: "pointer",
                ...type.tab(active),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "integration" ? (
        <IntegrationSettingsPanel
          group={group}
          linkedSuccess={linkedSuccess}
          unlinkedSuccess={unlinkedSuccess}
          actionError={actionData?.error}
        />
      ) : activeTab === "store" && storeReviews.length === 0 ? (
        <StoreReviewsEmpty storeReviewLink={storeReviewLink} />
      ) : (
        <ReviewsWorkspace
          {...workspaceProps}
          scope={activeTab}
        />
      )}
    </div>
  );
}

const pageStyle = {
  padding: "20px 24px 32px",
  minHeight: "100vh",
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  color: "#202223",
  boxSizing: "border-box",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};
