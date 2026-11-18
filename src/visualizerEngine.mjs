import { additionalRooms } from "./visualizerRooms.mjs";
// Project a square material plane into a photographed quadrilateral.
export function homography(points) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2,
    dx2 = x3 - x2,
    dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2,
    dy2 = y3 - y2,
    dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-10) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / det,
    h = (dx1 * dy3 - dx3 * dy1) / det;
  return [
    x1 - x0 + g * x1,
    x3 - x0 + h * x3,
    x0,
    y1 - y0 + g * y1,
    y3 - y0 + h * y3,
    y0,
    g,
    h,
    1,
  ];
}
export function invert(m) {
  if (!m) return null;
  const [a, b, c, d, e, f, g, h, i] = m;
  const out = [
    e * i - f * h,
    c * h - b * i,
    b * f - c * e,
    f * g - d * i,
    a * i - c * g,
    c * d - a * f,
    d * h - e * g,
    b * g - a * h,
    a * e - b * d,
  ];
  const det = a * out[0] + b * out[3] + c * out[6];
  return Math.abs(det) < 1e-10 ? null : out.map((x) => x / det);
}
export function project(m, x, y) {
  const d = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / d, (m[3] * x + m[4] * y + m[5]) / d];
}
export function validQuad(points) {
  if (points.length !== 4) return false;
  const cross = points.map((p, i) => {
    const q = points[(i + 1) % 4],
      r = points[(i + 2) % 4];
    return (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]);
  });
  const area =
    Math.abs(
      points.reduce(
        (a, p, i) =>
          a + p[0] * points[(i + 1) % 4][1] - points[(i + 1) % 4][0] * p[1],
        0,
      ),
    ) / 2;
  return (
    area > 0.008 && (cross.every((x) => x > 0) || cross.every((x) => x < 0))
  );
}
export const shades = [
  ["Warm ivory", "#d9d0bb"],
  ["Porcelain", "#eeece4"],
  ["Sandstone", "#c3b199"],
  ["Silver grey", "#a9aca9"],
  ["Stone grey", "#797d79"],
  ["Charcoal", "#383e3c"],
  ["Almond", "#c5bba9"],
  ["Taupe", "#978a7d"],
  ["Mocha", "#79685b"],
  ["Terracotta", "#aa7662"],
  ["Sage", "#88978a"],
  ["Slate blue", "#677e87"],
];
export const materials = [
  { id: "terrazzo", name: "Terrazzo", base: [219, 210, 191] },
  { id: "slate", name: "Slate", base: [92, 102, 106] },
  { id: "terracotta", name: "Terracotta", base: [179, 113, 81] },
  { id: "limestone", name: "Limestone", base: [201, 191, 170] },
  { id: "concrete", name: "Concrete", base: [156, 158, 153] },
  { id: "marble", name: "Marble", base: [229, 228, 220] },
];
export const rooms = [
  {
    id: "living",
    name: "Living room",
    category: "Living room",
    style: "Light · modern",
    image: "/images/hero-interior-floor.webp",
    floor: {
      quad: [
        [0.28, 0.255],
        [0.79, 0.255],
        [1.65, 1],
        [-0.8, 1],
      ],
      mask: [
        [0, 0.299681],
        [0.052632, 0.29543],
        [0.052632, 0.308183],
        [0.065789, 0.311371],
        [0.101675, 0.310308],
        [0.118421, 0.306057],
        [0.118421, 0.285866],
        [0.197967, 0.285866],
        [0.197967, 0.300744],
        [0.207536, 0.301807],
        [0.209928, 0.283741],
        [0.316388, 0.268863],
        [0.316388, 0.27949],
        [0.322967, 0.27949],
        [0.322967, 0.2678],
        [0.407297, 0.260361],
        [0.409689, 0.272051],
        [0.415072, 0.272051],
        [0.416866, 0.258236],
        [0.424641, 0.257173],
        [0.431818, 0.260361],
        [0.447368, 0.260361],
        [0.453947, 0.253985],
        [0.488636, 0.256111],
        [0.503589, 0.259299],
        [0.581938, 0.259299],
        [0.585526, 0.25186],
        [0.815789, 0.272051],
        [0.819378, 0.277365],
        [0.864234, 0.27949],
        [0.864234, 0.311371],
        [1, 0.328374],
        [1, 1],
        [0, 1],
      ],
      cols: 5,
      rows: 6,
    },
    wall: {
      quad: [
        [0.867823, 0],
        [1, 0],
        [1, 0.282678],
        [0.867823, 0.274176],
      ],
      cols: 2,
      rows: 3,
    },
  },
  {
    id: "bathroom",
    name: "Bathroom",
    category: "Bathroom",
    style: "Natural · stone",
    image: "/images/tiles.webp",
    floor: {
      quad: [
        [0.2, 0.73],
        [0.8, 0.73],
        [1.12, 1],
        [-0.18, 1],
      ],
      mask: [
        [0, 0.880037],
        [0.2, 0.731022],
        [0.26125, 0.727273],
        [0.299375, 0.719775],
        [0.299375, 0.727273],
        [0.309375, 0.72821],
        [0.3225, 0.714152],
        [0.576875, 0.713215],
        [0.576875, 0.72821],
        [0.58625, 0.72821],
        [0.58625, 0.713215],
        [0.666875, 0.712277],
        [0.68625, 0.787254],
        [0.69, 0.787254],
        [0.69, 0.712277],
        [0.796875, 0.712277],
        [0.796875, 0.77507],
        [0.805625, 0.802249],
        [0.89625, 1],
        [0, 1],
      ],
      cols: 4,
      rows: 4,
    },
    wall: {
      quad: [
        [0.261875, 0],
        [0.798125, 0],
        [0.798125, 0.712277],
        [0.261875, 0.712277],
      ],
      cols: 4,
      rows: 4,
      mask: [
        [0.261875, 0],
        [0.798125, 0],
        [0.798125, 0.548266],
        [0.784375, 0.548266],
        [0.784375, 0.62418],
        [0.798125, 0.640112],
        [0.798125, 0.712277],
        [0.261875, 0.727273],
      ],
      exclusions: [
        [
          [0.665625, 0],
          [0.66875, 0],
          [0.66875, 0.712277],
          [0.665625, 0.712277],
        ],
        [
          [0.686875, 0],
          [0.69, 0],
          [0.69, 0.712277],
          [0.686875, 0.712277],
        ],
        [
          [0.761875, 0.342081],
          [0.798125, 0.342081],
          [0.798125, 0.414246],
          [0.761875, 0.414246],
        ],
        [
          [0.735625, 0.081537],
          [0.798125, 0.081537],
          [0.798125, 0.091846],
          [0.741875, 0.091846],
          [0.740625, 0.109653],
          [0.760625, 0.114339],
          [0.76375, 0.123711],
          [0.755, 0.132146],
          [0.733125, 0.133083],
          [0.715625, 0.125586],
          [0.713125, 0.117151],
          [0.71875, 0.111528],
          [0.734375, 0.108716],
        ],
        [
          [0.29, 0.604499],
          [0.306875, 0.594189],
          [0.336875, 0.594189],
          [0.35, 0.584817],
          [0.384375, 0.581068],
          [0.404375, 0.589503],
          [0.406875, 0.579194],
          [0.423125, 0.573571],
          [0.43375, 0.57732],
          [0.433125, 0.589503],
          [0.428125, 0.595127],
          [0.59375, 0.594189],
          [0.59625, 0.604499],
          [0.59625, 0.621368],
          [0.58625, 0.621368],
          [0.58625, 0.712277],
          [0.576875, 0.712277],
          [0.576875, 0.621368],
          [0.39375, 0.621368],
          [0.3925, 0.675726],
          [0.335, 0.680412],
          [0.335, 0.621368],
          [0.3225, 0.621368],
          [0.3225, 0.712277],
          [0.299375, 0.727273],
          [0.299375, 0.620431],
          [0.29, 0.620431],
        ],
      ],
    },
  },
];
rooms.push(...additionalRooms);
export const surfaceKeys = ["floor", "wall", "wall2"];
export const layouts = [
  ["grid", "Grid"],
  ["brick", "Brick"],
  ["vertical", "Vertical stack"],
  ["diagonal", "Diagonal"],
  ["checker", "Checkered"],
  ["basket", "Basketweave"],
  ["herringbone", "Herringbone"],
  ["stripe", "Striped"],
];
export const defaultFinish = () => ({
  shade: 0,
  width: 3,
  material: "limestone",
  layout: "grid",
  size: 600,
  rotation: 0,
});
function polygon(ctx, points, w, h) {
  ctx.beginPath();
  points.forEach(([x, y], i) =>
    i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h),
  );
  ctx.closePath();
}
// Weak keys release image data when a room/photo is discarded. Bounded size caches
// avoid retaining intermediate resolutions while the viewport changes.
const lightingCache = new WeakMap();
const maskCache = new WeakMap();
function cachedLighting(photo, w, h) {
  let cache = lightingCache.get(photo);
  const key = `${w}x${h}`;
  if (cache?.key === key) return cache.data;
  const lighting = document.createElement("canvas");
  lighting.width = w;
  lighting.height = h;
  const lc = lighting.getContext("2d", { willReadFrequently: true });
  lc.filter = "blur(9px)";
  lc.drawImage(photo, 0, 0, w, h);
  const data = lc.getImageData(0, 0, w, h).data;
  lightingCache.set(photo, { key, data });
  return data;
}
function cachedMask(geometry, w, h, photo) {
  const key = `${w}x${h}`;
  let cache = maskCache.get(geometry);
  if (cache?.key === key) return cache;
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mc = mask.getContext("2d", { willReadFrequently: true });
  polygon(mc, geometry.mask || geometry.quad, w, h);
  mc.fill();
  // Keep fixtures visible inside a surface, not just along its perimeter.
  mc.globalCompositeOperation = "destination-out";
  for (const exclusion of geometry.exclusions || []) {
    polygon(mc, exclusion, w, h);
    mc.fill();
  }
  mc.globalCompositeOperation = "source-over";
  if (geometry.foliage?.length) {
    const detail = document.createElement("canvas");
    detail.width = w;
    detail.height = h;
    const dc = detail.getContext("2d", { willReadFrequently: true });
    for (const outline of geometry.foliage) {
      polygon(dc, outline, w, h);
      dc.fill();
    }
    const region = dc.getImageData(0, 0, w, h).data;
    dc.clearRect(0, 0, w, h);
    dc.drawImage(photo, 0, 0, w, h);
    const original = dc.getImageData(0, 0, w, h).data;
    const cutout = mc.getImageData(0, 0, w, h);
    for (let i = 0; i < region.length; i += 4) {
      if (!region[i + 3]) continue;
      const luminance =
        original[i] * 0.2126 +
        original[i + 1] * 0.7152 +
        original[i + 2] * 0.0722;
      const background = Math.max(0, Math.min(1, (luminance - 110) / 40));
      cutout.data[i + 3] *= 1 - (region[i + 3] / 255) * (1 - background);
    }
    mc.putImageData(cutout, 0, 0);
  }
  cache = { key, mask, mc, alpha: mc.getImageData(0, 0, w, h) };
  maskCache.set(geometry, cache);
  return cache;
}
// Canvas-only material renderer: uploaded images never leave this browser.
export function renderSurface(ctx, photo, geometry, finish) {
  const w = ctx.canvas.width,
    h = ctx.canvas.height;
  const inv = invert(homography(geometry.quad));
  if (!inv) return;
  const { mask, mc, alpha } = cachedMask(geometry, w, h, photo);
  const pixels = new ImageData(new Uint8ClampedArray(alpha.data), w, h);
  const light = cachedLighting(photo, w, h);
  const material =
    materials.find((m) => m.id === finish.material) || materials[0];
  const hex = shades[finish.shade][1];
  const grout = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const cols = (geometry.cols * 600) / finish.size,
    rows = (geometry.rows * 600) / finish.size;
  const gap = finish.width / finish.size;
  const angle =
    (((finish.rotation || 0) + (finish.layout === "diagonal" ? 45 : 0)) *
      Math.PI) /
    180;
  const a = Math.cos(angle),
    b = Math.sin(angle);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (!pixels.data[p + 3]) continue;
      const [u, v] = project(inv, x / w, y / h);
      if (!Number.isFinite(u + v)) {
        pixels.data[p + 3] = 0;
        continue;
      }
      const px = u * cols,
        py = v * rows;
      const tx = a * px - b * py,
        ty = b * px + a * py;
      const pattern = sampleLayout(tx, ty, finish.layout);
      const { fx, fy } = pattern;
      const divisor = (inv[6] * x) / w + (inv[7] * y) / h + inv[8];
      const dux = ((inv[0] - u * inv[6]) / divisor / w) * cols,
        duy = ((inv[1] - u * inv[7]) / divisor / h) * cols;
      const dvx = ((inv[3] - v * inv[6]) / divisor / w) * rows,
        dvy = ((inv[4] - v * inv[7]) / divisor / h) * rows;
      const wx = Math.max(
          1e-6,
          Math.abs(a * dux - b * dvx) + Math.abs(a * duy - b * dvy),
        ),
        wy = Math.max(
          1e-6,
          Math.abs(b * dux + a * dvx) + Math.abs(b * duy + a * dvy),
        );
      const coverage = (distance, pixel) =>
        Math.max(0, Math.min(1, 0.5 + (gap / 2 - distance) / pixel));
      const joint = Math.max(
        coverage(pattern.dx, wx),
        coverage(pattern.dy, wy),
      );
      const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const grain = (noise - Math.floor(noise) - 0.5) * 5;
      const cloud =
        Math.sin(u * 29 + Math.cos(v * 17)) * 2 + Math.cos(v * 37 + u * 12) * 2;
      const vein =
        material.id === "marble"
          ? Math.pow(
              (Math.sin(fx * 12 + fy * 17 + Math.sin(fy * 28) * 0.6) + 1) / 2,
              100,
            ) * 24
          : 0;
      const shade =
        0.3 +
        ((light[p] * 0.2126 + light[p + 1] * 0.7152 + light[p + 2] * 0.0722) /
          255) *
          0.95;
      const accent = pattern.alternate ? -28 : 0;
      const fleck =
        material.id === "terrazzo"
          ? Math.sin(Math.floor(tx * 55) * 31 + Math.floor(ty * 55) * 71) > 0.93
            ? -45
            : 0
          : 0;
      const tileVariation =
        Math.sin(Math.floor(tx) * 17 + Math.floor(ty) * 31) * 3;
      for (let c = 0; c < 3; c++)
        pixels.data[p + c] = Math.min(
          255,
          Math.max(
            0,
            ((grout[c] + grain) * joint +
              (material.base[c] +
                grain +
                cloud -
                vein +
                tileVariation +
                accent +
                fleck) *
                (1 - joint)) *
              shade,
          ),
        );
    }
  mc.putImageData(pixels, 0, 0);
  ctx.drawImage(mask, 0, 0);
}
export function renderRoom(canvas, photo, room, finishes) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
  for (const surface of surfaceKeys)
    if (room[surface] && finishes[surface])
      renderSurface(ctx, photo, room[surface], finishes[surface]);
}

