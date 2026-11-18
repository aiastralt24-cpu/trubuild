// Search only maintained site content. No generated technical claims or external service.
const groups = [
  ["roof", "terrace", "rooftop", "chhat", "chat", "छत"],
  [
    "leak",
    "leaks",
    "leaking",
    "leakage",
    "seepage",
    "seep",
    "tapak",
    "tapakta",
    "टपक",
    "रिसाव",
  ],
  ["waterproofing", "waterproof", "waterproofed", "सीलन", "silan"],
  ["bathroom", "bathrooms", "toilet", "washroom", "बाथरूम"],
  ["wall", "walls", "deewar", "diwar", "दीवार"],
  ["tile", "tiles", "tiling", "टाइल", "टाइल्स"],
  ["adhesive", "adhesives", "glue", "bonding", "chipkane", "चिपकाने"],
  ["crack", "cracks", "cracked", "दरार"],
  ["wet", "damp", "moisture", "geela", "gila", "गीला"],
  ["water", "pani", "paani", "पानी"],
  ["rain", "rains", "monsoon", "barish", "baarish", "बारिश"],
  ["coverage", "consumption", "dosage", "quantity", "kitna", "कितना"],
  ["grout", "grouting", "joint", "joints", "gap", "gaps"],
  ["document", "documents", "tds", "datasheet", "pdf"],
];
const synonyms = new Map(groups.flatMap((g) => g.map((word) => [word, g[0]])));
const stop = new Set(
  "a an the my me i is are it its for in on of to and or with when can how do does should use using need want please solution best which what you your ke ki ka liye hai se raha rahi ho aur ko का की के है से रहा रही में और लिए".split(
    " ",
  ),
);
export const normalize = (text) =>
  String(text || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/([\p{L}])(?=\d)|(?<=\d)(?=[\p{L}])/gu, "$1 ")
    .replace(/[^\p{L}\p{N}\p{M}+]+/gu, " ")
    .trim();
