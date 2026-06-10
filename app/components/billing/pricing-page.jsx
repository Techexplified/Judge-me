/* eslint-disable react/prop-types */
import { useLocation } from "react-router";
import { Shield, RefreshCw, CheckCircle2 } from "lucide-react";
import { Banner, Card, SecondaryButton, Stack } from "../admin-ui";
import { PricingTrialHero } from "./pricing-trial-hero";
import { PricingWhyUpgrade } from "./pricing-why-upgrade";
import { PricingFeatureGrid } from "./pricing-feature-grid";
import { PricingUpgradeFooter } from "./pricing-upgrade-footer";
import { FeatureUsageBars } from "./feature-usage-bars";

export function PricingPage({
  planStatus,
  billingSuccess,
  billingDeclined,
  proPrice,
  proTrialDays,
  billingTestMode,
  useBillingApi,
  billingError,
  appPricingUrl,
  actionError,
  isSubmitting,
  onStartTrial,
  onCancel,
}) {
  const location = useLocation();
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

  return (
    <Stack>
      {billingTestMode ? (
        <Banner tone="info">
          Test billing mode is on. Development stores will not be charged real money.
        </Banner>
      ) : null}

      {!useBillingApi ? (
        <Banner tone="info">
          Upgrades open Shopify&apos;s hosted Plan page (Shopify App Pricing). Configure your Pro
          Plan and 14 day trial in the Partner Dashboard.
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
          Subscription was not approved. You can continue on the Free Plan or try again.
        </Banner>
      ) : null}

      {actionError || billingError ? (
        <Banner tone="critical">{actionError || billingError}</Banner>
      ) : null}

      <PricingTrialHero
        hasPro={hasPro}
        inTrial={inTrial}
        trialDays={trialDays}
        trialEndsLabel={trialEndsLabel}
        proPrice={proPrice}
        proTrialDays={proTrialDays}
        appPricingUrl={appPricingUrl}
        isSubmitting={isSubmitting}
        onStartTrial={onStartTrial}
        onCancel={onCancel}
      />

      {!hasPro ? <PricingWhyUpgrade /> : null}

      <PricingFeatureGrid search={location.search} />

      {!hasPro ? (
        <PricingUpgradeFooter
          proPrice={proPrice}
          proTrialDays={proTrialDays}
          appPricingUrl={appPricingUrl}
          isSubmitting={isSubmitting}
          onStartTrial={onStartTrial}
        />
      ) : null}

      {!hasPro ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            fontWeight: 600,
            color: "#6d7175",
            justifyContent: "center",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={14} /> Shopify Billing protected
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Cancel anytime
          </span>
        </div>
      ) : null}

      {planStatus?.featureUsage ? (
        <Card
          title={hasPro ? "Pro feature usage" : "Free Plan usage"}
          description="Monthly limits reset on the 1st (UTC)."
        >
          <FeatureUsageBars featureUsage={planStatus.featureUsage} />
        </Card>
      ) : null}

      {hasPro ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SecondaryButton
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel subscription
          </SecondaryButton>
        </div>
      ) : null}
    </Stack>
  );
}
