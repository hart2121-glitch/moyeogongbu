// 캐릭터 부품 파이프라인 (Story 009 1차 목표).
// 기본 몸 위에 부품 하나만 얹어 생성한 그림에서 부품을 떼어 내고,
// 걷기 프레임(PixelLab skeleton-v3, 112×112)을 56×72 칸으로 맞춰 23프레임 시트로 만든다.
// 머리카락은 방향당 1장을 프레임별 머리 위치에 붙이고, 목 아래는 뒷머리(몸 뒤)로 나눈다.
import { FRAME } from "./pixelArt.mjs";
import { emptyLike, hsv, pixelIndex } from "./rigImage.mjs";

/** 서기 그림(56×72) 기준 목 줄. 이 줄 위가 머리 영역이다. */
export const NECK = 44;
/** 앉으면 윗몸을 내리는 양(픽셀). rigidRig.mjs와 같은 값. */
export const SIT_DROP = 6;
/** 눈썹 아래 줄. 이 줄부터 목 줄 위까지 얼굴 안쪽에 있는 진한 선, 흰자, 눈동자가 눈과 입이다. */
export const FACE_TOP = 30;
/** 기본 몸과 같은 색으로 볼 허용 차이. */
const SAME_TOLERANCE = 30;

const blank = (w, h) => ({ width: w, height: h, pixels: new Uint8Array(w * h * 4) });
const opaque = (im, x, y) => { const i = pixelIndex(im, x, y); return i >= 0 && im.pixels[i + 3] > 0; };

/** 눈과 입 색: 진한 선, 흰자(채도 낮고 밝음), 눈동자(진한 보라). */
function isFaceColor(r, g, b) {
  const c = hsv(r, g, b);
  return c.v < 0.3 || (c.s < 0.15 && c.v > 0.6) || (c.h >= 250 && c.h <= 320 && c.s > 0.6);
}

/**
 * 얼굴 안쪽의 눈과 입 픽셀 (머리가 dy만큼 내려간 그림이면 dy를 준다).
 * 머리 윤곽선도 진한 색이라, 투명 픽셀에 닿은 덩어리(윤곽선)는 넣지 않는다.
 * 윤곽선에 대각선으로만 붙은 점(생성 때 생긴 볼의 회색 점 등)은 윤곽선이 아니라 얼굴 쪽으로 본다.
 * @returns {Set<number>} y * width + x
 */
export function faceFeatures(im, dy = 0) {
  const keys = [];
  for (let y = FACE_TOP + dy; y < NECK + dy; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y);
      if (i >= 0 && im.pixels[i + 3] && isFaceColor(...im.pixels.subarray(i, i + 3))) keys.push(y * im.width + x);
    }
  const out = new Set();
  for (const comp of components(keys, im.width, false)) {
    const outline = comp.some((k) => {
      const x = k % im.width, y = Math.floor(k / im.width);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !opaque(im, x + dx, y + dy));
    });
    if (!outline) for (const k of comp) out.add(k);
  }
  return out;
}

/** 픽셀 집합을 주변 8칸만큼 넓힌다. */
function grow(set, width) {
  const out = new Set(set);
  for (const k of set) {
    const x = k % width;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < width) out.add(k + dy * width + dx);
  }
  return out;
}

/** 8방향(diagonal이 false면 상하좌우)으로 이어진 덩어리들. */
function components(keys, width, diagonal = true) {
  const left = new Set(keys), out = [];
  for (const start of keys) {
    if (!left.has(start)) continue;
    const stack = [start], comp = [];
    left.delete(start);
    while (stack.length) {
      const k = stack.pop(), x = k % width, y = Math.floor(k / width);
      comp.push(k);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!diagonal && dx && dy) continue;
          const n = (y + dy) * width + (x + dx);
          if (left.has(n)) { left.delete(n); stack.push(n); }
        }
    }
    out.push(comp);
  }
  return out;
}

/**
 * "기본 몸 + 부품" 그림에서 부품을 떼어 낸다.
 * 기본 몸과 색이 다른 픽셀 중, 머리 영역에 닿은 덩어리(머리 부품) 또는 목 아래 덩어리(옷 부품)만 남긴다.
 * 생성 과정에서 생긴 몸의 작은 흔들림은 떨어진 덩어리라 빠진다.
 * @param kind "head"(머리카락, 머리 장식) | "body"(옷)
 */
