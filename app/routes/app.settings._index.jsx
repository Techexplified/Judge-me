/* eslint-disable react/prop-types */
import { useEffect } from "react";
import {
  data,
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
  useLocation,
} from "react-router";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { PRO_PRICE_USD, PRO_TRIAL_DAYS } from "../lib/trial.shared.js";
import { Stack } from "../components/admin-ui";
import { PricingPage } from "../components/billing/pricing-page";

function buildReturnUrl(request) {
  const url = new URL(request.url);
  const base = `${url.origin}/app/settings`;
  return mergeShopifyEmbedParams(`${base}?billing=success`, url.search);
}

export const loader = async ({ request }) => {
  const {
    getShopPlanStatus,
    requestProSubscription,
    serializePlanStatus,
    formatBillingError,
    isShopifyBillingRedirect,
    getAppPricingUrl,
  } = await import("../lib/billing.server.js");
  const { BILLING_TEST_MODE, USE_BILLING_API } = await import("../shopify.server.js");
  const { session, billing, redirect } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const url = new URL(request.url);

  const returnedFromPricing =
    url.searchParams.get("billing") === "success" ||
    url.searchParams.has("plan_handle") ||
    url.searchParams.get("charge_id");

  if (returnedFromPricing) {
    const planHandle = url.searchParams.get("plan_handle");
    const billingCheck = await billing.check({ isTest: BILLING_TEST_MODE });
    const { syncSubscriptionFromShopify } = await import("../lib/billing.server.js");
    await syncSubscriptionFromShopify(shop, billingCheck, { planHandle });
  }

  let billingError = null;

  if (url.searchParams.get("startTrial") === "1") {
    const status = await getShopPlanStatus(shop, billing);
    if (!status.hasPro) {
      try {
        const returnUrl = buildReturnUrl(request);
        return await requestProSubscription({
          billing,
          redirect,
          session,
          shop,
          returnUrl,
        });
      } catch (error) {
        if (isShopifyBillingRedirect(error)) throw error;
        console.error("[billing] startTrial failed:", error);
        billingError = formatBillingError(error);
      }
    } else {
      throw embedRedirect("/app/settings", request);
    }
  }

  const planStatus = await getShopPlanStatus(shop, billing);
  const billingSuccess = returnedFromPricing && planStatus.hasPro;
  const billingDeclined = url.searchParams.get("billing") === "declined";
  const appPricingUrl = !USE_BILLING_API ? await getAppPricingUrl(shop) : null;

  return {
    shop,
    planStatus: serializePlanStatus(planStatus),
    billingSuccess,
    billingDeclined,
    billingError,
    appPricingUrl,
    proPrice: PRO_PRICE_USD,
    proTrialDays: PRO_TRIAL_DAYS,
    billingTestMode: BILLING_TEST_MODE,
    useBillingApi: USE_BILLING_API,
  };
};

export const action = async ({ request }) => {
  const {
    getShopPlanStatus,
    requestProSubscription,
    formatBillingError,
    isShopifyBillingRedirect,
  } = await import("../lib/billing.server.js");
  const { BILLING_TEST_MODE } = await import("../shopify.server.js");
  const { session, billing, redirect } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);
  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  if (intent === "startProTrial") {
    const status = await getShopPlanStatus(shop, billing);
    if (status.hasPro) {
      return data({ error: "You already have an active Pro subscription." }, { status: 400 });
    }
    try {
      const returnUrl = buildReturnUrl(request);
      return await requestProSubscription({
        billing,
        redirect,
        session,
        shop,
        returnUrl,
      });
    } catch (error) {
      if (isShopifyBillingRedirect(error)) throw error;
      console.error("[billing] startProTrial failed:", error);
      return data({ error: formatBillingError(error) }, { status: 500 });
    }
  }

  if (intent === "cancelSubscription") {
    const status = await getShopPlanStatus(shop, billing);
    if (!status.subscriptionId) {
      return data({ error: "No active subscription to cancel." }, { status: 400 });
    }
    await billing.cancel({
      subscriptionId: status.subscriptionId,
      isTest: BILLING_TEST_MODE,
      prorate: true,
    });
    const { downgradeShopToFree } = await import("../lib/billing.server.js");
    await downgradeShopToFree(shop);
    throw embedRedirect("/app/settings?cancelled=1", request);
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

export default function SettingsPricingPage() {
  const {
    planStatus,
    billingSuccess,
    billingDeclined,
    proPrice,
    proTrialDays,
    billingTestMode,
    useBillingApi,
    billingError: loaderBillingError,
    appPricingUrl,
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const location = useLocation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("cancelled") === "1") {
      params.delete("cancelled");
    }
  }, [location.search]);

  return (
    <Stack>
      <PricingPage
        planStatus={planStatus}
        billingSuccess={billingSuccess}
        billingDeclined={billingDeclined}
        proPrice={proPrice}
        proTrialDays={proTrialDays}
        billingTestMode={billingTestMode}
        useBillingApi={useBillingApi}
        billingError={loaderBillingError}
        appPricingUrl={appPricingUrl}
        actionError={actionData?.error}
        isSubmitting={isSubmitting}
        onStartTrial={() => submit({ intent: "startProTrial" }, { method: "post" })}
        onCancel={() => submit({ intent: "cancelSubscription" }, { method: "post" })}
      />
    </Stack>
  );
}
