import db from "../db.server.js";
import {
  FREE_REVIEWS_PER_MONTH,
  hasProAccess,
  PRO_TRIAL_DAYS,
} from "./trial.shared.js";
import {
  MANAGED_FREE_PLAN_HANDLE,
  MANAGED_PRO_PLAN_HANDLE,
} from "./plan-features.shared.js";

export {
  FREE_REVIEWS_PER_MONTH,
  hasProAccess,
  PRO_FEATURE_LABELS,
  FREE_FEATURE_LABELS,
  PRO_TRIAL_DAYS,
  PRO_PRICE_USD,
  serializePlanStatus,
  serializeTrialStatus,
  hasPremiumAccess,
} from "./trial.shared.js";

export {
  PRO_FEATURE_LIMITS,
  FREE_FEATURE_LIMITS,
  FEATURE_LABELS,
  FEATURE_KEYS,
  checkFeatureAccess,
  consumeFeatureUsage,
  requireFeatureUsage,
  getAllFeatureUsage,
  getFeatureUsage,
  formatFeatureLimitMessage,
  formatProRequiredMessage,
  getFeatureLimit,
} from "./usage.server.js";

export {
  MANAGED_FREE_PLAN_HANDLE,
  MANAGED_PRO_PLAN_HANDLE,
} from "./plan-features.shared.js";

export {
  PRO_PLAN,
  BILLING_TEST_MODE,
  APP_HANDLE,
  USE_BILLING_API,
} from "../shopify.server.js";

const ACTIVE_STATUSES = new Set(["ACTIVE", "ACCEPTED"]);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseSubscriptionDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addUtcDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Normalize billing.check / webhook subscription payloads. */
export function normalizeAppSubscription(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.admin_graphql_api_id ?? null,
    status: raw.status ?? null,
    name: raw.name ?? raw.plan_name ?? null,
    planHandle: raw.planHandle ?? raw.plan_handle ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    trialDays: raw.trialDays ?? raw.trial_days ?? null,
    currentPeriodEnd: raw.currentPeriodEnd ?? raw.current_period_end ?? null,
    lineItems: raw.lineItems ?? raw.line_items ?? null,
  };
}

function subscriptionMonthlyAmount(subscription) {
  const items = subscription?.lineItems ?? subscription?.line_items ?? [];
  if (!Array.isArray(items)) return null;

  for (const item of items) {
    const amount =
      item?.plan?.pricingDetails?.price?.amount ??
      item?.plan?.pricing_details?.price?.amount ??
      item?.price?.amount;
    if (amount != null && Number.isFinite(Number(amount))) {
      return Number(amount);
    }
  }
  return null;
}

/**
 * Decide free vs pro from Shopify App Pricing subscription data.
 * Uses plan_handle (free/pro), plan name, and recurring price.
 */
export function resolveManagedPlanTier(subscription, { hasActivePayment = false, planHandle = null } = {}) {
  const normalized = normalizeAppSubscription(subscription);
  const handleHint = String(planHandle ?? normalized?.planHandle ?? "")
    .trim()
    .toLowerCase();

  if (handleHint === MANAGED_FREE_PLAN_HANDLE) return "free";
  if (handleHint === MANAGED_PRO_PLAN_HANDLE) return "pro";

  const name = String(normalized?.name ?? subscription?.name ?? "")
    .trim()
    .toLowerCase();
  if (name.includes("pro") && !name.includes("free")) return "pro";
  if (name.includes("free") && !name.includes("pro")) return "free";

  const amount = subscriptionMonthlyAmount(subscription ?? normalized);
  if (amount != null) return amount > 0 ? "pro" : "free";

  const trialDays = Number(normalized?.trialDays ?? 0);
  if (hasActivePayment && trialDays > 0) return "pro";

  if (hasActivePayment) {
    // Active $0 contract without a clear handle — treat as free, not pro.
    return "free";
  }

  return "free";
}

function subscriptionIsActive(subscription, hasActivePayment) {
  const status = subscription?.status;
  if (status && ACTIVE_STATUSES.has(status)) return true;
  return Boolean(hasActivePayment && subscription);
}

/**
 * Trial end from Shopify subscription (createdAt + trialDays).
 * Returns null when there is no trial or the trial has already ended.
 */
export function resolveSubscriptionTrialEndsAt(subscription) {
  const normalized = normalizeAppSubscription(subscription);
  if (!normalized) return null;

  const trialDays = Number(normalized.trialDays ?? 0);
  if (!Number.isFinite(trialDays) || trialDays <= 0) return null;

  const createdAt = parseSubscriptionDate(normalized.createdAt);
  if (!createdAt) return null;

  const trialEndsAt = addUtcDays(createdAt, trialDays);
  return trialEndsAt.getTime() > Date.now() ? trialEndsAt : null;
}

