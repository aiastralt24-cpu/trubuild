# TruBuild portal pilot

## Review locally

Run `npm install` and `npm run dev`. Open `/calculator` for all seven application templates, or `/workspace` → **Explore sample workspace** for the sales workflow. Demonstration data and prices are illustrative, not approved TruBuild specifications or commercial offers. The sample workspace uses local browser storage; sample customer submissions are not sent or saved as real enquiries.

Implemented categories: tile adhesive, grout, primer/paint, waterproofing, sealant, repair mortar and multi-product systems. Measurement supports multiple zones, exclusions and metric/imperial conversion. Results show theoretical consumption, wastage, whole-pack purchase and surplus. Coverage rules distinguish per-coat from whole-system values.

The workspace includes assignment, stage evidence, follow-up tasks, manual activity, pipeline totals, frozen quote revisions, discount approval by a different user, issue/withdraw actions, private PDF jobs and scoped customer links. Customer acceptance records purchase intent, not payment or an order.

## Configure later

1. Create a Supabase project. Apply migrations in timestamp order, including the existing enquiries migration (the portal shares its rate-limit table). Do not expose the service-role key to Vite.
2. Create one organisation in `portal_organisations`, provision Supabase Auth users, then create active `portal_memberships`. Each membership is organisation scoped. Staff roles supported by this pilot are `admin`, `manager`, `sales`, `product_admin`, `pricing_admin`. Dealer and marketing customer access remains disabled. Set sales territory pincodes, or `*` for all territory coverage. Bootstrap membership through trusted database administration only.
3. Enrol staff TOTP factors through your organisation's Auth provisioning process. The workspace supports existing factors; mutations require an authenticated AAL2 session. Sessions are kept in memory and require sign-in again after a reload.
4. Set browser configuration using `.env.example`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Set Edge Function secrets: `PORTAL_ORG_ID`, `ALLOWED_ORIGINS` (comma-separated exact frontend origins), `RATE_LIMIT_SALT`, and a strong independent `PORTAL_WORKER_SECRET`. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in hosted functions. Keep worker and service keys server-only.
6. Deploy `portal` and `portal-worker`. Their gateway JWT checks are disabled in config because the handlers enforce their own public/staff/worker authentication. Do not remove these handler guards.
7. Schedule an authenticated POST to `portal-worker` using `Authorization: Bearer <PORTAL_WORKER_SECRET>` from a trusted scheduler. It claims up to three jobs per invocation, writes only to the private `portal-documents` bucket and checks existing file hashes on retries. Configure monitoring for failed jobs. There is no browser worker trigger.
8. In Administration, save technical rule and price-list versions as drafts. Use `src/portal/demo.mjs` for schema examples only. Replace every illustrative value with approved product-specific coverage, pack SKUs, source revision, technical owner, effective date, reference examples, territory, validity, legal seller, tax, minimum price and approval limit. Publication requires provenance/reference checks; pricing requires finance approval and terms. Published versions are appended, not overwritten. Ensure exactly one eligible price list applies to a customer's territory.
9. Test on staging with real Supabase Auth, MFA, Storage and scheduled execution before launch. Verify signed download expiry, organisation isolation, reassignment, failed-job recovery and two-user approvals. No live Supabase project has been configured or deployed by this change.

## Scope and remaining PRD work

This is a working pilot foundation, not completion of every phase of the PRD. Configuration alone does not enable the following: email/WhatsApp delivery, customer OTP verification, staff self-service MFA enrolment, business-calendar SLA escalation, dealer accounts, ERP/payment integrations, multilingual PDF fonts, retention/deletion automation, bulk exports or advanced reporting. Customer links are bearer credentials and should be shared only with the intended recipient. Callback/revision requests are recorded once per revision/action. Qualification creates a follow-up task; unassigned leads remain visible as exceptions.

The PDF renderer currently supports Latin text and INR rendered as `INR`; unsupported scripts fail explicitly instead of producing unreadable documents. Estimates remain indicative. Production terms, privacy wording, technical rates and commercial settings require business approval.

## Verification

- `npm test`: engine, server boundary, PDF, existing site and visualizer checks.
- `npm run test:portal-db`: real isolated PostgreSQL execution via PGlite, with Auth/Storage schema stubs; exercises migrations, RLS, cross-organisation isolation, immutable snapshots, idempotent capture/revisions, concurrency, approval and reassignment. This does not replace hosted Auth/Storage integration testing.
- `npm run build`: Vite production bundle and static prerender.

Browser QA covers the worked 100 m² paint example, sample approval/issue flow, desktop and mobile layouts. The sample fixture produces 40 L theoretical, 44 L with 10% wastage, and 60 L purchased in three 20 L packs when only those packs are available.
