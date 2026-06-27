/** Client-safe CSV import constants and helpers (no server dependencies). */

export const TARGET_FIELDS = [
  { key: "author", label: "Reviewer name", required: true },
  { key: "comment", label: "Review text", required: true },
  { key: "rating", label: "Star rating (1 to 5)", required: true },
  { key: "productHandle", label: "Product handle", required: false },
  { key: "productId", label: "Product ID", required: false },
  { key: "productSku", label: "Product SKU", required: false },
  { key: "reviewDate", label: "Review Date", required: false },
  { key: "title", label: "Review Title", required: false },
  { key: "email", label: "Reviewer Email", required: false },
  { key: "reply", label: "Merchant Reply", required: false },
  { key: "replyDate", label: "Reply Date", required: false },
  { key: "skip", label: "Skip this column", required: false },
];

export const SOURCE_PRESETS = {
  loox: {
    id: "loox",
    name: "Loox",
    category: "Shopify app",
    logo: "/import-logos/loox_logo.svg",
    autoMapped: true,
    columnAliases: {
      author: ["author", "reviewer_name", "reviewer", "name", "customer_name"],
      comment: ["body", "review_body", "review", "content", "text", "comment"],
      rating: ["rating", "star_rating", "stars", "score"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["created_at", "review_date", "date", "timestamp", "createdAt"],
      title: ["title", "review_title"],
      email: ["email", "reviewer_email"],
      reply: ["reply", "store_reply", "merchant_reply"],
      replyDate: ["replied_at", "reply_date", "replyDate"],
    },
  },
  judgeme: {
    id: "judgeme",
    name: "Judge.me",
    category: "Shopify app",
    logo: "/import-logos/judge_me_logo.png",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_name", "author", "name", "customer_name", "reviewer"],
      comment: ["body", "review_body", "review", "content", "comment", "text"],
      rating: ["rating", "star_rating", "score", "stars"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["review_date", "created_at", "date", "createdAt"],
      title: ["title", "review_title"],
      email: ["reviewer_email", "email"],
      reply: ["reply", "merchant_reply", "store_reply"],
      replyDate: ["reply_date", "replyDate", "replied_at"],
    },
  },
  stamped: {
    id: "stamped",
    name: "Stamped.io",
    category: "Shopify app",
    logo: "/import-logos/stamped_io_logo.svg",
    autoMapped: true,
    columnAliases: {
      author: ["author", "reviewauthor", "reviewer_name", "name", "customer_name", "reviewer"],
      comment: ["body", "reviewbody", "review_body", "content", "comment", "text"],
      rating: ["rating", "reviewrating", "star_rating", "score", "stars"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "productid", "shopify_product_id", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["datecreated", "created_at", "review_date", "date", "createdAt"],
      title: ["title", "reviewtitle", "review_title"],
      email: ["email", "reviewer_email"],
      reply: ["reply", "merchant_reply", "store_reply"],
      replyDate: ["reply_date", "replyDate", "replied_at"],
    },
  },
  yotpo: {
    id: "yotpo",
    name: "Yotpo",
    category: "Shopify app",
    logo: "/import-logos/yotpo_logo.jpeg",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_display_name", "reviewer_name", "author", "name", "customer_name", "reviewer"],
      comment: ["review_content", "content", "body", "review_body", "comment", "text"],
      rating: ["review_score", "rating", "score", "star_rating", "stars"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["review_creation_date", "created_at", "date", "createdAt"],
      title: ["review_title", "title"],
      email: ["reviewer_email", "email"],
      reply: ["comment_content", "reply", "merchant_reply", "store_reply"],
      replyDate: ["comment_created_at", "reply_date", "replyDate", "replied_at"],
    },
  },
  okendo: {
    id: "okendo",
    name: "Okendo",
    category: "Shopify app",
    logo: "/import-logos/okendo_logo.svg",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_name", "author", "name", "customer_name", "reviewer"],
      comment: ["body", "review_body", "review", "content", "comment", "text"],
      rating: ["rating", "star_rating", "score", "stars"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["date_created", "created_at", "review_date", "createdAt"],
      title: ["title", "review_title"],
      email: ["reviewer_email", "email"],
      reply: ["reply", "merchant_reply", "store_reply"],
      replyDate: ["reply_date", "replyDate", "replied_at"],
    },
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    category: "Marketplace",
    logo: "/import-logos/amazon.svg",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_name", "reviewer", "author", "name", "customer_name"],
      comment: ["review_text", "review_body", "body", "content", "text", "comment"],
      rating: ["star_rating", "rating", "stars", "score"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "asin", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["review_date", "created_at", "date", "createdAt"],
      title: ["review_title", "title", "headline"],
      email: ["email", "reviewer_email"],
    },
  },
  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    category: "Marketplace",
    logo: "/import-logos/flipkart_logo.svg",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_name", "reviewer", "author", "name", "customer_name"],
      comment: ["review_text", "review_body", "body", "content", "text", "comment"],
      rating: ["rating", "star_rating", "stars", "score"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "fsn", "productId"],
      productSku: ["sku", "variant_sku", "productSku"],
      reviewDate: ["review_date", "created_at", "date", "createdAt"],
      title: ["review_title", "title", "headline"],
      email: ["email", "reviewer_email"],
    },
  },
  custom: {
    id: "custom",
    name: "Custom CSV",
    category: "Any format",
    logo: "/import-logos/custom.svg",
    autoMapped: true,
    columnAliases: {
      author: ["reviewer_name", "author", "name", "customer_name", "reviewer"],
      comment: ["review_body", "comment", "body", "review", "content", "text"],
      rating: ["rating", "star_rating", "stars", "score"],
      productHandle: ["product_handle", "handle"],
      productId: ["product_id", "shopify_product_id", "productId"],
      productSku: ["product_sku", "sku", "variant_sku", "productSku"],
      reviewDate: ["review_date", "created_at", "date", "timestamp", "createdAt"],
      title: ["review_title", "title"],
      email: ["reviewer_email", "email"],
      reply: ["merchant_reply", "reply", "store_reply"],
      replyDate: ["reply_date", "replied_at", "replyDate"],
    },
  },
};