// Tile boundaries in plane coordinates. Rectangular patterns use a 2:1 aspect.
export function sampleLayout(x, y, layout) {
  const mod = (n, d) => ((n % d) + d) % d;
  let tx = x,
    ty = y,
    sx = 1,
    sy = 1;
  if (layout === "brick") {
    sx = 2;
    tx = x / 2 + (mod(Math.floor(y), 2) ? 0.5 : 0);
  }
  if (layout === "vertical") {
    sy = 2;
    ty = y / 2;
  }
  if (layout === "basket") {
    if (mod(Math.floor(x / 2) + Math.floor(y / 2), 2) === 0) {
      sx = 2;
      tx = x / 2;
    } else {
      sy = 2;
      ty = y / 2;
    }
  }
  if (layout === "herringbone") {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      m = mod(ix - iy, 4);
    if (m < 2) {
      sx = 2;
      tx = (mod(x, 1) + m) / 2;
      ty = mod(y, 1);
    } else {
      sy = 2;
      tx = mod(x, 1);
      ty = (mod(y, 1) + (m === 2 ? 1 : 0)) / 2;
    }
  }
  const fx = mod(tx, 1),
    fy = mod(ty, 1);
  return {
    fx,
    fy,
    dx: Math.min(fx, 1 - fx) * sx,
    dy: Math.min(fy, 1 - fy) * sy,
    alternate:
      layout === "checker"
        ? mod(Math.floor(x) + Math.floor(y), 2) === 1
        : layout === "stripe" && mod(Math.floor(y), 2) === 1,
  };
}
