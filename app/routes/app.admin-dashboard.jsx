import { authenticate } from "../shopify.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

/** Legacy route — use Reviews for moderation. */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  throw embedRedirect("/app/manage-reviews", request);
};

export default function AdminDashboardRedirect() {
  return null;
}
