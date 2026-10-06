# TruBuild website

## Scope and research

TruBuild-only project, confirmed by the user. JAY Chemical, K2 and Konkem are unrelated to this deliverable. TruBuild is an Astral Limited brand according to its official website. Resibond and Bondtite are discovery benchmarks, not TruBuild product divisions.

Research captured 5 October 2026 in `research/*.html`. Content inventory is `src/products.json` and `src/resources.json`, with per-record source URLs. 32 navigation product URLs were inspected; CPS 111 resolves to CFP 525 content and is excluded from detailed catalogue records pending confirmation. Its actual technical document remains in Resources. The download library contains additional document-only products, retained as searchable resources rather than given invented detail pages.

## Sitemap

- `/`: homepage, solutions, Advisor, featured products, company and resources.
- `/about`: verified brand overview and portfolio.
- `/solutions`: eight published application areas.
- `/solutions/:id`: application landing, linked category products and enquiry.
- `/products`: searchable catalogue, URL-persisted category and application filters.
- `/products?category=…`: category landing/filter.
- `/products/:id`: product details, applications, packaging, structured specifications and PDF.
- `/advisor`: adaptive deterministic guided selector.
- `/compare`: up to three products, persisted in session.
- `/resources`: official brochures and technical documents.
- `/contact`: general, product and technical enquiries, preserved Advisor context.
- `/sources`: source and image provenance disclosure.
- Unmatched routes: useful recovery page.

## Design system

Concept: `docs/design-yellow.png` (revised after the supplied logo). Palette: mineral white #f8f8f4, charcoal #19211f, logo yellow #ffca05, border #dcdedb. Arial/Helvetica Neue sans serif: familiar industrial credibility, open readable numeric forms, efficient dense specifications, no external font request. Headings bold with tight tracking; body 16px/1.65; metadata 10–12px uppercase. Squared controls, fine rules, generous editorial gutters, asymmetric architectural composition, varied imagery and restrained hover motion. Native dialog navigation; reduced-motion disables smooth scroll, animation and transforms.

The generated packaging silhouettes in the concept are deliberately replaced by official product photography. The final hero uses the separately generated architectural asset. No AI imagery is represented as a real project, facility or performance evidence.

## Advisor model

Rules are independently readable in `src/advisorRules.mjs`. Only explicit task + context + surface combinations return a shortlist. Roofing rules exclude standing water, heavy traffic and unsupported surfaces. Tiling rules exclude unknown substrate, exposed exterior, and sizes outside the verified 220+ range. Wet-area results require concrete/masonry and a listed use. Grout rules exclude chemical exposure and unknown material. Unsupported cases produce a technical handoff. Every response is a candidate selection, not a prescription; technical documents and enquiry remain available.

## Production dependencies / content gaps

- No CRM/email API credentials or backend supplied. The form validates, prepares a reviewable email draft and offers a text download. It never claims an enquiry was sent. A mail client is required to send the draft.
- Business approval, domain/deployment and current brand asset usage approval remain external dependencies.
- Confirm CPS 111 misdirected page; legacy TA/Trufix, WPL/SBR, Rooftect Pro/Prime, EFX/Trufix and TA660/440 naming; current pack sizes absent from some pages; page/TDS revision discrepancies.
- Rooftect Advanced FAQ conflicts with its structured description and DFT table. FAQ claims are excluded. Use current TDS and technical review for application instructions.
- Catalogue includes published pages with individual source attribution. Resources also includes products only documented in downloadable PDFs. Product availability is not implied by a published document.
- No verified project case studies, facility-specific details, current certification scope, SDS library or careers feed were established for this scoped brand site. No empty pages or invented claims have been introduced.
- Client-rendered route metadata is supplied; production SEO should add SSR/prerendering and a canonical domain once approved.
- Deployment must rewrite non-asset paths to index.html for browser history routes.

## Benchmarks

- https://www.astraladhesives.com/brand/bondtite.html : benefits, material/application routes, clear brand portfolio.
- https://www.astraladhesives.com/resibond-ss-101.html : concise chemistry and applications.
- https://www.astraladhesives.com/catalogue/ : TDS access.
  Adopted lessons: application-led entry, product-code search, readable technical details, contextual enquiry. No competitor visual layout copied.

User supplied a yellow/white TruBuild logo on a photographic background. Image Gen cleaned/recreated the wordmark on charcoal; original input is preserved in research/user-logo-reference.png. Header, menu and footer share the same logo asset. Yellow-on-white concept text was intentionally changed to dark grey for contrast.

The 46 original PDFs total approximately 550 MB and are fetched only when opened; none are eagerly loaded with a page. Resource rows show individual sizes. Consider an approved CDN for production document delivery.