export function extractPart(dressed, base, kind) {
  // 눈과 입 자리(1픽셀 여유)는 얼굴 레이어 몫이라 부품에 넣지 않는다. 생성 그림이 눈을 조금 다시 그려도 섞이지 않는다.
  const eyes = grow(faceFeatures(base), base.width), changed = [];
  for (let y = 0; y < dressed.height; y++)
    for (let x = 0; x < dressed.width; x++) {
      const i = pixelIndex(dressed, x, y);
      if (!dressed.pixels[i + 3] || eyes.has(y * dressed.width + x)) continue;
      const j = pixelIndex(base, x, y);
      const same = base.pixels[j + 3] && [0, 1, 2].every((k) => Math.abs(dressed.pixels[i + k] - base.pixels[j + k]) <= SAME_TOLERANCE);
      if (!same) changed.push(y * dressed.width + x);
    }
  const out = emptyLike(dressed);
  // 생성 때 얼굴에 생긴 1~2픽셀 흔들림은 머리 부품에서도 뺀다.
  const minSize = kind === "head" ? 3 : 6;
  for (const comp of components(changed, dressed.width)) {
    const top = Math.min(...comp.map((k) => Math.floor(k / dressed.width)));
    const keep = comp.length >= minSize && (kind === "head" ? top < NECK : comp.some((k) => Math.floor(k / dressed.width) >= NECK - 4));
    if (!keep) continue;
    for (const k of comp) out.pixels.set(dressed.pixels.subarray(k * 4, k * 4 + 4), k * 4);
  }
  return out;
}

/**
 * 몸 그림에서 눈과 입을 지우고 얼굴의 가장 흔한 살색으로 채운다. 눈과 입은 얼굴 레이어가 그린다.
 * @param dy 걷기 프레임처럼 머리가 내려간 양
 */
export function eraseFace(im, dy = 0) {
  const features = faceFeatures(im, dy), counts = new Map();
  if (!features.size) return im;
  for (let y = FACE_TOP + dy; y < NECK + dy; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y);
      if (i < 0 || im.pixels[i + 3] !== 255 || features.has(y * im.width + x)) continue;
      const c = hsv(...im.pixels.subarray(i, i + 3));
      if (!(c.h < 45 || c.h > 340) || c.v < 0.7) continue;
      const key = im.pixels.subarray(i, i + 3).join(",");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  const skin = [...[...counts].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number), 255];
  const out = { ...im, pixels: im.pixels.slice() };
  for (const k of features) out.pixels.set(skin, k * 4);
  return out;
}

/**
 * "기본 몸 + 얼굴" 그림에서 눈과 입만 떼어 낸다. 기본 몸 눈과 입 자리(1픽셀 여유) 안의 눈과 입 색만 남긴다.
 * 생성 그림마다 머리 위치가 1~2픽셀 달라서, 기본 몸 눈과 가장 많이 겹치는 자리로 옮겨 맞춘다.
 */
export function extractFace(dressed, base) {
  const features = faceFeatures(base), region = grow(features, base.width);
  const face = (x, y) => opaque(dressed, x, y) && isFaceColor(...dressed.pixels.subarray(pixelIndex(dressed, x, y), pixelIndex(dressed, x, y) + 3));
  let best = { dx: 0, dy: 0, score: -1 };
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      let score = 0;
      for (const k of features) if (face(k % base.width - dx, Math.floor(k / base.width) - dy)) score++;
      if (score > best.score || (score === best.score && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy))) best = { dx, dy, score };
    }
  const out = emptyLike(base);
  for (const k of region) {
    const x = k % base.width, y = Math.floor(k / base.width), sx = x - best.dx, sy = y - best.dy;
    if (!face(sx, sy)) continue;
    const i = pixelIndex(dressed, sx, sy);
    out.pixels.set(dressed.pixels.subarray(i, i + 4), k * 4);
  }
  return out;
}

/**
 * 서기 그림의 머리 조각이 큰 프레임의 어디에 있는지 찾는다 (불투명 픽셀 색 차이 평균이 가장 작은 곳).
 * @returns {{x:number, y:number, score:number}} 서기 그림 왼쪽 위가 놓일 프레임 좌표
 */
export function locateHead(stand, frame) {
  let best = { x: 0, y: 0, score: Infinity };
  for (let oy = 0; oy + NECK <= frame.height; oy++)
    for (let ox = 0; ox + stand.width <= frame.width; ox++) {
      let sum = 0, n = 0;
      for (let y = 0; y < NECK; y += 1)
        for (let x = 0; x < stand.width; x++) {
          const a = pixelIndex(stand, x, y);
          if (!stand.pixels[a + 3]) continue;
          const b = pixelIndex(frame, ox + x, oy + y);
          sum += frame.pixels[b + 3] ? Math.abs(stand.pixels[a] - frame.pixels[b]) + Math.abs(stand.pixels[a + 1] - frame.pixels[b + 1]) + Math.abs(stand.pixels[a + 2] - frame.pixels[b + 2]) : 765;
          n++;
          if (sum / Math.max(n, 1) > best.score && n > 200) break;
        }
      const score = sum / Math.max(n, 1);
      if (score < best.score) best = { x: ox, y: oy, score };
    }
  return best;
}

/** 가장 아래 불투명 줄 (발바닥). */
function bottomRow(im) {
  for (let y = im.height - 1; y >= 0; y--) for (let x = 0; x < im.width; x++) if (opaque(im, x, y)) return y;
  return -1;
}

