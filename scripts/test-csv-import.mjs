import {
  autoMapColumns,
  validateMapping,
  normalizeRating,
  parseReviewDate,
} from "../app/lib/csv-import.shared.js";
import {
  buildProductLookup,
  validateRows,
  rowsToReviewRecords,
} from "../app/lib/csv-import.server.js";

const lookup = buildProductLookup([
  { handle: "classic-wool-coat", productId: "1234567890", sku: "COAT-001", title: "Classic Wool Coat" },
  { handle: "leather-bag", productId: "999", sku: "BAG-01", title: "Leather Bag" },
]);

const headers = [
  "product_handle",
  "rating",
  "reviewer_name",
  "review_body",
  "review_date",
];
const rows = [
  {
    product_handle: "classic-wool-coat",
    rating: "5",
    reviewer_name: "Sarah K.",
    review_body: "Great coat!",
    review_date: "2025-01-12",
  },
  {
    product_handle: "unknown-product",
    rating: "4",
    reviewer_name: "Bob",
    review_body: "Nice",
    review_date: "2025-01-13",
  },
  {
    product_handle: "classic-wool-coat",
    rating: "bad",
    reviewer_name: "X",
    review_body: "",
    review_date: "2025-01-14",
  },
];

const { mapping, matchedFields } = autoMapColumns(headers, "loox");
console.assert(matchedFields.has("author"), "author auto-mapped");
console.assert(matchedFields.has("comment"), "comment auto-mapped");
console.assert(validateMapping(mapping).valid, "mapping valid");

const settings = {
  publishImmediately: true,
  skipDuplicates: true,
  filterMinRating: false,
  autoTranslate: false,
};
const fp = new Set();
const { validated, summary } = validateRows(rows, mapping, lookup, fp, settings, "test.myshopify.com");
console.assert(summary.ready === 1, `expected 1 ready, got ${summary.ready}`);
console.assert(summary.productNotFound === 1, `expected 1 not found, got ${summary.productNotFound}`);
console.assert(summary.invalid === 1, `expected 1 invalid, got ${summary.invalid}`);

const records = rowsToReviewRecords(validated, "test.myshopify.com", settings);
console.assert(records.length === 1, `expected 1 record, got ${records.length}`);
console.assert(records[0].status === "PUBLISHED", "published by default");

console.assert(normalizeRating("4.5") === 5, "rating rounds");
console.assert(parseReviewDate("2025-01-12") instanceof Date, "date parses");

console.log("All csv-import checks passed.");
