// 사용법: node tools/art/desk-items.mjs
// 내 책상 세트 아이템 그림 (꾸미기 슬롯 계획 1절, 2026-11-01). 회사 방 책상의 세 자리에 1배로 얹는다.
//   책상 소품(desk_top, 왼쪽과 오른쪽 자리) 32×44: PixelLab pixen(no_background, 시드 21)으로 한 장씩 그린 art-src/rooms/desk/src/<id>.png.
//     자리 바닥 줄이 책상 앞 가장자리라 소품은 그림 아래쪽에 서 있다. 반투명 칸은 반올림해 완전 불투명과 완전 투명만 남긴다.
//   책상 스티커(desk_front, 앞면 자리) 32×16: 아래에 손으로 찍었다.
// 결과: art-src/rooms/desk/<id>.png와 같은 파일을 public/assets/rooms/desk/<id>.png에, 확인용 4배 그림 art-src/rooms/desk/preview-items.png.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";

const SRC = "art-src/rooms/desk/src";
const OUT = "art-src/rooms/desk";
const PUBLIC = "public/assets/rooms/desk";

/** 그림 안 반투명 칸을 반올림한다 (가장자리 흐림 없이 1배로 얹기 위해). */
function solid(image) {
  for (let k = 3; k < image.pixels.length; k += 4) image.pixels[k] = image.pixels[k] >= 128 ? 255 : 0;
  return image;
}

/** 글자 그림(.은 투명)을 팔레트 색으로 찍는다. */
function draw(width, height, layers) {
  const image = { width, height, pixels: new Uint8Array(width * height * 4) };
  for (const { x, y, rows, palette } of layers)
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (palette[ch]) image.pixels.set([...palette[ch], 255], ((y + dy) * width + x + dx) * 4);
    }));
  return image;
}

/** 스티커 바탕: 짙은 테두리, 흰 띠, 파스텔 안쪽의 둥근 모서리 32×16. */
const label = (fill) => ({
  x: 0, y: 0, palette: { o: [84, 62, 54], w: [252, 248, 240], b: fill },
  rows: [
    "..oooooooooooooooooooooooooooo..",
    ".owwwwwwwwwwwwwwwwwwwwwwwwwwwwo.",
    "owwbbbbbbbbbbbbbbbbbbbbbbbbbbwwo",
    ...Array(10).fill("owbbbbbbbbbbbbbbbbbbbbbbbbbbbbwo"),
    "owwbbbbbbbbbbbbbbbbbbbbbbbbbbwwo",
    ".owwwwwwwwwwwwwwwwwwwwwwwwwwwwo.",
    "..oooooooooooooooooooooooooooo..",
  ],
});
const STAR = { Y: [214, 150, 40], y: [252, 214, 96] };
const bigStar = ["....Y....", "...YyY...", "...YyY...", "YYYYyYYYY", ".YyyyyyY.", "..YyyyY..", "..YyYyY..", ".YyY.YyY.", ".YY...YY."];
const smallStar = ["..Y..", ".YyY.", "YyyyY", ".YyY.", "..Y.."];
const CAT = { o: [84, 62, 54], W: [252, 248, 240], e: [60, 44, 40], c: [240, 150, 160], n: [230, 120, 130] };
const catFace = [".o........o.", "oWo......oWo", "oWWo....oWWo", "oWWWooooWWWo", "oWWWWWWWWWWo", "oWeWWWWWWeWo", "oWcWWnnWWcWo", ".oWWWWWWWWo.", "..oooooooo.."];
const HEART = { r: [232, 96, 110] };
const heart = [".r.r.", "rrrrr", ".rrr.", "..r.."];

/** 책상 소품을 바닥 줄에 세운다: 가장 아래 불투명 줄이 BASE_ROW가 되도록 내린다 (2026-11-01: 책 더미가 떠 보였다). */
const BASE_ROW = 42;
function standOnDesk(image) {
  let bottom = -1;
  for (let k = 0; k < image.width * image.height; k++) if (image.pixels[k * 4 + 3]) bottom = Math.max(bottom, Math.floor(k / image.width));
  const dy = BASE_ROW - bottom;
  if (dy <= 0) return image;
  const out = { ...image, pixels: new Uint8Array(image.pixels.length) };
  out.pixels.set(image.pixels.subarray(0, (image.height - dy) * image.width * 4), dy * image.width * 4);
  return out;
}

/** 머그와 쿠키: 생성 그림의 머그 손잡이가 양쪽에 있어 오른쪽(접시 쪽)을 지우고, 몸통 오른쪽 끝(x 19)을 외곽선으로 닫는다. */
function oneHandle(image) {
  const INK = [73, 1, 0, 255];
  for (let y = 22; y <= 29; y++) {
    for (let x = 20; x <= 22; x++) image.pixels.fill(0, (y * image.width + x) * 4, (y * image.width + x) * 4 + 4);
    if (image.pixels[(y * image.width + 19) * 4 + 3]) image.pixels.set(INK, (y * image.width + 19) * 4);
  }
  return image;
}

const items = {};
for (const name of readdirSync(SRC).filter((n) => n.endsWith(".png"))) items[name.replace(/\.png$/, "")] = solid(decodePng(readFileSync(join(SRC, name))));
items["desk-mug"] = oneHandle(items["desk-mug"]);
for (const id of Object.keys(items)) if (items[id].height === 44) items[id] = standOnDesk(items[id]);
items["sticker-star"] = draw(32, 16, [
  label([196, 222, 246]),
  { x: 12, y: 3, rows: bigStar, palette: STAR },
  { x: 5, y: 5, rows: smallStar, palette: STAR },
  { x: 23, y: 6, rows: smallStar, palette: STAR },
]);
items["sticker-cat"] = draw(32, 16, [
  label([248, 210, 216]),
  { x: 10, y: 3, rows: catFace, palette: CAT },
  { x: 4, y: 6, rows: heart, palette: HEART },
  { x: 23, y: 6, rows: heart, palette: HEART },
]);

mkdirSync(PUBLIC, { recursive: true });
for (const [id, image] of Object.entries(items)) {
  const png = encodePng(image);
  writeFileSync(join(OUT, `${id}.png`), png);
  writeFileSync(join(PUBLIC, `${id}.png`), png);
}

// 확인용: 모든 아이템을 4배로 한 줄에
{
  const S = 4, list = Object.values(items), W = list.reduce((w, i) => w + i.width + 4, 4) * S, H = 52 * S;
  const sheet = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
  for (let k = 0; k < W * H; k++) sheet.pixels.set([58, 48, 44, 255], k * 4);
  let ox = 4;
  for (const im of list) {
    for (let y = 0; y < im.height * S; y++) for (let x = 0; x < im.width * S; x++) {
      const k = (((y / S) | 0) * im.width + ((x / S) | 0)) * 4;
      if (im.pixels[k + 3]) sheet.pixels.set(im.pixels.subarray(k, k + 4), ((4 * S + y) * W + ox * S + x) * 4);
    }
    ox += im.width + 4;
  }
  writeFileSync(join(OUT, "preview-items.png"), encodePng(sheet));
}
console.log(`책상 아이템 ${Object.keys(items).length}개: ${Object.keys(items).join(", ")}`);
