import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  measure,
  calculate,
  selectPacks,
  minor,
  priceEstimate,
  validateRule,
  validateReferences,
  validateStage,
  normalizeContact,
} from "../supabase/functions/_shared/portal-engine.mjs";
import { demoRules, defaultInput, demoPrices } from "../src/portal/demo.mjs";
import { quotePdf } from "../supabase/functions/_shared/portal-pdf.mjs";
import { createPortalHandler } from "../supabase/functions/_shared/portal-handler.mjs";
const input = defaultInput();
test("imperial and metric measurements agree; impossible deductions fail", () => {
  const a = measure([{ mode: "direct", area: 100, excluded: 5 }], "m"),
    b = measure(
      [
        {
          mode: "dimensions",
          length: 10 / 0.3048,
          width: 10 / 0.3048,
          excluded: 5 / 0.09290304,
        },
      ],
      "ft",
    );
  assert.ok(Math.abs(a.areaM2 - b.areaM2) < 1e-9);
  assert.throws(() => measure([{ mode: "direct", area: 10, excluded: 11 }]));
  assert.throws(() => measure([{ mode: "dimensions", length: -1, width: 3 }]));
  assert.throws(() => measure([{ mode: "direct", area: 1 }], "unknown"));
});
test("PRD worked example yields 40 L theoretical, 44 adjusted, 60 purchased", () => {
  const result = calculate(
    demoRules.find((r) => r.id === "demo-paint"),
    { ...input, waste: 10 },
  );
  const p = result.components.find((c) => c.id === "paint");
  assert.equal(p.theoretical, 40);
  assert.equal(p.adjusted, 44);
  assert.equal(p.purchase.purchased, 60);
  assert.equal(p.purchase.surplus, 16);
});
test("whole-system coverage never counts coats twice", () => {
  const r = calculate(
    demoRules.find((r) => r.id === "demo-waterproofing"),
    { ...input, waste: 0 },
  );
  assert.equal(r.components.find((c) => c.id === "coat").theoretical, 120);
});
test("all seven calculator templates work and outside-range thickness requires review", () => {
  assert.equal(demoRules.length, 7);
  for (const r of demoRules)
    assert.ok(calculate(r, input).components.every((c) => c.adjusted > 0));
  assert.throws(() =>
    calculate(
      demoRules.find((r) => r.id === "demo-repair"),
      { ...input, thickness: 100 },
    ),
  );
});
test("pack objectives choose actual eligible whole combinations", () => {
  const packs = [
    { id: "big", size: 20, priceMinor: 100 },
    { id: "small", size: 5, priceMinor: 40 },
  ];
  assert.equal(selectPacks(44, packs, "surplus").purchased, 45);
  assert.equal(
    selectPacks(44, packs, "packs").packs.reduce((n, p) => n + p.count, 0),
    3,
  );
  assert.equal(selectPacks(44, packs, "cost").purchased, 45);
  assert.throws(() => selectPacks(10, [{ id: "x", size: 20 }], "cost"));
  assert.equal(selectPacks(2.3, [{ id: "kit", size: 5 }]).packs[0].count, 1);
});
test("minor unit rounding avoids binary float errors and missing prices cannot issue", () => {
  assert.equal(minor("0.29"), 29);
  assert.equal(minor("10.1"), 1010);
  assert.throws(() => minor("1.005"));
  const e = calculate(demoRules[0], input);
  const q = priceEstimate(e, demoPrices, {
    discountBps: 501,
    territory: "400001",
  });
  assert.equal(q.needsApproval, true);
  assert.ok(Number.isSafeInteger(q.totalMinor));
  assert.throws(() => priceEstimate(e, null));
  assert.throws(() => priceEstimate(e, { ...demoPrices, items: {} }));
  assert.throws(() => priceEstimate(e, demoPrices, { discountBps: 5000 }));
});
test("rule publication requires provenance and passing reference examples, never executable code", () => {
  assert.throws(() => validateRule(demoRules[0], { publish: true }));
  assert.throws(() =>
    validateRule({
      ...demoRules[0],
      components: [{ ...demoRules[0].components[0], method: "eval" }],
    }),
  );
  const r = {
    ...demoRules[0],
    owner: "technical-owner",
    effectiveDate: "2026-10-22",
    referenceTests: [{ input, expected: 400 }],
  };
  assert.equal(validateReferences(r), true);
  assert.throws(() =>
    validateReferences({ ...r, referenceTests: [{ input, expected: 999 }] }),
  );
});
test("saved calculation snapshots do not mutate with rule or input edits", () => {
  const r = structuredClone(demoRules[0]),
    i = defaultInput(),
    e = calculate(r, i);
  r.components[0].rate = 999;
  i.zones[0].area = 1;
  assert.equal(e.ruleSnapshot.components[0].rate, 4);
  assert.equal(e.inputs.zones[0].area, 100);
});
test("lead stages require evidence and next action", () => {
  assert.throws(() => validateStage("Won", {}));
  assert.throws(() => validateStage("Lost", {}));
  assert.throws(() => validateStage("Negotiation", {}, false));
  assert.throws(() =>
    validateStage("Qualified", { need: "Tiles", timeline: "This month" }),
  );
  assert.equal(
    validateStage("Won", { orderValue: "25000", orderReference: "PO-123" }),
    true,
  );
});
test("contact matching is normalised and marketing remains optional", () => {
  const c = normalizeContact({
    name: " Example ",
    email: "USER@Example.com",
    phone: "+91 98765 43210",
    pincode: "400001",
    customerType: "Homeowner",
    preferred: "Email",
    acknowledged: true,
  });
  assert.equal(c.email, "user@example.com");
  assert.equal(c.phone, "+919876543210");
  assert.equal(c.marketing, false);
});
test("PDF contains selectable text, valid xref and multiple page headers", () => {
  const estimate = calculate(demoRules[0], input);
  const bytes = quotePdf({
      number: "TEST-001",
      revision: 2,
      estimate,
      demo: true,
      terms: "Long terms ".repeat(2000),
    }),
    s = new TextDecoder().decode(bytes);
  assert.ok(s.startsWith("%PDF-1.4"));
  assert.ok(s.includes("/Logo Do"));
  assert.ok(s.includes("Page 2 of"));
  const start = Number(s.match(/startxref\n(\d+)/)[1]);
  assert.equal(s.slice(start, start + 4), "xref");
  assert.throws(() => quotePdf({ estimate, project: "项目" }), /Latin/);
});
const environment = (k) =>
  ({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "server-only",
    PORTAL_ORG_ID: "11111111-1111-4111-8111-111111111111",
    ALLOWED_ORIGINS: "http://localhost:5173",
    RATE_LIMIT_SALT: "salt",
  })[k];
