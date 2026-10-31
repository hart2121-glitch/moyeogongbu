// 머리 고정 리그 (Story 009): 4방향 서기 그림 4장에서 23프레임 시트를 만든다.
// 머리와 윗몸은 서기 그림을 그대로 쓰고, 다리와 손만 프레임마다 옮긴다.
// 그래서 머리에 붙는 부품(머리카락, 얼굴, 액세서리)은 방향당 1장으로 모든 프레임에 맞는다.
// 사용법: node tools/art/rigidRig.mjs <down.png> <up.png> <left.png> <right.png> <출력 시트.png>
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodePng, FRAME } from "./pixelArt.mjs";
import { emptyLike, hsv, pixelIndex } from "./rigImage.mjs";

/** 프레임 높이 72 기준 다리 시작 줄. 캐릭터 비율이 바뀌면 이 값만 고친다. */
export const LEG_TOP = 61;
/** 손을 찾는 줄 범위 (다리 시작 위 몇 줄). */
const HAND_ROWS = 14;
/** 걷기 한 주기: [왼다리 들기, 오른다리 들기, 몸 올리기, 보폭 방향]. */
const WALK = [[0, 0, 0, 0], [2, 0, 1, 1], [0, 0, 0, 0], [0, 2, 1, -1]];
/** 옆모습 보폭(픽셀). */
const STRIDE = 2;
/** 앉으면 윗몸을 내리는 양(픽셀). */
const SIT_DROP = 6;

const isSkin = (r, g, b) => { const c = hsv(r, g, b); return c.h < 40 && c.s > 0.12 && c.v > 0.6; };

/** 불투명 픽셀의 가로 가운데 (발 기준). */
function feetCenter(im) {
  let lo = Infinity, hi = -Infinity;
  for (let y = LEG_TOP; y < im.height; y++)
    for (let x = 0; x < im.width; x++) if (im.pixels[pixelIndex(im, x, y) + 3]) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  return (lo + hi) / 2;
}

/** 다리 위 줄에서 몸통 바깥쪽의 살색 픽셀 = 손. 왼쪽과 오른쪽 손 픽셀 목록. */
function findHands(im, cx) {
  const hands = { left: new Set(), right: new Set() };
  for (let y = LEG_TOP - HAND_ROWS; y < LEG_TOP; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y);
      if (!im.pixels[i + 3] || !isSkin(...im.pixels.subarray(i, i + 3))) continue;
      if (Math.abs(x - cx) < 7) continue; // 몸통 가운데(목, 다리 사이)는 손이 아니다
      hands[x < cx ? "left" : "right"].add(y * im.width + x);
    }
  // 손 둘레의 외곽선도 함께 움직이도록 이웃한 어두운 픽셀을 포함한다
  for (const side of ["left", "right"])
    for (const key of [...hands[side]]) {
      const x = key % im.width, y = Math.floor(key / im.width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const i = pixelIndex(im, x + dx, y + dy);
        if (i >= 0 && im.pixels[i + 3] && hsv(...im.pixels.subarray(i, i + 3)).v < 0.35) hands[side].add((y + dy) * im.width + x + dx);
      }
    }
  return hands;
}

const put = (out, x, y, src, i) => { const d = pixelIndex(out, x, y); if (d >= 0) out.pixels.set(src.pixels.subarray(i, i + 4), d); };

/**
 * 걷기 4프레임.
 * @param side 옆모습이면 true, facing은 앞쪽 방향(-1 왼쪽, 1 오른쪽)
 */
