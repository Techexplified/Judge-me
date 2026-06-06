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
import { Shield, Gift, RefreshCw, CheckCircle2 } from "lucide-react";
import { authenticate } from "../shopify.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import { PRO_PRICE_USD, PRO_TRIAL_DAYS } from "../lib/trial.shared.js";
import {
  Banner,
  Card,
  Page,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Stack,
} from "../components/admin-ui";
import { PlanComparison } from "../components/billing/plan-comparison";
import { FEATURE_LABELS } from "../lib/usage.shared.js";

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
  const billingSuccess =
    returnedFromPricing && planStatus.hasPro;
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

export default function SettingsPage() {
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

  const hasPro = planStatus?.hasPro;
  const inTrial = planStatus?.isInTrial === true;
  const trialDays = inTrial ? planStatus?.trialDaysRemaining : null;
  const trialEndsLabel = planStatus?.billingTrialEndsAt
    ? new Date(planStatus.billingTrialEndsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("cancelled") === "1") {
      params.delete("cancelled");
    }
  }, [location.search]);

  return (
    <Page>
      <PageHeader
        title="Settings & billing"
        subtitle="Manage your plan. Payments are processed securely by Shopify — we never store card details."
      />

      <Stack>
        {billingTestMode ? (
          <Banner tone="info">
            Test billing mode is on. Development stores will not be charged real money.
          </Banner>
        ) : null}

        {!useBillingApi ? (
          <Banner tone="info">
            Upgrades open Shopify&apos;s hosted plan page (Shopify App Pricing). Configure your Pro
            plan and 14-day trial in the Partner Dashboard.
          </Banner>
        ) : null}

        {billingSuccess && hasPro ? (
          <Banner tone="success" icon={<CheckCircle2 size={18} />}>
            {inTrial
              ? "Pro free trial started. You will not be charged until the trial ends."
              : "Pro subscription activated. Premium features are now unlocked."}
          </Banner>
        ) : null}

        {billingDeclined ? (
          <Banner tone="warning">
            Subscription was not approved. You can continue on the Free plan or try again.
          </Banner>
        ) : null}

        {actionData?.error || loaderBillingError ? (
          <Banner tone="critical">{actionData?.error || loaderBillingError}</Banner>
        ) : null}

        <Card>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 900 }}>
            Current plan: {hasPro ? "Pro" : "Free"}
          </h2>
          {hasPro ? (
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
              {inTrial && trialDays != null && trialDays > 0
                ? `${trialDays} day${trialDays === 1 ? "" : "s"} left in your free trial${
                    trialEndsLabel ? ` (ends ${trialEndsLabel})` : ""
                  }. You will not be charged until the trial ends.`
                : `Your Pro subscription is active. Billed $${proPrice}/month via Shopify.`}
              {planStatus?.reviewsRemaining == null ? " Unlimited reviews." : ""}
            </p>
          ) : (
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
              {planStatus?.reviewsRemaining ?? 50} of {planStatus?.freeReviewCap ?? 50} reviews
              remaining this month.
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {!hasPro ? (
              appPricingUrl ? (
                <a
                  href={appPricingUrl}
                  target="_top"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 18px",
                    borderRadius: 8,
                    background: "#008060",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Start {proTrialDays}-day free trial
                </a>
              ) : (
                <PrimaryButton
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={() => submit({ intent: "startProTrial" }, { method: "post" })}
                >
                  Start {proTrialDays}-day free trial
                </PrimaryButton>
              )
            ) : (
              <SecondaryButton
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={() => submit({ intent: "cancelSubscription" }, { method: "post" })}
              >
                Cancel subscription
              </SecondaryButton>
            )}
          </div>
        </Card>

        {!hasPro ? (
          <Card>
            <div
              style={{
                border: `2px solid #008060`,
                borderRadius: 8,
                padding: 16,
                maxWidth: 320,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#008060",
                  display: "inline-block",
                  marginBottom: 8,
                }}
              >
                Most popular
              </span>
              <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900 }}>Pro Plan</h3>
              <p style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900 }}>
                ${proPrice}
                <span style={{ fontSize: 14, fontWeight: 600, color: "#6d7175" }}> /month USD</span>
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
                Billed monthly via Shopify
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  border: "1px solid #aee9d1",
                  borderRadius: 8,
                  background: "#f1f8f5",
                  marginBottom: 12,
                }}
              >
                <Gift size={18} color="#008060" />
                <span style={{ fontSize: 13, fontWeight: 800 }}>{proTrialDays}-day free trial</span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
                No charge today
              </p>
              {appPricingUrl ? (
                <a
                  href={appPricingUrl}
                  target="_top"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 20px",
                    borderRadius: 8,
                    background: "#008060",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Start free trial
                </a>
              ) : (
                <PrimaryButton
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={() => submit({ intent: "startProTrial" }, { method: "post" })}
                >
                  Start free trial
                </PrimaryButton>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginTop: 16,
                fontSize: 12,
                fontWeight: 600,
                color: "#6d7175",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={14} /> Shopify Billing protected
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} /> Cancel anytime
              </span>
            </div>
          </Card>
        ) : null}

        {planStatus?.featureUsage ? (
          <Card
            title={hasPro ? "Pro feature usage" : "Free plan usage"}
            description="Monthly limits reset on the 1st (UTC)."
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e1e3e5" }}>
                      Feature
                    </th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #e1e3e5" }}>
                      Used
                    </th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #e1e3e5" }}>
                      Limit
                    </th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #e1e3e5" }}>
                      Left
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(planStatus.featureUsage).map(([key, row]) => (
                    <tr key={key}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f2f3" }}>
                        {FEATURE_LABELS[key] || key}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f2f3", textAlign: "right" }}>
                        {row.used}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f2f3", textAlign: "right" }}>
                        {row.limit == null ? "∞" : row.limit}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          borderBottom: "1px solid #f1f2f3",
                          textAlign: "right",
                          color:
                            row.limit != null && row.remaining <= 0 ? "#d72c0d" : "#202223",
                          fontWeight: row.limit != null && row.remaining <= 0 ? 800 : 600,
                        }}
                      >
                        {row.limit == null ? "—" : row.remaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        <Card title="Plans & features" description="Everything included on Free and Pro.">
          <PlanComparison freePrice="$0" proPrice={`$${proPrice}`} />
        </Card>
      </Stack>
    </Page>
  );
}