const req = (b, origin = "http://localhost:5173") =>
  new Request("http://edge/portal", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });
test("server rejects forbidden origins, unauthenticated staff access and unconfigured backend", async () => {
  let calls = 0;
  const h = createPortalHandler(environment, async () => {
    calls++;
    return Response.json({}, { status: 401 });
  });
  assert.equal(
    (await h(req({ action: "workspace" }, "https://bad.example"))).status,
    403,
  );
  assert.equal(calls, 0);
  assert.equal(
    (await h(req({ action: "workspace", role: "admin" }))).status,
    401,
  );
  assert.equal(
    (await createPortalHandler(() => null)(req({ action: "catalogue" })))
      .status,
    503,
  );
});
test("authoritative server ignores forged estimate quantities on capture", async () => {
  let captured;
  const rule = { ...demoRules[0], status: "published" };
  const h = createPortalHandler(environment, async (url, options) => {
    if (url.includes("portal_rules"))
      return Response.json([{ definition: rule }]);
    if (url.includes("portal_capture")) {
      captured = JSON.parse(options.body);
      return Response.json({ id: "lead" });
    }
    throw new Error("unexpected call");
  });
  const r = await h(
    req({
      action: "capture",
      ruleId: "22222222-2222-4222-8222-222222222222",
      requestId: "33333333-3333-4333-8333-333333333333",
      project: "Project",
      input,
      estimate: { quantity: 1 },
      contact: {
        name: "Sample",
        email: "a@example.test",
        pincode: "400001",
        customerType: "Homeowner",
        preferred: "Email",
        acknowledged: true,
      },
    }),
  );
  assert.equal(r.status, 200);
  assert.equal(captured.p_estimate.components[0].theoretical, 400);
});
test("MFA and membership checks precede staff mutations", async () => {
  let mutations = 0;
  const token =
    "Bearer x." +
    Buffer.from(JSON.stringify({ aal: "aal1" })).toString("base64url") +
    ".x";
  const h = createPortalHandler(environment, async (url) => {
    if (url.includes("/auth/v1/user")) return Response.json({ id: "u" });
    if (url.includes("portal_memberships"))
      return Response.json([{ role: "admin" }]);
    mutations++;
    return Response.json({});
  });
  const r = req({ action: "mutate", leadId: "fake" });
  r.headers.set("authorization", token);
  assert.equal((await h(r)).status, 403);
  assert.equal(mutations, 0);
});
test("migration keeps client writes private and guards cross-org links and immutable snapshots", () => {
  const sql = fs.readFileSync(
    new URL("../supabase/migrations/202610220001_portal.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /revoke all on public.portal_%I from anon,authenticated/);
  assert.match(
    sql,
    /foreign key\(org_id,lead_id\) references public.portal_leads\(org_id,id\)/,
  );
  assert.match(sql, /q.created_by=p_actor/);
  assert.match(sql, /immutable_snapshot/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /l.version<>p_version/);
});
