import { test } from "node:test";
import assert from "node:assert/strict";
import { createReactionGate, formatStudyTime, parseMove, presenceLabel } from "../src/features/room/model/roomRules.ts";

// roomConfig.ts의 값과 같다 (roomConfig는 다른 모듈을 불러오지 않지만 이 시험은 규칙 함수만 본다).
const REACTION_KEYS = ["thumbs", "fire", "clap", "coffee", "muscle", "heart", "cheer", "goodjob", "rest"];
const INTERVAL_MS = 5000;

test("반응: 정해진 9개 키만, 같은 사람은 5초에 한 번", () => {
  const gate = createReactionGate(REACTION_KEYS, INTERVAL_MS);
  assert.equal(gate("a", "fire", 1000), true);
  assert.equal(gate("a", "clap", 1000 + INTERVAL_MS - 1), false);
  assert.equal(gate("b", "clap", 1500), true);
  assert.equal(gate("a", "clap", 1000 + INTERVAL_MS), true);
  assert.equal(gate("c", "자유 채팅", 1000), false);
  assert.equal(gate("", "fire", 1000), false);
});

test("이동 메시지: 목적지만, 형식이 틀리면 버린다", () => {
  const nodes = { entrance: {}, sofa: {} };
  assert.deepEqual(parseMove({ to: "sofa", activity: "resting", seatId: null }, nodes, 6), { to: "sofa", activity: "resting", seatId: null });
  assert.deepEqual(parseMove({ to: { x: 0.5, y: 0.9 }, activity: "idle" }, nodes, 6), { to: { x: 0.5, y: 0.9 }, activity: "idle", seatId: null });
  for (const bad of [null, { to: "roof", activity: "idle" }, { to: { x: 2, y: 0 }, activity: "idle" }, { to: "sofa", activity: "fly" }, { to: "sofa", activity: "seated", seatId: 7 }, { to: "sofa", activity: "seated" }])
    assert.equal(parseMove(bad, nodes, 6), null);
});

test("마우스 올림 상태와 오늘 공부 시간 문구", () => {
  assert.equal(presenceLabel("seated", "studying"), "공부 중");
  assert.equal(presenceLabel("restroom", "break"), "화장실");
  assert.equal(presenceLabel("resting", "break"), "휴식");
  assert.equal(formatStudyTime(2 * 3600 + 5 * 60 + 30), "2시간 5분");
  assert.equal(formatStudyTime(59), "0분");
});
