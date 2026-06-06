import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.settings.customizations.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search
    ? `/app/settings/customizations${url.search}`
    : "/app/settings/customizations";
  throw embedRedirect(target, request);
};

export default function ReviewFormRedirect() {
  return null;
}
