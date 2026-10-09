# TruBuild — Built for life

A responsive React + Vite website for Astral TruBuild, using the supplied yellow/white logo direction. Includes an official-source catalogue, eight solution landing pages, product detail pages, deterministic Product Advisor, comparison, resources and contextual enquiries and TDS lead capture.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The production preview is running at http://127.0.0.1:4173; the development server is at http://localhost:5173.

```sh
npm run build
npm run preview
npm test
```

## Content and architecture

- `src/products.json`: 40 product records, official source URLs, applications, packaging, technical data and verification notes.
- `src/resources.json`: 50 source PDFs, with downloadable local copies.
- `src/advisorRules.mjs`: transparent matching rules and adaptive questions.
- `src/components.jsx`: shared navigation, footer, cards, buttons and banners.
- `src/Home.jsx`, `src/Catalogue.jsx`, `src/Advisor.jsx`, `src/Pages.jsx`: page families.
- `src/styles.css`: brand tokens, responsive layouts and reduced-motion handling.
- `docs/CONTENT-INVENTORY.md`: source-backed content/product inventory.
- `docs/IMPLEMENTATION.md`: sitemap, design system, source caveats and production dependencies.
- `docs/QA.md`: verification and visual review.

## Enquiries

Product, general and TDS enquiries use a shared Supabase Edge Function. TDS downloads require name, mobile and email before a private signed PDF URL is returned. Database connection/deployment is pending project details; forms show an honest error until configured. See [Supabase setup](docs/SUPABASE-SETUP.md) for migrations, private storage upload, environment values, verification and the static-PDF release caveat.

## Deployment

`npm run build` produces prerendered route HTML, metadata, robots.txt and a sitemap in `dist/`. The approved canonical origin is https://www.trubuild.in (override at build time with VITE_SITE_URL if needed). Serve generated route files before fallback and return a real HTTP 404 using `404.html` for unknown routes. Do not use the prerendered home page as a universal fallback. See [SEO deployment and research notes](docs/SEO-AEO-STRATEGY.md). No live deployment or search-engine submission has been performed.

## TDS update — 9 October 2026

All 23 supplied TDS files are linked to their matching products: 14 existing records updated and nine added. The user confirmed these PDFs as final approved sources. See [the audit report](docs/TDS-AUDIT-2026-10-09.md) for internal observations and the 17 products outside this batch. Review dates identify comparison with supplied files, not manufacturer release dates.

## Content limitations

CPS 111's published product URL redirects to different product content; its authentic PDF remains searchable in Resources. Some official pages use legacy names and conflict with current PDF revisions. These are documented and flagged. Architecture/interior media are generated concepts, not actual company facilities or documented projects. Original product pack shots are from the official website.

## Solution SEO checks

Run `npm run test:seo` to build and check prerendered content, metadata, canonical URLs, visible FAQ/schema consistency, links and sitemap. Eight solution guides include distinct search intent, product selection guidance and 33 source-backed FAQs.
