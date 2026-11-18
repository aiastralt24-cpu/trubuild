import {
  defaultFinish,
  materials,
  rooms,
  shades,
  layouts,
  surfaceKeys,
} from "./visualizerEngine.mjs";
export const STORAGE_KEY = "trubuild-studio-v2";
export function cleanFinishes(input) {
  const result = {};
  for (const surface of surfaceKeys) {
    const f = input?.[surface];
    if (!f) {
      result[surface] = surface === "floor" ? defaultFinish() : null;
      continue;
    }
    result[surface] = {
      shade:
        Number.isInteger(f.shade) && f.shade >= 0 && f.shade < shades.length
          ? f.shade
          : 0,
      width:
        Number.isInteger(f.width) && f.width >= 1 && f.width <= 10
          ? f.width
          : 3,
      material: materials.some((m) => m.id === f.material)
        ? f.material
        : "limestone",
      layout: layouts.some(([id]) => id === f.layout) ? f.layout : "grid",
      rotation: [0, 90, 180, 270].includes(f.rotation) ? f.rotation : 0,
      size: [300, 600, 900].includes(f.size) ? f.size : 600,
    };
  }
  return result;
}
export function cleanDesign(value) {
  if (!value || !rooms.some((r) => r.id === value.roomId)) return null;
  return { roomId: value.roomId, finishes: cleanFinishes(value.finishes) };
}
export function tileDimensions(size, layout) {
  return ["brick", "basket", "herringbone"].includes(layout)
    ? [size * 2, size]
    : layout === "vertical"
      ? [size, size * 2]
      : [size, size];
}
export function tileEstimate(area, size, waste, layout = "grid") {
  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    area > 100000 ||
    ![300, 600, 900].includes(size) ||
    !Number.isFinite(waste) ||
    waste < 0 ||
    waste > 30
  )
    return null;
  const [width, height] = tileDimensions(size, layout);
  const tileArea = (width * height) / 1e6;
  return {
    count: Math.ceil((area * (1 + waste / 100)) / tileArea),
    purchaseArea: area * (1 + waste / 100),
  };
}
export const finishPresets = [
  {
    name: "Soft & seamless",
    description: "Limestone · warm ivory",
    finish: { ...defaultFinish() },
  },
  {
    name: "Defined contrast",
    description: "Marble · charcoal",
    finish: { ...defaultFinish(), material: "marble", shade: 5 },
  },
  {
    name: "Contemporary grey",
    description: "Concrete · silver grey",
    finish: {
      ...defaultFinish(),
      material: "concrete",
      shade: 3,
      layout: "brick",
    },
  },
];
