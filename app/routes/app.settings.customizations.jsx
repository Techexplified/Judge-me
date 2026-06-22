import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  throw embedRedirect("/app/collect-reviews/customize", request);
};

export { action } from "./app.collect-reviews.customize.jsx";
