import { test } from "node:test";
import assert from "node:assert/strict";
import { companyLayout as layout } from "../src/study/companyLayout.js";
import {
  navigateFloor,
  isWalkable,
  segmentWalkable,
} from "../src/study/navigation.js";
test("바닥 클릭 경로: 책상/벽/외부 거부, 테이블 반대쪽과 방 간 이동", () => {
  for (const p of [
    { x: 0.4, y: 0.55 },
    { x: 0.27, y: 0.65 },
    { x: 0.85, y: 0.6 },
    { x: 0.32, y: 0.35 },
    { x: NaN, y: 0.9 },
  ]) {
    assert.equal(isWalkable(layout, p), false);
    assert.throws(() => navigateFloor(layout, layout.nodes.entrance, p));
  }
  for (const p of [
    { x: 0.74, y: 0.8 },
    { x: 0.52, y: 0.86 },
    { x: 0.305, y: 0.68 },
    { x: 0.2, y: 0.51 },
    { x: 0.12, y: 0.895 },
  ]) {
    assert.ok(isWalkable(layout, p));
    const path = navigateFloor(layout, layout.nodes.entrance, p);
    assert.deepEqual(path.at(-1), p);
    for (let i = 1; i < path.length; i++)
      assert.ok(segmentWalkable(layout, path[i - 1], path[i]));
  }
});
test("대각선 모서리 지름길로 장애물을 통과하지 않음", () => {
  const maze = {
    image: { width: 100, height: 100 },
    navigation: {
      step: 2,
      radius: 0,
      areas: [{ left: 0, right: 1, top: 0, bottom: 1 }],
      blockers: [{ left: 0.3, right: 0.7, top: 0.2, bottom: 0.8 }],
    },
  };
  const route = navigateFloor(maze, { x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 });
  assert.ok(route.length > 2);
  for (let i = 1; i < route.length; i++)
    assert.ok(segmentWalkable(maze, route[i - 1], route[i]));
});
