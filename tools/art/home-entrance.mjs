// 사용법: node tools/art/home-entrance.mjs
// 로그인과 환영 화면의 "집 현관" 장면(240×144)을 손 보정해 내보낸다 (2026-10-31, 내 방과 같은 분위기).
// 원재료: art-src/home/entrance/src/
//   draft-2.png    PixelLab pixen 시안 4장 중 고른 것 (360×216, 시드 72). 문 위에 문패 자리가 있다.
//   generated.png  시안을 240×144로 줄인 그림을 출발점 삼아 pixflux(시드 82, 보존 200)로 새로 그렸다.
// 손 보정: 1) 벽등의 네모난 빛 상자를 계단식 타원 빛으로, 2) 문 위 문패를 지우고 벽지(분홍 점)를 채운다.
//   문패는 이름 길이에 맞춰 늘어나야 해서 그림에 넣지 않고 9조각 sign.png(양 끝 4px + 가운데 1px)로 따로 그린다.
// 결과: art-src/home/entrance/{entrance,sign,preview}.png, 화면용 public/assets/home/entrance/{entrance,sign}.png
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";

const SRC = "art-src/home/entrance/src";
const OUT = "art-src/home/entrance";
const PUBLIC = "public/assets/home/entrance";

const scene = decodePng(readFileSync(join(SRC, "generated.png")));
const W = scene.width;
const rgb = (hex) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
const at = (x, y) => scene.pixels.subarray((y * W + x) * 4, (y * W + x) * 4 + 3);
const hexAt = (x, y) => Array.from(at(x, y), (v) => v.toString(16).padStart(2, "0")).join("");
const put = (x, y, hex) => scene.pixels.set([...rgb(hex), 255], (y * W + x) * 4);

/** 벽지: 크림 바탕과 분홍 점(+ 모양)의 색. */
const BASE = "e8cda2";
const DOT = new Set(["d9a28e", "c48077", "d4ad87"]);
const isWall = (x, y) => hexAt(x, y) === BASE || DOT.has(hexAt(x, y));
/** 분홍 점 하나 (가운데 진한 분홍, 십자 팔). 벽지인 칸에만 찍는다. */
const stampDot = (cx, cy, inside = () => true) => {
  for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) {
    const x = cx + dx, y = cy + dy;
    if (inside(x, y) || isWall(x, y)) put(x, y, dx || dy ? "d9a28e" : "c48077");
  }
};

// 손 보정 1: 벽등 빛. 생성 그림은 x 156~184, y 30~67을 네모나게 밝혔다. 빛을 걷어 낸 뒤 비어 있던 점을 채우고,
// 등 가운데를 중심으로 안쪽 타원은 밝게, 바깥 고리는 반만 밝게 칠한다 (벽지 칸만, 등과 사슬은 그대로).
{
  const GLOW = "fcf0b0";
  for (let y = 28; y <= 70; y++) for (let x = 150; x <= 186; x++) if (hexAt(x, y) === GLOW) put(x, y, BASE);
  stampDot(181, 33);
  stampDot(181, 47);
  const cx = 167.5, cy = 49, LIT = { [BASE]: GLOW, d9a28e: "eac99f", c48077: "e0b090", d4ad87: "eccb9f" };
  const HALF = { [BASE]: "f2dea9", d9a28e: "e1b696", c48077: "d69a83", d4ad87: "e0bc93" };
  for (let y = 28; y <= 70; y++) for (let x = 150; x <= 186; x++) {
    const d = Math.hypot((x - cx) / 15, (y - cy) / 18);
    const c = hexAt(x, y);
    if (d <= 0.7 && LIT[c]) put(x, y, LIT[c]);
    else if (d <= 1 && HALF[c]) put(x, y, HALF[c]);
  }
}

// 손 보정 2: 문 위 문패(x 91~143, y 18~33)를 지우고 벽지로 채운다. 점 자리는 양옆 벽지의 줄(가로 약 12.75칸, 줄마다 반 칸 어긋남)을 잇는다.
const HOLE = { x0: 89, x1: 145, y0: 17, y1: 33 };
{
  const inHole = (x, y) => x >= HOLE.x0 && x <= HOLE.x1 && y >= HOLE.y0 && y <= HOLE.y1;
  for (let y = HOLE.y0; y <= HOLE.y1; y++) for (let x = HOLE.x0; x <= HOLE.x1; x++) put(x, y, BASE);
  for (const cx of [92, 104, 117, 130, 142]) stampDot(cx, 20, inHole);
  for (const cx of [98, 111, 124, 137]) stampDot(cx, 26, inHole);
  for (const cx of [92, 104, 117, 130, 142]) stampDot(cx, 33, inHole);
}

// 문패 9조각: 가운데 줄 1칸은 가로로 늘리고, 양 끝 4칸은 말린 나무 끝이다. 위아래 각 1줄은 끝만 튀어나오고, 맨 아래 가운데는 벽 그림자.
const SIGN_PALETTE = { h: "703b2b", L: "e6c690", k: "bb7a38", d: "d1ab6e", i: "c19572", m: "c39a5f", s: "cfb68f" };
const CAP = ["hhh.", ...Array(14).fill("hLkh"), "hhh."].map((r, n) => (n === 0 || n === 15 ? ".hhh" : r));
const MID = [".", "h", "L", "d", "i", "d", "d", "d", "d", "d", "d", "i", "d", "m", "h", "s"];
const sign = { width: 9, height: 16, pixels: new Uint8Array(9 * 16 * 4) };
for (let y = 0; y < 16; y++) {
  const row = CAP[y] + MID[y] + [...CAP[y]].reverse().join("");
  [...row].forEach((ch, x) => { if (SIGN_PALETTE[ch]) sign.pixels.set([...rgb(SIGN_PALETTE[ch]), 255], (y * 9 + x) * 4); });
}

mkdirSync(PUBLIC, { recursive: true });
for (const [name, image] of [["entrance", scene], ["sign", sign]]) {
  const png = encodePng(image);
  writeFileSync(join(OUT, `${name}.png`), png);
  writeFileSync(join(PUBLIC, `${name}.png`), png);
}

// 확인용: 가장 좁은 문패(53칸, 가운데 x 118)를 얹고 3배로 키운 그림
{
  const SIGN = { center: 118, top: 18, minWidth: 53 }, comp = { width: W, height: scene.height, pixels: scene.pixels.slice() };
  const x0 = SIGN.center - Math.floor(SIGN.minWidth / 2);
  for (let y = 0; y < 16; y++) for (let dx = 0; dx < SIGN.minWidth; dx++) {
    const sx = dx < 4 ? dx : dx >= SIGN.minWidth - 4 ? 9 - (SIGN.minWidth - dx) : 4;
    const i = (y * 9 + sx) * 4;
    if (sign.pixels[i + 3]) comp.pixels.set(sign.pixels.subarray(i, i + 4), ((SIGN.top + y) * W + x0 + dx) * 4);
  }
  const S = 3, big = { width: W * S, height: comp.height * S, pixels: new Uint8Array(W * comp.height * S * S * 4) };
  for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) {
    const i = (Math.floor(y / S) * W + Math.floor(x / S)) * 4;
    big.pixels.set(comp.pixels.subarray(i, i + 4), (y * big.width + x) * 4);
  }
  writeFileSync(join(OUT, "preview.png"), encodePng(big));
}
console.log(`현관 ${W}×${scene.height}, 문패 9조각 9×16`);
