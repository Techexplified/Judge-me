/**
 * Non-blocking shop row bootstrap. Billing and webhooks call ensureShopRecord when needed.
 */
export async function safeEnsureShopRecord(shop) {
  try {
    const { ensureShopRecord } = await import("./billing.server.js");
    await ensureShopRecord(shop);
  } catch (err) {
    console.error("[app-shell] ensureShopRecord failed:", err);
  }
}

/**
 * Onboarding gate for the app shell. Fail open on DB errors so merchants are not locked out.
 */
export async function safeIsOnboardingComplete(shop) {
  try {
    const { isOnboardingComplete } = await import("./onboarding.server.js");
    return await isOnboardingComplete(shop);
  } catch (err) {
    console.error("[app-shell] isOnboardingComplete failed:", err);
    return true;
  }
}
