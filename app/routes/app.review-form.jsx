import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export { action } from "./app.collect-reviews.customize.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const target = url.search
    ? `/app/collect-reviews/customize${url.search}`
    : "/app/collect-reviews/customize";
  throw embedRedirect(target, request);
};

export default function ReviewFormRedirect() {
  return null;
}