const tokens = (text) =>
  normalize(text)
    .split(/\s+/)
    .filter((t) => t && !stop.has(t))
    .map((t) => synonyms.get(t) || t);
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = row;
  }
  return prev[b.length];
}
export function buildIndex({
  products = [],
  blogs = [],
  resources = [],
  solutions = [],
}) {
  const docs = [
    ...products.map((p) => ({
      id: "p:" + p.id,
      type: "Products",
      title: p.name,
      href: "/products/" + p.id,
      description: p.subtitle || p.description,
      product: p,
      image: p.image,
      text: [
        p.name,
        ...(p.aliases || []),
        p.category,
        p.description,
        ...(p.fields || []),
        ...(p.applications || []),
        ...(p.benefits || []),
        p.coverage,
        p.shelfLife,
        ...(p.applicationNotes || []),
        ...(p.specs || []).flat(),
      ].join(" "),
    })),
    ...blogs.map((b) => ({
      id: "g:" + b.slug,
      type: "Guides",
      title: b.title,
      href: "/blogs/" + b.slug,
      description: b.answer,
      text: [
        b.title,
        b.answer,
        b.question,
        b.response,
        ...b.sections.flat(),
        ...b.checklist,
      ].join(" "),
    })),
    ...resources
      .filter(
        (r) =>
          !r.legacyLabel ||
          !resources.some(
            (other) => other.productId === r.productId && !other.legacyLabel,
          ),
      )
      .map((r, i) => {
        const p = products.find((p) => p.id === r.productId);
        return {
          id: "d:" + i,
          type: "Documents",
          title:
            r.title +
            " · " +
            (r.kind === "tds" ? "Technical data sheet" : "Document"),
          href: "/resources",
          sheet: r,
          product: p,
          description: r.version
            ? "Technical data sheet · Version " + r.version
            : "Published product document",
          text: [
            r.title,
            r.sourceTitle,
            "tds datasheet pdf technical document",
            p?.category,
            p?.description,
            p?.coverage,
            ...(p?.specs || []).flat(),
          ].join(" "),
        };
      }),
    ...solutions.map((s) => ({
      id: "s:" + s.id,
      type: "Applications",
      title: s.name,
      href: "/solutions/" + s.id,
      description: s.description || s.summary,
      text: [s.name, s.summary, s.description].join(" "),
    })),
  ];
  return docs.map((d) => ({
    ...d,
    words: new Set(tokens(d.text)),
    titleWords: new Set(tokens(d.title)),
  }));
}
export function search(index, query, { limit = 200 } = {}) {
  const raw = String(query || "").slice(0, 300),
    original = [...new Set(tokens(raw))];
  if (!original.length) return { results: [], corrections: [], terms: [] };
  const vocabulary = new Set(index.flatMap((d) => [...d.words]));
  const corrections = [];
  const terms = original.map((t) => {
    if (vocabulary.has(t) || t.length < 4 || /^\d+$/.test(t)) return t;
    let best = null,
      min = 3;
    for (const v of vocabulary) {
      if (v.length < 4 || v[0] !== t[0] || /\d/.test(v)) continue;
      const n = distance(t, v);
      if (n < min) {
        min = n;
        best = v;
      }
    }
    if (best && min <= (t.length >= 7 ? 2 : 1)) {
      corrections.push({ from: t, to: best });
      return best;
    }
    return t;
  });
  const normalized = normalize(raw);
  const families = terms.filter((t) =>
    [
      "aqualock",
      "trufix",
      "rooftect",
      "walltect",
      "buildcrete",
      "crystaseal",
      "stylo",
      "sbr",
      "trushield",
      "trubond",
      "primesure",
      "tcsr",
      "cps",
      "boretite",
      "aquapoxy",
      "sealmaster",
      "plasterbond",
      "wrp",
      "wts",
    ].includes(t),
  );
  const results = index
    .map((d) => {
      if (
        families.length &&
        !families.some((t) =>
          (["Products", "Documents"].includes(d.type)
            ? d.titleWords
            : d.words
          ).has(t),
        )
      )
        return null;
      let score = 0,
        hits = 0;
      for (const t of terms) {
        if (d.words.has(t)) {
          hits++;
          const frequency = index.reduce(
            (n, x) => n + Number(x.words.has(t)),
            0,
          );
          score +=
            (d.titleWords.has(t) ? 9 : 2) *
            (1 + Math.log(1 + index.length / (1 + frequency)));
        } else if (
          t.length >= 3 &&
          [...d.titleWords].some((w) => w.startsWith(t))
        ) {
          hits++;
          score += 3;
        }
      }
      const compact = normalized.replace(/ /g, "");
      const productName = normalize(d.product?.name).replace(/ /g, "");
      if (d.type === "Products" && productName && compact === productName)
        score += 150;
      const numeric = terms.filter((t) => /^\d+$/.test(t));
      if (
        ["Products", "Documents"].includes(d.type) &&
        numeric.length &&
        !numeric.every((t) => d.titleWords.has(t))
      )
        return null;
      const coverage = hits / terms.length;
      if (!hits || coverage < 0.45) return null;
      if (terms.includes("document") && d.type === "Documents") score += 22;
      if (d.type === "Products") score += 2;
      return {
        ...d,
        score: score * coverage,
        matched: terms.filter((t) => d.words.has(t)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
  return { results, corrections, terms };
}
export function guidance(query, result) {
  const terms = result.terms;
  if (!result.results.length) return null;
  const productResults = result.results.filter((r) => r.type === "Products");
  const norm = normalize(query);
  const named = productResults.filter((r) => norm.includes(normalize(r.title)));
  const product = /\b(vs|versus|compare)\b/.test(norm)
    ? null
    : named.sort((a, b) => b.title.length - a.title.length)[0];
  if (product && terms.includes("coverage") && product.product.coverage)
    return {
      title: "Published coverage",
      text: product.product.coverage,
      source: product,
      question:
        "Coverage depends on the stated application conditions. Use the complete technical sheet when planning your quantity.",
    };
  if (
    terms.includes("roof") &&
    !terms.some((t) => ["exposed", "tile", "tiled", "coating"].includes(t))
  )
    return {
      title: "Start with your roof surface",
      question: "Is your roof exposed concrete, tiled, or already coated?",
      choices: [
        "Exposed concrete roof waterproofing",
        "Tiled terrace waterproofing",
        "Existing roof coating repair",
      ],
    };
  if (
    terms.includes("bathroom") &&
    !terms.some((t) => ["floor", "wall", "pipe"].includes(t))
  )
    return {
      title: "Locate the source first",
      question: "Is the problem at the floor, wall, or a pipe joint?",
      choices: [
        "Bathroom floor waterproofing",
        "Bathroom wall seepage",
        "Pipe joint sealant",
      ],
    };
  if (terms.includes("wet") && terms.includes("concrete"))
    return {
      title: "Application conditions matter",
      question:
        "Which product are you planning to use? Enter its name so you can check its published preparation instructions.",
    };
  const guide = result.results.find((r) => r.type === "Guides");
  return guide
    ? {
        title: "From the TruBuild guide",
        text: guide.description,
        source: guide,
      }
    : null;
}
