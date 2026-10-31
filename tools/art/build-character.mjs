// 사용법: node tools/art/build-character.mjs
// art-src/characters/src/의 기본 몸과 부품 원재료로 23프레임 시트를 만든다 (Story 009).
// 출력: art-src/characters/body-basic.png, face-<id>.png, hair-<모양>-<색>-front.png, hair-<모양>-<색>-back.png, outfit-<id>.png, 색 바꾸기 변형
// 게임은 뒷머리 → 몸 → 옷 → 얼굴 → 앞머리 순서로 같은 칸을 겹친다.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng, FRAME } from "./pixelArt.mjs";
import { coverBaldPeeks, cropCell, plainEyes, eraseFace, extractFace, extractPart, feetAlignment, fitWalkFrame, mirror, NECK, placeHeadPart, shift, SIT_DROP, symmetricEyes, toSheet } from "./characterParts.mjs";
import { emptyLike, hsv } from "./rigImage.mjs";
import { restFrame, sitFrame } from "./rigidRig.mjs";

const SRC = "art-src/characters/src", OUT = "art-src/characters";
/** 시트의 방향 순서 (Story 009). 동쪽은 서쪽 반전. */
const DIRS = ["south", "north", "west", "east"];
const load = (p) => decodePng(readFileSync(p));
const flipIfEast = (dir, im) => (dir === "east" ? mirror(im) : im);
/** 부품 서기 그림을 기본 몸과 같은 양만큼 옮겨 불러온다. */
const loadRot = (base, dir, ...path) => { const a = base[dir].align; return shift(flipIfEast(dir, load(join(SRC, ...path, `${srcDir(dir)}.png`))), a.dx, a.dy); };
const srcDir = (dir) => (dir === "east" ? "west" : dir);

/** 방향별 기본 몸 서기와 걷기 칸 4개(+프레임별 머리 높이, 큰 프레임에서 자른 위치). */
function loadBase() {
  const base = {};
  for (const dir of DIRS) {
    // 생성된 서기 그림마다 발 위치가 조금씩 달라서 칸의 기준점에 맞춘다. 같은 방향 부품도 같은 양만큼 옮긴다.
    const raw = flipIfEast(dir, load(join(SRC, "base/rot", `${srcDir(dir)}.png`)));
    const align = feetAlignment(raw);
    const stand = shift(raw, align.dx, align.dy);
    const walkDir = join(SRC, "base/walk", srcDir(dir));
    let walk;
    if (existsSync(walkDir)) {
      walk = [0, 1, 2, 3].map((i) => {
        const frame = flipIfEast(dir, load(join(walkDir, `${i}.png`)));
        return { frame, ...fitWalkFrame(stand, frame) };
      });
    } else {
      // 아직 생성하지 않은 방향: 서기 그림으로 임시 대체 (보고에 표시)
      walk = [0, 1, 2, 3].map(() => ({ frame: null, cell: stand, headDy: 0, origin: null, placeholder: true }));
    }
    base[dir] = { stand, walk, align };
  }
  return base;
}

/** 서기 4, 걷기 16(남, 북, 서, 동 순), 앉기(뒷모습, 정면), 휴식 순서의 23칸. */
function frameOrder(per) {
  return [...DIRS.map((d) => per[d].stand), ...DIRS.flatMap((d) => per[d].walk), per.north.sitUp, per.south.sitDown, per.south.rest];
}

/** 기본 몸은 눈과 입을 지운 맨 얼굴이다 (눈과 입은 얼굴 레이어). */
function buildBody(base) {
  const per = {};
  for (const dir of DIRS) per[dir] = { stand: eraseFace(base[dir].stand), walk: base[dir].walk.map((w) => eraseFace(w.cell, w.headDy)) };
  per.north.sitUp = sitFrame(per.north.stand);
  per.south.sitDown = sitFrame(per.south.stand);
  per.south.rest = restFrame(per.south.stand);
  return toSheet(frameOrder(per));
}

