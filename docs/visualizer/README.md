# TruBuild tile & grout studio

Route: `/visualizer`. The homepage promotional section remains disabled with `SHOW_HOME_VISUALIZER = false`.

## Room library and editor

The library offers ten distinct scenes in six searchable categories: living room (2), kitchen (2), bathroom (2), bedroom (2), outdoor (1), pool (1). Eight new original architectural images are in `public/images/visualizer/`; the two initial scenes use existing site assets. `src/visualizerRooms.mjs` defines normalized projection quadrilaterals, foreground masks and descriptive surface labels. The pool is intentionally empty so its interior finish is visible.

Eight patterns: grid, brick, vertical stack, diagonal, checkered, basketweave, herringbone and striped. Rotation: 0/90/180/270 degrees. Six illustrative material treatments: limestone, concrete, marble, terrazzo, slate and terracotta. Twelve illustrative grout colours; 1–10 mm joints. The pool and spa have an additional independent wall surface. Other scenes expose a floor plus a mapped wall or backsplash area.

Rectangular patterns use 2:1 tiles. Dimension labels, quantity estimates, enquiry summaries and PNG specifications reflect that aspect ratio. The quantity planner uses the entered surface area, allowance and selected tile dimensions; it excludes pack rounding and is not a grout consumption calculator.

Named shortlists (up to six), undo/redo, original/saved-finish comparison, zoom, demo-room share URLs, PNG exports and prefilled enquiries remain available. Demo designs persist in versioned localStorage. Shared input is validated. Uploaded photos and their mapped geometry remain in browser memory for that visit; uploaded photos are neither persisted nor placed in share URLs. Photo mapping supports pointer handles, arrow keys and percentage inputs.

The Canvas renderer uses perspective projection, foreground masks, photo-derived lighting and antialiased joints. Lighting and masks are cached. Hidden editors do not render while the room gallery is open. PNG exports render separately at up to 1800 px wide.

## Asset provenance

The eight new scene assets were created using the built-in image generation tool, then resized and encoded as WebP for the website. Original outputs remain in the Codex generated-images directory. No Roff or Tilesview room assets were copied.

Prompt brief shared across the first five images: one photorealistic architectural photograph, landscape 3:2, for an interactive tile visualizer; unobstructed foreground floor for material overlay; realistic daylight and shadows; no people, text, collage or watermark. Individual scene directions:

- `kitchen.webp`: contemporary Indian apartment kitchen; oak lower and ivory upper cabinets across the back wall; window over worktop; no island, chairs or rug; cabinetry above the foreground floor.
- `kitchen-dark.webp`: dark walnut galley kitchen, sage upper cupboards, steel fittings, right window, empty grey tiled foreground.
- `bedroom.webp`: low walnut bed with linen bedding in rear left, plaster wall, morning light, unobstructed pale floor.
- `outdoor.webp`: Indian villa veranda, terracotta rear wall, glass doors, garden, bench and planter behind clear stone patio foreground.
- `pool.webp`: finished rectangular pool without water, tropical house behind, visible ivory floor and interior end/side walls.

Prompt brief for the remaining three: one photorealistic architectural photograph, landscape 3:2; straight verticals and doorway-level camera; realistic soft light; all furniture/fixtures in the back half; unobstructed floor; no people, text or collage.

- `living-loft.webp`: charcoal sofa, tall loft windows, brass floor lamp, grey walls, no coffee table or rug.
- `bedroom-suite.webp`: terracotta upholstered bed at rear right, cream walls, framed artwork, left daylight.
- `bathroom-spa.webp`: floating walnut vanity left, freestanding rear bath, stone walls and skylight, no glass screen or rug.

## Limits and dependencies

This is an independent custom 2D studio, not a Tilesview integration. It has no panorama scenes, AI segmentation, QR cross-device transfer or approved sparkle finishes. Colour names/RGB values and procedural material treatments are illustrative, not an approved product shade chart. Nominal tile size changes visual scale; room dimensions are not surveyed. Demo wall masks represent selected areas rather than automatic full-room segmentation. Uploaded photos require manual mapping around unobstructed surfaces.

Product suitability must be confirmed using the selected product’s technical data, including pool/exterior uses and joint sizes. Enquiries use the existing contact flow and its Supabase configuration requirement in `docs/SUPABASE-SETUP.md`. No service purchase, live deployment or external platform integration was performed.

Run `npm test` for projection, library geometry/assets, pattern joins, input validation and quantity calculations. Run `npm run build` for the production bundle and prerender.
