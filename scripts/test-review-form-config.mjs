import {
  mergeFormConfig,
  applyLayoutPreset,
  pickFormConfigForSave,
  migrateLayoutPreset,
  migrateRadiusPreset,
  radiusFromPreset,
  resolveFormText,
  resolveRatingPageTitle,
} from "../app/lib/review-form-config.shared.js";

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

const withTranslation = {
  translation: { enabled: true },
  layoutPreset: "compact",
  primaryColor: "#111111",
};

const merged = mergeFormConfig(withTranslation);
assert(merged.translation?.enabled === true, "merge keeps translation keys");
assert(merged.layoutPreset === "modern", "compact migrates to modern");
assert(merged.primaryColor === "#111111", "merge keeps custom colors");

const preset = applyLayoutPreset("luxury", merged);
assert(preset.layoutPreset === "luxury", "preset applies luxury");
assert(preset.translation?.enabled === true, "preset keeps translation keys");
assert(preset.brandLogoUrl === merged.brandLogoUrl, "preset keeps logo url");

const saved = pickFormConfigForSave({
  ...merged,
  aiDigestCache: { x: 1 },
});
assert(saved.aiDigestCache === undefined, "pick omits non-form keys");
assert(saved.layoutPreset === "modern", "pick includes form keys");
assert(Object.keys(saved).length >= 20, "pick has expected form keys");

assert(migrateLayoutPreset("brandLed") === "luxury", "brandLed migrates");
assert(migrateRadiusPreset("medium") === "default", "medium radius migrates to default");
assert(radiusFromPreset("pill") === 999, "pill radius");
assert(radiusFromPreset("sharp") === 0, "sharp radius is 0");
assert(radiusFromPreset("slight") === 6, "slight radius is 6");

const resolved = resolveFormText("Rate {{item}} from {{store}}", {
  item: "Serum",
  store: "Maple Oak",
});
assert(resolved === "Rate Serum from Maple Oak", "resolveFormText replaces tokens");

const cfg = mergeFormConfig({});
const ratingTitle = resolveRatingPageTitle(cfg, { item: "Botanical Serum" });
assert(
  ratingTitle === "How would you rate this product?",
  "resolveRatingPageTitle uses clean generic title",
);
const customCfg = mergeFormConfig({ ratingPageTitle: "Rate {{item}} please" });
const customTitle = resolveRatingPageTitle(customCfg, { item: "Botanical Serum" });
assert(customTitle.includes("Botanical Serum"), "resolveRatingPageTitle still supports {{item}} token");
const fallbackTitle = resolveRatingPageTitle(cfg, { item: "" });
assert(fallbackTitle === cfg.ratingPageTitleFallback, "resolveRatingPageTitle uses fallback");

assert(cfg.cardBackgroundColor === "#FFFFFF", "cardBackgroundColor default");

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll review-form-config tests passed.");
