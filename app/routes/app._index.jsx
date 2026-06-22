import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

/** Legacy /app entry — Performance Overview is the app home. */
export const loader = async ({ request }) => {
  throw embedRedirect("/app/performance-overview", request);
};

export default function AppIndexRedirect() {
  return null;
}
