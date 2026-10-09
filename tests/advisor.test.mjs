import test from "node:test";
import assert from "node:assert/strict";
import { recommend, questions, summary } from "../src/advisorRules.mjs";
import fs from "node:fs";
const products = JSON.parse(
  fs.readFileSync(new URL("../src/products.json", import.meta.url)),
);
test("exposed screed roof has grounded candidates", () =>
  assert.deepEqual(
    recommend({ task: "roof", condition: "exposed", surface: "screed" }).ids,
    ["trubuild-rooftect-advanced", "trubuild-rooftect-prime"],
  ));
test("standing water, covered roof and unsupported surfaces require review", () => {
  for (const condition of ["ponding", "covered", "unsure"])
    assert.equal(
      recommend({ task: "roof", condition, surface: "screed" }).ids.length,
      0,
    );
  assert.equal(
    recommend({ task: "roof", condition: "exposed", surface: "other" }).ids
      .length,
    0,
  );
});
test("mosaic roof includes primer condition", () =>
  assert.match(
    recommend({ task: "roof", condition: "exposed", surface: "mosaic" })
      .limitations,
    /Primesure Premium/,
  ));
test("tile matching rejects unsupported size, substrate and exposure", () => {
  assert.equal(
    recommend({
      task: "tiles",
      area: "inside",
      surface: "cement",
      size: "medium",
    }).ids.length,
    2,
  );
  for (const patch of [
    { size: "large" },
    { size: "unsure" },
    { surface: "other" },
    { area: "outside" },
  ])
    assert.equal(
      recommend({
        task: "tiles",
        area: "inside",
        surface: "cement",
        size: "medium",
        ...patch,
      }).ids.length,
      0,
    );
});
test("chemical grout exposure and unknown tasks never produce speculative matches", () => {
  assert.equal(
    recommend({ task: "grout", area: "chemical", surface: "ceramic" }).ids
      .length,
    0,
  );
  assert.equal(recommend({ task: "other" }).ids.length, 0);
  assert.equal(recommend({}).ids.length, 0);
});
test("waterproofing requires a known area and substrate", () => {
  assert.equal(
    recommend({ task: "wet", area: "bathroom", surface: "concrete" }).ids
      .length,
    2,
  );
  assert.equal(
    recommend({ task: "wet", area: "unsure", surface: "concrete" }).ids.length,
    0,
  );
});
test("all possible recommendations point to real products and retain requirements", () => {
  for (const task of ["roof", "wet", "tiles", "grout", "other"]) {
    let combinations = [{ task }];
    for (const q of questions(task))
      combinations = combinations.flatMap((a) =>
        q.options.map((o) => ({ ...a, [q.key]: o[0] })),
      );
    for (const a of combinations) {
      for (const id of recommend(a).ids)
        assert.ok(products.some((p) => p.id === id));
      assert.ok(summary(a).length);
    }
  }
});
test("catalogue records have original source, image, category and specifications", () => {
  assert.equal(products.length, 47);
  for (const p of products) {
    assert.ok(p.source.startsWith("https://www.trubuild.in/products/") || (p.tdsVersion && p.source === p.tds) || (p.source === "research/feedback/website-feedback-2.xlsx" && fs.existsSync(new URL("../" + p.source, import.meta.url)) && p.tdsStatus === "replacement-pending"));
    assert.ok(p.category);
    assert.ok(p.fields.length);
    assert.ok(fs.existsSync(new URL("../public" + p.image, import.meta.url)));

  }
});
test("download library contains real PDF files", () => {
  const docs = JSON.parse(
    fs.readFileSync(new URL("../src/resources.json", import.meta.url)),
  );
  assert.equal(docs.length, 43);
  for (const d of docs) {
    assert.ok(d.local);
    const b = fs.readFileSync(new URL("../public" + d.local, import.meta.url));
    assert.equal(b.subarray(0, 5).toString(), "%PDF-");
  }
});
