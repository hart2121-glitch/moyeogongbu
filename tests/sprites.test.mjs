// Story 009: 캐릭터 레이어 시트의 칸 번호 규칙.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  BODY_SHEET,
  characterSprites,
  frameIndex,
  resolvePose,
  SHEET_FRAME,
  spriteFootCenterX,
  spriteFootPadding,
} from "../src/study/characterSprites.js";
import { decodePng } from "../tools/art/pixelArt.mjs";

test("서기는 방향마다 0~3번 칸", () => {
  assert.deepEqual(["down", "up", "left", "right"].map((d) => frameIndex("idle", d)), [0, 1, 2, 3]);
});

test("걷기는 방향마다 4칸씩 이어지고 프레임은 4로 돈다", () => {
  assert.deepEqual([0, 1, 2, 3].map((f) => frameIndex("walk", "down", f)), [4, 5, 6, 7]);
  assert.deepEqual([0, 1, 2, 3].map((f) => frameIndex("walk", "right", f)), [16, 17, 18, 19]);
  assert.equal(frameIndex("walk", "left", 6), frameIndex("walk", "left", 2));
});

test("의자 앉기는 정면과 뒷모습 칸, 소파 휴식은 마지막 칸", () => {
  assert.equal(frameIndex("sit", "down"), 21);
  assert.equal(frameIndex("sit", "up"), 20);
  assert.equal(frameIndex("rest", "left"), 22);
  assert.equal(frameIndex("rest", "down"), SHEET_FRAME.count - 1);
});

test("활동을 시트 동작으로 바꾼다 (출구로 나가는 중은 걷기)", () => {
  assert.deepEqual(resolvePose("walking"), { action: "walk", frames: 4 });
  assert.deepEqual(resolvePose("exiting"), { action: "walk", frames: 4 });
  assert.equal(resolvePose("seated").action, "sit");
  assert.equal(resolvePose("sitting").action, "sit");
  assert.equal(resolvePose("resting").action, "rest");
  assert.equal(resolvePose("idle").action, "idle");
});

test("발 기준점은 모든 방향에서 칸 맨 아래 줄 가운데", () => {
  for (const d of ["down", "up", "left", "right"]) {
    assert.equal(spriteFootCenterX[d], (SHEET_FRAME.width - 1) / 2);
    assert.equal(spriteFootPadding[d], 0);
    assert.deepEqual(characterSprites.idle[d], [BODY_SHEET]);
  }
});

test("공개 폴더의 몸 시트가 23칸 크기다", () => {
  const file = `public${BODY_SHEET}`;
  assert.ok(existsSync(file));
  const image = decodePng(readFileSync(file));
  assert.equal(image.width, SHEET_FRAME.width * SHEET_FRAME.count);
  assert.equal(image.height, SHEET_FRAME.height);
});
