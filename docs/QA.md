# TruBuild verification — 5 October 2026

## Build and data

- Production build passes (`npm run build`).
- All nine Node tests pass (`npm test`), covering Advisor matching/exclusions and branch combinations, catalogue asset references and the 46 PDF file signatures.
- 31 sourced product records; CPS 111 excluded because its source URL redirects to another product. Its published document remains available in Resources.
- No external message was sent and no public deployment was performed.

## Browser checks

Tested the development app and finished with the production build served at `http://127.0.0.1:4173`.

- Desktop homepage inspected at 1280 × 720 and 1440 × 900; mobile at 390 × 844. Homepage overflow checks also passed at widths 320 and 768.
- Fullscreen navigation, menu search, empty search state and Escape focus return checked.
- Product search for Aqualock returns two records; category filtering, URL state and reset inspected.
- Two products added to comparison, compared and cleared.
- Aqualock Flexi specifications expanded on mobile; table and page fit the 390px viewport.
- Advisor roof → exposed → screed gives the expected shortlist with reasons and limitations. Context and answers reach the enquiry form.
- A fictional enquiry was prepared and visibly labelled NOT SENT. Product and requirement context were present in the draft. No email was sent.
- Resources search for Aqualock returns two documents; PDF size labels render correctly.
- Production preview loaded without a new captured runtime warning/error. One earlier development hot-reload error occurred during stylesheet formatting; the subsequent build and rendered production view passed.
- Viewport override reset after testing. Desktop and mobile screenshots saved alongside this report.

## Visual comparison

Compared `design-yellow.png` with the implemented desktop screenshot and inspected the mobile screenshot.

| Element | Implemented result |
| --- | --- |
| Identity | Yellow TRU / white BUILD wordmark on charcoal, recreated cleanly from the supplied raster reference. Original reference retained. |
| Hero | Large editorial headline, yellow emphasis, split architecture composition, clear primary/secondary actions. |
| Palette | Yellow accents and Advisor band, charcoal navigation/footer, mineral white reading surfaces. |
| Solutions | Asymmetric roof/tiling/wet-area grid with application-led navigation. |
| Products | Authentic published pack shots replace the concept's placeholder silhouettes. |
| Mobile | Stacked hero, compact menu, readable heading and paired actions without horizontal overflow. |

Intentional differences from the concept: a separately generated terracotta courtyard provides the hero photograph; dark secondary heading text improves contrast over yellow text on white; the hero has more breathing room; verified company and technical-resource sections expand the initial concept. Main hero copy and its two actions follow the concept. Generated architecture is labelled illustrative, not evidence of completed projects.

## Remaining production dependencies

The enquiry flow prepares drafts only. Live CRM/mail delivery, privacy approval, final brand artwork, source-conflict review, hosting, canonical domain, server-rendering/prerendering and production indexing remain integration/content tasks. Official PDF copies total roughly 550MB and should be served through appropriate static storage/CDN. See `IMPLEMENTATION.md` and `CONTENT-INVENTORY.md` for detail. Browser checks are targeted functional and visual checks, not a comprehensive accessibility certification or real-device laboratory test.

## Redesign following user feedback — 5 October 2026

The user rejected the original composition. The earlier concept comparison above is historical and superseded for the homepage.

New direction: “Great spaces. Start beneath.” A full-width architectural scene with manually selectable roof, tiling and exterior applications; a yellow typographic application index; an oversized authentic-packaging showcase; an image-led Advisor section; concise technical and brand links. This replaces the split hero and repeated bento/card section pattern. Logo and TruBuild yellow retained. Existing catalogue, comparison, resources and enquiry functionality retained.

Verified the production rendering at 1440 × 1000 and 390 × 844. Inspected hero, application index and product showcase. Scene selection updated its heading and destination; mobile exterior-scene link opened the correct solution page with product recommendations. Mobile document width equals viewport width. Generated architectural imagery remains labelled. Build and all nine existing tests pass after the redesign. Screenshots: `redesign-desktop.jpg`, `redesign-mobile.jpg`. The earlier `design-yellow.png` and `desktop-home.jpg` represent the rejected direction.