/** 방향별 머리 부품 1장을 프레임마다 머리 높이에 맞춰 붙인 시트. which는 placeHeadPart와 같다. */
function headSheet(parts, base, which) {
  const per = {};
  for (const dir of DIRS)
    per[dir] = { stand: placeHeadPart(parts[dir], 0, which), walk: base[dir].walk.map((w) => placeHeadPart(parts[dir], w.headDy, which)) };
  per.north.sitUp = placeHeadPart(parts.north, SIT_DROP, which);
  per.south.sitDown = placeHeadPart(parts.south, SIT_DROP, which);
  per.south.rest = placeHeadPart(parts.south, SIT_DROP, which);
  return toSheet(frameOrder(per));
}

/** 머리카락: 방향당 1장을 떼어 내 프레임마다 머리 높이에 맞춰 앞머리와 뒷머리 시트로 나눈다. */
function buildHair(id, base) {
  const parts = {};
  const dressed = {};
  for (const dir of DIRS) {
    dressed[dir] = loadRot(base, dir, "hair", id, "rot");
    parts[dir] = coverBaldPeeks(extractPart(dressed[dir], base[dir].stand, "head"), dressed[dir], base[dir].stand);
  }
  // 걷기 칸은 움직이며 머리가 1픽셀쯤 커지기도 해서, 그 칸의 대머리가 비치는 자리도 칸마다 덮는다 (서기 좌표에서 덮고 다시 올린다).
  const walkParts = {};
  for (const dir of DIRS)
    walkParts[dir] = base[dir].walk.map((w) => (w.placeholder ? parts[dir] : coverBaldPeeks(parts[dir], dressed[dir], shift(w.cell, 0, -w.headDy))));
  const sheet = (which) => {
    const per = {};
    for (const dir of DIRS)
      per[dir] = { stand: placeHeadPart(parts[dir], 0, which), walk: base[dir].walk.map((w, i) => placeHeadPart(walkParts[dir][i], w.headDy, which)) };
    per.north.sitUp = placeHeadPart(parts.north, SIT_DROP, which);
    per.south.sitDown = placeHeadPart(parts.south, SIT_DROP, which);
    per.south.rest = placeHeadPart(parts.south, SIT_DROP, which);
    return toSheet(frameOrder(per));
  };
  return { front: sheet("front"), back: sheet("back") };
}

/**
 * 얼굴(눈과 입): 방향당 1장에서 떼어 내 머리카락처럼 붙인다. 뒷모습(북쪽)은 그림이 없어 빈 칸이고, 정면은 두 눈을 같은 모양으로 맞춘다.
 * 남자 눈매(male)는 정면 눈의 속눈썹과 꼬리를 지운 판이다 (옆모습은 같다).
 */
function buildFace(id, base, male = false) {
  const parts = {};
  for (const dir of DIRS)
    parts[dir] = existsSync(join(SRC, "face", id, "rot", `${srcDir(dir)}.png`))
      ? extractFace(loadRot(base, dir, "face", id, "rot"), base[dir].stand)
      : emptyLike(base[dir].stand);
  parts.south = symmetricEyes(parts.south, base.south.stand);
  if (male) parts.south = plainEyes(parts.south, base.south.stand);
  return headSheet(parts, base, "all");
}

/**
 * 완성 캐릭터에서 임시로 떼어 낸 옷(FROM-FULL-CHARACTER 표시 파일)은 머리카락과 리본이 섞여 있다.
 * 목 위 픽셀과 머리카락, 리본 색(밝은 라벤더, 진한 보라)을 지운다. "기본 몸 + 옷"으로 생성한 재료에는 쓰지 않는다.
 */
