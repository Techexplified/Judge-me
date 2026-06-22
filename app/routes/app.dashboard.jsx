import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

/** Legacy dashboard URL — home is now Performance Overview. */
export const loader = async ({ request }) => {
  throw embedRedirect("/app/performance-overview", request);
};

export default function DashboardRedirect() {
  return null;
}
