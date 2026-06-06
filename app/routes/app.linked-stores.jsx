import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.settings.integration.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search ? `/app/settings/integration${url.search}` : "/app/settings/integration";
  throw embedRedirect(target, request);
};

export default function LinkedStoresRedirect() {
  return null;
}