function stripHeadColors(part, under) {
  const out = { ...part, pixels: part.pixels.slice() };
  for (let y = 0; y < part.height; y++)
    for (let x = 0; x < part.width; x++) {
      const i = (y * part.width + x) * 4;
      if (!out.pixels[i + 3]) continue;
      const c = hsv(out.pixels[i], out.pixels[i + 1], out.pixels[i + 2]);
      const hairOrRibbon = c.h >= 240 && c.h <= 320 && ((c.s > 0.12 && c.s < 0.6 && c.v > 0.6) || (c.s > 0.5 && c.v > 0.6));
      if (y < NECK - 2 || hairOrRibbon) out.pixels.fill(0, i, i + 4);
    }
  // 지운 머리카락의 외곽선(짙은 색)이 남아 선처럼 보인다. 옷 색 픽셀과 맞닿지 않은 짙은 픽셀은 지운다.
  const dark = (i) => out.pixels[i + 3] && hsv(out.pixels[i], out.pixels[i + 1], out.pixels[i + 2]).v < 0.3;
  const stray = [];
  for (let y = 0; y < part.height; y++)
    for (let x = 0; x < part.width; x++) {
      const i = (y * part.width + x) * 4;
      if (!dark(i)) continue;
      const touchesCloth = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= part.width || ny >= part.height) return false;
        const j = (ny * part.width + nx) * 4;
        return out.pixels[j + 3] && !dark(j);
      });
      if (!touchesCloth) stray.push(i);
    }
  for (const i of stray) out.pixels.fill(0, i, i + 4);
  // 몸 밖 허공에 떠 있는 작은 덩어리(완성 캐릭터의 리본, 머리카락 조각)도 지운다. 몸과 겹치는 덩어리(치마 등)는 둔다.
  const left = new Set();
  for (let k = 0; k < part.width * part.height; k++) if (out.pixels[k * 4 + 3]) left.add(k);
  for (const start of [...left]) {
    if (!left.has(start)) continue;
    const stack = [start], comp = [];
    left.delete(start);
    while (stack.length) {
      const k = stack.pop(), x = k % part.width, y = Math.floor(k / part.width);
      comp.push(k);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, n = ny * part.width + nx;
          if (nx >= 0 && ny >= 0 && nx < part.width && ny < part.height && left.has(n)) { left.delete(n); stack.push(n); }
        }
    }
    if (comp.length < 12 && comp.every((k) => !under.pixels[k * 4 + 3])) for (const k of comp) out.pixels.fill(0, k * 4, k * 4 + 4);
  }
  return out;
}

/** 옷: 서기는 방향별로, 걷기는 프레임마다 기본 몸 걷기와 같은 자리에서 잘라 차이를 떼어 낸다. */
function buildOutfit(id, base) {
  const fromFull = existsSync(join(SRC, "outfit", id, "FROM-FULL-CHARACTER"));
  // 생성한 옷 그림은 얼굴 윤곽을 1픽셀쯤 다시 그리기도 해서, 옷깃과 이어진 볼 윤곽이 옷에 섞인다. 목 줄 위는 버린다.
  const belowNeck = (part, headDy = 0) => {
    const out = { ...part, pixels: part.pixels.slice() };
    out.pixels.fill(0, 0, Math.max(0, NECK - 2 + headDy) * part.width * 4);
    return out;
  };
  const clean = (part, under, headDy = 0) => (fromFull ? stripHeadColors(part, under) : belowNeck(part, headDy));
  const per = {};
  for (const dir of DIRS) {
    const standPart = clean(extractPart(loadRot(base, dir, "outfit", id, "rot"), base[dir].stand, "body"), base[dir].stand);
    const walkDir = join(SRC, "outfit", id, "walk", srcDir(dir));
    // 옷 걷기는 기본 몸 걷기와 같은 뼈대라, 기본 몸 칸과 같은 자리에서 잘라 비교한다
    const walk = base[dir].walk.map((w, i) => {
      if (w.placeholder || !existsSync(walkDir)) return standPart;
      const cell = cropCell(flipIfEast(dir, load(join(walkDir, `${i}.png`))), w.origin.x, w.origin.y);
      return clean(extractPart(cell, w.cell, "body"), w.cell, w.headDy);
    });
    per[dir] = { stand: standPart, walk, standPart };
  }
  per.north.sitUp = sitFrame(per.north.standPart);
  per.south.sitDown = sitFrame(per.south.standPart);
  per.south.rest = restFrame(per.south.standPart);
  return toSheet(frameOrder(per));
}

/**
 * 머리 장식: 완성 캐릭터와 "기본 몸 + 머리카락"(OVER-HAIR 파일에 머리카락 id)의 차이 중
 * 진한 유채색 덩어리(장식 색)와 그 외곽선만 남겨, 앞머리 위에 붙는 시트로 만든다.
 */
