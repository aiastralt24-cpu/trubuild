import data from "./products.json";
import documents from "./resources.json";
export const products = [...data].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }));
export const resources = documents;
export const categories = [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "en"));
export const solutions = [
  {
    id: "roof",
    name: "Roof Waterproofing",
    sourceName: "Roof Waterproofing",
    summary: "Protect the spaces that shelter everything below.",
    description:
      "Explore coatings for exposed roofs, new roof construction and roof rehabilitation.",
    image: "/images/hero-roof-coating.webp",
    imageAlt: "Illustrative exposed terrace with a continuous waterproof coating",
    icon: "roof",
  },
  {
    id: "tiling",
    name: "Tiling & Grouting",
    sourceName: "Tiling and Grouting",
    summary: "A beautiful finish starts beneath the surface.",
    description:
      "Cementitious and hybrid tile adhesives, cementitious grouts and epoxy grouts for different installation requirements.",
    image: "/images/hero-interior-floor.webp",
    imageAlt: "Illustrative ceramic tiled floor in a dry living room",
    icon: "tile",
  },
  {
    id: "wet",
    name: "Wet Areas",
    sourceName: "Wet Areas",
    summary: "Protection where water is part of everyday life.",
    description:
      "Discover waterproofing and repair solutions for bathrooms, kitchens and other wet areas.",
    image: "/images/application-wet-v2.webp",
    imageAlt: "Illustrative unfinished bathroom with waterproofing beneath the future tile finish",
    icon: "water",
  },
  {
    id: "exterior",
    name: "Exterior Waterproofing",
    sourceName: "Exterior Waterproofing",
    summary: "Prepare. Protect. Finish with confidence.",
    description:
      "Walltect coatings, surface primers, crack fillers and protective sealers for exterior applications.",
    image: "/images/hero-exterior-home-v3.webp",
    imageAlt: "Illustrative contemporary home with finished ivory plastered exterior walls",
    icon: "wall",
  },
  {
    id: "repair",
    name: "Concrete and Mortar",
    sourceName: "Concrete and Mortar",
    summary: "Build strength into every stage.",
    description:
      "Polymer modifiers and epoxy systems for concrete, mortar and repair applications.",
    image: "/images/application-repair-v2.webp",
    imageAlt: "Illustrative localized mortar repair to a concrete column base",
    icon: "repair",
  },
  {
    id: "basement",
    name: "Substructure Waterproofing",
    sourceName: "Substructure Waterproofing",
    summary: "Protection starts below ground.",
    description:
      "Waterproofing options for below-ground structures. Confirm pressure, substrate and system requirements with technical support.",
    image: "/images/application-basement-v2.webp",
    imageAlt: "Illustrative waterproof membrane on the external face of a below-ground concrete wall",
    icon: "foundation",
  },
  {
    id: "tanks",
    name: "Water Tanks & Other Areas",
    sourceName: "Water Tanks and Other Areas",
    summary: "Find the system for your water-retaining structure.",
    description:
      "Explore published products for water tanks and related areas. Confirm suitability for the intended water use with the technical team.",
    image: "/images/application-tanks-v2.webp",
    imageAlt: "Illustrative empty concrete water tank with cementitious waterproof coating",
    icon: "water",
  },
  {
    id: "sealants",
    name: "Professional Sealants",
    sourceName: "Professional Sealants",
    summary: "The detail that brings everything together.",
    description:
      "Elastic joint sealing and gap-filling solutions, with product-specific substrate guidance.",
    image: "/images/application-sealants-v2.webp",
    imageAlt: "Illustrative tooled sealant filling a movement joint between concrete panels",
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
  if (p.tdsStatus === "replacement-pending") return { title: p.name, pending: true, url: enquiryUrl(p.name, "Please send the current technical data sheet.") };
  const linked = resources.find(d => d.productId === p.id);
  if (linked) return linked;
  if (p.documentId) {
    return resources.find((d) => d.productId === p.documentId) || { title: p.name, local: p.tds };
  }
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
