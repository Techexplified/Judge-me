import { authenticate } from "../shopify.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

/** Legacy route — widget editor lives at Review Form. */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  throw embedRedirect("/app/review-form", request);
};

export default function EditorRedirect() {
  return null;
}
