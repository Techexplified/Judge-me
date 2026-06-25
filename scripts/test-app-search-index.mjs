import {
  APP_SEARCH_ITEMS,
  filterAppSearchItems,
  getRecommendedSearchItems,
} from "../app/lib/app-search-index.shared.js";

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

assert(APP_SEARCH_ITEMS.length > 0, "search index is not empty");

assert(
  APP_SEARCH_ITEMS.every((item) => typeof item.path === "string" && item.path.startsWith("/app/")),
  "every item path starts with /app/",
);

assert(
  APP_SEARCH_ITEMS.every((item) => item.id && item.title && item.description && item.icon),
  "every item has id, title, description, and icon",
);

const ids = APP_SEARCH_ITEMS.map((item) => item.id);
assert(new Set(ids).size === ids.length, "item ids are unique");

assert(getRecommendedSearchItems().length === 5, "exactly 5 recommended items (matches mockup)");

assert(filterAppSearchItems("").length === APP_SEARCH_ITEMS.length, "empty query returns all items");

function findsTitle(query, expectedId) {
  const results = filterAppSearchItems(query);
  return results.length > 0 && results.some((r) => r.id === expectedId);
}

assert(findsTitle("import", "import-reviews"), "'import' finds Import Reviews");
assert(findsTitle("translation", "translation"), "'translation' finds Translate Your Reviews");
assert(findsTitle("brand", "brand-identification"), "'brand' finds Brand Identification");
assert(findsTitle("analytics", "analytics"), "'analytics' finds Analytics");
assert(findsTitle("pricing", "settings"), "'pricing' finds Settings");
assert(findsTitle("widget", "widgets"), "'widget' finds Widgets");

assert(filterAppSearchItems("zzzznotathing").length === 0, "nonsense query returns no results");

const productResults = filterAppSearchItems("product reviews");
assert(productResults[0]?.id === "manage-reviews", "title match ranks above keyword/description match");

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll app search index checks passed.");
