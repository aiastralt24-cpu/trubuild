# Typography and text-colour audit

Completed 5 October 2026. Scope: home, catalogue, product detail, solution index/detail, About, Advisor, resources, contact, comparison and source credits, plus shared navigation/footer. This audits all eleven page templates, not every individual product record.

## Findings and fixes

| Finding | Impact | Resolution |
| --- | --- | --- |
| Heading fragments used black, muted grey and yellow together | Weak hierarchy; words appeared to have different importance without a reason | Main heading words now share the ink colour; one accent treatment per heading. “performance” now matches “Small details”. |
| Bright brand yellow on pale paper had 1.33:1 contrast | Large accent words were hard to read | Bright yellow retained on dark surfaces; deeper yellow-gold `#957000` used for large text on light surfaces. No highlight backgrounds. |
| Display sizes varied without clear roles | Application heading overwhelmed adjacent product section | Shared page, section and card heading scales; consistent weight, line height and tracking. Hero remains deliberately larger. |
| Labels and metadata often 8–10px | Reading effort increased on mobile | Content labels now 11px; metadata/breadcrumbs 12px; controls 13px; summaries 14px; body copy 15–16px. |
| Search/form fields were as small as 12–14px | Difficult reading and potential mobile browser input zoom | Inputs and selects now 16px. |
| Product descriptions/actions crowded two-column phone cards | Unnecessary wrapping and density | Single-column catalogue at phone widths, larger descriptions, categories and actions. |
| Faint product-brand labels, image notes and search hints | Several solid-background contrast failures | Shared secondary ink token `#596151`. |
| Oversized/cropped decorative document art conflicted with larger mobile copy | Reduced room for useful text | Decorative document illustration removed at phone widths. Resource link and text retained. |
| Text overlays rely on scene brightness | Variable contrast | Application-image lower gradients strengthened; image headings remain white and captions fully opaque. |

## Text system

- Main ink: `#19211f`; secondary ink: `#596151`.
- Dark surfaces: warm white `#f8f7ee`; secondary `#c4ccbc`.
- Brand yellow on dark: `#ffca05`.
- Large accent text on pale surfaces: `#957000` (yellow-gold).
- Page headings: 40–68px; major section headings: 34–56px; card headings: 22–28px. Smaller functional headings retain their own appropriate roles.
- Display tracking: −0.045em; card tracking: −0.025em; body line height: 1.65.
- Implementation lives in `src/typography.css`, loaded after layout CSS so typography decisions can be maintained together.

## Evidence

- Inspected computed heading/label styles for all eleven templates before edits (`typography-before.json`).
- Reflow checks at 1440px, 390px and 320px across all eleven templates: no page-level horizontal overflow. `typography-after.json` records these 33 checks. Comparison content retains its intentional horizontal scroll region.
- Final solid-background contrast sample: **626 rendered text leaves, zero failures** against 4.5:1 normal / 3:1 large-text thresholds (`contrast-audit.json`). Captured computed styles in `text-colors.json`; reproducible calculation in `research/audit-contrast.mjs`.
- Large accent contrast on paper `#efefe8`: improved from **1.33:1** to **3.96:1**. This token is for large headings, not small body copy.
- Visually inspected home headings/cards, Advisor questions, mobile comparison, resources, contact and fullscreen navigation; reviewed application image tiles during the preceding image pass.
- Advisor roof → exposed → screed shortlist completed; comparison selection/removal and resources search checked. Form field computed size confirmed at 16px. Menu opens and Escape closes it.
- Production build passes. Existing nine tests pass after the typography implementation; final label-colour adjustment also builds successfully.

Screenshots: `typography-home-desktop.jpg`, `typography-resources-mobile.jpg`.

## Limits

The computed contrast check excludes gradients, images, opacity and hidden content; those require visual assessment and are not covered by its zero-failure result. Decorative document mockup text is artwork, not required reading. This is a typography/colour audit and targeted interaction check, not a complete WCAG certification, screen-reader audit or real-device lab test. The existing publication/content dependencies are unchanged.

### Subsequent brand-colour correction

The user rejected the deeper yellow-gold shown in the audit screenshots. Headline accents on light surfaces now use the requested original brand yellow `#ffca05`. The earlier zero-failure contrast result is historical and no longer applies to these accents; the light-background yellow contrast limitation remains. Dark focus outlines are retained for keyboard visibility. Other typography corrections remain in place.

### Font-family consistency correction
Removed all explicit monospace styles from homepage labels, image captions, document artwork, search hints and catalogue counts. The site now uses the shared Arial sans-serif stack, including form controls and enquiry previews. Display and card headings use regular weight consistently; labels and primary controls use bold. Brand artwork remains an image.
