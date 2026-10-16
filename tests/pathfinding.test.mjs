import { test } from "node:test";
import assert from "node:assert/strict";
import { findPath } from "../src/study/pathfinding.js";

test("통로 그래프의 간선만 따라 이동하고 직선 지름길은 사용하지 않음", () => {
  const graph = {
    nodes: {
      door: { x: 0, y: 1 },
      left: { x: 0, y: 0 },
      back: { x: 1, y: 0 },
      seat: { x: 1, y: 1 },
    },
    edges: [
      ["door", "left"],
      ["left", "back"],
      ["back", "seat"],
    ],
  };
  assert.deepEqual(findPath(graph, "door", "seat"), [
    "door",
    "left",
    "back",
    "seat",
  ]);
  assert.deepEqual(findPath(graph, "seat", "door"), [
    "seat",
    "back",
    "left",
    "door",
  ]);
  assert.deepEqual(findPath(graph, "seat", "seat"), ["seat"]);
  assert.throws(() => findPath({ ...graph, edges: [] }, "door", "seat"));
  assert.throws(() => findPath(graph, "missing", "seat"));
});
