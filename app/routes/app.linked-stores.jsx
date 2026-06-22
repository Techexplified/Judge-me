import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.manage-reviews.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  params.set("tab", "integration");
  throw embedRedirect(`/app/manage-reviews?${params.toString()}`, request);
};

export default function LinkedStoresRedirect() {
  return null;
}
