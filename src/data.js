import data from "./products.json";
import documents from "./resources.json";
export const products = data;
export const resources = documents;
export const categories = [...new Set(products.map((p) => p.category))];
export const solutions = [
  {
    id: "roof",
    name: "Roof & terrace",
    sourceName: "Roof Waterproofing",
    summary: "Protect the spaces that shelter everything below.",
    description:
      "Explore coatings for exposed roofs, new roof construction and roof rehabilitation.",
    image: "/images/roof.webp",
    icon: "roof",
  },
  {
    id: "tiling",
    name: "Tiling & grouting",
    sourceName: "Tiling and Grouting",
    summary: "A beautiful finish starts beneath the surface.",
    description:
      "Cementitious and hybrid tile adhesives, cementitious grouts and epoxy grouts for different installation requirements.",
    image: "/images/tiles.webp",
    icon: "tile",
  },
  {
    id: "wet",
    name: "Bathrooms & wet areas",
    sourceName: "Wet Areas",
    summary: "Protection where water is part of everyday life.",
    description:
      "Discover waterproofing and repair solutions for bathrooms, kitchens and other wet areas.",
    image: "/images/application-wet.webp",
    icon: "water",
  },
  {
    id: "exterior",
    name: "Exterior walls",
    sourceName: "Exterior Waterproofing",
    summary: "Prepare. Protect. Finish with confidence.",
    description:
      "Walltect coatings, surface primers, crack fillers and protective sealers for exterior applications.",
    image: "/images/architecture.webp",
    icon: "wall",
  },
  {
    id: "repair",
    name: "Concrete & repair",
    sourceName: "Concrete and Mortar",
    summary: "Build strength into every stage.",
    description:
      "Polymer modifiers and epoxy systems for concrete, mortar and repair applications.",
    image: "/images/application-repair.webp",
    icon: "repair",
  },
  {
    id: "basement",
    name: "Basements & foundations",
    sourceName: "Substructure Waterproofing",
    summary: "Protection starts below ground.",
    description:
      "Waterproofing options for below-ground structures. Confirm pressure, substrate and system requirements with technical support.",
    image: "/images/application-basement.webp",
    icon: "foundation",
  },
  {
    id: "tanks",
    name: "Water tanks & pools",
    sourceName: "Water Tanks and Other Areas",
    summary: "Find the system for your water-retaining structure.",
    description:
      "Explore published products for water tanks and related areas. Confirm suitability for the intended water use with the technical team.",
    image: "/images/application-tanks.webp",
    icon: "water",
  },
  {
    id: "sealants",
    name: "Joints & sealants",
    sourceName: "Professional Sealants",
    summary: "The detail that brings everything together.",
    description:
      "Elastic joint sealing and gap-filling solutions, with product-specific substrate guidance.",
    image: "/images/application-sealants.webp",
    icon: "sealant",
  },
];
export const featured = [
  "trubuild-rooftect-advanced",
  "trubuild-aqualock-flexi",
  "trufix-110",
].map((id) => products.find((p) => p.id === id));
export const shortDescription = (p) =>
  p.subtitle || p.description.split(". ")[0].replace(/^TRUBUILD /i, "");
export const documentFor = (p) => {
  const normal = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const alias = {
    "trubuild-rooftect-prime": "TRUBUILD ROOFTECT PRO",
    "trufix-110": "TRUBUILD TILE ADHESIVE TA 110",
    "trufix-220-grey": "TRUBUILD TILE ADHESIVE TA-220",
    "trufix-220-plus-grey": "TRUBUILD TILE ADHESIVE TA-220 PLUS GREY",
    "trufix-220-plus-white": "TRUBUILD TILE ADHESIVE TA-220 PLUS WHITE",
    "trufix-330-grey": "TRUBUILD TILE ADHESIVE TA-330 GREY",
    "trufix-330-white": "TRUBUILD TILE ADHESIVE TA-330 WHITE",
    "trufix-440-grey": "TRUBUILD TILE ADHESIVE TA-660 GREY",
    "trufix-440-white": "TRUBUILD TILE ADHESIVE TA-660 WHITE",
    "trubuild-stylo-cem": "TRUBUILD TILE GROUT",
    "trubuild-stylo-3k": "TRUBUILD STAIN FREE EPOXY GROUT",
    "trubuild-trufix-550": "TRUBUILD EFX 550",
    "trubuild-sbr-333": "TRUBUILD WPL 333",
    "trubuild-sbr-pro-334": "TRUBUILD WSL-334",
  };
  const doc = resources.find(
    (d) => normal(d.title) === normal(alias[p.id] || "TRUBUILD " + p.name),
  );
  return doc || { title: p.name, url: p.tds };
};
export const enquiryUrl = (names = "", requirements = "") =>
  "/contact?" +
  new URLSearchParams({
    type: names || requirements ? "Technical assistance" : "General enquiry",
    product: names,
    requirements,
  });
