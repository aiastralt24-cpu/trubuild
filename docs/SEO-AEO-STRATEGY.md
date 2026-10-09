# TruBuild solution-page SEO and answer content

Prepared 9 October 2026. Approved production origin: https://www.trubuild.in.

## Scope and evidence

Implemented content and technical improvements for eight existing solution URLs. Research combined public search-result sampling, manufacturer application/selection pages, Google Search Central guidance, and the site's product data. The 23 user-supplied final TDS PDFs remain the approved source for covered products. Existing official product documents remain the source for products outside that batch. Competitor material informs search-intent analysis only; competitor product performance is not transferred to TruBuild products.

This is qualitative keyword and intent research, not a keyword-volume study. No Search Console, Keyword Planner, paid keyword database, conversion analytics or ranking history was supplied. Search results vary by time, location and personalisation. No search-volume, keyword-difficulty or ranking-speed numbers have been invented.

## Keyword and intent map

| Existing page | Primary topic | Supporting search intents | Distinct question answered | Suggested initial measurement priority |
|---|---|---|---|---|
| /solutions/roof | Roof and terrace waterproofing | Roof leakage solution; terrace coating; waterproofing cost; exposed vs protected roof | How do exposure, substrate, traffic and drainage change selection? | First: directly matches the user's example and a broad application journey |
| /solutions/wet | Bathroom waterproofing | Bathroom leakage; waterproofing under tiles; wet-area coating | Is the problem plumbing, joints or the waterproofing layer? | First: clear problem-to-product journey |
| /solutions/tiling | Tile adhesive and grout | Vitrified tile adhesive; epoxy grout; adhesive vs cement | How do tile, substrate and exposure change selection? | First: supports product selection and wet-area cross-links |
| /solutions/exterior | Exterior wall waterproofing | Wall seepage; plaster crack filler; water repellent | Does the wall need defect repair, a coating or a repellent? | Next |
| /solutions/repair | Concrete repair materials | SBR latex; bonding agent; non-shrink grout; plaster bonding | Which material performs which repair role? | Next |
| /solutions/basement | Basement waterproofing | Foundation; retaining wall; negative-side coating; sheet membrane | Which side is accessible and which way does pressure act? | Specialist/specifier intent |
| /solutions/tanks | Water tank and pool waterproofing | Concrete tank leakage; immersion; curing before filling | Is the system documented for the intended water use? | Specialist/specifier intent |
| /solutions/sealants | Joint and expansion-joint sealant | MS polymer; construction joints; sealant vs crack filler | Is the gap a movement joint or a static plaster crack? | Specialist/specifier intent |

Priorities above are editorial hypotheses, not measured demand rankings. Product pages own branded product/code searches; solution pages own application selection. Keep bathroom waterproofing distinct from tile installation, and roof waterproofing distinct from exterior wall seepage. No duplicate city pages or keyword-stuffed variants were created.

## Research observations and sources

