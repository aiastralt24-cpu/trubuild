import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { blogs } from "../src/blogs.mjs";
import { buildIndex, search, guidance } from "../src/searchEngine.mjs";
const products = JSON.parse(
  fs.readFileSync(new URL("../src/products.json", import.meta.url)),
);
const resources = JSON.parse(
  fs.readFileSync(new URL("../src/resources.json", import.meta.url)),
);
const index = buildIndex({ products, resources, blogs });
test("misspelled product code keeps the numeric variant and ranks the correct product first", () => {
  const r = search(index, "trufx 110");
  assert.equal(r.results[0].product.name.toLowerCase(), "trufix 110");
  assert.ok(r.corrections.some((c) => c.to === "trufix"));
  assert.ok(
    !r.results
      .filter((d) => d.type === "Products")
      .some((d) => !d.title.includes("110")),
  );
});
test("natural roof questions and Hindi/Hinglish phrases retrieve roof information", () => {
  for (const q of [
    "my terrace leaks when it rains",
    "roof ke liye waterproofing",
    "छत से पानी टपक रहा है",
  ]) {
    const r = search(index, q);
    assert.ok(r.results.length, q);
    assert.ok(
      r.results.slice(0, 5).some((d) => /roof|terrace/i.test(d.text)),
      q,
    );
    assert.match(guidance(q, r).question, /roof/i);
  }
});
test("documents and editorial guides are searchable alongside products", () => {
  const r = search(index, "Aqualock tds");
  assert.equal(r.results[0].type, "Documents");
  assert.ok(r.results[0].sheet.local);
  assert.ok(
    search(index, "terrace leak inspection").results.some(
      (r) => r.type === "Guides",
    ),
  );
});
test("coverage answer uses the exact published value, with a product source", () => {
  const r = search(index, "Aqualock coverage"),
    a = guidance("Aqualock coverage", r);
  assert.equal(a.title, "Published coverage");
  assert.equal(
    a.text,
    products.find((p) => p.name.toLowerCase() === "aqualock").coverage,
  );
  assert.ok(a.source.href.startsWith("/products/"));
});
test("blank, unsupported and instruction-like input cannot fabricate an answer", () => {
  for (const q of ["", "zzxxqq987", "<script>alert(987654321)</script>"])
    assert.equal(search(index, q).results.length, 0);
  assert.equal(guidance("zzxxqq987", search(index, "zzxxqq987")), null);
});
test("queries are bounded and search leaves source records unchanged", () => {
  const before = JSON.stringify(products);
  search(index, "roof ".repeat(1000));
  assert.equal(JSON.stringify(products), before);
});

test("product-code documents cannot match an unrelated specification number", () => {
  const r = search(index, "trufx 110");
  const docs = r.results.filter((d) => d.type === "Documents");
  assert.ok(docs.length);
  assert.ok(docs.every((d) => d.title.includes("110")));
});
test("answering a clarification moves on to source guidance", () => {
  const q = "Exposed concrete roof waterproofing";
  const a = guidance(q, search(index, q));
  assert.ok(a.source);
  assert.ok(!a.choices);
});

test("coverage for a longer variant does not use its base product", () => {
  const q = "Aqualock Flexi coverage";
  const a = guidance(q, search(index, q));
  assert.equal(a.source.title, "Aqualock Flexi");
  assert.equal(
    a.text,
    products.find((p) => p.name === "Aqualock Flexi").coverage,
  );
});

test("named-product questions do not return unrelated products for a generic word", () => {
  for (const d of search(index, "Aqualock coverage").results.filter(
    (d) => d.type === "Products" || d.type === "Documents",
  ))
    assert.match(d.title, /aqualock/i);
});
