// routes/app.jsx
/* global globalThis */
import { isRouteErrorResponse, Outlet, useLoaderData, useRouteError, useLocation, data } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import {
  isDatabaseUnavailable,
  isThrownResponse,
} from "../lib/app-shell.shared.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { PAGE_BG, SURFACE_BG, SURFACE_BORDER } from "../components/admin-ui";
import { QuickSearchProvider } from "../components/quick-search/quick-search-provider.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const onboardingPath = "/app/onboarding";
  const onOnboarding = pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`);
  const apiKey = globalThis.process?.env?.SHOPIFY_API_KEY || "";

  let session;
  try {
    ({ session } = await authenticate.admin(request));
  } catch (error) {
    if (isThrownResponse(error)) throw error;
    if (isDatabaseUnavailable(error)) {
      console.error("[app] authenticate.admin failed (database):", error);
      throw data({ serviceUnavailable: true }, { status: 503 });
    }
    throw error;
  }

  const shop = normalizeShopDomain(session.shop);
  const { safeIsOnboardingComplete } = await import("../lib/app-shell.server.js");

  if (!onOnboarding && !(await safeIsOnboardingComplete(shop))) {
    throw embedRedirect(onboardingPath, request);
  }

  return {
    apiKey,
    hideNav: onOnboarding,
  };
};

function ServiceUnavailablePanel() {
  return (
    <div
      style={{
        padding: "32px 24px",
        minHeight: "60vh",
        background: PAGE_BG,
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: SURFACE_BG,
          border: `1px solid ${SURFACE_BORDER}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#202223" }}>
          Temporarily unavailable
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#6d7175" }}>
          We could not reach the app database right now. This is not caused by AI or OpenRouter —
          those features only run on specific pages. Refresh in a moment, or check that your
          DATABASE_URL and DIRECT_URL environment variables are set on Vercel.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { apiKey, hideNav } = useLoaderData();
  const { pathname } = useLocation();

  // Determine which nav item is active based on the current pathname
  const isPerformanceOverview =
    pathname === "/app/performance-overview" ||
    pathname === "/app/dashboard" ||
    pathname === "/app" ||
    pathname === "/app/";
  const isManageReviews = pathname.startsWith("/app/manage-reviews");
  const isCollectReviews = pathname.startsWith("/app/collect-reviews");
  const isWidgets = pathname.startsWith("/app/widgets");
  const isAnalytics = pathname.startsWith("/app/analytics");
  const isSettings = pathname.startsWith("/app/settings") || pathname.startsWith("/app/settings");

  const appContent = (
    <>
      {!hideNav ? (
        <s-app-nav>
          <s-link href="/app/performance-overview" selected={isPerformanceOverview ? "" : undefined}>Performance Overview</s-link>
          <s-link href="/app/manage-reviews" selected={isManageReviews ? "" : undefined}>Manage Reviews</s-link>
          <s-link href="/app/collect-reviews" selected={isCollectReviews ? "" : undefined}>Collect Reviews</s-link>
          <s-link href="/app/widgets" selected={isWidgets ? "" : undefined}>Widgets</s-link>
          <s-link href="/app/analytics" selected={isAnalytics ? "" : undefined}>Analytics</s-link>
          <s-link href="/app/settings" selected={isSettings ? "" : undefined}>Settings</s-link>
        </s-app-nav>
      ) : null}

      <Outlet />
    </>
  );

  return (
    <AppProvider embedded apiKey={apiKey}>
      {hideNav ? appContent : <QuickSearchProvider>{appContent}</QuickSearchProvider>}
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 503 && error.data?.serviceUnavailable) {
    return (
      <AppProvider embedded apiKey={globalThis.process?.env?.SHOPIFY_API_KEY || ""}>
        <ServiceUnavailablePanel />
      </AppProvider>
    );
  }

  if (isRouteErrorResponse(error)) {
    return boundary.error(error);
  }

  if (isDatabaseUnavailable(error)) {
    return (
      <AppProvider embedded apiKey={globalThis.process?.env?.SHOPIFY_API_KEY || ""}>
        <ServiceUnavailablePanel />
      </AppProvider>
    );
  }

  return boundary.error(error);
}
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  formData,
  defaultShouldRevalidate,
}) {
  // The import wizard's "preview" / "import" run through a fetcher. Re-running
  // this parent loader (authenticate.admin + onboarding check) on those submits
  // can throw a re-auth/onboarding redirect that reloads the whole embedded app
  // and dumps the merchant back at step 1. Nothing here changes for a preview or
  // import, so skip it. (A successful import navigates away on its own.)
  if (formData) {
    const intent = formData.get("_intent") ?? formData.get("intent");
    if (intent === "preview" || intent === "import") return false;
  }

  const leavingOnboarding =
    currentUrl.pathname.startsWith("/app/onboarding") &&
    !nextUrl.pathname.startsWith("/app/onboarding");
  if (leavingOnboarding) return true;

  const enteringOnboarding =
    !currentUrl.pathname.startsWith("/app/onboarding") &&
    nextUrl.pathname.startsWith("/app/onboarding");
  if (enteringOnboarding) return true;

  if (
    currentUrl.pathname.startsWith("/app/onboarding") &&
    nextUrl.pathname.startsWith("/app/onboarding") &&
    currentUrl.search !== nextUrl.search
  ) {
    return true;
  }

  if (formMethod && formMethod.toUpperCase() !== "GET") return true;

  // apiKey + hideNav are stable across normal /app pages — skip parent loader on tab nav.
  if (
    currentUrl.pathname.startsWith("/app/") &&
    nextUrl.pathname.startsWith("/app/") &&
    !nextUrl.pathname.startsWith("/app/onboarding")
  ) {
    return false;
  }

  return defaultShouldRevalidate;
}
