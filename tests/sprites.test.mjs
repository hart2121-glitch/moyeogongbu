import { test } from "node:test";
import assert from "node:assert/strict";
import {
  characterSprites,
  resolveSprite,
} from "../src/study/characterSprites.js";

test("걷기 이미지 미등록 상태는 확정 정면 이미지로 유지", () => {
  assert.deepEqual(
    resolveSprite("walking", "up").frames,
    characterSprites.idle.down,
  );
  assert.equal(resolveSprite("walking", "left").mirror, false);
});
test("방향별 걷기 프레임 등록 시 순서를 유지하고 왼쪽 프레임을 재반전하지 않음", () => {
  const sprites = {
    idle: { down: ["idle.png"] },
    walking: { left: ["left-step-1.png", "left-step-2.png"], up: [] },
  };
  assert.deepEqual(resolveSprite("walking", "left", sprites), {
    frames: ["left-step-1.png", "left-step-2.png"],
    mirror: false,
  });
  assert.deepEqual(resolveSprite("walking", "up", sprites), {
    frames: ["idle.png"],
    mirror: false,
  });
});
