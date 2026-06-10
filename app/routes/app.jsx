// routes/app.jsx
/* global globalThis */
import { Outlet, useLoaderData, useRouteError, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { isOnboardingComplete } from "../lib/onboarding.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const pathname = url.pathname;
  const shop = normalizeShopDomain(session.shop);

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
  const isDashboard =
    pathname === "/app/dashboard" || pathname === "/app" || pathname === "/app/";
  const isAnalytics = pathname.startsWith("/app/analytics");
  const isReviews = pathname.startsWith("/app/reviews") || pathname.startsWith("/app/write-review");
  const isSettings = pathname.startsWith("/app/settings") || pathname.startsWith("/app/settings");

  return (
    <AppProvider embedded apiKey={apiKey}>
      {!hideNav ? (
        <s-app-nav>
          <s-link href="/app/dashboard" selected={isDashboard ? "" : undefined}>Dashboard</s-link>
          <s-link href="/app/analytics" selected={isAnalytics ? "" : undefined}>Analytics</s-link>
          <s-link href="/app/reviews" selected={isReviews ? "" : undefined}>Reviews</s-link>
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

export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }) {
  const leavingOnboarding =
    currentUrl.pathname.startsWith("/app/onboarding") &&
    !nextUrl.pathname.startsWith("/app/onboarding");
  if (leavingOnboarding) return true;
  if (currentUrl.pathname.startsWith("/app/") && nextUrl.pathname.startsWith("/app/")) {
    return false;
  }
  return defaultShouldRevalidate;
}
