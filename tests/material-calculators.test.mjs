import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateMaterial,
  adhesiveRules,
  waterproofRules,
  packSizes,
} from "../src/calculatorMath.mjs";
const base = { area: 100, unit: "m2", waste: 5, pack: 20 };
test("adhesive uses sourced coverage and whole bags", () => {
  const r = estimateMaterial(
    "tile-adhesive",
    { ...base, area: 30, unit: "ft2", waste: 0 },
    adhesiveRules["trufix-110"].rate,
  );
  assert.equal(r.packs, 1);
  assert.ok(Math.abs(r.total - 20) < 1e-9);
});
test("waterproofing includes two coats once", () => {
  const r = estimateMaterial(
    "waterproofing",
    base,
    waterproofRules["trubuild-aqualock"].rate,
  );
  assert.equal(r.net, 175);
  assert.equal(r.total, 183.75);
  assert.equal(r.packs, 10);
});
test("grout dimensions determine consumption", () => {
  const r = estimateMaterial(
    "grout",
    { ...base, length: 600, width: 600, joint: 3, depth: 5 },
    1.5,
  );
  assert.ok(Math.abs(r.consumption - 0.075) < 1e-10);
  assert.ok(Math.abs(r.net - 7.5) < 1e-10);
});
test("unit conversion gives equivalent quantity", () => {
  const a = estimateMaterial("waterproofing", base, 2),
    b = estimateMaterial(
      "waterproofing",
      { ...base, area: 100 / 0.09290304, unit: "ft2" },
      2,
    );
  assert.ok(Math.abs(a.total - b.total) < 1e-8);
});
test("invalid inputs cannot produce quantities", () => {
  for (const patch of [
    { area: 0 },
    { area: -1 },
    { area: "NaN" },
    { waste: -1 },
    { waste: 31 },
    { pack: 0 },
    { unit: "x" },
  ])
    assert.throws(() =>
      estimateMaterial("waterproofing", { ...base, ...patch }, 2),
    );
  assert.throws(() =>
    estimateMaterial(
      "grout",
      { ...base, length: 600, width: 600, joint: 3, depth: 5 },
      "",
    ),
  );
});
test("pack sizes convert grams and deduplicate", () =>
  assert.deepEqual(packSizes({ packaging: "500 gm 1 Kg 1 kg" }), [0.5, 1]));
