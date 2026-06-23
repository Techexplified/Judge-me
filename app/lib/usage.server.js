import db from "../db.server.js";
import { hasProAccess } from "./trial.shared.js";
import {
  PRO_FEATURE_LIMITS,
  FREE_FEATURE_LIMITS,
  PRO_ONLY_FEATURES,
  FEATURE_LABELS,
  FEATURE_KEYS,
  FREE_USAGE_DISPLAY_KEYS,
  PRO_USAGE_DISPLAY_KEYS,
  FREE_PRO_LOCKED_USAGE_KEYS,
  getFeatureLimit,
} from "./usage.shared.js";

export {
  PRO_FEATURE_LIMITS,
  FREE_FEATURE_LIMITS,
  FEATURE_LABELS,
  FEATURE_KEYS,
  getFeatureLimit,
} from "./usage.shared.js";

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatFeatureLimitMessage(featureKey, used, limit) {
  const label = FEATURE_LABELS[featureKey] || featureKey;
  if (!Number.isFinite(limit)) {
    return `${label} is unlimited on your plan.`;
  }
  return `You've used ${used}/${limit} for ${label}. More available on your next bill.`;
}

export function formatProRequiredMessage(featureKey) {
  const label = FEATURE_LABELS[featureKey] || featureKey;
  return `${label} requires a Pro plan. Upgrade in Settings.`;
}

/**
 * @returns {Promise<number>}
 */
export async function getFeatureUsage(shop, featureKey, monthKey = currentMonthKey()) {
  const row = await db.featureUsage.findUnique({
    where: {
      shop_featureKey_monthKey: { shop, featureKey, monthKey },
    },
  });
  return row?.count ?? 0;
}

/**
 * @returns {Promise<Record<string, { used: number, limit: number, remaining: number }>>}
 */
export async function getAllFeatureUsage(shop, planStatus = null) {
  const monthKey = currentMonthKey();
  const rows = await db.featureUsage.findMany({
    where: { shop, monthKey },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.featureKey, r.count]));

  const hasPro = planStatus?.hasPro === true;
  const displayKeys = hasPro ? PRO_USAGE_DISPLAY_KEYS : FREE_USAGE_DISPLAY_KEYS;

  return Object.fromEntries(
    displayKeys.map((key) => {
      const proLocked = !hasPro && FREE_PRO_LOCKED_USAGE_KEYS.has(key);
      const used = proLocked ? 0 : (byKey[key] ?? 0);
      let limit = getFeatureLimit(planStatus ?? { hasPro: false }, key);
      if (proLocked) {
        const proLimit = PRO_FEATURE_LIMITS[key];
        limit = proLimit == null ? Infinity : proLimit;
      }
      return [
        key,
        {
          used,
          limit: Number.isFinite(limit) ? limit : null,
          remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : null,
          proLocked,
        },
      ];
    }),
  );
}

/**
 * Check whether a shop can use a feature (plan + under limit). Does not consume.
 */
export async function checkFeatureAccess(planStatus, featureKey, amount = 1) {
  const limit = getFeatureLimit(planStatus, featureKey);

  if (limit === 0) {
    return {
      ok: false,
      reason: "pro_required",
      used: 0,
      limit: 0,
      remaining: 0,
      message: formatProRequiredMessage(featureKey),
    };
  }

  const shop = planStatus?.shop;
  if (!shop) {
    return { ok: false, reason: "missing_shop", used: 0, limit, remaining: 0 };
  }

  const used = await getFeatureUsage(shop, featureKey);
  const finiteLimit = Number.isFinite(limit) ? limit : used + amount;
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity;

  if (Number.isFinite(limit) && used + amount > limit) {
    return {
      ok: false,
      reason: "limit_exceeded",
      used,
      limit,
      remaining: Math.max(0, limit - used),
      message: formatFeatureLimitMessage(featureKey, used, limit),
    };
  }

  return {
    ok: true,
    used,
    limit: Number.isFinite(limit) ? limit : null,
    remaining: Number.isFinite(remaining) ? remaining - amount : null,
  };
}

/**
 * Atomically increment usage after a successful access check.
 */
export async function consumeFeatureUsage(shop, featureKey, amount = 1) {
  const monthKey = currentMonthKey();

  const row = await db.featureUsage.upsert({
    where: {
      shop_featureKey_monthKey: { shop, featureKey, monthKey },
    },
    create: { shop, featureKey, monthKey, count: amount },
    update: { count: { increment: amount } },
  });

  const used = row.count;
  return { used, featureKey };
}

/**
 * Check access and consume in one step. Call before serving cached or fresh results.
 */
export async function requireFeatureUsage(planStatus, featureKey, amount = 1) {
  const access = await checkFeatureAccess(planStatus, featureKey, amount);
  if (!access.ok) {
    return { ok: false, ...access };
  }

  const usage = await consumeFeatureUsage(planStatus.shop, featureKey, amount);
  const limit = getFeatureLimit(planStatus, featureKey);
  return {
    ok: true,
    used: usage.used,
    limit: Number.isFinite(limit) ? limit : null,
    remaining: Number.isFinite(limit) ? Math.max(0, limit - usage.used) : null,
  };
}

/**
 * Reset all feature usage for a shop (dev/testing).
 */
export async function resetFeatureUsageForShop(shop, monthKey = currentMonthKey()) {
  await db.featureUsage.deleteMany({ where: { shop, monthKey } });
}

/** Reset specific metered features for a shop (e.g. after analytics UI migration). */
export async function resetFeatureUsageKeys(shop, featureKeys, monthKey = currentMonthKey()) {
  if (!featureKeys?.length) return;
  await db.featureUsage.deleteMany({
    where: { shop, monthKey, featureKey: { in: featureKeys } },
  });
}
