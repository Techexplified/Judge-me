/**
 * Strip any legacy or sensitive keys before sending settings JSON
 * to the browser or storefront.
 *
 * Note: With BYOK removed, `openRouterApiKey` should no longer appear
 * in config. This function remains as a safety net to strip it if old
 * data is still present.
 */
export function stripSensitiveFromConfig(config) {
  if (!config || typeof config !== "object") return config;
  const rest = { ...config };
  delete rest.openRouterApiKey; // legacy BYOK field — remove if still present
  return rest;
}
