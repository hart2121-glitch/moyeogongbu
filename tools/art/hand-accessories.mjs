// 사용법: node tools/art/hand-accessories.mjs
// 생성하지 않고 손으로 찍는 작은 장식(안경, 별 머리핀)과 생성 그림이 어색한 방향(목도리 옆)을
// 방향별 서기 칸(56×72, 기본 몸과 같은 정렬 좌표)으로 그린다 (Story 009).
// 출력: art-src/characters/src/accessory/<id>/hand/<방향>.png. build-character.mjs가 머리 높이에 맞춰 붙인다.
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

/** 문자 그림을 (x0, y0)부터 찍는다. 표에 없는 글자는 비운다. */
function art(im, x0, y0, rows, colors) {
  rows.forEach((row, dy) => [...row].forEach((c, dx) => { if (colors[c]) dot(im, x0 + dx, y0 + dy, colors[c]); }));
}

// 목도리 색: pixen으로 그린 앞모습 목도리에서 뽑았다 (A 외곽선, E~O 밝은 쪽, C~D 중간, F~K 그늘).
const SCARF = {
  A: [91, 3, 4, 255], E: [254, 81, 67, 255], N: [250, 60, 51, 255], O: [237, 48, 40, 255], C: [205, 31, 29, 255],
  L: [194, 27, 27, 255], G: [190, 26, 25, 255], D: [176, 23, 24, 255], F: [159, 20, 21, 255], P: [148, 17, 18, 255], K: [128, 11, 12, 255],
};

/**
 * 옆모습 목도리 (서쪽을 본다): 앞이 두껍고 뒤로 갈수록 가는 띠와, 가슴 앞으로 늘어진 술 달린 끝자락.
 * 기본 몸 옆 서기에서 턱 끝은 43줄 x 21~32, 목은 44줄 x 26~33, 몸통은 45~48줄 x 24~34다.
 */
function sideScarf(im) {
  art(im, 21, 44, [
    "...AAAAAAAAA....",
    "..AEENOOCCLLAA..",
    ".AENOCOCLCLGDDA.",
    "AENOFPFFPFPFKKA.",
    "AEOCCOCLCLGDA...",
    "ANOCLGDAAAAA....",
    ".ACLGDA",
    ".AEOLDA",
    ".AEOGDA",
    "AENCGA",
    "AEOCDA",
    "ANCDKA",
    "AAAAAA",
    "A.A.A",
  ], SCARF);
}

/**
 * 11×10 별 머리핀 (왼쪽 위 x0, y0). 다섯 꼭짓점이 보이도록 모양을 먼저 정하고, 바깥에 닿은 칸은 외곽선,
 * 안쪽은 노랑으로 칠한 뒤 왼쪽 위에 빛, 아래 다리에 그늘을 둔다 (2026-11-01: 7×7은 별로 보이지 않았다).
 */
function star(im, x0, y0) {
  const shape = [
    ".....#.....",
    "....###....",
    "....###....",
    "###########",
    ".#########.",
    "..#######..",
    "..#######..",
    ".####.####.",
    ".###...###.",
    "##.......##",
  ];
  const on = (x, y) => shape[y]?.[x] === "#";
  const LIGHT = [255, 236, 150, 255];
  shape.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== "#") return;
    const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
    const rgba = edge ? STAR.line : y <= 4 && x <= 5 ? LIGHT : y >= 6 ? STAR.shade : STAR.fill;
    dot(im, x0 + x, y0 + y, rgba);
  }));
}

const drawings = {
  glasses: {
    south: (im) => { lens(im, 20, 37); lens(im, 35, 37); for (let x = 25; x <= 30; x++) dot(im, x, 36, FRAME_INK); dot(im, 15, 36, FRAME_INK); dot(im, 40, 36, FRAME_INK); },
    west: (im) => sideLens(im, 21, 32, 33),
    north: () => {},
  },
  hairpin: {
    south: (im) => star(im, 35, 15),
    west: (im) => star(im, 30, 14),
    north: (im) => star(im, 10, 15),
  },
  // 목도리는 앞과 뒤는 pixen 그림을 쓰고, 생성 옆모습이 앞모습 무늬를 붙인 T자 모양이라 옆만 손으로 찍는다.
  scarf: {
    west: sideScarf,
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
