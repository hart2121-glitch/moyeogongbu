import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRooms, makeRoom, CAPACITY } from "../src/study/rooms.js";

test("방 생성: 정원 6명, 고유 코드, 공백/과도한 이름 거부", () => {
  const rooms = [];
  for (let i = 0; i < 30; i++) rooms.push(makeRoom(`방 ${i}`, rooms));
  assert.equal(new Set(rooms.map((r) => r.code)).size, 30);
  assert.ok(
    rooms.every(
      (r) =>
        r.capacity === CAPACITY && r.kind === "owned" && r.theme === "company",
    ),
  );
  assert.throws(() => makeRoom("   ", rooms));
  assert.throws(() => makeRoom("가".repeat(31), rooms));
});
test("방 저장 복원과 손상된 저장값의 안전한 기본값", () => {
  const rooms = [makeRoom("내 회사", [])];
  assert.deepEqual(loadRooms({ getItem: () => JSON.stringify(rooms) }), rooms);
  for (const value of [
    "broken",
    "null",
    "{}",
    JSON.stringify([{ ...rooms[0], capacity: 99 }]),
    JSON.stringify([rooms[0], rooms[0]]),
  ]) {
    const fallback = loadRooms({ getItem: () => value });
    assert.equal(fallback[0].code, "MOYEO6");
  }
});
