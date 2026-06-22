import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  throw embedRedirect("/app/widgets/translation", request);
};

export { action } from "./app.widgets.translation.jsx";
