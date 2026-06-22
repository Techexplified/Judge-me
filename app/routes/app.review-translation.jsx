import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.widgets.translation.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search ? `/app/widgets/translation${url.search}` : "/app/widgets/translation";
  throw embedRedirect(target, request);
};

export default function ReviewTranslationRedirect() {
  return null;
}