function buildAccessory(id, base) {
  const handDir = join(SRC, "accessory", id, "hand");
  if (existsSync(handDir)) return headSheet(handParts(handDir, base), base, "all");
  const hairId = readFileSync(join(SRC, "accessory", id, "OVER-HAIR"), "utf8").trim();
  // KEEP.json이 있으면 장식 색 범위를 그 값으로 잡는다 (파스텔처럼 채도가 낮은 장식).
  const keepFile = join(SRC, "accessory", id, "KEEP.json");
  const keep = existsSync(keepFile) ? JSON.parse(readFileSync(keepFile, "utf8")) : {};
  const parts = {};
  for (const dir of DIRS) {
    const withHair = loadRot(base, dir, "hair", hairId, "rot");
    // 목도리처럼 목 아래에 걸치는 장식은 kind "body"로 뗀다 (머리 부품은 목 줄 위에서 시작하는 덩어리만 남는다).
    const raw = extractPart(loadRot(base, dir, "accessory", id, "rot"), withHair, keep.kind ?? "head");
    parts[dir] = dropSpecks(keepVivid(raw, keep), 6, keep.maxTop);
  }
  return headSheet(parts, base, "all");
}

/**
 * 손으로 찍은 장식(tools/art/hand-accessories.mjs): 방향별 서기 칸이 이미 기본 몸과 같은 정렬 좌표다.
 * 동쪽은 서쪽을 뒤집고, 두 방향의 발 맞춤 차이만큼 옮긴다 (기본 몸 동쪽 서기와 같은 자리가 된다).
 */
function handParts(handDir, base) {
  const parts = {};
  for (const dir of ["south", "west", "north"]) parts[dir] = load(join(handDir, `${dir}.png`));
  const w = base.west.align, e = base.east.align;
  parts.east = shift(mirror(parts.west), e.dx + w.dx, e.dy - w.dy);
  return parts;
}

/**
 * 8방향으로 이어진 덩어리 중 min칸보다 작은 것(생성 그림의 잔티)을 지운다.
 * maxTop이 있으면 그 줄 아래에서 시작하는 덩어리도 지운다 (머리 위 장식에 섞인 머리카락 조각).
 */
function dropSpecks(part, min, maxTop = Infinity) {
  const out = { ...part, pixels: part.pixels.slice() }, W = part.width;
  const left = new Set();
  for (let k = 0; k < W * part.height; k++) if (out.pixels[k * 4 + 3]) left.add(k);
  for (const start of [...left]) {
    if (!left.has(start)) continue;
    const stack = [start], comp = [];
    left.delete(start);
    while (stack.length) {
      const k = stack.pop(), x = k % W, y = Math.floor(k / W);
      comp.push(k);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, n = ny * W + nx;
          if (nx >= 0 && ny >= 0 && nx < W && ny < part.height && left.has(n)) { left.delete(n); stack.push(n); }
        }
    }
    const top = Math.min(...comp.map((k) => Math.floor(k / W)));
    if (comp.length < min || top >= maxTop) for (const k of comp) out.pixels.fill(0, k * 4, k * 4 + 4);
  }
  return out;
}

/**
 * 장식 색 픽셀과, 그것에 맞닿은 짙은 외곽선만 남긴다. 기본은 채도 0.45, 명도 0.4 초과.
 * @param keep {hue?: [h0, h1] (h0 > h1이면 360을 넘어 이어진다), minS?, minV?}
 */
function keepVivid(part, { hue, minS = 0.45, minV = 0.4 } = {}) {
  const out = { ...part, pixels: new Uint8Array(part.pixels.length) };
  const inHue = (h) => !hue || (hue[0] <= hue[1] ? h >= hue[0] && h <= hue[1] : h >= hue[0] || h <= hue[1]);
  const vivid = (i) => { const c = hsv(part.pixels[i], part.pixels[i + 1], part.pixels[i + 2]); return part.pixels[i + 3] && c.s > minS && c.v > minV && inHue(c.h); };
  for (let y = 0; y < part.height; y++)
    for (let x = 0; x < part.width; x++) {
      const i = (y * part.width + x) * 4;
      if (!part.pixels[i + 3]) continue;
      const near = vivid(i) || (hsv(part.pixels[i], part.pixels[i + 1], part.pixels[i + 2]).v < 0.35 &&
        [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < part.width && ny < part.height && vivid((ny * part.width + nx) * 4); }));
      if (near) out.pixels.set(part.pixels.subarray(i, i + 4), i);
    }
  return out;
}

