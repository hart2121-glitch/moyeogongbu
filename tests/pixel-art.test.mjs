// Story 009: 도트 스프라이트 규칙 검사기 (AGENTS.md). 고정 데이터로 검사기 자체를 확인하고,
// art-src/에 정식 시트가 있으면 실제 그림도 검사한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkImage, decodePng, encodePng, FRAME, SHEET } from "../tools/art/pixelArt.mjs";
import { validateArtDir } from "../tools/art/validate.mjs";

const INK = [40, 35, 50, 255];

/** 크기만큼 투명한 그림을 만들고 칠할 칸 목록을 찍는다. */
function makeImage(width, height, dots = []) {
  const pixels = new Uint8Array(width * height * 4);
  for (const [x, y, rgba] of dots) pixels.set(rgba, (y * width + x) * 4);
  return { width, height, pixels };
}

/** 3×3 불투명 덩어리. 가운데 칸은 사방이 칠해져 있어 가장자리가 아니다. */
function block(cx, cy, rgba = INK) {
  const dots = [];
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) dots.push([x, y, rgba]);
  return dots;
}

/** 모든 서기와 걷기 프레임의 같은 자리에 발 한 칸을 찍는다. */
function feetDots(offsetFrame = -1, shift = 0) {
  const center = Math.floor(FRAME.width / 2);
  return Array.from({ length: 20 }, (_, f) => [f * FRAME.width + center + (f === offsetFrame ? shift : 0), FRAME.height - 1, INK]);
}

test("PNG를 쓰고 다시 읽으면 픽셀이 그대로다", () => {
  const image = makeImage(3, 2, [[1, 0, [179, 157, 219, 128]], [2, 1, INK]]);
  const back = decodePng(encodePng(image));
  assert.equal(back.width, 3);
  assert.equal(back.height, 2);
  assert.deepEqual([...back.pixels], [...image.pixels]);
});

test("색 수와 상관없이, 불투명과 완전 투명만 쓴 시트는 통과한다", () => {
  const colors = Array.from({ length: 200 }, (_, i) => [i, 255 - i, (i * 7) % 256, 255]);
  const many = colors.map((c, i) => [100 + (i % 40), 5 + Math.floor(i / 40), c]);
  const image = makeImage(SHEET.width, SHEET.height, [...feetDots(), ...many]);
  assert.deepEqual(checkImage(image, { size: SHEET, checkFeet: true }), []);
});

test("실루엣 가장자리의 반투명 픽셀은 허용한다", () => {
  const dots = block(10, 10);
  dots.push([12, 10, [40, 35, 50, 120]]); // 덩어리 오른쪽 바깥, 투명 칸과 맞닿음
  assert.deepEqual(checkImage(makeImage(SHEET.width, SHEET.height, dots), { size: SHEET }), []);
});

test("안쪽(사방이 칠해진 곳)의 반투명 픽셀은 막는다", () => {
  const dots = block(10, 10);
  dots[4] = [10, 10, [40, 35, 50, 120]]; // 가운데 칸
  const problems = checkImage(makeImage(SHEET.width, SHEET.height, dots), { size: SHEET });
  assert.match(problems.join(), /가장자리가 아닌 곳의 반투명 픽셀 1개/);
});

test("크기가 다르면 막는다", () => {
  assert.match(checkImage(makeImage(24, 32), { size: SHEET }).join(), /크기 24×32/);
});

test("몸 시트에서 서기 프레임 발이 2픽셀 어긋나면 막고 1픽셀은 허용한다", () => {
  const two = makeImage(SHEET.width, SHEET.height, feetDots(2, 2));
  assert.match(checkImage(two, { size: SHEET, checkFeet: true }).join(), /3번 프레임 발 위치/);
  const one = makeImage(SHEET.width, SHEET.height, feetDots(2, 1));
  assert.deepEqual(checkImage(one, { size: SHEET, checkFeet: true }), []);
});

test("걷기 프레임은 발이 앞뒤로 움직여도 되지만 발바닥 줄이 뜨면 막는다", () => {
  const stride = makeImage(SHEET.width, SHEET.height, feetDots(6, 3));
  assert.deepEqual(checkImage(stride, { size: SHEET, checkFeet: true }), []);
  const center = Math.floor(FRAME.width / 2);
  const dots = feetDots().filter(([x]) => x !== 6 * FRAME.width + center);
  dots.push([6 * FRAME.width + center, FRAME.height - 3, INK]);
  assert.match(checkImage(makeImage(SHEET.width, SHEET.height, dots), { size: SHEET, checkFeet: true }).join(), /7번 프레임 발 위치/);
});

test("폴더 검사는 시안과 미리보기를 건너뛰고 정식 시트의 위반을 알린다", () => {
  const root = mkdtempSync(join(tmpdir(), "pixel-art-"));
  mkdirSync(join(root, "characters"));
  writeFileSync(join(root, "characters", "hair-test.png"), encodePng(makeImage(24, 32)));
  writeFileSync(join(root, "characters", "preview-x4.png"), encodePng(makeImage(5, 5)));
  writeFileSync(join(root, "characters", "draft-front-a.png"), encodePng(makeImage(48, 64)));
  const results = validateArtDir(root);
  assert.equal(results.length, 1);
  assert.match(results[0].problems.join(), /크기 24×32/);
});

test("art-src의 실제 그림이 규칙을 지킨다", (t) => {
  if (!existsSync("art-src/characters") && !existsSync("art-src/rooms")) return t.skip("아직 art-src에 정식 그림이 없어요");
  const failures = validateArtDir("art-src").filter((r) => r.problems.length);
  assert.deepEqual(failures, []);
});

