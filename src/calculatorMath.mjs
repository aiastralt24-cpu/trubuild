export const SQFT_TO_M2 = 0.09290304;
export const adhesiveRules = Object.fromEntries(
  [
    ["trufix-110", 30, 5],
    ...[
      "220-grey",
      "220-plus-grey",
      "220-plus-white",
      "330-grey",
      "330-white",
      "440-grey",
      "440-white",
    ].map((id) => [`trufix-${id}`, 50, 3]),
  ].map(([id, sqft, thickness]) => [
    id,
    {
      rate: 20 / (sqft * SQFT_TO_M2),
      thickness,
      basis: `20 kg covers ${sqft} sq ft at ${thickness} mm. Uses the lower published coverage for planning.`,
    },
  ]),
);
export const waterproofRules = {
  "trubuild-aqualock": {
    rate: 1.75,
    basis: "1.65–1.75 kg/m² for two coats; 0.8–1 mm dry film thickness.",
  },
  "trubuild-aqualock-flexi": {
    rate: 2,
    basis: "1.8–2 kg/m² for two coats; 1.2–1.5 mm dry film thickness.",
  },
  "trubuild-waterproofing-membrane-tru-pu": {
    rate: 1.2,
    basis: "1.1–1.2 kg/m² for two coats. Primer is additional.",
  },
  "tru-pu-pura-1k": {
    rate: 1.6,
    basis: "1.5–1.6 kg/m² to achieve 1 mm dry film thickness.",
  },
};
export function packSizes(product) {
  return [
    ...new Set(
      [...product.packaging.matchAll(/(\d+(?:\.\d+)?)\s*(kg|gm|g)\b/gi)].map(
        (m) => Number(m[1]) * (m[2].toLowerCase() === "kg" ? 1 : 0.001),
      ),
    ),
  ].sort((a, b) => a - b);
}
function positive(value, name, max = 100000) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > max)
    throw Error(`Enter a valid ${name} greater than zero (maximum ${max}).`);
  return n;
}
export function estimateMaterial(kind, input, rate) {
  if (!["tile-adhesive", "grout", "waterproofing"].includes(kind))
    throw Error("Choose a calculator.");
  if (!["m2", "ft2"].includes(input.unit)) throw Error("Choose an area unit.");
  const area =
    positive(input.area, "area", 10000) *
    (input.unit === "ft2" ? SQFT_TO_M2 : 1);
  const waste = Number(input.waste);
  if (input.waste === "" || !Number.isFinite(waste) || waste < 0 || waste > 30)
    throw Error("Allowance must be between 0 and 30%.");
  let consumption = positive(rate, "consumption rate", 100);
  if (kind === "grout") {
    const l = positive(input.length, "tile length", 3000),
      w = positive(input.width, "tile width", 3000),
      j = positive(input.joint, "joint width", 50),
      d = positive(input.depth, "joint depth", 100);
    if (j >= Math.min(l, w))
      throw Error("Joint width must be smaller than the tile dimensions.");
    consumption = ((l + w) / (l * w)) * j * d * consumption;
  }
  const pack = positive(input.pack, "pack size", 1000),
    net = area * consumption,
    total = net * (1 + waste / 100);
  const packs = Math.ceil(total / pack - 1e-10);
  return {
    area,
    consumption,
    net,
    total,
    packs,
    purchase: packs * pack,
    surplus: packs * pack - total,
  };
}
