import {
  mergeFormConfig,
  applyLayoutPreset,
  pickFormConfigForSave,
  migrateLayoutPreset,
  radiusFromPreset,
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
assert(radiusFromPreset("pill") === 999, "pill radius");

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll review-form-config tests passed.");
