/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  data,
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
  useNavigate,
  useLocation,
} from "react-router";
import { CheckCircle2, Store } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { linkStore } from "../lib/link-store.server";
import {
  completeOnboarding,
  getOnboardingState,
  isOnboardingComplete,
  saveStoreProfile,
  saveSyndicationChoice,
} from "../lib/onboarding.server";
import {
  isStoreProfileComplete,
  mergeShopifyEmbedParams,
} from "../utils/shopify-embed-nav.js";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import {
  Banner,
  GOAL_OPTIONS,
  IMPORT_FROM_APP_OPTIONS,
  INDUSTRY_OPTIONS,
  MULTI_STORE_OPTIONS,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  Stack,
  TextField,
  WizardShell,
} from "../components/admin-ui";
import { SourceGrid } from "../components/import-wizard-ui";
import { SOURCE_LIST, SOURCE_PRESETS } from "../lib/csv-import.shared.js";

function parseStep(searchParams) {
  const s = Number.parseInt(searchParams.get("step") ?? "1", 10);
  return s >= 1 && s <= 4 ? s : 1;
}

function resolveOnboardingStep(requestedStep, storeProfile) {
  if (!isStoreProfileComplete(storeProfile)) {
    return requestedStep === 1 ? 1 : 2;
  }
  if (requestedStep <= 2) return 2;
  if (requestedStep >= 4) return 4;
  return 3;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  if (await isOnboardingComplete(shop)) {
    throw embedRedirect("/app", request);
  }

  const url = new URL(request.url);
  const requestedStep = parseStep(url.searchParams);
  const linkedFlash = url.searchParams.get("linked") === "1";

  const { storeProfile } = await getOnboardingState(shop);
  const profile = storeProfile ?? {
    industry: "",
    primaryGoal: "",
    hasMultipleStores: "",
    importingFromOtherApp: "",
    importSource: "",
  };

  const step = resolveOnboardingStep(requestedStep, profile);
  if (step !== requestedStep) {
    throw embedRedirect(`/app/onboarding?step=${step}`, request);
  }

  const link = await prisma.groupStoreLink.findUnique({
    where: { shop },
    include: { group: { include: { members: true } } },
  });

  const linkedCount = link?.group?.members?.length ?? 0;

  return {
    shop,
    step,
    linkedFlash,
    storeProfile: profile,
    linkedCount,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = normalizeShopDomain(session.shop);

  if (await isOnboardingComplete(shop)) {
    throw embedRedirect("/app", request);
  }

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  if (intent === "saveProfile") {
    const industry = String(fd.get("industry") ?? "").trim();
    const primaryGoal = String(fd.get("primaryGoal") ?? "").trim();
    const hasMultipleStores = String(fd.get("hasMultipleStores") ?? "").trim();
    const importingFromOtherApp = String(fd.get("importingFromOtherApp") ?? "").trim();
    const importSource = String(fd.get("importSource") ?? "").trim();

    if (!industry || !primaryGoal || !hasMultipleStores || !importingFromOtherApp) {
      return data(
        { error: "Complete all fields to continue.", step: 2 },
        { status: 400 },
      );
    }

    if (importingFromOtherApp === "yes") {
      if (!importSource || !SOURCE_PRESETS[importSource]) {
        return data(
          { error: "Select which app you are importing reviews from.", step: 2 },
          { status: 400 },
        );
      }
    }

    await saveStoreProfile(shop, {
      industry,
      primaryGoal,
      hasMultipleStores,
      importingFromOtherApp,
      importSource,
    });
    throw embedRedirect("/app/onboarding?step=3", request);
  }

  if (intent === "linkStore") {
    const targetShop = fd.get("targetShop");
    const result = await linkStore({ session, admin, targetShopRaw: targetShop });
    if (!result.ok) {
      return data({ error: result.error, step: 3 }, { status: 400 });
    }
    throw embedRedirect("/app/onboarding?step=3&linked=1", request);
  }

  if (intent === "skipSyndication") {
    await saveSyndicationChoice(shop, true);
    throw embedRedirect("/app/onboarding?step=4", request);
  }

  if (intent === "continueToComplete") {
    await saveSyndicationChoice(shop, false);
    throw embedRedirect("/app/onboarding?step=4", request);
  }

  if (intent === "finish") {
    const { storeProfile: profile } = await getOnboardingState(shop);
    await completeOnboarding(shop);

    if (
      profile?.importingFromOtherApp === "yes" &&
      profile?.importSource &&
      SOURCE_PRESETS[profile.importSource]
    ) {
      throw embedRedirect(
        `/app/import-reviews?source=${encodeURIComponent(profile.importSource)}`,
        request,
      );
    }

    throw embedRedirect("/app", request);
  }

  return data({ error: "Unknown action." }, { status: 400 });
};

export default function Onboarding() {
  const { shop, storeProfile, linkedCount, step, linkedFlash } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const goToStep = (n) => {
    navigate(mergeShopifyEmbedParams(`/app/onboarding?step=${n}`, location.search));
  };

  const [industry, setIndustry] = useState(storeProfile.industry || "");
  const [primaryGoal, setPrimaryGoal] = useState(storeProfile.primaryGoal || "");
  const [hasMultipleStores, setHasMultipleStores] = useState(
    storeProfile.hasMultipleStores || "",
  );
  const [importingFromOtherApp, setImportingFromOtherApp] = useState(
    storeProfile.importingFromOtherApp || "",
  );
  const [importSource, setImportSource] = useState(
    storeProfile.importSource || "loox",
  );
  const [targetShop, setTargetShop] = useState("");
  const profileError =
    step === 2 && actionData?.error && actionData?.step === 2
      ? actionData.error
      : null;
  const linkError =
    step === 3 && actionData?.error && actionData?.step === 3
      ? actionData.error
      : null;

  const confettiStep = step === 4;

  useEffect(() => {
    if (!confettiStep) return;
    let cancelled = false;
    (async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        if (cancelled) return;
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.65 },
          zIndex: 9999,
        });
      } catch {
        /* optional effect */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [confettiStep]);

  if (step === 1) {
    return (
      <WizardShell
        step={1}
        actions={
          <PrimaryButton onClick={() => goToStep(2)}>Get started</PrimaryButton>
        }
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900 }}>Welcome</h2>
        <p style={{ margin: "0 0 16px", color: "#6d7175", fontWeight: 600, lineHeight: 1.5 }}>
          Collect, manage, and share product reviews across your Shopify stores.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#6d7175", fontWeight: 600 }}>
          Signed in as <strong>{shop}</strong>
        </p>
      </WizardShell>
    );
  }

  if (step === 2) {
    return (
      <WizardShell
        step={2}
        actions={
          <>
            <SecondaryButton onClick={() => goToStep(1)} disabled={isSubmitting}>
              Back
            </SecondaryButton>
            <PrimaryButton
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={() => {
                submit(
                  {
                    intent: "saveProfile",
                    industry,
                    primaryGoal,
                    hasMultipleStores,
                    importingFromOtherApp,
                    importSource:
                      importingFromOtherApp === "yes" ? importSource : "",
                  },
                  { method: "post" },
                );
              }}
            >
              Continue
            </PrimaryButton>
          </>
        }
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900 }}>About your store</h2>
        <p style={{ margin: "0 0 16px", color: "#6d7175", fontWeight: 600, fontSize: 13 }}>
          Helps us tailor setup and recommendations.
        </p>
        {profileError ? (
          <Stack>
            <Banner tone="critical">{profileError}</Banner>
          </Stack>
        ) : null}
        <SelectField
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          options={INDUSTRY_OPTIONS}
        />
        <SelectField
          label="Primary goal"
          value={primaryGoal}
          onChange={(e) => setPrimaryGoal(e.target.value)}
          options={GOAL_OPTIONS}
        />
        <SelectField
          label="Multiple Shopify stores?"
          value={hasMultipleStores}
          onChange={(e) => setHasMultipleStores(e.target.value)}
          options={MULTI_STORE_OPTIONS}
        />
        <SelectField
          label="Importing reviews from another app?"
          value={importingFromOtherApp}
          onChange={(e) => setImportingFromOtherApp(e.target.value)}
          options={IMPORT_FROM_APP_OPTIONS}
        />
        {importingFromOtherApp === "yes" ? (
          <div style={{ marginTop: 4 }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "#6d7175",
                lineHeight: 1.45,
              }}
            >
              Loox, Judge.me, Stamped, Yotpo, Okendo, Amazon, Flipkart, or custom CSV.
            </p>
            <SourceGrid
              sources={SOURCE_LIST}
              selectedId={importSource}
              onSelect={setImportSource}
            />
          </div>
        ) : null}
      </WizardShell>
    );
  }

  if (step === 3) {
    const showLaterHint = hasMultipleStores === "no";
    return (
      <WizardShell
        step={3}
        actions={
          <>
            <SecondaryButton
              disabled={isSubmitting}
              onClick={() =>
                submit({ intent: "skipSyndication" }, { method: "post" })
              }
            >
              Skip for now
            </SecondaryButton>
            {linkedCount > 0 ? (
              <PrimaryButton
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={() =>
                  submit({ intent: "continueToComplete" }, { method: "post" })
                }
              >
                Continue
              </PrimaryButton>
            ) : null}
          </>
        }
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900 }}>Link stores</h2>
        <p style={{ margin: "0 0 16px", color: "#6d7175", fontWeight: 600, fontSize: 13 }}>
          Install this app on each store. Reviews sync when SKU or handle matches.
          {showLaterHint ? " You can add stores later from Linked stores." : ""}
        </p>

        {linkError ? (
          <div style={{ marginBottom: 12 }}>
            <Banner tone="critical">{linkError}</Banner>
          </div>
        ) : null}
        {linkedFlash ? (
          <div style={{ marginBottom: 12 }}>
            <Banner tone="success" icon={<CheckCircle2 size={18} />}>
              Store linked.
            </Banner>
          </div>
        ) : null}

        <TextField
          label="Store domain"
          value={targetShop}
          onChange={(e) => setTargetShop(e.target.value)}
          placeholder="brand-uk.myshopify.com"
          disabled={isSubmitting}
          helpText="The other store must have this app installed."
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <PrimaryButton
            loading={isSubmitting}
            disabled={isSubmitting || !targetShop.trim()}
            onClick={() =>
              submit(
                { intent: "linkStore", targetShop },
                { method: "post" },
              )
            }
          >
            Connect store
          </PrimaryButton>
          {linkedCount > 0 ? (
            <SecondaryButton
              disabled={isSubmitting}
              onClick={() =>
                submit({ intent: "continueToComplete" }, { method: "post" })
              }
            >
              Done linking
            </SecondaryButton>
          ) : null}
        </div>

        {linkedCount > 0 ? (
          <p style={{ margin: "16px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
            {linkedCount} store{linkedCount === 1 ? "" : "s"} in your network.
          </p>
        ) : null}
      </WizardShell>
    );
  }

  const wantsImport = storeProfile.importingFromOtherApp === "yes";

  return (
    <WizardShell
      step={4}
      actions={
        <PrimaryButton
          loading={isSubmitting}
          disabled={isSubmitting}
          onClick={() => submit({ intent: "finish" }, { method: "post" })}
        >
          {wantsImport ? "Continue to import" : "Go to dashboard"}
        </PrimaryButton>
      }
    >
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: "#ecfdf3",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Store size={24} color="#008060" />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900 }}>You&apos;re set up</h2>
        <p style={{ margin: 0, color: "#6d7175", fontWeight: 600, fontSize: 13, lineHeight: 1.5 }}>
          {wantsImport
            ? "Next, we'll help you import your reviews from your previous app."
            : "Add the review widget to your theme, or open Linked stores anytime to connect more shops."}
        </p>
      </div>
    </WizardShell>
  );
}
