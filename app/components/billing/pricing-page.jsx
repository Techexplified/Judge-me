/* eslint-disable react/prop-types */
import { useLocation } from "react-router";
import { Shield, RefreshCw, CheckCircle2 } from "lucide-react";
import { Banner, Card, SecondaryButton, Stack } from "../admin-ui";
import { FEATURE_LABELS } from "../../lib/usage.shared.js";
import { PricingTrialHero } from "./pricing-trial-hero";
import { PricingWhyUpgrade } from "./pricing-why-upgrade";
import { PricingFeatureGrid } from "./pricing-feature-grid";
import { PricingUpgradeFooter } from "./pricing-upgrade-footer";

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
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
                    Feature
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
                    Used
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
                    Limit
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
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
                    <td
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid #f1f2f3",
                        textAlign: "right",
                      }}
                    >
                      {row.used}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid #f1f2f3",
                        textAlign: "right",
                      }}
                    >
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
