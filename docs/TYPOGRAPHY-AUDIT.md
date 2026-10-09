# TruBuild typography research and small audit

9 October 2026. Scope: CSS plus rendered desktop homepage, catalogue, roof guide and Rooftect Advanced detail at 1280px. This is a representative audit, not an exhaustive accessibility certification. No website typography changed in this audit.

## Recommendation

Use IBM Plex Sans as the single website family: regular 400 for reading, medium 500 for display headings, semibold 600 for product names and controls. Keep the logo and authentic packaging untouched. Self-host WOFF2, retain its OFL licence, use font-display: swap and preload only the critical face. Avoid introducing Plex Mono/Serif simply because they exist.

This is a design recommendation for TruBuild's mix of architectural marketing and technical product selection, not evidence that most premium brands share one font.

## Primary research

- IBM identifies IBM Plex as its corporate typeface, with multiple real weights, UI support and an open licence: https://www.ibm.com/design/language/typography/typeface/ and https://github.com/IBM/plex
- Siemens Element uses Siemens Sans and a controlled hierarchy. Its branded font is explicitly restricted to Siemens applications: https://element.siemens.io/v49/fundamentals/typography/
- SAP Fiori uses 72 with specific attention to legibility, character distinction and hierarchy: https://experience.sap.com/fiori-design-web/typography-horizon/

These examples support a disciplined sans-serif family with defined roles. They do not establish a single universal B2B font. Branded fonts are references, not permission to reuse them.

## Current findings

1. The site mostly already uses one Arial-based family. Computed CSS on the four pages returned Arial, Helvetica Neue, sans-serif; the hero uses Arial, Helvetica, sans-serif. These are fallback stacks, not three simultaneous fonts. No self-hosted @font-face was found in source stylesheets.
2. Weight rules conflict: typography.css intentionally limits Arial headings to 400, but later styles reintroduce 500/600. At 1280px the homepage hero computes to 500, Solutions for every space to 500, and Find the right product section to 400. Arial's installed faces need not provide distinct real intermediate weights; computed weight is not proof of a separate rendered face.
3. Tracking is too tight for broad use: hero -0.065em (~-4.83px at 74.24px); many section headings -0.045em. Product names also inherit compressed heading treatment. This is a significant contributor to the inconsistent visual feel.
4. Labels are undersized: catalogue category labels compute to 10px, hero eyebrow 11px. Important controls are frequently 12–13px. Use 12–13px labels, 14–16px controls and 16–18px main reading text.
5. Hierarchy needs semantic role tokens, not identical h2 sizing everywhere. Current catalogue sidebar heading is 13px, section headings range from 32px to 47.36px, and guide direct-answer text is 20px. Different roles are legitimate; ad hoc selectors obscure the intended system.
6. Yellow #ffca05 on paper #f8f8f4 has approximately 1.44:1 contrast. It looks weak even with a different font. Preserve the requested true yellow by placing yellow text on dark supporting surfaces where appropriate; do not silently replace it with mustard.
7. CSS is layered across styles.css, typography.css, solutions.css and product-hero.css, including later overrides and a hard-coded hero font. Consolidate typography into shared variables and role classes instead of adding another global override block.

## Proposed role scale (starting values, subject to fit checks)

| Role | Desktop | Mobile | Weight | Line height |
|---|---|---|---|---|
| Hero | 64–80px | 40–48px | 500 | 1.05–1.1 |
| Page heading | 48–56px | 34–40px | 500 | 1.1 |
| Section heading | 36–44px | 28–32px | 500 | 1.15 |
| Product/card title | 22–26px | 20–24px | 600 | 1.25 |
| Reading text | 16–18px | 16px | 400 | 1.55–1.7 |
| Controls | 14–16px | 14–16px | 600 | 1.35 |
| Labels | 12–13px | 12px | 600 | 1.4 |

Use approximately -0.02em tracking for large headings, normal tracking for reading and controls, and modest positive tracking only for short uppercase labels. Aim for 55–70 characters in reading columns; use tabular numerals for specification comparisons where available. Keep wrapping responsive rather than forcing all descriptions onto one line.

## Implementation sequence

Load the chosen family and real weights; consolidate font roles; remove conflicting old rules; check hero, catalogue, product specs and solution guide at desktop and mobile sizes. Verify long product names, PDF labels, symbol coverage (±, ≥, °C), 200% zoom, focus states, colour contrast and font-loading layout stability. Change font and hierarchy together; a family swap alone will not resolve the audit findings.

## Implementation

Applied locally after approval: self-hosted IBM Plex Sans 400/500/600 plus regular italic from @fontsource/ibm-plex-sans 5.3.0. OFL retained in public/fonts. typography.css now loads after layout styles and defines shared roles. Removed the previous Arial-only final override section, replaced hard-coded hero family, normalized tight tracking and semibold rules, raised body and control sizes, and checked representative desktop/mobile templates. Brand yellow was preserved; the previously documented yellow-on-light contrast limitation remains. No deployment or Git push performed.
