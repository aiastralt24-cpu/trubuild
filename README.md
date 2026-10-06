# TruBuild — Built for life

A responsive React + Vite website for Astral TruBuild, using the supplied yellow/white logo direction. Includes an official-source catalogue, eight solution landing pages, product detail pages, deterministic Product Advisor, comparison, resources and contextual enquiry drafts.

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

- `src/products.json`: 31 product records, official source URLs, applications, packaging, technical data and verification notes.
- `src/resources.json`: 46 official PDFs, with downloadable local copies.
- `src/advisorRules.mjs`: transparent matching rules and adaptive questions.
- `src/components.jsx`: shared navigation, footer, cards, buttons and banners.
- `src/Home.jsx`, `src/Catalogue.jsx`, `src/Advisor.jsx`, `src/Pages.jsx`: page families.
- `src/styles.css`: brand tokens, responsive layouts and reduced-motion handling.
- `docs/CONTENT-INVENTORY.md`: source-backed content/product inventory.
- `docs/IMPLEMENTATION.md`: sitemap, design system, source caveats and production dependencies.
- `docs/QA.md`: verification and visual review.

## Enquiries

The form prepares an email draft and a downloadable text file. It does **not** send email or claim submission success. Production requires an approved CRM/mail integration and appropriate privacy/retention configuration. Contact details are from the official TruBuild website.

## Deployment

`dist/` is the build output. Configure SPA history fallback to `index.html` for non-asset routes. Set an approved canonical origin, add prerendering/SSR and a sitemap for production search indexing. No deployment or third-party messages were sent during development.

## Content limitations

CPS 111's published product URL redirects to different product content; its authentic PDF remains searchable in Resources. Some official pages use legacy names and conflict with current PDF revisions. These are documented and flagged. Architecture/interior media are generated concepts, not actual company facilities or documented projects. Original product pack shots are from the official website.
