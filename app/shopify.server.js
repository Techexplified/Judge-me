import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

export const PRO_PLAN = "JudgeMe Pro";
export const PRO_PRICE_USD = 20;
export const PRO_TRIAL_DAYS = 14;
export const BILLING_TEST_MODE = process.env.BILLING_TEST_MODE !== "false";
/** App handle from Partner Dashboard / admin URL (e.g. judgeme-reviews). */
export const APP_HANDLE = process.env.SHOPIFY_APP_HANDLE || "judgeme-reviews";
/**
 * Set USE_BILLING_API=true only if Partner Dashboard uses Manual Pricing (not Shopify App Pricing).
 * Apps on Shopify App Pricing must redirect to the hosted plan page instead.
 */
export const USE_BILLING_API = process.env.USE_BILLING_API === "true";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma, {
    connectionRetries: 10,
    connectionRetryIntervalMs: 3000,
  }),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  billing: {
    [PRO_PLAN]: {
      trialDays: PRO_TRIAL_DAYS,
      lineItems: [
        {
          amount: PRO_PRICE_USD,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
