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

test("책상보다 위로 돌출된 파티션은 클릭과 지름길 모두 차단", () => {
  for (const r of layout.partitions) {
    const p = { x: (r.left + r.right) / 2, y: r.top + 0.005 };
    assert.equal(isWalkable(layout, p), false, r.name);
    const left = { x: r.left - 0.012, y: p.y },
      right = { x: r.right + 0.012, y: p.y };
    assert.equal(segmentWalkable(layout, left, right), false, r.name);
  }
  for (const seat of layout.seats) {
    const approach = layout.nodes[seat.approach],
      anchor = layout.nodes[seat.node];
    // 착석 전환은 해당 의자 중심의 세로 방향만 사용하며 옆 파티션을 넘지 않습니다.
    assert.equal(approach.x, anchor.x);
    for (let t = 0; t <= 1; t += 0.01) {
      const p = { x: approach.x, y: approach.y + (anchor.y - approach.y) * t };
      for (const r of layout.partitions)
        assert.ok(
          !(p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom),
        );
    }
  }
});
test("표본 간격보다 얇은 벽도 선분 교차로 차단", () => {
  const maze = {
    image: { width: 100, height: 100 },
    navigation: {
      radius: 0,
      step: 1,
      areas: [{ left: 0, right: 1, top: 0, bottom: 1 }],
      blockers: [{ left: 0.504, right: 0.505, top: 0, bottom: 1 }],
    },
  };
  assert.equal(
    segmentWalkable(maze, { x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }),
    false,
  );
});

test("발 중심만 바닥 안쪽이고 발 폭이 벽 밖인 위치도 차단", () => {
  assert.equal(
    isWalkable(layout, {
      x: layout.navigation.areas[0].right - 2 / 1705,
      y: 0.5,
    }),
    false,
  );
});