- [Nerolac's terrace guide](https://www.nerolac.com/wall-paint/terrace-waterproofing-guide) shows a public search journey that combines methods, chemicals and costs. Our roof page answers these through project variables and TruBuild-specific TDS quantities rather than unsupported fixed prices.
- [Asian Paints' bathroom guide](https://www.asianpaints.com/content/ap/en/home/blogs/waterproofing-bathrooms-guide.html) addresses below-finish waterproofing and junctions. The wet-area page separates plumbing diagnosis from the coating system.
- [Weber's tile selector](https://www.in.weber/tile-adhesive-product-selector-tool) demonstrates selection-led intent. The tiling guide records tile, substrate and exposure before product choice.
- [Sika's tile-system overview](https://ind.sika.com/en/construction/tile-installationsystems.html) distinguishes preparation, waterproofing, adhesive, grout and sealant. Our page explains these roles without recommending competing products.
- [TruBuild's published waterproofing brochure](https://www.trubuild.in/wp-content/uploads/2023/10/TRUBUILD-WATERPROOFING-A4-BROCHURE.pdf) identifies exterior wall coatings and crack-filling families; final supplied sheets take precedence for covered products.
- [Sika's concrete repair overview](https://ind.sika.com/en/construction/concrete-repair.html) organises the subject by defects and repair tasks. Our repair page distinguishes mortar modification, bonding and baseplate grouting.
- [Sika's basement guidance](https://ind.sika.com/dam/dms/corporate/g/glo-watertight-basement-below-grade-waterproofing.pdf) distinguishes pressure side and system continuity. The basement guide connects those questions to the appropriate TruBuild documents.
- [Sika's tank coating page](https://ind.sika.com/en/construction/waterproofing-systems/waterproofing-mortar/sikatop-107-sealplusin.html) illustrates water-use-specific documentation. TruBuild water-contact statements come only from its own TDS; no blanket drinking-water claim was added.
- [Sika's joint sealing overview](https://ind.sika.com/en/construction/joint-sealing.html) supports joint/substrate selection intent. Our sealant guide uses Sealmaster Flexi's own values and distinguishes movement accommodation from elongation at break.

## SEO and AEO approach

Each page has an explicit application H1, a direct opening answer, original selection guidance, preparation considerations, relevant product links, four or five distinct FAQs, linked technical PDFs and three related solution pages. All FAQ answers exist in the initial HTML even when their accessible disclosure is collapsed. Concrete quantities are product-specific, not generic application recipes. There are 33 unique FAQ questions across the eight guides.

[Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) favours helpful content and sound crawlability; it does not establish a special keyword formula that guarantees citations. No AI visibility, featured snippet or ranking guarantee is made. AEO here means clear, contextual answers with accessible source documents.

[Google's JavaScript guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) informs the build-time HTML rendering, unique titles/descriptions and normal crawlable links. The build generates 55 indexable route documents plus utility/error documents; solution content is available without client-side JavaScript. The interactive app hydrates matching routes, while filtered catalogue URLs render their query-specific state without a hydration mismatch.

Each solution has WebPage, BreadcrumbList and FAQPage JSON-LD. FAQ markup is generated from the same content as the visible FAQ. There are no fabricated reviews, prices, certifications, authors or expert-review claims. [Google restricts FAQ rich results mainly to authoritative government and health sites](https://developers.google.com/search/blog/2023/08/howto-faq-changes); TruBuild should not expect FAQ rich-result eligibility. Markup describes the content; it is not a ranking promise.

[Canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) informs consistent absolute URLs at the approved domain. Each route has a canonical, Open Graph and Twitter metadata; parameterised catalogue variants use the clean catalogue canonical. Utility and unknown routes receive noindex. No obsolete meta-keywords tag or speculative llms.txt ranking mechanism was added.

## Verification and deployment

- `npm run test:seo`: builds and verifies all eight guides in generated HTML, one H1, unique metadata, canonical tags, visible/structured FAQ equality, linked files and product pages, sitemap count and noindex error page.
- `npm test`: data, advisor and SEO content consistency checks.
- Browser checks cover desktop/mobile layout, FAQ opening, related-page navigation, metadata updates, and representative filtered catalogue navigation after prerendering.
- Build output contains `robots.txt`, `sitemap.xml`, route HTML and `404.html`. Sitemap URLs omit query parameters and use the approved origin. No artificial change frequency, priority or daily last-modified dates are emitted.
- Serve each route's generated HTML before a fallback. Configure the production server to return a real HTTP 404 with `404.html` for unknown routes; do not return the home page for every missing URL. Nginx example: `try_files $uri/index.html $uri =404;` with `error_page 404 /404.html;`. Keep assets and PDF paths accessible. `200.html` is a neutral SPA shell for hosts needing a separate fallback; do not apply it to all unknown URLs in production.
- Preserve existing public URLs and audit legacy redirects before replacing the live website. Review the current site's URL inventory, traffic and incoming links before any migration. This work does not replace the live WordPress deployment or install redirects on the server.
- Restrict staging access or use host-level noindex for a public preview. Production canonicals alone do not make a public staging host private.

## After launch

1. Deploy the verified build at the approved domain with the correct route/status handling.
2. Verify ownership in Google Search Console and Bing Webmaster Tools; submit the sitemap and inspect the eight solution URLs. These actions have not been performed by this task.
3. Record a baseline of impressions, clicks, CTR, average position, indexed URLs and product/technical-enquiry conversions. Segment by solution page and query intent, branded versus non-branded.
4. Review crawl/indexing problems after launch; compare performance over subsequent 28-day windows rather than promising a date for rankings. Expand FAQs only where real queries reveal unmet questions.
5. Add genuine project case studies, application photographs, technical reviewer credentials and test/certification documents when available and approved. Do not fabricate authority signals.

All changes are local until deployed. Search indexing and rankings have not been verified, and no claim is made that the pages rank faster or have appeared in AI answers.
