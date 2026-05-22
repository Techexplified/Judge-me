import db from "../db.server.js";
import { TRIAL_DAYS } from "./trial.shared.js";

export {
  TRIAL_DAYS,
  PREMIUM_FEATURE_LABELS,
  hasPremiumAccess,
  serializeTrialStatus,
} from "./trial.shared.js";

/**
 * Ensure a Shop row exists for this shop domain.
 * Called on every authenticated loader/action so the trial clock starts
 * automatically on first app open (install).
 *
 * If the shop was previously uninstalled and reinstalls, the original
 * trial window is preserved — we don't reset the clock.
 */
export async function ensureShopRecord(shop) {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const existing = await db.shop.findUnique({ where: { shop } });

  if (existing) {
    // If shop reinstalled, clear the uninstalledAt flag
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
      installedAt: now,
      trialEndsAt,
      planStatus: "trial",
    },
  });
}

/**
 * Returns the current trial/plan status for a shop.
 *
 * @returns {{ isActive: boolean, daysRemaining: number, trialEndsAt: Date, planStatus: string, installedAt: Date }}
 */
export async function getTrialStatus(shop) {
  const record = await ensureShopRecord(shop);
  const now = new Date();

  // If shop has been explicitly upgraded, features are always active
  if (record.planStatus === "active") {
    return {
      isActive: true,
      daysRemaining: Infinity,
      trialEndsAt: record.trialEndsAt,
      planStatus: "active",
      installedAt: record.installedAt,
    };
  }

  const msRemaining = record.trialEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const isActive = msRemaining > 0;

  // Auto-expire if trial has ended
  if (!isActive && record.planStatus === "trial") {
    await db.shop.update({
      where: { shop },
      data: { planStatus: "expired" },
    });
  }

  return {
    isActive,
    daysRemaining,
    trialEndsAt: record.trialEndsAt,
    planStatus: isActive ? "trial" : "expired",
    installedAt: record.installedAt,
  };
}

/**
 * Mark a shop as uninstalled.
 */
export async function markShopUninstalled(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });
  if (!existing) return;

  await db.shop.update({
    where: { shop },
    data: { uninstalledAt: new Date() },
  });
}
