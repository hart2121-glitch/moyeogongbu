// 사용법: node tools/art/hand-accessories.mjs
// 생성하지 않고 손으로 찍는 작은 장식(안경, 별 머리핀)을 방향별 서기 칸(56×72, 기본 몸과 같은 정렬 좌표)으로 그린다 (Story 009).
// 출력: art-src/characters/src/accessory/<id>/hand/{south,west,north}.png. build-character.mjs가 머리 높이에 맞춰 붙인다.
// 좌표는 기본 얼굴 시트에서 잰 눈 자리 기준이다: 정면 눈 x 16~24, 31~39, y 32~42 / 옆 눈 x 23~28, y 31~39.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodePng, FRAME } from "./pixelArt.mjs";

const SRC = "art-src/characters/src/accessory";
const FRAME_INK = [59, 44, 34, 255]; // 안경테: 명패 잉크 계열의 짙은 고동
const GLINT = [255, 255, 255, 255];
const STAR = { fill: [241, 184, 84, 255], shade: [201, 138, 27, 255], line: [107, 74, 30, 255] };

const blank = () => ({ width: FRAME.width, height: FRAME.height, pixels: new Uint8Array(FRAME.width * FRAME.height * 4) });
const dot = (im, x, y, rgba) => im.pixels.set(rgba, (y * im.width + x) * 4);

/** 지름 11칸 둥근 안경알 테두리 (가운데 cx, cy). 안쪽은 비우고 왼쪽 위에 반짝임 한 칸. */
function lens(im, cx, cy) {
  const ring = ["...###...", "..#...#..", ".#.....#.", "#.......#", "#.......#", "#.......#", ".#.....#.", "..#...#..", "...###..."];
  ring.forEach((row, dy) => [...row].forEach((c, dx) => { if (c === "#") dot(im, cx - 4 + dx, cy - 4 + dy, FRAME_INK); }));
  dot(im, cx - 2, cy - 2, GLINT);
}

/** 옆모습 안경알: 세로로 긴 좁은 테와 귀 쪽으로 가는 다리. */
function sideLens(im, x0, y0, armTo) {
  const ring = [".##.", "#..#", "#..#", "#..#", "#..#", "#..#", ".##."];
  ring.forEach((row, dy) => [...row].forEach((c, dx) => { if (c === "#") dot(im, x0 + dx, y0 + dy, FRAME_INK); }));
  for (let x = x0 + 4; x <= armTo; x++) dot(im, x, y0 + 2, FRAME_INK);
}

/** 7×7 별 머리핀 (왼쪽 위 x0, y0). */
function star(im, x0, y0) {
  const art = ["...o...", "..oyo..", "ooyyyoo", "oyyyyyo", ".oyssyo", ".oso.so", "oo...oo"];
  art.forEach((row, dy) => [...row].forEach((c, dx) => {
    const rgba = c === "o" ? STAR.line : c === "y" ? STAR.fill : c === "s" ? STAR.shade : null;
    if (rgba) dot(im, x0 + dx, y0 + dy, rgba);
  }));
}

const drawings = {
  glasses: {
    south: (im) => { lens(im, 20, 37); lens(im, 35, 37); for (let x = 25; x <= 30; x++) dot(im, x, 36, FRAME_INK); dot(im, 15, 36, FRAME_INK); dot(im, 40, 36, FRAME_INK); },
    west: (im) => sideLens(im, 21, 32, 33),
    north: () => {},
  },
  hairpin: {
    south: (im) => star(im, 37, 17),
    west: (im) => star(im, 32, 16),
    north: (im) => star(im, 12, 17),
  },
};

for (const [id, dirs] of Object.entries(drawings)) {
  const dir = join(SRC, id, "hand");
  mkdirSync(dir, { recursive: true });
  for (const [d, draw] of Object.entries(dirs)) {
    const im = blank();
    draw(im);
    writeFileSync(join(dir, `${d}.png`), encodePng(im));
  }
  console.log(id, Object.keys(dirs).join(", "));
}
