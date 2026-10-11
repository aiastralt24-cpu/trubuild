# Protection in Every Layer — separate prototype

Route: `/experience`. The homepage and its navigation are unchanged. The prototype is prerendered, noindex, and excluded from the public sitemap pending review.

## Direction and storyboard

An architectural study for homeowners and specifiers: warm ivory (#edece6), charcoal (#202824), restrained TruBuild yellow, IBM Plex Sans, generous space, native scrolling. A three-chapter fixed viewport occupies 350 viewport heights on desktop and mobile. Accessible chapter buttons provide direct navigation; the skip link bypasses the sequence.

1. The building: oversized left-aligned heading and a two-storey architectural miniature at right. Warm timber, fine glass framing, concrete, planting and entry steps establish scale.
2. Beneath the surface: the roof separates vertically into structural slab, a yellow-highlighted waterproofing layer, and a protective finish. The legend explains the illustration rather than prescribing a product build-up.
3. Ready for the elements: layers reassemble and a light rain cue appears. Product links take visitors to the existing roof solution guide and Product Advisor. Rain is illustrative, not a performance simulation.

The concluding dark section explains the system and limitations. Its grid collapses to a single column on mobile. No unsupported durability or water-resistance claims.

## Motion and rendering

Native scroll + Three.js requestAnimationFrame workhorse, damped response at 8/s. Text transitions: opacity 450ms, translation 650ms cubic-bezier(.22,1,.36,1), distance 18px. Micro hover: 250ms. Chapter rule: 500ms. No bounce or scroll hijacking.

Target budgets: meaningful first paint before WebGL, poster <100KB, initial core app JS <180KB gzip, deferred Three.js chunk <150KB gzip, desktop DPR <=1.5 and mobile <=1. Desktop target 60fps, mobile floor 45fps; real-device measurements are still required. Reduced-motion preference removes the sticky scroll sequence and all continuous motion. The user can also pause motion manually. Render only when progress changes or rain is active; stop when offscreen or the document is hidden. Dispose geometries, textures, materials, observers and renderer on route exit.

Geometry is illustrative and procedurally built, with a static WebP fallback. The scene chunk loads only on this route. Concept screenshot is a visual direction, not a photograph of a real project. Runtime geometry intentionally uses a lightweight architectural model rather than photographic mesh assets.

## Verification and visual review

Compared the generated 1536x1024 concept with rendered desktop and 390x844 mobile screenshots using image inspection. Checked heading copy and hierarchy, ivory/charcoal/yellow palette, left-copy/right-model composition, restrained header, bottom chapter rail, mobile framing, and the roof separation sequence. Fixed clipping during capture, missing mobile word spacing, and model overlap with the mobile layer legend. Intentional variation: the live scene is a lightweight procedural architectural model with simpler vegetation/materials than the photoreal concept; this prototype is not represented as photographic fidelity.

Playwright Chrome used because the Browser plugin is unavailable. Verified all chapters, pause/resume, reduced motion, lack of horizontal overflow, navigation back to the homepage, and simulated WebGL-unavailable fallback. No runtime exceptions during normal interaction. All 30 existing tests, production build, SEO checks and 50-blog checks passed. Current app bundle ~178KB gzip; deferred scene ~135KB gzip; two fallback images total ~46KB. Physical Android/iOS, Safari, and field Core Web Vitals have not been measured; frame-rate targets remain targets, not verified results.
