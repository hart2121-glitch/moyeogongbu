// 앞줄에 앉은 사람의 캐릭터가 덮는 뒷줄 좌석 번호 (2026-11-11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { coveredSeatIds } from "../src/study/seatMarkers.js";
import { companyFinalLayout as layout } from "../src/study/companyFinalLayout.js";

const seatsWith = (leases) => layout.seats.map((seat) => ({ ...seat, lease: leases[seat.id] ?? null }));

test("4번에 앉으면 바로 뒤 1번 번호만 가려진다", () => {
  assert.deepEqual([...coveredSeatIds(seatsWith({ 4: { state: "occupied" } }), layout)], [1]);
});

test("뒷줄에 앉거나 자리로 걸어가는 중이면 가려지는 번호가 없다", () => {
  assert.equal(coveredSeatIds(seatsWith({ 1: { state: "occupied" }, 2: { state: "occupied" } }), layout).size, 0);
  assert.equal(coveredSeatIds(seatsWith({ 5: { state: "reserved" } }), layout).size, 0);
});

test("앞줄이 다 차면 뒷줄 번호 셋이 모두 가려진다", () => {
  const covered = coveredSeatIds(seatsWith({ 4: { state: "occupied" }, 5: { state: "occupied" }, 6: { state: "occupied" } }), layout);
  assert.deepEqual([...covered].sort(), [1, 2, 3]);
});
