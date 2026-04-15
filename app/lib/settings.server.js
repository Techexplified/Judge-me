/** Remove secrets before sending settings JSON to the browser or storefront. */
export function stripOpenRouterFromConfig(config) {
  if (!config || typeof config !== "object") return config;
  const rest = { ...config };
  delete rest.openRouterApiKey;
  return rest;
}
