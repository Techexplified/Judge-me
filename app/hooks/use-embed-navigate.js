import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { mergeShopifyEmbedParams } from "../utils/shopify-embed-nav.js";

/**
 * Client navigation that keeps Shopify embedded-app query params (host, shop, etc.)
 * and notifies App Bridge so the admin iframe stays in sync.
 */
export function useEmbedNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const shopify = useAppBridge();

  return useCallback(
    (to) => {
      const target = mergeShopifyEmbedParams(to, location.search);
      navigate(target);
      if (typeof shopify?.navigate === "function") {
        shopify.navigate(target);
      }
    },
    [location.search, navigate, shopify],
  );
}
