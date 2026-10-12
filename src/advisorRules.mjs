export const tasks = [
  ["roof", "Waterproof a roof", "Exposed terraces and roof surfaces"],
  ["wet", "Waterproof a bathroom, basement or tank", "Bathrooms, basements and water tanks"],
  ["tiles", "Fix tiles", "Tile adhesives for walls and floors"],
  ["grout", "Fill gaps between tiles", "Cementitious and epoxy grouts"],
  [
    "other",
    "Something else / I’m not sure",
    "Get the right technical guidance",
  ],
];
export function questions(task) {
  if (task === "roof")
    return [
      {
        key: "condition",
        title: "Is the roof open to sun and rain?",
        options: [
          ["exposed", "Exposed to sun and rain"],
          ["covered", "Under tiles or another covering"],
          ["ponding", "Water collects on it, or it gets heavy foot traffic"],
          ["unsure", "I’m not sure"],
        ],
      },
      {
        key: "surface",
        title: "What is the roof surface?",
        options: [
          ["screed", "Cement mortar / screed", "A cement-and-sand finishing layer over the roof slab"],
          ["mosaic", "China mosaic or roof tiles"],
          ["other", "Metal, other surface or not sure"],
        ],
      },
    ];
  if (task === "wet")
    return [
      {
        key: "area",
        title: "Where do you need waterproofing?",
        options: [
          ["bathroom", "Bathroom, kitchen or balcony"],
          ["basement", "Basement or foundation"],
          ["tank", "Water tank or swimming pool"],
          ["unsure", "I’m not sure"],
        ],
      },
      {
        key: "surface",
        title: "What surface are you waterproofing?",
        options: [
          ["concrete", "Concrete"],
          ["masonry", "Cement plaster, brick or blockwork"],
          ["other", "Existing tiles, other surface or not sure"],
        ],
      },
    ];
  if (task === "tiles")
    return [
      {
        key: "area",
        title: "Where are you fixing the tiles?",
        options: [
          ["inside", "Interior wall or floor"],
          ["covered", "Covered exterior floor"],
          ["outside", "Exposed exterior wall or floor"],
          ["unsure", "I’m not sure"],
        ],
      },
      {
        key: "surface",
        title: "What will the tiles be fixed onto?",
        options: [
          ["cement", "Firm, fully cured cement or concrete", "It has finished curing and is not loose, dusty or crumbling"],
          ["other", "Existing tiles, wood, metal or not sure"],
        ],
      },
      {
        key: "size",
        title: "What is the tile size?",
        options: [
          ["medium", "Over 30 × 30 cm, up to 60 × 60 cm"],
          ["small", "30 × 30 cm or smaller"],
          ["large", "Over 60 × 60 cm"],
          ["unsure", "I’m not sure"],
        ],
      },
    ];
  if (task === "grout")
    return [
      {
        key: "area",
        title: "Where are the tile joints?",
        options: [
          ["home", "Inside or outside a home"],
          ["pool", "Swimming pool or fountain"],
          ["chemical", "Industrial or chemical exposure"],
          ["unsure", "I’m not sure"],
        ],
      },
      {
        key: "surface",
        title: "What are the tiles made of?",
        options: [
          ["ceramic", "Ceramic tile"],
          ["stone", "Marble or natural stone"],
          ["other", "Other material or not sure"],
        ],
      },
    ];
  return [];
}
export function recommend(a) {
  const out = (ids, reason, limitations) => ({ ids, reason, limitations });
  if (
    a.task === "roof" &&
    a.condition === "exposed" &&
    ["screed", "mosaic"].includes(a.surface)
  )
    return out(
      ["trubuild-rooftect-advanced", "trubuild-rooftect-prime"],
      "Both product application sections list cement mortar, screed and tiled roof surfaces.",
      a.surface === "mosaic"
        ? "Both sources specify Primesure Premium for china mosaic and roof tiles. Confirm preparation, drainage and the complete coating system."
        : "Confirm drainage, cracks and surface preparation. These are candidates for a technical review, not approval for standing water or traffic.",
    );
  if (
    a.task === "wet" &&
    ["bathroom", "basement", "tank"].includes(a.area) &&
    ["concrete", "masonry"].includes(a.surface)
  )
    return out(
      ["trubuild-aqualock-flexi", "trubuild-aqualock"],
      "The published application sections include your selected area on concrete or masonry.",
      "Confirm hydrostatic pressure, detailing and protective finishes. For water tanks, confirm the current certificate and intended water use with the technical team.",
    );
  if (
    a.task === "tiles" &&
    ["inside", "covered"].includes(a.area) &&
    a.surface === "cement" &&
    a.size === "medium"
  )
    return out(
      ["trufix-220-plus-grey", "trufix-220-plus-white"],
      "The published range covers tiles larger than 300 × 300 mm and up to 600 × 600 mm, on interior walls/floors and covered exterior floors, over sound cementitious substrates.",
      "Grey and white are alternative variants. Confirm the tile material, installation height and full application instructions before selection.",
    );
  if (
    a.task === "grout" &&
    ["home", "pool"].includes(a.area) &&
    ["ceramic", "stone"].includes(a.surface)
  )
    return out(
      ["trubuild-stylo-cem"],
      "The published applications include ceramic tiles, marble and natural stone in internal and external areas, including pools.",
      "Confirm joint width, tile staining sensitivity and exposure requirements. Chemical exposure requires a separate technical review.",
    );
  return out(
    [],
    "We need a technical review before suggesting a product.",
    "Your surface, exposure or installation details are outside the combinations verified in this Advisor. Share your requirements with the TruBuild team.",
  );
}
export function summary(a) {
  return [
    tasks.find((t) => t[0] === a.task)?.[1],
    ...questions(a.task).map((q) => {
      let v = q.options.find((o) => o[0] === a[q.key]);
      return v ? q.title + " " + v[1] : null;
    }),
  ]
    .filter(Boolean)
    .join("\n");
}
