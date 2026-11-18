export class PortalError extends Error {
  constructor(message, field = "") {
    super(message);
    this.field = field;
  }
}
const fail = (message, field) => {
  throw new PortalError(message, field);
};
const num = (v, min, max, field) => {
  if (
    v === "" ||
    v === null ||
    v === undefined ||
    !Number.isFinite(Number(v)) ||
    Number(v) < min ||
    Number(v) > max
  )
    fail(`Enter ${field} between ${min} and ${max}.`, field);
  return Number(v);
};
export const SQFT = 0.09290304;
export function measure(zones, unit = "m") {
  if (!["m", "ft"].includes(unit)) fail("Choose metres or feet.", "unit");
  if (!Array.isArray(zones) || !zones.length || zones.length > 30)
    fail("Add between 1 and 30 zones.", "zones");
  const factor = unit === "ft" ? SQFT : 1;
  const breakdown = zones.map((z, i) => {
    const gross =
      z.mode === "direct"
        ? num(z.area, 0.01, 100000, "area")
        : num(z.length, 0.01, 1000, "length") *
          num(z.width, 0.01, 1000, "width");
    const excluded = num(z.excluded ?? 0, 0, 100000, "deductions");
    if (excluded >= gross)
      fail(
        `Deductions must be smaller than ${z.name || "zone " + (i + 1)}.`,
        "deductions",
      );
    return {
      name: String(z.name || `Zone ${i + 1}`).slice(0, 80),
      grossM2: gross * factor,
      excludedM2: excluded * factor,
      netM2: (gross - excluded) * factor,
    };
  });
  const area = breakdown.reduce((n, z) => n + z.netM2, 0);
  if (area > 10000)
    fail("Projects above 10,000 m² need technical review.", "area");
  return { unit, breakdown, areaM2: area };
}
export const methods = [
  "coverage",
  "consumption",
  "thickness",
  "grout",
  "sealant",
];
export function validateRule(rule, { publish = false } = {}) {
  if (
    !rule ||
    !rule.id ||
    !rule.version ||
    !rule.name ||
    !Array.isArray(rule.components) ||
    !rule.components.length ||
    rule.components.length > 12
  )
    fail("A rule needs an identifier, version and product components.");
  if (
    publish &&
    (!rule.source ||
      !rule.effectiveDate ||
      !rule.owner ||
      !rule.referenceTests?.length)
  )
    fail(
      "Publication needs source, effective date, owner and reference examples.",
    );
  for (const c of rule.components) {
    if (!methods.includes(c.method))
      fail("Only approved formula templates are supported.");
    if (!["per_coat", "system"].includes(c.basis))
      fail("Declare per-coat or complete-system consumption.");
    num(c.rate, 0.000001, 100000, "technical rate");
    num(c.coats ?? 1, 1, 10, "coats");
    num(c.wasteDefault, 0, 30, "default wastage");
    num(c.wasteMax, 0, 30, "maximum wastage");
    if (c.wasteDefault > c.wasteMax) fail("Default wastage exceeds the limit.");
    if (!Array.isArray(c.packs) || !c.packs.length || c.packs.length > 8)
      fail("Define eligible product packs.");
    for (const p of c.packs) {
      if (!p.id) fail("Packs need SKU identifiers.");
      num(p.size, 0.001, 10000, "pack size");
    }
    if (publish && (!c.productId || !c.source || !c.unit))
      fail("Every component needs product, source and unit.");
  }
  return true;
}
// Exact integer milliquantity DP; bounded limits route unusual projects to review.
export function selectPacks(required, packs, objective = "surplus") {
  if (!["surplus", "packs", "cost"].includes(objective))
    fail("Unknown pack objective.");
  const target = Math.ceil((required - 1e-9) * 1000);
  if (!Number.isFinite(target) || target <= 0)
    fail("Invalid purchase requirement.");
  const eligible = packs.filter((p) => p.available !== false);
  if (!eligible.length)
    fail("No eligible pack is available in this territory.");
  if (
    objective === "cost" &&
    eligible.some(
      (p) => !Number.isSafeInteger(p.priceMinor) || p.priceMinor <= 0,
    )
  )
    fail("Cost optimisation requires an approved price for every pack.");
  const sizes = eligible.map((p) => Math.round(p.size * 1000));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const step = sizes.reduce(gcd);
  const ts = Math.ceil(target / step),
    scaled = sizes.map((s) => s / step),
    limit = ts + Math.max(...scaled);
  if (limit > 200000) fail("This pack combination needs commercial review.");
  const dp = Array(limit + 1).fill(null);
  dp[0] = { count: 0, cost: 0, prev: -1, pack: -1 };
  for (let q = 1; q <= limit; q++)
    for (let i = 0; i < eligible.length; i++) {
      const prev = dp[q - scaled[i]];
      if (!prev) continue;
      const cand = {
        count: prev.count + 1,
        cost: prev.cost + (eligible[i].priceMinor || 0),
        prev: q - scaled[i],
        pack: i,
      };
      const rank = (x) =>
        objective === "cost" ? [x.cost, x.count] : [x.count, x.cost];
      if (!dp[q] || compare(rank(cand), rank(dp[q])) < 0) dp[q] = cand;
    }
  let best = -1;
  for (let q = ts; q <= limit; q++) {
    if (!dp[q]) continue;
    const rank = (x) =>
      objective === "cost"
        ? [dp[x].cost, x, dp[x].count]
        : objective === "packs"
          ? [dp[x].count, x, dp[x].cost]
          : [x, dp[x].count, dp[x].cost];
    if (best < 0 || compare(rank(q), rank(best)) < 0) best = q;
  }
  if (best < 0) fail("No valid whole-pack combination.");
  const counts = eligible.map(() => 0);
  let q = best;
  while (q > 0) {
    counts[dp[q].pack]++;
    q = dp[q].prev;
  }
  const purchased = (best * step) / 1000;
  return {
    objective,
    packs: eligible.flatMap((p, i) =>
      counts[i] ? [{ ...p, count: counts[i] }] : [],
    ),
    purchased,
    surplus: Math.max(0, purchased - required),
  };
}
function compare(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
export function calculate(rule, input, { publishedOnly = false } = {}) {
  validateRule(rule);
  if (publishedOnly && rule.status !== "published")
    fail("This calculation rule is not published.");
  const measurement = measure(input.zones, input.unit);
  const components = rule.components
    .filter((c) => !c.optional || input.optional?.includes(c.id))
    .map((c) => {
      const area = c.areaFraction
        ? measurement.areaM2 *
          num(c.areaFraction, 0.001, 1, "component area fraction")
        : measurement.areaM2;
      const coats = c.basis === "system" ? 1 : c.coats;
      let theoretical;
      if (c.method === "coverage") theoretical = (area * coats) / c.rate;
      if (c.method === "consumption") theoretical = area * c.rate * coats;
      if (c.method === "thickness")
        theoretical =
          area *
          c.rate *
          num(input.thickness, c.minThickness, c.maxThickness, "thickness");
      if (c.method === "grout") {
        const a = num(input.tileLength, 25, 3000, "tile length"),
          b = num(input.tileWidth, 25, 3000, "tile width"),
          w = num(
            input.jointWidth,
            c.minJoint ?? 1,
            c.maxJoint ?? 10,
            "joint width",
          ),
          d = num(input.jointDepth, 1, 30, "joint depth");
        theoretical = area * ((a + b) / (a * b)) * w * d * c.rate;
      }
      if (c.method === "sealant")
        theoretical =
          (num(input.jointLength, 0.1, 10000, "joint length") *
            num(input.jointWidth, 1, 50, "joint width") *
            num(input.jointDepth, 1, 50, "joint depth")) /
          1000;
      const waste = num(
        input.waste ?? c.wasteDefault,
        0,
        c.wasteMax,
        "wastage",
      );
      const adjusted = theoretical * (1 + waste / 100);
      const purchase = selectPacks(
        adjusted,
        c.packs,
        input.objective || "surplus",
      );
      return {
        id: c.id,
        productId: c.productId,
        name: c.name,
        unit: c.unit,
        areaM2: area,
        theoretical,
        adjusted,
        waste,
        purchase,
        method: c.method,
        basis: c.basis,
        coats,
        source: c.source,
        sequence: c.sequence || 1,
      };
    });
  return {
    ruleId: rule.id,
    ruleVersion: rule.version,
    ruleSnapshot: structuredClone(rule),
    inputs: structuredClone(input),
    measurement,
    components,
    technicalReview: rule.status !== "published",
    assumptions: rule.assumptions || [],
    createdAt: new Date().toISOString(),
  };
}
export function validateReferences(rule) {
  validateRule(rule, { publish: true });
  for (const t of rule.referenceTests) {
    const r = calculate(rule, t.input);
    if (
      Math.abs(r.components[0].theoretical - t.expected) >
      Math.max(0.0001, Math.abs(t.expected) * 0.00001)
    )
      fail("A reference example failed. Publication is blocked.");
  }
  return true;
}
// Money is represented in whole minor units; integer arithmetic, half-up rounding.
export function minor(value) {
  const s = String(value);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(s))
    fail("Money must have at most two decimal places.");
  const [a, b = ""] = s.split(".");
  return Number(BigInt(a) * 100n + BigInt(b.padEnd(2, "0")));
}
const mulBps = (n, bps) => Number((BigInt(n) * BigInt(bps) + 5000n) / 10000n);
export function priceEstimate(
  estimate,
  priceList,
  {
    discountBps = 0,
    chargesMinor = 0,
    date = new Date().toISOString().slice(0, 10),
    territory = "",
  } = {},
) {
  if (
    !priceList ||
    priceList.status !== "published" ||
    !priceList.seller?.legalName ||
    !priceList.seller?.address ||
    !priceList.seller?.approvedBy
  )
    fail("Official quotations require an approved seller and price list.");
  if (
    date < priceList.validFrom ||
    date > priceList.validTo ||
    (!priceList.territories.includes("*") &&
      !priceList.territories.includes(territory))
  )
    fail("No unambiguous active price list for this territory/date.");
  num(discountBps, 0, 10000, "discount");
  num(chargesMinor, 0, 100000000, "charges");
  if (!Number.isInteger(discountBps) || !Number.isSafeInteger(chargesMinor))
    fail("Invalid commercial precision.");
  const items = estimate.components.flatMap((c) =>
    c.purchase.packs.map((p) => {
      const price = priceList.items[p.id];
      if (!price)
        fail(`Price missing for ${p.id}; commercial review required.`);
      const unit = minor(price.unitPrice),
        gross = unit * p.count,
        discount = mulBps(gross, discountBps),
        net = gross - discount;
      if (
        !Number.isSafeInteger(gross) ||
        net < minor(price.minimumPrice || "0") * p.count
      )
        fail("Price below permitted minimum.");
      const taxBps = num(price.taxBps, 0, 10000, "tax basis points");
      if (!Number.isInteger(taxBps)) fail("Invalid tax precision.");
      if (priceList.taxBasis !== "exclusive")
        fail("This pilot requires explicitly tax-exclusive pricing.");
      const tax = mulBps(net, taxBps);
      return {
        sku: p.id,
        description: c.name,
        pack: `${p.size} ${c.unit}`,
        count: p.count,
        unitMinor: unit,
        grossMinor: gross,
        discountMinor: discount,
        netMinor: net,
        taxMinor: tax,
        totalMinor: net + tax,
      };
    }),
  );
  return {
    items,
    currency: priceList.currency,
    priceListId: priceList.id,
    priceVersion: priceList.version,
    seller: structuredClone(priceList.seller),
    terms: priceList.terms,
    discountBps,
    chargesMinor,
    subtotalMinor: items.reduce((n, l) => n + l.netMinor, 0),
    taxMinor: items.reduce((n, l) => n + l.taxMinor, 0),
    totalMinor: items.reduce((n, l) => n + l.totalMinor, chargesMinor),
    needsApproval: discountBps > (priceList.executiveLimitBps || 0),
  };
}
export const stages = [
  "New",
  "Assigned",
  "Contact attempted",
  "Contacted",
  "Qualified",
  "Technical assessment",
  "Quotation issued",
  "Negotiation",
  "Won",
  "Lost",
  "Nurture",
  "Invalid",
  "Duplicate",
  "Unserviceable",
];
export function validateStage(stage, data, hasQuote = false) {
  if (!stages.includes(stage)) fail("Unknown lead stage.");
  if (
    stage === "Qualified" &&
    (!data.need || !data.timeline || !data.nextAction || !data.dueAt)
  )
    fail("Qualification needs project need, timeline and a dated next action.");
  if (stage === "Negotiation" && !hasQuote)
    fail("Negotiation requires an issued quotation.");
  if (
    stage === "Won" &&
    (!data.orderReference || minor(data.orderValue || "0") <= 0)
  )
    fail("Won requires an order reference and positive order value.");
  if (
    stage === "Lost" &&
    !["Price", "Competitor", "Timing", "Project cancelled", "Other"].includes(
      data.lostReason,
    )
  )
    fail("Choose a structured lost reason.");
  return true;
}
export function normalizeContact(c) {
  const name = String(c.name || "").trim(),
    email = String(c.email || "")
      .trim()
      .toLowerCase(),
    phone = String(c.phone || "").replace(/[\s()-]/g, "");
  if (name.length < 2 || name.length > 100) fail("Enter a name.", "name");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail("Enter a valid email.", "email");
  if (phone && !/^\+?[1-9]\d{7,14}$/.test(phone))
    fail("Include a valid country code and phone number.", "phone");
  if (!email && !phone) fail("Enter email or phone.", "contact");
  if (!/^\d{6}$/.test(String(c.pincode)))
    fail("Enter a six-digit pincode.", "pincode");
  if (
    !["Homeowner", "Contractor", "Architect", "Dealer", "Business"].includes(
      c.customerType,
    )
  )
    fail("Choose customer type.");
  if (
    !["Email", "Phone"].includes(c.preferred) ||
    (c.preferred === "Email" && !email) ||
    (c.preferred === "Phone" && !phone)
  )
    fail("Provide your preferred contact method.");
  if (c.acknowledged !== true) fail("Acknowledge enquiry processing.");
  return {
    name,
    email,
    phone,
    pincode: String(c.pincode),
    customerType: c.customerType,
    preferred: c.preferred,
    marketing: c.marketing === true,
    acknowledged: true,
    consentVersion: "2026-10-v1",
  };
}