const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** 명도 v를 색 띠 [[v, [r,g,b]], ...]에서 고른다 (사이는 선형 보간). */
function rampColor(ramp, v) {
  if (v <= ramp[0][0]) return ramp[0][1];
  for (let k = 1; k < ramp.length; k++)
    if (v <= ramp[k][0]) return lerp(ramp[k - 1][1], ramp[k][1], (v - ramp[k - 1][0]) / (ramp[k][0] - ramp[k - 1][0]));
  return ramp.at(-1)[1];
}

/**
 * 색 바꾸기 변형 (src/recolor/<시트 이름>.json: from, hue, ramp).
 * 이미 만든 시트에서 hue 범위 안의 픽셀만 명도 순서를 지켜 새 색 띠로 바꾼다. 생성 없이 같은 모양의 다른 색 아이템을 만든다
 * (머리 색, 눈 색). 흰자처럼 채도가 낮은 픽셀은 그대로 둔다.
 * paleHighlights면 아주 밝은 연한 픽셀(채도 0.06 이상, 명도 0.85 초과)도 바꾼다: 머리카락의 흰 광택 띠가 라벤더 빛으로 남지 않게.
 */
function recolorSheet(sheet, { hue: [h0, h1], ramp }, paleHighlights = false) {
  const out = { ...sheet, pixels: sheet.pixels.slice() };
  for (let i = 0; i < out.pixels.length; i += 4) {
    if (!out.pixels[i + 3]) continue;
    const c = hsv(out.pixels[i], out.pixels[i + 1], out.pixels[i + 2]);
    const tinted = c.s >= 0.15 || (paleHighlights && c.s >= 0.06 && c.v > 0.85);
    if (c.h >= h0 && c.h <= h1 && tinted) out.pixels.set(rampColor(ramp, c.v), i);
  }
  return out;
}

/**
 * 머리 색 입히기: 머리카락 사이에 낀 기본 몸 머리 윤곽선(4방향 이웃 중 머리카락이 2개 이상)은
 * 원래 머리 색과 같아 부품에서 빠져 있다. 새 색에서는 선이 튀므로 앞머리 시트에 새 색으로 넣는다.
 */
function recolorHair(front, back, body, recipe) {
  const [h0, h1] = recipe.hue;
  const hairAt = (im, i) => { if (!im.pixels[i + 3]) return false; const c = hsv(im.pixels[i], im.pixels[i + 1], im.pixels[i + 2]); return c.h >= h0 && c.h <= h1 && c.s >= 0.15; };
  const newFront = recolorSheet(front, recipe, true);
  const W = body.width;
  for (let y = 0; y < body.height; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (front.pixels[i + 3] || body.pixels[i + 3] !== 255) continue;
      const c = hsv(body.pixels[i], body.pixels[i + 1], body.pixels[i + 2]);
      if (!(c.v < 0.3 && c.h >= h0 && c.h <= h1)) continue;
      let hairNeighbors = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (ny < 0 || ny >= body.height || Math.floor(nx / FRAME.width) !== Math.floor(x / FRAME.width)) continue;
        const j = (ny * W + nx) * 4;
        if (hairAt(front, j) || (hairAt(back, j) && !body.pixels[j + 3])) hairNeighbors++;
      }
      if (hairNeighbors >= 2) newFront.pixels.set([...rampColor(recipe.ramp, c.v), 255], i);
    }
  return { front: newFront, back: recolorSheet(back, recipe, true) };
}

