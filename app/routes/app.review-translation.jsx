import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.settings.translation.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search ? `/app/settings/translation${url.search}` : "/app/settings/translation";
  throw embedRedirect(target, request);
};

export default function ReviewTranslationRedirect() {
  return null;
}
