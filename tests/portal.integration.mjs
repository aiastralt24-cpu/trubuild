import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
);
for (const p of ["202610090001_enquiries.sql", "202610220001_portal.sql"])
  await db.exec(
    fs.readFileSync(
      new URL("../supabase/migrations/" + p, import.meta.url),
      "utf8",
    ),
  );
const org = "11111111-1111-4111-8111-111111111111",
  other = "11111111-1111-4111-8111-111111111112",
  sales = "22222222-2222-4222-8222-222222222222",
  manager = "22222222-2222-4222-8222-222222222223",
  dealer = "22222222-2222-4222-8222-222222222224",
  outsider = "22222222-2222-4222-8222-222222222225";
await db.query(
  `insert into public.portal_organisations(id,name) values($1,'Test'),($2,'Other');`,
  [org, other],
);
for (const u of [sales, manager, dealer, outsider])
  await db.query("insert into auth.users(id)values($1)", [u]);
for (const [o, u, r] of [
  [org, sales, "sales"],
  [org, manager, "manager"],
  [org, dealer, "dealer"],
  [other, outsider, "manager"],
])
  await db.query(
    "insert into public.portal_memberships(org_id,user_id,role,territories)values($1,$2,$3,array['400001'])",
    [o, u, r],
  );
const contact = {
  name: "Sample",
  email: "sample@example.test",
  phone: "",
  pincode: "400001",
  acknowledged: true,
  marketing: false,
};
const call = async (name, args) => {
  let keys = Object.keys(args);
  return (
    await db.query(
      `select public.${name}(${keys.map((k, i) => k + " => $" + (i + 1)).join(",")}) as result`,
      Object.values(args),
    )
  ).rows[0].result;
};
const args = {
  p_org: org,
  p_request: "33333333-3333-4333-8333-333333333333",
  p_fingerprint: "test",
  p_contact: contact,
  p_project: "Project",
  p_estimate: { components: [] },
  p_source: {},
  p_rate: "test",
};
const first = await call("portal_capture", args),
  retry = await call("portal_capture", args);
assert.equal(first.id, retry.id);
await call("portal_capture", {
  ...args,
  p_request: "33333333-3333-4333-8333-333333333334",
});
assert.equal(
  (await db.query("select count(*)::int as n from portal_contacts")).rows[0].n,
  1,
);
assert.equal(
  (await db.query("select count(*)::int as n from portal_projects")).rows[0].n,
  2,
);
await db.exec("set role authenticated");
for (const [u, count] of [
  [sales, 2],
  [manager, 2],
  [dealer, 0],
  [outsider, 0],
]) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [u]);
  assert.equal(
    (await db.query("select count(*)::int as n from portal_leads")).rows[0].n,
    count,
  );
}
await assert.rejects(
  db.exec("update portal_leads set stage='Won'"),
  /permission denied/,
);
await db.exec("reset role");
await assert.rejects(
  call("portal_mutate", {
    p_org: org,
    p_actor: outsider,
    p_lead: first.id,
    p_version: 1,
    p_action: "stage",
    p_data: { stage: "Contacted" },
  }),
  /access_denied/,
);
await call("portal_mutate", {
  p_org: org,
  p_actor: sales,
  p_lead: first.id,
  p_version: 1,
  p_action: "stage",
  p_data: { stage: "Contacted" },
});
await assert.rejects(
  call("portal_mutate", {
    p_org: org,
    p_actor: sales,
    p_lead: first.id,
    p_version: 1,
    p_action: "stage",
    p_data: { stage: "Contacted" },
  }),
  /edit_conflict/,
);
await assert.rejects(
  call("portal_mutate", {
    p_org: org,
    p_actor: sales,
    p_lead: first.id,
    p_version: 2,
    p_action: "stage",
    p_data: { stage: "Won" },
  }),
  /order_evidence_required/,
);
const qa = {
  p_org: org,
  p_actor: sales,
  p_lead: first.id,
  p_version: 2,
  p_snapshot: { needsApproval: true, discountBps: 600, chargesMinor: 0 },
  p_expires: new Date(Date.now() + 86400000).toISOString(),
  p_reason: "Test",
  p_request: "33333333-3333-4333-8333-333333333335",
};
const quote = await call("portal_quote_create", qa);
assert.equal((await call("portal_quote_create", qa)).id, quote.id);
await assert.rejects(
  call("portal_quote_transition", {
    p_org: org,
    p_actor: sales,
    p_quote: quote.id,
    p_version: 1,
    p_action: "approve",
  }),
  /approval_not_permitted/,
);
await call("portal_quote_transition", {
  p_org: org,
  p_actor: manager,
  p_quote: quote.id,
  p_version: 1,
  p_action: "approve",
});
await call("portal_quote_transition", {
  p_org: org,
  p_actor: sales,
  p_quote: quote.id,
  p_version: 2,
  p_action: "issue",
  p_token_hash: "secure-token-hash",
});
await assert.rejects(
  db.query("update portal_quotations set snapshot='{}' where id=$1", [
    quote.id,
  ]),
  /immutable_snapshot/,
);
const jobs = await db.query("select * from public.portal_claim_pdf()");
assert.equal(jobs.rows.length, 1);
await call("portal_mutate", {
  p_org: org,
  p_actor: manager,
  p_lead: first.id,
  p_version: 3,
  p_action: "assign",
  p_data: { ownerId: manager, reason: "Transfer" },
});
await db.exec("set role authenticated");
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [sales]);
assert.equal(
  (await db.query("select count(*)::int as n from portal_leads")).rows[0].n,
  1,
);
await db.exec("reset role");
console.log(
  "PASS: migrations execute; idempotent capture/revisions; separate projects; RLS roles and cross-org isolation; direct-write denial; concurrency; stage evidence; separate approver; immutable snapshots; job claim; reassignment revokes access.",
);
await db.close();
