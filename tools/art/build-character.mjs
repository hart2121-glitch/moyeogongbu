// 사용법: node tools/art/build-character.mjs
// art-src/characters/src/의 기본 몸과 부품 원재료로 23프레임 시트를 만든다 (Story 009).
// 출력: art-src/characters/body-basic.png, hair-<id>-front.png, hair-<id>-back.png, outfit-<id>.png
// 게임은 뒷머리 → 몸 → 옷 → 앞머리 순서로 같은 칸을 겹친다.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";
import { cropCell, extractPart, feetAlignment, fitWalkFrame, mirror, NECK, placeHeadPart, shift, SIT_DROP, toSheet } from "./characterParts.mjs";
import { hsv } from "./rigImage.mjs";
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

function buildBody(base) {
  const per = {};
  for (const dir of DIRS) per[dir] = { stand: base[dir].stand, walk: base[dir].walk.map((w) => w.cell) };
  per.north.sitUp = sitFrame(base.north.stand);
  per.south.sitDown = sitFrame(base.south.stand);
  per.south.rest = restFrame(base.south.stand);
  return toSheet(frameOrder(per));
}

/** 머리카락: 방향당 1장을 떼어 내 프레임마다 머리 높이에 맞춰 앞머리와 뒷머리 시트로 나눈다. */
function buildHair(id, base) {
  const parts = {};
  for (const dir of DIRS) parts[dir] = extractPart(loadRot(base, dir, "hair", id, "rot"), base[dir].stand, "head");
  const sheets = {};
  for (const which of ["front", "back"]) {
    const per = {};
    for (const dir of DIRS)
      per[dir] = { stand: placeHeadPart(parts[dir], 0, which), walk: base[dir].walk.map((w) => placeHeadPart(parts[dir], w.headDy, which)) };
    per.north.sitUp = placeHeadPart(parts.north, SIT_DROP, which);
    per.south.sitDown = placeHeadPart(parts.south, SIT_DROP, which);
    per.south.rest = placeHeadPart(parts.south, SIT_DROP, which);
    sheets[which] = toSheet(frameOrder(per));
  }
  return sheets;
}

/**
 * 완성 캐릭터에서 임시로 떼어 낸 옷(FROM-FULL-CHARACTER 표시 파일)은 머리카락과 리본이 섞여 있다.
 * 목 위 픽셀과 머리카락, 리본 색(밝은 라벤더, 진한 보라)을 지운다. "기본 몸 + 옷"으로 생성한 재료에는 쓰지 않는다.
 */
function stripHeadColors(part) {
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
  return out;
}

/** 옷: 서기는 방향별로, 걷기는 프레임마다 기본 몸 걷기와 같은 자리에서 잘라 차이를 떼어 낸다. */
function buildOutfit(id, base) {
  const fromFull = existsSync(join(SRC, "outfit", id, "FROM-FULL-CHARACTER"));
  const clean = (part) => (fromFull ? stripHeadColors(part) : part);
  const per = {};
  for (const dir of DIRS) {
    const standPart = clean(extractPart(loadRot(base, dir, "outfit", id, "rot"), base[dir].stand, "body"));
    const walkDir = join(SRC, "outfit", id, "walk", srcDir(dir));
    // 옷 걷기는 기본 몸 걷기와 같은 뼈대라, 기본 몸 칸과 같은 자리에서 잘라 비교한다
    const walk = base[dir].walk.map((w, i) => {
      if (w.placeholder || !existsSync(walkDir)) return standPart;
      const cell = cropCell(flipIfEast(dir, load(join(walkDir, `${i}.png`))), w.origin.x, w.origin.y);
      return clean(extractPart(cell, w.cell, "body"));
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
  const hairId = readFileSync(join(SRC, "accessory", id, "OVER-HAIR"), "utf8").trim();
  const parts = {};
  for (const dir of DIRS) {
    const withHair = loadRot(base, dir, "hair", hairId, "rot");
    const raw = extractPart(loadRot(base, dir, "accessory", id, "rot"), withHair, "head");
    parts[dir] = keepVivid(raw);
  }
  const per = {};
  for (const dir of DIRS)
    per[dir] = { stand: placeHeadPart(parts[dir], 0, "all"), walk: base[dir].walk.map((w) => placeHeadPart(parts[dir], w.headDy, "all")) };
  per.north.sitUp = placeHeadPart(parts.north, SIT_DROP, "all");
  per.south.sitDown = placeHeadPart(parts.south, SIT_DROP, "all");
  per.south.rest = placeHeadPart(parts.south, SIT_DROP, "all");
  return toSheet(frameOrder(per));
}

/** 채도가 높은 장식 색 픽셀과, 그것에 맞닿은 짙은 외곽선만 남긴다. */
function keepVivid(part) {
  const out = { ...part, pixels: new Uint8Array(part.pixels.length) };
  const vivid = (i) => { const c = hsv(part.pixels[i], part.pixels[i + 1], part.pixels[i + 2]); return part.pixels[i + 3] && c.s > 0.45 && c.v > 0.4; };
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

const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => !n.startsWith(".")) : []);
const base = loadBase();
const report = [];
writeFileSync(join(OUT, "body-basic.png"), encodePng(buildBody(base)));
report.push("body-basic.png");
for (const id of list(join(SRC, "hair"))) {
  const { front, back } = buildHair(id, base);
  writeFileSync(join(OUT, `hair-${id}-front.png`), encodePng(front));
  writeFileSync(join(OUT, `hair-${id}-back.png`), encodePng(back));
  report.push(`hair-${id}-front.png`, `hair-${id}-back.png`);
}
for (const id of list(join(SRC, "outfit"))) {
  writeFileSync(join(OUT, `outfit-${id}.png`), encodePng(buildOutfit(id, base)));
  report.push(`outfit-${id}.png`);
}
for (const id of list(join(SRC, "accessory"))) {
  writeFileSync(join(OUT, `acc-${id}.png`), encodePng(buildAccessory(id, base)));
  report.push(`acc-${id}.png`);
}
const placeholders = DIRS.filter((d) => base[d].walk[0].placeholder);
console.log("시트:", report.join(", "));
console.log("걷기 머리 높이:", DIRS.map((d) => `${d} ${base[d].walk.map((w) => w.headDy).join("/")}`).join(", "));
if (placeholders.length) console.log("임시 대체(걷기 미생성):", placeholders.join(", "));
