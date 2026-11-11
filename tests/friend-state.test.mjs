import { test } from "node:test";
import assert from "node:assert/strict";
import { friendPlace, visibleState } from "../src/features/friends/model/friendText.ts";

// 친구 상태 표시: 방에 있는 친구를 "오프라인"으로 보이지 않는다.
test("방에 있는데 공부 세션이 없는 친구는 휴식 중으로 보인다", () => {
  assert.equal(visibleState("offline", true), "break");
  assert.equal(friendPlace({ state: visibleState("offline", true), inRoom: true, roomName: "우리 회사" }), "우리 회사에서 휴식 중");
});

test("방 밖이거나 이미 상태가 있으면 서버 상태 그대로", () => {
  assert.equal(visibleState("offline", false), "offline");
  assert.equal(visibleState("studying", true), "studying");
  assert.equal(visibleState("away", true), "away");
});
