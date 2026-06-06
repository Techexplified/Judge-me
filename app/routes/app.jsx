// routes/app.jsx
/* global globalThis */
import { Outlet, useLoaderData, useRouteError } from "react-router";
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

  return (
    <AppProvider embedded apiKey={apiKey}>
      {!hideNav ? (
        <s-app-nav>
          <s-link href="/app">Dashboard</s-link>
          <s-link href="/app/analytics">Analytics</s-link>
          <s-link href="/app/reviews">Reviews</s-link>
          <s-link href="/app/import-reviews">Import reviews</s-link>
          <s-link href="/app/review-translation">Translation</s-link>
          <s-link href="/app/linked-stores">Integration</s-link>
          <s-link href="/app/review-form">Review Form</s-link>
          <s-link href="/app/settings">Settings</s-link>
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