/** 프레임의 (x, y)부터 56×72를 잘라 낸다. */
export function cropCell(im, x0, y0) {
  const out = blank(FRAME.width, FRAME.height);
  for (let y = 0; y < FRAME.height; y++)
    for (let x = 0; x < FRAME.width; x++) {
      const i = pixelIndex(im, x0 + x, y0 + y);
      if (i >= 0 && im.pixels[i + 3]) out.pixels.set(im.pixels.subarray(i, i + 4), pixelIndex(out, x, y));
    }
  return out;
}

/**
 * 큰 걷기 프레임을 56×72 칸으로 맞춘다. 가로는 머리 위치(흔들리지 않게), 세로는 발바닥을 맨 아래 줄에 둔다.
 * 그래서 몸이 위아래로 흔들린 만큼 머리 위치(headDy)가 프레임마다 달라진다.
 * @returns {{cell, headDy:number, origin:{x,y}}}
 */
export function fitWalkFrame(stand, frame) {
  const head = locateHead(stand, frame);
  const origin = { x: head.x, y: bottomRow(frame) - (FRAME.height - 1) };
  return { cell: cropCell(frame, origin.x, origin.y), headDy: head.y - origin.y, origin };
}

/** 그림 전체를 (dx, dy)만큼 옮긴다. 밖으로 나간 픽셀은 버린다. */
export function shift(im, dx, dy) {
  const out = emptyLike(im);
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y), d = pixelIndex(out, x + dx, y + dy);
      if (im.pixels[i + 3] && d >= 0) out.pixels.set(im.pixels.subarray(i, i + 4), d);
    }
  return out;
}

/**
 * 서기 그림의 발을 칸의 기준점(맨 아래 줄, 가로 가운데)에 맞추는 이동량.
 * 발은 맨 아래 줄의 불투명 픽셀 범위로 본다 (검사 도구 pixelArt.mjs와 같은 기준).
 */
export function feetAlignment(stand) {
  const bottom = bottomRow(stand);
  let lo = Infinity, hi = -Infinity;
  for (let x = 0; x < stand.width; x++) if (opaque(stand, x, bottom)) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  return { dx: Math.round((FRAME.width - 1) / 2 - (lo + hi) / 2), dy: FRAME.height - 1 - bottom };
}

/** 좌우 반전 (동쪽 = 서쪽 반전). */
export function mirror(im) {
  const out = emptyLike(im);
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y);
      if (im.pixels[i + 3]) out.pixels.set(im.pixels.subarray(i, i + 4), pixelIndex(out, im.width - 1 - x, y));
    }
  return out;
}

/** 부품을 세로로 dy만큼 옮긴다. which가 "front"면 목 위만, "back"이면 목 아래만, "all"이면 전부 남긴다. */
export function placeHeadPart(part, dy, which) {
  const out = blank(FRAME.width, FRAME.height);
  for (let y = 0; y < part.height; y++) {
    if (which === "front" && y >= NECK) continue;
    if (which === "back" && y < NECK) continue;
    for (let x = 0; x < part.width; x++) {
      const i = pixelIndex(part, x, y), d = pixelIndex(out, x, y + dy);
      if (part.pixels[i + 3] && d >= 0) out.pixels.set(part.pixels.subarray(i, i + 4), d);
    }
  }
  return out;
}

/** 프레임 목록을 23칸 시트 한 장으로 잇는다. */
export function toSheet(frames) {
  const sheet = blank(FRAME.width * frames.length, FRAME.height);
  frames.forEach((f, n) => {
    for (let y = 0; y < FRAME.height; y++)
      for (let x = 0; x < FRAME.width; x++) {
        const i = pixelIndex(f, x, y);
        if (f.pixels[i + 3]) sheet.pixels.set(f.pixels.subarray(i, i + 4), pixelIndex(sheet, n * FRAME.width + x, y));
      }
  });
  return sheet;
}

/** 서기 그림을 SIT_DROP만큼 내리고 다리(목 아래 legTop 줄부터)를 지운 앉은 윗몸. */
export function seat(im, legTop) {
  const out = blank(FRAME.width, FRAME.height);
  for (let y = 0; y < legTop; y++)
    for (let x = 0; x < im.width; x++) {
      const i = pixelIndex(im, x, y), d = pixelIndex(out, x, y + SIT_DROP);
      if (im.pixels[i + 3] && d >= 0) out.pixels.set(im.pixels.subarray(i, i + 4), d);
    }
  return out;
}

/** 아래에서 위 순서로 겹친다. */
export function stack(layers) {
  const out = blank(FRAME.width, FRAME.height);
  for (const l of layers)
    for (let i = 0; i < l.pixels.length; i += 4) if (l.pixels[i + 3]) out.pixels.set(l.pixels.subarray(i, i + 4), i);
  return out;
}
