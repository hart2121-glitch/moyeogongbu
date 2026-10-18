import { test } from "node:test";
import assert from "node:assert/strict";
import { companyFinalLayout as layout } from "../src/study/companyFinalLayout.js";
import { distance } from "../src/study/pathfinding.js";
import { navigateFloor, segmentWalkable } from "../src/study/navigation.js";

test("최종 원본 비율·6석 방향별 배열·공간 경로와 주요 가구 회피", () => {
  assert.deepEqual(layout.image, { width: 1705, height: 922 });
  assert.equal(layout.seats.length, 6);
  assert.equal(layout.backgroundPeople.length, 0);
  for (const [id, node] of Object.entries(layout.nodes)) {
    assert.ok(node.x >= 0 && node.x <= 1 && node.y >= 0 && node.y <= 1, id);
  }
  for (let i = 0; i < 3; i++) {
    assert.ok(layout.seats[i].label.y < layout.seats[i + 3].label.y);
    if (i < 2) assert.ok(layout.seats[i].label.x < layout.seats[i + 1].label.x);
  }
  const destinations = [
    "entrance",
    "sofa",
    "loungeFloor",
    "restroom",
    ...layout.seats.map((s) => s.approach),
  ];
  for (const from of destinations)
    for (const to of destinations) {
      const route = navigateFloor(layout, layout.nodes[from], layout.nodes[to]);
      for (let i = 1; i < route.length; i++)
        assert.ok(segmentWalkable(layout, route[i - 1], route[i]));
    }
  for (const seat of layout.seats) {
    const anchor = layout.nodes[seat.node],
      r = seat.foreground;
    assert.ok(anchor.x > r.left && anchor.x < r.right);
    assert.ok(
      anchor.y > r.top && anchor.y < r.bottom,
      "다리 가림 영역 안의 착석 앵커",
    );
  }
  assert.equal(distance({ x: 0, y: 0 }, { x: 1, y: 0 }, layout.image), 1705);
  assert.equal(distance({ x: 0, y: 0 }, { x: 0, y: 1 }, layout.image), 922);
});