export function walkFrames(stand, { side = false, facing = 1 } = {}) {
  const cx = feetCenter(stand), hands = findHands(stand, cx);
  return WALK.map(([liftL, liftR, bob, phase]) => {
    const out = emptyLike(stand);
    // 윗몸: bob만큼 올리고, 손은 다리와 반대로 1px 흔든다
    for (let y = 0; y < LEG_TOP; y++)
      for (let x = 0; x < stand.width; x++) {
        const i = pixelIndex(stand, x, y);
        if (!stand.pixels[i + 3]) continue;
        const key = y * stand.width + x;
        let hx = 0, hy = 0;
        if (phase && hands.left.has(key)) side ? (hx = -phase * facing) : (hy = phase > 0 ? -1 : 1);
        if (phase && hands.right.has(key)) side ? (hx = phase * facing) : (hy = phase > 0 ? 1 : -1);
        put(out, x + hx, y - bob + hy, stand, i);
      }
    // 윗몸을 올려 생긴 틈은 다리 첫 줄을 늘려 메운다
    for (let b = 0; b < bob; b++)
      for (let x = 0; x < stand.width; x++) {
        const i = pixelIndex(stand, x, LEG_TOP);
        if (stand.pixels[i + 3] && !out.pixels[pixelIndex(out, x, LEG_TOP - 1 - b) + 3]) put(out, x, LEG_TOP - 1 - b, stand, i);
      }
    // 다리
    for (let y = LEG_TOP; y < stand.height; y++)
      for (let x = 0; x < stand.width; x++) {
        const i = pixelIndex(stand, x, y);
        if (!stand.pixels[i + 3]) continue;
        const left = x < cx;
        let dx = 0, lift = left ? liftL : liftR;
        if (side) {
          // 앞다리는 앞으로 벌리며 살짝 들고, 뒷다리는 뒤로 벌린다
          const front = (left ? -1 : 1) === facing;
          const forward = front ? phase : -phase;
          dx = forward * STRIDE * facing;
          lift = forward > 0 ? 1 : 0;
        }
        put(out, x + dx, y - lift, stand, i);
      }
    return out;
  });
}

/** 의자 앉기: 다리를 빼고 윗몸을 내린다 (하체는 책상 전경이 가린다). */
export function sitFrame(stand) {
  const out = emptyLike(stand);
  for (let y = 0; y < LEG_TOP; y++)
    for (let x = 0; x < stand.width; x++) {
      const i = pixelIndex(stand, x, y);
      if (stand.pixels[i + 3]) put(out, x, y + SIT_DROP, stand, i);
    }
  return out;
}

/** 소파 휴식: 앉은 윗몸 아래에 신발 줄만 붙여 다리를 접은 모습으로 만든다. */
export function restFrame(stand) {
  const out = sitFrame(stand);
  const shoeRows = 4;
  for (let y = stand.height - shoeRows; y < stand.height; y++)
    for (let x = 0; x < stand.width; x++) {
      const i = pixelIndex(stand, x, y);
      if (!stand.pixels[i + 3]) continue;
      const ny = LEG_TOP + SIT_DROP + (y - (stand.height - shoeRows));
      if (!out.pixels[pixelIndex(out, x, ny) + 3]) put(out, x, ny, stand, i);
    }
  return out;
}

/** Story 009 순서의 23프레임: 서기 4, 걷기 아래/위/왼/오 각 4, 앉기(뒷모습), 앉기(정면), 휴식. */
export function buildSheet({ down, up, left, right }) {
  const frames = [down, up, left, right,
    ...walkFrames(down), ...walkFrames(up),
    ...walkFrames(left, { side: true, facing: -1 }), ...walkFrames(right, { side: true, facing: 1 }),
    sitFrame(up), sitFrame(down), restFrame(down)];
  const sheet = { width: FRAME.width * FRAME.count, height: FRAME.height, pixels: new Uint8Array(FRAME.width * FRAME.count * FRAME.height * 4) };
  frames.forEach((f, n) => {
    for (let y = 0; y < f.height; y++)
      for (let x = 0; x < f.width; x++) {
        const i = pixelIndex(f, x, y);
        if (f.pixels[i + 3]) sheet.pixels.set(f.pixels.subarray(i, i + 4), pixelIndex(sheet, n * FRAME.width + x, y));
      }
  });
  return sheet;
}

if (process.argv[1]?.endsWith("rigidRig.mjs")) {
  const [down, up, left, right, out] = process.argv.slice(2);
  const load = (p) => decodePng(readFileSync(p));
  writeFileSync(out, encodePng(buildSheet({ down: load(down), up: load(up), left: load(left), right: load(right) })));
  console.log("시트 저장:", out);
}