export function computeTrialDaysRemaining(trialEndsAt) {
  const end = parseSubscriptionDate(trialEndsAt);
  if (!end) return null;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / MS_PER_DAY);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Ensure a Shop row exists for this shop domain.
 */
export async function ensureShopRecord(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });

  if (existing) {
    if (existing.uninstalledAt) {
      await db.shop.update({
        where: { shop },
        data: { uninstalledAt: null },
      });
    }
    return existing;
  }

  return db.shop.create({
    data: {
      shop,
      plan: "free",
      planStatus: "free",
    },
  });
}

/**
 * Sync subscription state from Shopify billing.check() result into Neon.
 */
export async function syncSubscriptionFromShopify(shop, billingCheck, hints = {}) {
  await ensureShopRecord(shop);

  const rawSub = billingCheck?.appSubscriptions?.[0] ?? null;
  const subscription = normalizeAppSubscription(rawSub);
  const hasActive = Boolean(billingCheck?.hasActivePayment);
  const status = subscription?.status ?? (hasActive ? "ACTIVE" : null);
  const tier = resolveManagedPlanTier(rawSub, {
    hasActivePayment: hasActive,
    planHandle: hints.planHandle ?? hints.selectedPlanHandle ?? null,
  });
  const isPro =
    tier === "pro" &&
    subscriptionIsActive(subscription ?? rawSub, hasActive) &&
    (!status || ACTIVE_STATUSES.has(status));

  const billingTrialEndsAt = isPro ? resolveSubscriptionTrialEndsAt(subscription) : null;

  await db.shop.update({
    where: { shop },
    data: {
      plan: isPro ? "pro" : "free",
      planStatus: isPro ? "pro" : "free",
      subscriptionId: isPro ? subscription?.id ?? null : null,
      subscriptionStatus: isPro ? status : null,
      billingTrialEndsAt,
    },
  });

  return { isPro, subscription, tier };
}

/**
 * Downgrade shop to free (cancel, uninstall, webhook).
 */
export async function downgradeShopToFree(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });
  if (!existing) return;

  await db.shop.update({
    where: { shop },
    data: {
      plan: "free",
      planStatus: "free",
      subscriptionId: null,
      subscriptionStatus: null,
      billingTrialEndsAt: null,
    },
  });
}

/**
 * Count reviews created this calendar month for a shop.
 */
export async function getMonthlyReviewCount(shop) {
  const monthKey = currentMonthKey();
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return db.review.count({
    where: {
      shop,
      createdAt: { gte: start, lt: end },
    },
  });
}

/**
 * Returns unified plan status for a shop.
 * Pass billing from authenticate.admin() to sync from Shopify on each check.
 */
export async function getShopPlanStatus(shop, billing = null) {
  await ensureShopRecord(shop);

  if (billing) {
    const { BILLING_TEST_MODE } = await import("../shopify.server.js");
    const billingCheck = await billing.check({ isTest: BILLING_TEST_MODE });
    await syncSubscriptionFromShopify(shop, billingCheck);
  }

  const record = await db.shop.findUnique({ where: { shop } });
  const reviewsThisMonth = await getMonthlyReviewCount(shop);
  const hasPro =
    record.plan === "pro" &&
    (!record.subscriptionStatus || ACTIVE_STATUSES.has(record.subscriptionStatus));

  if (record.billingTrialEndsAt && record.billingTrialEndsAt.getTime() <= Date.now()) {
    await db.shop.update({
      where: { shop },
      data: { billingTrialEndsAt: null },
    });
    record.billingTrialEndsAt = null;
  }

  const isInTrial =
    hasPro &&
    record.billingTrialEndsAt != null &&
    record.billingTrialEndsAt.getTime() > Date.now();
  const trialDaysRemaining = isInTrial
    ? computeTrialDaysRemaining(record.billingTrialEndsAt)
    : null;

  const reviewsRemaining = hasPro
    ? null
    : Math.max(0, FREE_REVIEWS_PER_MONTH - reviewsThisMonth);

  const { getAllFeatureUsage } = await import("./usage.server.js");
  const { FREE_FEATURE_LIMITS } = await import("./usage.shared.js");
  const featureUsage =
    hasPro || Object.keys(FREE_FEATURE_LIMITS).length
      ? await getAllFeatureUsage(shop, { hasPro, shop })
      : null;

  return {
    shop,
    plan: hasPro ? "pro" : "free",
    hasPro,
    subscriptionStatus: record.subscriptionStatus,
    subscriptionId: record.subscriptionId,
    billingTrialEndsAt: isInTrial ? record.billingTrialEndsAt : null,
    trialDaysRemaining,
    isInTrial,
    reviewsThisMonth,
    reviewsRemaining,
    freeReviewCap: FREE_REVIEWS_PER_MONTH,
    installedAt: record.installedAt,
    featureUsage,
  };
}