export const SOURCE_LIST = [
  SOURCE_PRESETS.loox,
  SOURCE_PRESETS.judgeme,
  SOURCE_PRESETS.stamped,
  SOURCE_PRESETS.yotpo,
  SOURCE_PRESETS.okendo,
  SOURCE_PRESETS.amazon,
  SOURCE_PRESETS.flipkart,
  SOURCE_PRESETS.custom,
];

const MAX_ROWS = 5000;

function normalizeHeader(h) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]/g, "");
}

export function autoMapColumns(headers, sourceId) {
  const preset = SOURCE_PRESETS[sourceId] ?? SOURCE_PRESETS.custom;
  const mapping = {};
  const matchedFields = new Set();
  const usedTargets = new Set();

  if (!preset.autoMapped) {
    for (const h of headers) {
      mapping[h] = "skip";
    }
    return { mapping, matchedFields };
  }

  const aliasToTarget = {};
  for (const [target, aliases] of Object.entries(preset.columnAliases)) {
    for (const alias of aliases) {
      aliasToTarget[normalizeHeader(alias)] = target;
    }
  }

  for (const header of headers) {
    const norm = normalizeHeader(header);
    const target = aliasToTarget[norm];
    if (target && !usedTargets.has(target)) {
      mapping[header] = target;
      matchedFields.add(target);
      usedTargets.add(target);
    } else {
      mapping[header] = "skip";
    }
  }

  return { mapping, matchedFields };
}

const REQUIRED_MAPPING_HINTS = {
  author: "Reviewer name",
  comment: "Review text",
  rating: "Star rating (1 to 5)",
};

export function validateMapping(mapping) {
  const errors = [];
  const mappedTargets = Object.values(mapping).filter((v) => v && v !== "skip");
  const required = ["author", "comment", "rating"];
  for (const req of required) {
    if (!mappedTargets.includes(req)) {
      errors.push(REQUIRED_MAPPING_HINTS[req] ?? req);
    }
  }
  const productFields = ["productHandle", "productId", "productSku"];
  if (!productFields.some((f) => mappedTargets.includes(f))) {
    errors.push("Which product the review is for (handle, ID, or SKU)");
  }
  const seen = new Set();
  for (const target of mappedTargets) {
    if (seen.has(target)) {
      const label = TARGET_FIELDS.find((f) => f.key === target)?.label ?? target;
      errors.push(`${label} is selected more than once`);
    }
    seen.add(target);
  }
  return { valid: errors.length === 0, errors };
}

