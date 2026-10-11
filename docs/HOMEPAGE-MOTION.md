# Homepage motion plan and implementation

Scope: refine existing homepage motion without redesigning layouts, changing content, or replacing the separate /experience prototype. All selectors are scoped to `.new-home`.

## Choreography

- Hero: 850ms background crossfade, subtle 2.5% settling scale over 1500ms; authentic pack shot moves 24px and scales 2.5% over 950ms. Heading lines settle over 780ms with an 80ms offset. Description and actions follow at 140ms and 210ms. Existing three selectors remain, with a visible pause/play button. Autoplay interval remains six seconds and pauses while hovered, focused, offscreen, page-hidden, manually paused or under reduced-motion preferences. Manual scene selection and horizontal touch swipes remain available.
- Applications: section introduction and tiles reveal once as they enter view; tile staggering is capped at 195ms. Desktop hover gently scales the image and moves the directional arrow.
- Product lineup: three once-only staggered reveals, then a restrained pack lift on hover. Copy remains stationary.
- Advisor: heading, supporting copy and CTA reveal in sequence. Only its image gets a desktop parallax offset capped at 16px with 6% overscan. Mobile disables parallax.
- Guides: reveal the existing promo as a single block, with a small arrow response.
- Resources/About: stagger the existing panels, retain a restrained document-stack hover, and keep destinations immediately usable.
- Shared footer is unchanged; the homepage's Advisor section is the existing main enquiry/selection CTA.

## Motion system

Native CSS and Web Animations API. Easing: cubic-bezier(.22,1,.36,1). Micro: 220ms; reveal: 680ms desktop/440ms mobile; cinematic hero: 780–1500ms. Reveal travel: 22px desktop/12px mobile. Stagger: 65ms desktop/35ms mobile, max three steps. No scroll hijacking or persistent will-change. IntersectionObserver unobserves revealed elements. Parallax reads/writes are batched in requestAnimationFrame and run only when visible.

Content is visible before JavaScript, when animation APIs are unavailable, and after cancellation. Focus finishes a pending reveal immediately. Reduced motion cancels active Web Animations, stops autoplay, removes parallax and decorative hover movement. Preference changes do not overwrite the user's explicit slideshow pause choice. Cleanup disconnects all listeners/observers and cancels owned animations.

## Performance budget and verification

No new dependency. Target: existing initial JS remains around 180KB gzip; no homepage WebGL requests; no geometry animation; no layout shifts introduced by reveals. Browser QA covers desktop/mobile layout, manual and automatic slides, pause, offscreen behavior, focus, touch, once-only reveals, reduced-motion changes, link destinations, and navigation cleanup. Real-device field Core Web Vitals are outside this local check.

## Validation results

- Production build passed; initial JavaScript is 179.09KB gzip. Separate scene chunk remains deferred.
- All 30 existing tests passed, along with SEO and 50-article validation.
- Chrome desktop (1440×1000) and mobile (390×844): screenshots reviewed, no horizontal mobile overflow, manual scene/CTA synchronization, autoplay, explicit pause, touch swipe, section reveals and reduced-motion behavior passed.
- Additional checks passed for keyboard focus during reveals, preserving pause across preference changes, offscreen autoplay suspension and navigation away from the homepage.
- No homepage WebGL requests or browser runtime errors in the main interaction run. Mobile advisor image has no parallax transform.
- Local browser checks are not a substitute for real-device performance measurements or field Core Web Vitals.