/** @deprecated use getShopPlanStatus */
export async function getTrialStatus(shop, billing = null) {
  const status = await getShopPlanStatus(shop, billing);
  return {
    isActive: status.hasPro,
    daysRemaining: status.trialDaysRemaining ?? 0,
    trialEndsAt: status.billingTrialEndsAt,
    isInTrial: status.isInTrial === true,
    planStatus: status.hasPro ? "active" : status.plan === "free" ? "free" : "expired",
    installedAt: status.installedAt,
    hasPro: status.hasPro,
    ...status,
  };
}

/**
 * Whether the shop can create another review (Free plan capped at 50/month).
 */
export async function canCreateReview(shop, billing = null) {
  const status = await getShopPlanStatus(shop, billing);
  if (status.hasPro) {
    return { ok: true, status };
  }
  if (status.reviewsThisMonth >= FREE_REVIEWS_PER_MONTH) {
    return {
      ok: false,
      error: `Free plan is limited to ${FREE_REVIEWS_PER_MONTH} reviews per month. Upgrade to Pro for unlimited reviews.`,
      status,
    };
  }
  return { ok: true, status };
}

function isManagedPricingBlocked(error) {
  const messages = error?.errorData?.map((e) => e.message).join(" ") ?? "";
  return (
    messages.includes("Managed Pricing") ||
    messages.includes("Shopify App Pricing") ||
    messages.includes("Billing API")
  );
}

function storeHandleFromShop(shop) {
  return String(shop ?? "")
    .trim()
    .replace(/\.myshopify\.com$/i, "");
}

/** Shopify embedded apps signal external redirects via a thrown 401 Response. */
export function isShopifyBillingRedirect(error) {
  if (!(error instanceof Response)) return false;
  if (error.status === 302 || error.status === 303) return true;
  if (error.status === 401) {
    return error.headers.has("X-Shopify-API-Request-Failure-Reauthorize-Url");
  }
  return false;
}

export async function getAppPricingUrl(shop, planHandle = null) {
  const { APP_HANDLE } = await import("../shopify.server.js");
  const storeHandle = storeHandleFromShop(shop);
  const base = `https://admin.shopify.com/store/${storeHandle}/charges/${APP_HANDLE}/pricing_plans`;
  if (planHandle) return `${base}/${planHandle}`;
  return base;
}

/** Shopify-hosted plan selection page (merchants pick Free or Pro there). */
export async function getProPricingUrl(shop) {
  return getAppPricingUrl(shop);
}

/**
 * Redirect to Shopify App Pricing plan selection (required when Managed Pricing is enabled).
 */
export async function redirectToAppPricing({ redirect, session, shop }) {
  const { APP_HANDLE } = await import("../shopify.server.js");
  const storeHandle = storeHandleFromShop(session?.shop ?? shop);
  const pricingUrl = `https://admin.shopify.com/store/${storeHandle}/charges/${APP_HANDLE}/pricing_plans`;
  return redirect(pricingUrl, { target: "_top" });
}

/**
 * Start Pro upgrade: Billing API (manual pricing) or Shopify App Pricing redirect.
 */
export async function requestProSubscription({
  billing,
  redirect,
  session,
  shop,
  returnUrl,
}) {
  const { PRO_PLAN, BILLING_TEST_MODE, USE_BILLING_API } = await import(
    "../shopify.server.js"
  );

  if (USE_BILLING_API) {
    try {
      return await billing.request({
        plan: PRO_PLAN,
        isTest: BILLING_TEST_MODE,
        trialDays: PRO_TRIAL_DAYS,
        returnUrl,
      });
    } catch (error) {
      if (!isManagedPricingBlocked(error)) throw error;
    }
  }

  return await redirectToAppPricing({ redirect, session, shop });
}

/** Extract a user-friendly message from billing errors. */
export function formatBillingError(error) {
  if (isManagedPricingBlocked(error)) {
    return "This app uses Shopify App Pricing. Use the upgrade button to open Shopify's plan page.";
  }
  const detail = error?.errorData?.[0]?.message;
  return detail || error?.message || "Could not start billing. Try again or contact support.";
}

/**
 * Mark a shop as uninstalled (preserves data, clears subscription).
 */
export async function markShopUninstalled(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });
  if (!existing) return;

  await db.shop.update({
    where: { shop },
    data: {
      uninstalledAt: new Date(),
      plan: "free",
      planStatus: "free",
      subscriptionId: null,
      subscriptionStatus: null,
      billingTrialEndsAt: null,
    },
  });
}