/** How merchants export reviews from each source (shown in the import wizard). */
export const EXPORT_INSTRUCTIONS = {
  loox: {
    title: "How to Import Reviews from Loox",
    steps: [
      {
        label: "Step 1",
        text: "Open Loox from your Shopify Admin and go to the Reviews section.",
      },
      {
        label: "Step 2",
        text: "Export your reviews as a CSV file. If you cannot find the export option, contact Loox support for a full export.",
      },
      {
        label: "Step 3",
        text: "Upload the CSV file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  judgeme: {
    title: "How to Import Reviews from Judge.me",
    steps: [
      {
        label: "Step 1",
        text: "Open Judge.me and go to Settings, then Import and Export.",
      },
      {
        label: "Step 2",
        text: "Click Export Reviews and download the CSV file.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  stamped: {
    title: "How to Import Reviews from Stamped.io",
    steps: [
      {
        label: "Step 1",
        text: "Open your Stamped dashboard and go to the Reviews section.",
      },
      {
        label: "Step 2",
        text: "Apply filters if needed, then click the download button to export as CSV. For all reviews, contact Stamped support at support@stamped.io.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  yotpo: {
    title: "How to Import Reviews from Yotpo",
    steps: [
      {
        label: "Step 1",
        text: "Open Yotpo and go to Reviews, then Moderation.",
      },
      {
        label: "Step 2",
        text: "Click Export to CSV. Yotpo will email a download link to your account email. This can take up to an hour.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  okendo: {
    title: "How to Import Reviews from Okendo",
    steps: [
      {
        label: "Step 1",
        text: "Open Okendo and go to Settings, then Import and Export.",
      },
      {
        label: "Step 2",
        text: "Under Data, click Export next to Reviews, choose your date range, and click Request Export. Okendo will email you a download link.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  amazon: {
    title: "How to Import Reviews from Amazon",
    steps: [
      {
        label: "Step 1",
        text: "Export your product reviews from Amazon Seller Central or your review export tool.",
      },
      {
        label: "Step 2",
        text: "Add a Product Handle column for each row that matches the product URL slug in your Shopify store.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle or ASIN", "Rating", "Reviewer Name", "Review Content"],
  },
  flipkart: {
    title: "How to Import Reviews from Flipkart",
    steps: [
      {
        label: "Step 1",
        text: "Export product reviews from Flipkart Seller Hub.",
      },
      {
        label: "Step 2",
        text: "Add a Product Handle column for each row that matches the product URL slug in your Shopify store.",
      },
      {
        label: "Step 3",
        text: "Upload the file here. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: ["Product Handle", "Rating", "Reviewer Name", "Review Content"],
  },
  custom: {
    title: "How to Import Reviews from a Custom CSV",
    steps: [
      {
        label: "Step 1",
        text: "Download our template below.",
      },
      {
        label: "Step 2",
        text: "Fill in one row per review using your store's product handles or product IDs.",
      },
      {
        label: "Step 3",
        text: "Upload the file on the next step. We'll automatically match the columns for you.",
      },
    ],
    requiredFields: [
      "Product Handle or Product ID",
      "Rating",
      "Reviewer Name",
      "Review Content",
    ],
  },
};

/** Per-source CSV templates using column names that match each platform's exports. */
const CSV_TEMPLATES = {
  loox: {
    headers: [
      "product_handle",
      "product_id",
      "rating",
      "reviewer_name",
      "email",
      "title",
      "body",
      "created_at",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "5",
        "Sarah K.",
        "sarah@example.com",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "4",
        "Marcus T.",
        "marcus@example.com",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
      ],
    ],
  },
  judgeme: {
    headers: [
      "product_handle",
      "product_id",
      "rating",
      "reviewer_name",
      "reviewer_email",
      "title",
      "body",
      "review_date",
      "reply",
      "reply_date",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "5",
        "Sarah K.",
        "sarah@example.com",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
        "",
        "",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "4",
        "Marcus T.",
        "marcus@example.com",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
        "Thanks Marcus!",
        "2025-01-16",
      ],
    ],
  },
  stamped: {
    headers: [
      "product_handle",
      "productid",
      "reviewauthor",
      "email",
      "reviewtitle",
      "reviewbody",
      "reviewrating",
      "datecreated",
      "reply",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "Sarah K.",
        "sarah@example.com",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "5",
        "2025-01-12",
        "",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "Marcus T.",
        "marcus@example.com",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "4",
        "2025-01-15",
        "Thanks Marcus!",
      ],
    ],
  },
  yotpo: {
    headers: [
      "product_handle",
      "product_id",
      "reviewer_display_name",
      "reviewer_email",
      "review_score",
      "review_title",
      "review_content",
      "review_creation_date",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "Sarah K.",
        "sarah@example.com",
        "5",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "Marcus T.",
        "marcus@example.com",
        "4",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
      ],
    ],
  },
  okendo: {
    headers: [
      "product_handle",
      "product_id",
      "reviewer_name",
      "reviewer_email",
      "rating",
      "title",
      "body",
      "date_created",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "Sarah K.",
        "sarah@example.com",
        "5",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "Marcus T.",
        "marcus@example.com",
        "4",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
      ],
    ],
  },
  amazon: {
    headers: [
      "asin",
      "product_handle",
      "star_rating",
      "reviewer_name",
      "review_title",
      "review_text",
      "review_date",
    ],
    rows: [
      [
        "B0EXAMPLE01",
        "classic-wool-coat",
        "5",
        "Sarah K.",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
      ],
      [
        "B0EXAMPLE02",
        "leather-crossbody-bag",
        "4",
        "Marcus T.",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
      ],
    ],
  },
  flipkart: {
    headers: [
      "fsn",
      "product_handle",
      "rating",
      "reviewer_name",
      "review_title",
      "review_text",
      "review_date",
    ],
    rows: [
      [
        "BAGEXAMPLE01",
        "classic-wool-coat",
        "5",
        "Sarah K.",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
      ],
      [
        "BAGEXAMPLE02",
        "leather-crossbody-bag",
        "4",
        "Marcus T.",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
      ],
    ],
  },
  custom: {
    headers: [
      "product_handle",
      "product_id",
      "product_sku",
      "rating",
      "reviewer_name",
      "reviewer_email",
      "review_title",
      "review_body",
      "review_date",
      "merchant_reply",
      "reply_date",
    ],
    rows: [
      [
        "classic-wool-coat",
        "8234567890123",
        "COAT-001",
        "5",
        "Sarah K.",
        "sarah@example.com",
        "Perfect fit!",
        "Absolutely love this coat. Quality is outstanding.",
        "2025-01-12",
        "",
        "",
      ],
      [
        "leather-crossbody-bag",
        "8234567890124",
        "BAG-001",
        "4",
        "Marcus T.",
        "marcus@example.com",
        "Great bag",
        "Sturdy leather and plenty of room.",
        "2025-01-15",
        "Thanks Marcus!",
        "2025-01-16",
      ],
    ],
  },
};

function escapeCsvCell(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function getExportInstructions(sourceId) {
  const preset = SOURCE_PRESETS[sourceId] ?? SOURCE_PRESETS.custom;
  return EXPORT_INSTRUCTIONS[preset.id] ?? EXPORT_INSTRUCTIONS.custom;
}

/** True when a downloadable CSV template exists for this source. */
export function supportsImportTemplate(sourceId) {
  const preset = SOURCE_PRESETS[sourceId] ?? SOURCE_PRESETS.custom;
  return Boolean(CSV_TEMPLATES[preset.id]);
}

export function generateTemplateCsv(sourceId) {
  const preset = SOURCE_PRESETS[sourceId] ?? SOURCE_PRESETS.custom;
  const template = CSV_TEMPLATES[preset.id] ?? CSV_TEMPLATES.custom;
  const lines = [
    template.headers.join(","),
    ...template.rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}

/**
 * Trigger a CSV file download in the browser (works inside Shopify embedded iframe).
 * @param {string} sourceId
 * @returns {boolean} true if download was triggered
 */
export function downloadTemplateCsv(sourceId) {
  if (typeof document === "undefined") return false;

  const preset = SOURCE_PRESETS[sourceId] ?? SOURCE_PRESETS.custom;
  const csv = generateTemplateCsv(sourceId);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `review-import-${preset.id}-template.csv`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}

export const IMPORT_LIMITS = {
  maxRows: MAX_ROWS,
  maxBytes: 5 * 1024 * 1024,
};

export const DEFAULT_SETTINGS = {
  publishImmediately: true,
  skipDuplicates: true,
  filterMinRating: false,
  autoTranslate: false,
};

export function normalizeRating(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

export function parseReviewDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) {
    const parsed = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}
