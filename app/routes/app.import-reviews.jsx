import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.settings.import.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search ? `/app/settings/import${url.search}` : "/app/settings/import";
  throw embedRedirect(target, request);
};

export default function ImportReviewsRedirect() {
  return null;
}
