# Enquiry backend — pending Supabase project connection

Implemented: three-field TDS popup, shared enquiry submission endpoint, general/product contact forms, validation, restricted database tables, atomic request deduplication and rate limiting, private PDF storage and two-minute signed download URLs. No enquiries have been sent to a real database yet. No secrets are committed. Browser submission does not claim success when configuration is missing.

## Deployment steps

1. Provide the Supabase project URL and publishable key. Put these in a local `.env` using `.env.example`. Both are browser-safe; never put the service-role key into Vite variables.
2. Run `supabase link --project-ref YOUR_PROJECT_REF`, then `supabase db push` to apply the migration. No local Supabase CLI/database was available during implementation; SQL execution remains to be verified on the project.
3. Set function secrets `ALLOWED_ORIGINS` (exact comma-separated production origins and localhost origins if testing) and a random `RATE_LIMIT_SALT`. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted functions. Keep service keys in secret management only.
4. Run `node scripts/upload-tds.mjs` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` provided securely in the process environment. This uploads the approved/current document registry to the private `tds` bucket; it does not rewrite PDFs.
5. Deploy `supabase functions deploy enquiries`. The function is intentionally anonymous (`verify_jwt=false`) for public website visitors. It exposes no enquiry-reading operation; it validates input and allowed origins, rate-limits writes, and uses server-only credentials. Origin checks are not authentication or bot protection. For production abuse beyond per-IP rate limiting, add Turnstile/WAF protection; confirm platform-forwarded IP behaviour during deployment.
6. Set frontend environment values on the website host and rebuild. Verify one synthetic enquiry is stored, then verify its private signed download. Check RLS denies anon/authenticated reads/writes; test rate limits and retry deduplication against the deployed database.

## Access and operation

Authorised team members can view `public.enquiries` in the Supabase dashboard. Columns include enquiry kind, name, email, mobile, product name, status and creation time. `payload` contains message, company, city, requirements, topic and requested document. Status accepts new/contacted/closed. No public admin screen or email notification service is implemented. Agree retention and team access before going live.

All in-site TDS controls (product pages, comparison, solution guides and resources) open the form. Product enquiries and general enquiries share the backend. Invalid entries, failed saves and missing configuration do not unlock downloads. Request IDs prevent duplicates on a retry of the same submission. No PII is placed in browser storage or logs. IP hashes are kept only in the short-lived rate-limit table, cleaned on new submissions.

## Important release distinction

The existing static PDFs under `public/documents` are retained for the current local site and approved-document tests. While those copies are deployed, anyone who knows a direct URL can bypass the form. After private storage is verified, exclude `dist/documents/` from production publishing if a strictly enforced download gate is required. Existing public links and indexing will then stop serving those files; align this with SEO requirements. The gated frontend uses signed storage URLs, not static PDF URLs, after successful submission.

Local checks cover real Edge Function handler code with mocked Supabase REST/storage responses, validation, registry integrity, frontend build, and browser modal/error behaviour. They do not claim a live database migration or delivery verification.
