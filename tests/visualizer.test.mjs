import test from "node:test";
import assert from "node:assert/strict";
import {
  homography,
  invert,
  project,
  validQuad,
  rooms,
} from "../src/visualizerEngine.mjs";

test("material projection maps all corners and round-trips perspective coordinates", () => {
  for (const q of [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    ...rooms.flatMap((r) => [r.floor.quad, r.wall.quad]),
  ]) {
    const matrix = homography(q),
      inverse = invert(matrix);
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].forEach(([x, y], i) => {
      const result = project(matrix, x, y);
      result.forEach((v, j) => assert.ok(Math.abs(v - q[i][j]) < 1e-8));
    });
    for (const [x, y] of [
      [0.2, 0.4],
      [0.8, 0.9],
      [0.5, 0.5],
    ]) {
      const back = project(inverse, ...project(matrix, x, y));
      assert.ok(Math.abs(back[0] - x) < 1e-8 && Math.abs(back[1] - y) < 1e-8);
    }
  }
});
test("surface mapping rejects crossed, tiny and degenerate selections", () => {
  assert.equal(
    validQuad([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]),
    true,
  );
  assert.equal(
    validQuad([
      [0, 0],
      [1, 1],
      [1, 0],
      [0, 1],
    ]),
    false,
  );
  assert.equal(
    validQuad([
      [0, 0],
      [0.01, 0],
      [0.01, 0.01],
      [0, 0.01],
    ]),
    false,
  );
  assert.equal(
    validQuad([
      [0, 0],
      [0.1, 0.1],
      [0.2, 0.2],
      [0.3, 0.3],
    ]),
    false,
  );
  assert.equal(validQuad([[0, 0]]), false);
  assert.equal(
    invert(
      homography([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]),
    ),
    null,
  );
});

import {
  cleanDesign,
  cleanFinishes,
  tileEstimate,
} from "../src/visualizerState.mjs";
test("shared and stored designs cannot inject invalid material or geometry values", () => {
  assert.equal(cleanDesign({ roomId: "upload", finishes: {} }), null);
  assert.equal(cleanDesign({ roomId: "not-a-room" }), null);
  const d = cleanDesign({
    roomId: "living",
    finishes: {
      floor: {
        shade: 999,
        width: -2,
        size: 0,
        material: "invalid",
        layout: "invalid",
      },
      wall: {
        shade: 5,
        width: 5,
        size: 300,
        material: "marble",
        layout: "brick",
      },
    },
  });
  assert.equal(d.finishes.floor.shade, 0);
  assert.equal(d.finishes.floor.width, 3);
  assert.equal(d.finishes.floor.size, 600);
  assert.equal(d.finishes.wall.material, "marble");
  assert.equal(cleanFinishes(null).wall, null);
});
test("tile planner rounds up and rejects invalid quantities", () => {
  assert.deepEqual(tileEstimate(20, 600, 10), { count: 62, purchaseArea: 22 });
  assert.equal(tileEstimate(9, 300, 0).count, 100);
  for (const args of [
    [0, 600, 10],
    [-1, 600, 10],
    [NaN, 600, 10],
    [20, 0, 10],
    [20, 600, 31],
  ])
    assert.equal(tileEstimate(...args), null);
});

import {
  sampleLayout,
  surfaceKeys,
  layouts,
} from "../src/visualizerEngine.mjs";
import { tileDimensions } from "../src/visualizerState.mjs";
import { existsSync } from "node:fs";
test("room library has unique scenes, all six categories and valid mapped surfaces", () => {
  assert.equal(new Set(rooms.map((r) => r.id)).size, rooms.length);
  assert.equal(new Set(rooms.map((r) => r.category)).size, 6);
  assert.ok(rooms.length >= 10);
  for (const r of rooms) {
    assert.ok(
      existsSync(new URL("../public" + r.image, import.meta.url)),
      r.image,
    );
    for (const key of surfaceKeys) {
      if (!r[key]) continue;
      assert.ok(validQuad(r[key].quad), r.id + " " + key);
      assert.ok(r[key].cols > 0 && r[key].rows > 0);
    }
  }
});
test("rectangular layouts use their actual tile area in quantity estimates", () => {
  for (const layout of ["brick", "vertical", "basket", "herringbone"]) {
    assert.equal(tileEstimate(9, 300, 0, layout).count, 50);
    assert.equal(
      tileDimensions(300, layout).reduce((a, b) => a * b),
      180000,
    );
  }
  assert.equal(tileEstimate(9, 300, 0, "checker").count, 100);
});
test("pattern boundaries remain finite across negative coordinates and internal domino joins", () => {
  for (const [id] of layouts)
    for (const [x, y] of [
      [-0.2, -1.1],
      [0, 0],
      [1.5, 2.3],
      [10.3, 4.8],
    ]) {
      const p = sampleLayout(x, y, id);
      assert.ok(Number.isFinite(p.dx + p.dy));
      assert.ok(p.dx >= 0 && p.dy >= 0);
    }
  assert.equal(sampleLayout(1, 0.5, "herringbone").dx, 1); // internal horizontal join is not grout
  assert.equal(sampleLayout(3.5, 1, "herringbone").dy, 1); // internal vertical join is not grout
  assert.equal(sampleLayout(0.2, 0.2, "checker").alternate, false);
  assert.equal(sampleLayout(1.2, 0.2, "checker").alternate, true);
});
test("new surface finishes and rotation survive sharing while invalid rotation is rejected", () => {
  const d = cleanDesign({
    roomId: "pool",
    finishes: {
      wall2: {
        rotation: 270,
        material: "slate",
        layout: "herringbone",
        size: 300,
        shade: 4,
        width: 2,
      },
    },
  });
  assert.equal(d.finishes.wall2.rotation, 270);
  assert.equal(d.finishes.wall2.layout, "herringbone");
  assert.equal(cleanFinishes({ floor: { rotation: 23 } }).floor.rotation, 0);
});