const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => !n.startsWith(".")) : []);
const base = loadBase();
const report = [];
/** 만든 시트 (색 바꾸기 변형의 원본). */
const built = {};
/**
 * 뒷모습(북쪽) 칸 손질: 생성한 뒷모습은 머리가 앞모습보다 4픽셀쯤 크고 높게 그려져, 돌아서면 몸이 떠 보인다.
 * 서기와 걷기 뒷모습 칸은 다리에서 3줄(62, 64, 66)을 빼 몸을 내리고, 앉은 뒷모습 칸은 통째로 3줄 내린다.
 * 모든 레이어에 똑같이 해서 서로 어긋나지 않는다. 파일로 쓸 때만 하므로 색 바꾸기 변형이 두 번 내려가지 않는다.
 */
const NORTH_CELLS = [1, 8, 9, 10, 11], NORTH_SIT = 20, NORTH_DROP_ROWS = [62, 64, 66];
function lowerNorth(sheet) {
  const out = { ...sheet, pixels: sheet.pixels.slice() };
  const row = (src, cell, y) => src.pixels.subarray((y * src.width + cell * FRAME.width) * 4, (y * src.width + (cell + 1) * FRAME.width) * 4);
  for (const cell of [...NORTH_CELLS, NORTH_SIT]) {
    const keep = [];
    for (let y = 0; y < FRAME.height; y++) if (cell === NORTH_SIT || !NORTH_DROP_ROWS.includes(y)) keep.push(y);
    const drop = cell === NORTH_SIT ? NORTH_DROP_ROWS.length : FRAME.height - keep.length;
    const rows = cell === NORTH_SIT ? keep.slice(0, FRAME.height - drop) : keep;
    for (let y = 0; y < FRAME.height; y++) row(out, cell, y).fill(0);
    rows.forEach((sy, k) => row(out, cell, k + drop).set(row(sheet, cell, sy)));
  }
  return out;
}
const save = (name, image) => { built[name] = image; writeFileSync(join(OUT, `${name}.png`), encodePng(lowerNorth(image))); report.push(`${name}.png`); };
save("body-basic", buildBody(base));
for (const id of list(join(SRC, "face"))) {
  save(`face-${id}`, buildFace(id, base));
  save(`face-${id}-m`, buildFace(id, base, true));
}
// 머리 모양 원재료는 라벤더색으로 생성한다. 머리 색 recolor/hair-color/<색>.json을 모든 모양에 입혀 hair-<모양>-<색>을 만든다.
const recipe = (...path) => JSON.parse(readFileSync(join(SRC, "recolor", ...path), "utf8"));
for (const style of list(join(SRC, "hair"))) {
  const { front, back } = buildHair(style, base);
  save(`hair-${style}-lavender-front`, front);
  save(`hair-${style}-lavender-back`, back);
  for (const file of list(join(SRC, "recolor", "hair-color"))) {
    const color = file.replace(/\.json$/, "");
    const dyed = recolorHair(front, back, built["body-basic"], recipe("hair-color", file));
    save(`hair-${style}-${color}-front`, dyed.front);
    save(`hair-${style}-${color}-back`, dyed.back);
  }
}
for (const id of list(join(SRC, "outfit"))) save(`outfit-${id}`, buildOutfit(id, base));
for (const id of list(join(SRC, "accessory"))) save(`acc-${id}`, buildAccessory(id, base));
// 그 밖의 색 바꾸기 변형 (눈 색): recolor/<시트 이름>.json의 from 시트에서 만든다. 남자 눈매 판(-m)이 있으면 같이 만든다.
for (const file of list(join(SRC, "recolor")).filter((n) => n.endsWith(".json"))) {
  const r = recipe(file), name = file.replace(/\.json$/, "");
  save(name, recolorSheet(built[r.from], r));
  if (built[`${r.from}-m`]) save(`${name}-m`, recolorSheet(built[`${r.from}-m`], r));
}
const placeholders = DIRS.filter((d) => base[d].walk[0].placeholder);
console.log("시트:", report.join(", "));
console.log("걷기 머리 높이:", DIRS.map((d) => `${d} ${base[d].walk.map((w) => w.headDy).join("/")}`).join(", "));
if (placeholders.length) console.log("임시 대체(걷기 미생성):", placeholders.join(", "));
