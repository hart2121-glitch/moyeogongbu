import { test } from "node:test";
import assert from "node:assert/strict";
import { companyLayout as layout } from "../src/study/companyLayout.js";
import {
  planMovement,
  movementSegmentSafe,
} from "../src/study/movementPlan.js";
import { isWalkable } from "../src/study/navigation.js";

test("1·3·4·6번 좌우 퇴석·재착석의 모든 구간과 발 폭 검사", () => {
  for (const id of [1, 3, 4, 6]) {
    const seat = layout.seats.find((s) => s.id === id),
      anchor = layout.nodes[seat.node];
    for (const x of [0.315, 0.76]) {
      const target = { x, y: anchor.y };
      const out = planMovement(
        layout,
        { activity: "seated", seatId: id, position: anchor },
        target,
        { activity: "idle" },
      );
      assert.equal(out.segments[0].activity, "standing");
      assert.deepEqual(out.segments[0].to, layout.nodes[seat.approach]);
      assert.ok(out.segments.length >= 3, "의자 진입선과 통로를 거쳐 우회");
      const back = planMovement(
        layout,
        { activity: "idle", position: target },
        seat.node,
        { activity: "seated", seatId: id },
      );
      assert.equal(back.segments.at(-1).activity, "sitting");
      for (const segment of [...out.segments, ...back.segments]) {
        assert.ok(movementSegmentSafe(layout, segment));
        for (let t = 0; t <= 1; t += 0.005) {
          const p = {
            x: segment.from.x + (segment.to.x - segment.from.x) * t,
            y: segment.from.y + (segment.to.y - segment.from.y) * t,
          };
          for (const r of layout.partitions)
            assert.ok(
              !(
                p.x > r.left - 14 / 1705 &&
                p.x < r.right + 14 / 1705 &&
                p.y > r.top - 1.5 / 922 &&
                p.y < r.bottom + 1.5 / 922
              ),
              `${id}번 발 폭 침범`,
            );
        }
      }
    }
  }
  for (const r of layout.partitions)
    assert.equal(
      isWalkable(layout, { x: r.left - 6 / 1705, y: (r.top + r.bottom) / 2 }),
      false,
      "중심만 밖인 발 걸침 차단",
    );
});
test("착석 진입선도 파티션을 통과하면 실패하고 다른 좌석 예외는 허용하지 않음", () => {
  const seat = layout.seats[0],
    from = layout.nodes[seat.approach],
    to = layout.nodes[seat.node];
  const segment = { from, to, activity: "sitting", seatId: 1 };
  assert.ok(movementSegmentSafe(layout, segment));
  const blocked = {
    ...layout,
    navigation: {
      ...layout.navigation,
      blockers: [
        ...layout.navigation.blockers,
        {
          name: "추가 파티션",
          left: from.x - 0.01,
          right: from.x + 0.01,
          top: 0.45,
          bottom: 0.46,
        },
      ],
    },
  };
  assert.equal(movementSegmentSafe(blocked, segment), false);
  assert.throws(() =>
    planMovement(blocked, { activity: "idle", position: from }, seat.node, {
      seatId: 1,
    }),
  );
  assert.equal(
    movementSegmentSafe(layout, {
      ...segment,
      to: { x: to.x + 0.02, y: to.y },
    }),
    false,
  );
});
