import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.searchParams);
  params.set("tab", "import");
  const qs = params.toString();
  throw embedRedirect(qs ? `/app/collect-reviews?${qs}` : "/app/collect-reviews?tab=import", request);
};

export default function SettingsImportRedirect() {
  return null;
}
