// routes/app.jsx
/* global globalThis */
import { Outlet, useLoaderData, useRouteError, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { isOnboardingComplete } from "../lib/onboarding.server";
import { ensureShopRecord } from "../lib/billing.server.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const pathname = url.pathname;
  const shop = normalizeShopDomain(session.shop);

  // Reinstall clears onboarding when the shop was previously uninstalled.
  await ensureShopRecord(shop);

  const onboardingPath = "/app/onboarding";
  const onOnboarding = pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`);

  if (!onOnboarding && !(await isOnboardingComplete(shop))) {
    throw embedRedirect(onboardingPath, request);
  }

  return {
    apiKey: globalThis.process?.env?.SHOPIFY_API_KEY || "",
    hideNav: onOnboarding,
  };
};

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

  return (
    <AppProvider embedded apiKey={apiKey}>
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
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) {
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
