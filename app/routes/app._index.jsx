import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

/** Legacy /app entry — dashboard lives at /app/dashboard for correct App Bridge nav matching. */
export const loader = async ({ request }) => {
  throw embedRedirect("/app/dashboard", request);
};

export default function AppIndexRedirect() {
  return null;
}
