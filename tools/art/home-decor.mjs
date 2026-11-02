// 사용법: node tools/art/home-decor.mjs
// 로비 "내 방" 꾸밈 (꾸미기 슬롯 계획 3절). 2026-11-02 사용자 결정:
// - 완성된 방 그림에서 물건을 떼지 않는다. 물건 없는 빈 방(art-src/home/room/src/empty.png) 위에 물건마다 따로 만든 그림
//   (art-src/home/room/objects/src/, PixelLab)을 정한 자리에 올린다. 아이템 그림에는 그 물건 픽셀만 있다.
// - 판매 아이템은 브라운, 화이트, 블랙, 앤티크 테마로 묶어 서로 조합되게 하고, 바닥에 데코타일과 대리석, 파케이를 더한다.
// 그림자는 바닥에 닿는 물건 밑의 납작한 타원(곱하기 층)으로 그린다. 러그, 커튼 천, 커튼 봉은 새로 그린다.
// 가구 아이템은 같은 물건 그림에서 재질 칸(나무, 천, 갓, 받침, 쿠션, 다리)만 테마 색으로 바꾼다.
// 결과: art-src/home/room/decor/<층>.png, <아이템>-<층>.png, 같은 파일을 public/assets/home/room/decor/에,
//   층 좌표와 아이템 그림 표는 src/features/lobby/model/homeDecorLayers.ts에, 미리보기는 art-src/home/room/decor/preview-*.png.
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";

const SRC = "art-src/home/room/src";
const OUT = "art-src/home/room/decor";
const PUBLIC = "public/assets/home/room/decor";
const LAYOUT = "src/features/lobby/model/homeDecorLayers.ts";
const read = (file) => decodePng(readFileSync(file));
const E = read(join(SRC, "empty.png"));
const W = E.width, H = E.height;
const N = W * H;
const xy = (k) => [k % W, Math.floor(k / W)];

// ---- 색 ----
const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx / 255 };
};
const hsvToRgb = (h, s, v) => {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  v = Math.min(1, Math.max(0, v));
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((c) => Math.round(c * 255));
};
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const rgb = (im, k) => [im.pixels[k * 4], im.pixels[k * 4 + 1], im.pixels[k * 4 + 2]];
const colorOf = (im, k) => hsv(...rgb(im, k));
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
const blank = () => ({ width: W, height: H, pixels: new Uint8Array(N * 4) });
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// ---- 방 구조 (빈 방에서 잰 값) ----
/** 마루가 시작하는 줄. 뒷벽은 115줄, 왼쪽 옆벽은 (36,115)~(0,148), 오른쪽 옆벽은 (224,116)~(255,146). */
const floorStart = (x) => (x <= 36 ? 115 + (36 - x) * (33 / 36) : x >= 224 ? 116 + (x - 224) * (30 / 31) : 115);
const isFloor = (x, y) => y >= Math.ceil(floorStart(x));
/** 창틀과 창턱 (벽지가 아니다). */
const inWindow = (x, y) => x >= 99 && x <= 165 && y >= 12 && y <= 80;
/** 벽지 칸: 몰딩 아래부터 걸레받이 위까지, 모서리 선과 창을 뺀다. */
const isWall = (x, y) => y >= 2 && y < floorStart(x) - 7 && x !== 36 && x !== 223 && !inWindow(x, y);

// ---- 물건 그림 (따로 만든 그림을 빈 방에 올린다) ----
const OBJ = "art-src/home/room/objects/src";
/** 투명 둘레를 자른 물건 그림. clean이면 그 칸을 지운다 (협탁 바닥 그림자 줄). */
const sprite = (name, clean = () => false) => {
  const im = read(join(OBJ, `${name}.png`));
  let x0 = im.width, x1 = -1, y0 = im.height, y1 = -1;
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const k = (y * im.width + x) * 4;
    if (!im.pixels[k + 3]) continue;
    if (clean(im.pixels.subarray(k, k + 4), x, y, im)) { im.pixels.fill(0, k, k + 4); continue; }
  }
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++)
    if (im.pixels[(y * im.width + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = { width: w, height: h, pixels: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) out.pixels.set(im.pixels.subarray(((y0 + y) * im.width + x0) * 4, ((y0 + y) * im.width + x1 + 1) * 4), y * w * 4);
  // 반투명 칸은 불투명으로 (그림 규칙: 반투명은 실루엣 가장자리만인데, 만든 그림은 가장자리도 불투명이다)
  for (let k = 0; k < w * h; k++) if (out.pixels[k * 4 + 3]) out.pixels[k * 4 + 3] = 255;
  return out;
};
const nearBlack = (p) => p[0] + p[1] + p[2] < 45;
const SPRITES = {
  desk: sprite("desk"),
  armchair: sprite("armchair"),
  nightstand: sprite("nightstand", (p, x, y, im) => nearBlack(p) && y >= 36), // 바닥 그림자 줄
  bed: sprite("bed"),
  plant: sprite("plant"),
  lamp: sprite("lamp"),
  frames: sprite("frames"),
  shelves: sprite("shelves"),
  cat: sprite("cat"),
  succulent: sprite("succulent"),
  clock: sprite("clock"),
  vase: sprite("vase"),
  book: sprite("book"),
  notebook: sprite("notebook"),
  paper: sprite("paper"),
};
/** 방 크기 그림에 물건을 놓는다: 왼쪽 x, 바닥 줄 bottom(그 줄에 물건 맨 아래 칸이 온다). */
const placeAt = (spr, x, bottom) => {
  const out = blank(), top = bottom - spr.height + 1;
  for (let y = 0; y < spr.height; y++) for (let sx = 0; sx < spr.width; sx++) {
    const k = (y * spr.width + sx) * 4, X = x + sx, Y = top + y;
    if (!spr.pixels[k + 3] || X < 0 || Y < 0 || X >= W || Y >= H) continue;
    out.pixels.set(spr.pixels.subarray(k, k + 4), (Y * W + X) * 4);
  }
  return out;
};
/**
 * 물건 자리 (방 그림 1배 칸): 왼쪽 x와 바닥 줄. 옆벽 앞 물건은 그 x의 마루 시작 줄보다 아래에 바닥이 오게 한다.
 * 책상 위 물건은 책상 윗면(책상 그림 47~50줄), 협탁 위 물건은 협탁 윗면(협탁 그림 0~3줄)에 놓는다.
 */
const SPOT = {
  desk: { x: 22, bottom: 131 },
  armchair: { x: 82, bottom: 140 },
  nightstand: { x: 130, bottom: 124 },
  bed: { x: 166, bottom: 150 },
  plant: { x: 0, bottom: 150 },
  frames: { x: 46, bottom: 44 },
  shelves: { x: 188, bottom: 58 },
};
const deskTop = { y: SPOT.desk.bottom - SPRITES.desk.height + 1 + 49, x0: SPOT.desk.x + 3, x1: SPOT.desk.x + 52 };
const standTop = { y: SPOT.nightstand.bottom - SPRITES.nightstand.height + 1 + 2, x0: SPOT.nightstand.x, x1: SPOT.nightstand.x + SPRITES.nightstand.width - 1 };
/** 윗면 위 물건: 가운데 x를 cx에, 바닥을 윗면 줄에. */
const onTop = (spr, cx, y) => placeAt(spr, Math.round(cx - spr.width / 2), y);
const layers = {
  desk: placeAt(SPRITES.desk, SPOT.desk.x, SPOT.desk.bottom),
  "desk-paper": onTop(SPRITES.paper, deskTop.x0 + 14, deskTop.y),
  "desk-lamp": onTop(SPRITES.lamp, deskTop.x1 - 9, deskTop.y),
  armchair: placeAt(SPRITES.armchair, SPOT.armchair.x, SPOT.armchair.bottom),
  nightstand: placeAt(SPRITES.nightstand, SPOT.nightstand.x, SPOT.nightstand.bottom),
  "nightstand-top": onTop(SPRITES.succulent, standTop.x0 + 10, standTop.y),
  "lamp-right": onTop(SPRITES.lamp, standTop.x1 - 9, standTop.y),
  bed: placeAt(SPRITES.bed, SPOT.bed.x, SPOT.bed.bottom),
  "floor-plant": placeAt(SPRITES.plant, SPOT.plant.x, SPOT.plant.bottom),
  "frames-left": placeAt(SPRITES.frames, SPOT.frames.x, SPOT.frames.bottom),
  "wall-shelves": placeAt(SPRITES.shelves, SPOT.shelves.x, SPOT.shelves.bottom),
};
// 침대 그림의 이불(초록 칸)은 이불 자리 층으로 나눈다 (같은 그림을 색으로 나눌 뿐이라 남는 칸이 없다).
const sage = (c) => c.h >= 60 && c.h <= 170 && c.s > 0.12;
layers["bed-blanket"] = blank();
for (let k = 0; k < N; k++) {
  if (!layers.bed.pixels[k * 4 + 3] || !sage(colorOf(layers.bed, k))) continue;
  layers["bed-blanket"].pixels.set(layers.bed.pixels.subarray(k * 4, k * 4 + 4), k * 4);
  layers.bed.pixels.fill(0, k * 4, k * 4 + 4);
}
// 침대 인형은 이불 위 오른쪽 (이불 윗면 가운데 높이)
const blanketBox = (() => {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < N; k++) if (layers["bed-blanket"].pixels[k * 4 + 3]) { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
})();
layers["bed-cat"] = placeAt(SPRITES.cat, blanketBox.x1 - SPRITES.cat.width - 10, blanketBox.y0 + 16);

// ---- 그림자: 바닥에 닿는 물건 밑에 납작한 타원 두 겹 (곱하기 층) ----
const shadow = blank();
const SHADOWS = [
  { cx: SPOT.desk.x + 28, cy: SPOT.desk.bottom, rx: 30, ry: 4 },
  { cx: SPOT.armchair.x + 24, cy: SPOT.armchair.bottom, rx: 25, ry: 4 },
  { cx: SPOT.nightstand.x + 18, cy: SPOT.nightstand.bottom, rx: 19, ry: 3 },
  { cx: SPOT.bed.x + 42, cy: SPOT.bed.bottom - 1, rx: 44, ry: 5 },
  { cx: SPOT.plant.x + 18, cy: SPOT.plant.bottom, rx: 16, ry: 3 },
];
for (const { cx, cy, rx, ry } of SHADOWS) for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
  if (d > 1) continue;
  const m = d < 0.45 ? 178 : 208;
  const k = (y * W + x) * 4;
  const prev = shadow.pixels[k + 3] ? shadow.pixels[k] : 255;
  shadow.pixels.set([Math.min(prev, m), Math.min(prev, m) - 4, Math.min(prev, m) - 8, 255], k);
}
layers.shadow = shadow;

// 마루 원근: 판자 선이 (126, 17)로 모인다. Z는 깊이(맨 앞 줄 151이 1), X는 가로 (같은 단위).
const VP = { x: 126, y: 17 }, FOCAL = 284, DEPTH = 134;
const floorZ = (y) => DEPTH / (y - VP.y);
const floorX = (x, y) => ((x - VP.x) * floorZ(y)) / FOCAL;
// 러그: 바닥 위 사각형 (뒤 118줄, 앞은 그림 밖까지).
const RUG = { x0: -0.265, x1: 0.19, zBack: floorZ(118), zFront: 0.86 };
const inRug = (x, y) => {
  if (!isFloor(x, y) || y < 118) return false;
  const X = floorX(x, y), Z = floorZ(y);
  return X >= RUG.x0 && X <= RUG.x1 && Z <= RUG.zBack && Z >= RUG.zFront;
};
// 원래 러그의 밝은 바탕색 (그림자 비율의 기준).

// ---- 새로 그리는 것: 러그, 커튼 천 ----
/** 러그 그림: 바닥 원근으로 사각형을 채운다. paint(u, v, edge)는 러그 안 위치(u 왼→오 0~1, v 뒤→앞 0~1)의 색. */
const drawRug = (paint) => {
  const out = blank();
  for (let k = 0; k < N; k++) {
    const [x, y] = xy(k);
    if (!inRug(x, y)) continue;
    const X = floorX(x, y), Z = floorZ(y);
    const u = (X - RUG.x0) / (RUG.x1 - RUG.x0), v = (RUG.zBack - Z) / (RUG.zBack - RUG.zFront);
    const edge = ![[1, 0], [-1, 0], [0, -1]].every(([dx, dy]) => inRug(x + dx, y + dy));
    out.pixels.set([...paint(u, v, edge, x, y), 255], k * 4);
  }
  return out;
};
/** 러그 테두리 띠 (u, v 단위의 두께). 앞쪽은 그림 밖이라 띠가 없다. */
const band = (u, v, t) => u < t || u > 1 - t || v < t * 1.6;
const RUGS = {
  cream: (u, v, edge) => (edge ? hex("#b8a585") : band(u, v, 0.05) ? hex("#d9c9a8") : hex("#ebdfc6")),
  camel: (u, v, edge) => (edge ? hex("#6e4a2c") : band(u, v, 0.05) ? hex("#8f6239") : band(u, v, 0.09) ? hex("#e2c9a0") : hex("#b98b5c")),
  ivory: (u, v, edge) => (edge ? hex("#b7b2a6") : band(u, v, 0.05) && !band(u, v, 0.035) ? hex("#c9c4b8") : hex("#f3efe5")),
  charcoal: (u, v, edge) => (edge ? hex("#26262b") : band(u, v, 0.06) && !band(u, v, 0.04) ? hex("#a9a9ad") : hex("#4b4b52")),
  persian: (u, v, edge, x, y) => {
    if (edge) return hex("#3a1418");
    if (band(u, v, 0.06)) return (x + y) % 4 === 0 ? hex("#c9a25b") : hex("#2f3a5c");
    if (band(u, v, 0.08)) return hex("#c9a25b");
    const du = Math.abs(u - 0.5) * 2, dv = Math.abs(v - 0.5) * 2;
    if (du + dv < 0.42) return du + dv < 0.2 ? hex("#2f3a5c") : hex("#c9a25b");
    if (Math.abs(du + dv - 0.62) < 0.05) return hex("#d8b46c");
    return (Math.floor(x / 3) + Math.floor(y / 2)) % 7 === 0 ? hex("#8f3a3a") : hex("#7a2b2f");
  },
};

// 커튼 천: 창 양옆에 늘어진 두 폭. 봉(curtain-rod) 아래 13줄부터 98줄까지, 주름은 세로 줄무늬.
const CURTAIN_PANELS = [{ x0: 87, x1: 106 }, { x0: 160, x1: 179 }];
const CURTAINS = {
  ivory: ["#a39783", "#d2c8b4", "#e8e0d0", "#f6f1e6"],
  linen: ["#7c6146", "#b6956c", "#ccb088", "#e0c9a3"],
  charcoal: ["#232327", "#45454c", "#5b5b63", "#73737b"],
  burgundy: ["#3e1015", "#6a1f27", "#8a2d36", "#a8424b"],
};
const drawCurtains = (ramp, tie) => {
  const [o, d, m, l] = ramp.map(hex);
  const out = blank();
  for (const { x0, x1 } of CURTAIN_PANELS) {
    const w = x1 - x0 + 1;
    for (let y = 13; y <= 98; y++) {
      // 묶은 자리(60줄 둘레)는 살짝 좁고, 아래 끝은 주름 따라 들쭉날쭉하다.
      const pinch = tie && y >= 56 && y <= 64 ? 2 : 0;
      const left = x0 === 87 ? pinch : 0, right = x0 === 87 ? 0 : pinch;
      for (let x = x0 + left; x <= x1 - right; x++) {
        const i = x - x0;
        if (y >= 96 && (i % 5 === 2) === (y === 98)) continue;
        const edge = x === x0 + left || x === x1 - right || y === 13 || y === 98 || (y >= 96 && i % 5 === 2);
        const fold = i % 5;
        const c = edge ? o : fold === 0 ? d : fold === 1 || fold === 4 ? m : l;
        out.pixels.set([...c, 255], (y * W + x) * 4);
      }
      if (tie && y >= 58 && y <= 61) {
        // 끈: 금색 (앤티크) 또는 천보다 짙은 색
        const tx0 = x0 === 87 ? x0 + 2 : x0, tx1 = x0 === 87 ? x1 : x1 - 2;
        for (let x = tx0; x <= tx1; x++) out.pixels.set([...(y === 58 || y === 61 ? o : tie), 255], (y * W + x) * 4);
      }
    }
  }
  return out;
};

// ---- 벽지와 바닥 ----
/** 빈 방 벽, 마루의 밝기 흐름 (모서리 그늘, 가운데 볕). 무늬를 지우려고 넓게 평균 낸다. */
const shading = (mask, radius) => {
  const L = new Float32Array(N), M = new Uint8Array(N);
  for (let k = 0; k < N; k++) { const [x, y] = xy(k); if (mask(x, y)) { L[k] = lum(rgb(E, k)); M[k] = 1; } }
  const sorted = [...L.filter((_, k) => M[k])].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.75)];
  const out = new Float32Array(N).fill(1);
  for (let k = 0; k < N; k++) {
    if (!M[k]) continue;
    const [x, y] = xy(k);
    let s = 0, n = 0;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n2 = ny * W + nx;
      if (M[n2] && L[n2] > ref * 0.82) { s += L[n2]; n++; }
    }
    out[k] = n ? Math.min(1.05, Math.max(0.7, s / n / ref)) : 1;
  }
  return out;
};
const wallShade = shading(isWall, 5);
const floorShade = shading(isFloor, 6);
const shadeRgb = (c, s) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * s))));
/** 벽지 그림: paint(x, y)의 색에 벽 그늘을 곱한다. 옆벽은 무늬를 가로로 반 줄인다. */
const drawWall = (paint) => {
  const out = blank();
  for (let k = 0; k < N; k++) {
    const [x, y] = xy(k);
    if (!isWall(x, y)) continue;
    const u = x < 36 ? Math.floor(x * 0.6) : x > 223 ? 224 + Math.floor((x - 224) * 0.6) : x;
    out.pixels.set([...shadeRgb(paint(u, y), wallShade[k]), 255], k * 4);
  }
  return out;
};
const WALLS = {
  stripe: (x, y) => (x % 8 < 4 ? hex("#d9c3a0") : x % 8 === 4 ? hex("#c4aa82") : hex("#e6d4b4")),
  white: (x, y) => ((x * 7 + y * 3) % 23 === 0 ? hex("#e4e1da") : hex("#f2f0ea")),
  charcoal: (x, y) => (x % 12 === 0 ? hex("#6d6e76") : hex("#5d5e66")),
  damask: (x, y) => {
    const cx = ((x % 14) + 14) % 14 - 7, cy = ((y + (Math.floor(x / 14) % 2) * 9) % 18) - 9;
    const d = Math.abs(cx) * 1.6 + Math.abs(cy);
    if (d <= 2) return hex("#c2a35f");
    if (Math.abs(d - 6) < 0.8 && Math.abs(cy) < 7) return hex("#b39350");
    return y % 2 === 0 && x % 2 === 0 ? hex("#3c5a48") : hex("#41604d");
  },
};
/** 바닥 그림: 마루 칸만, 원근 좌표(X, Z)로 무늬를 정한다. */
const drawFloor = (paint) => {
  const out = blank();
  for (let k = 0; k < N; k++) {
    const [x, y] = xy(k);
    if (!isFloor(x, y)) continue;
    out.pixels.set([...shadeRgb(paint(floorX(x, y), floorZ(y), x, y), floorShade[k]), 255], k * 4);
  }
  return out;
};
const TILE = 0.0565; // 맨 앞 줄에서 16칸
/** 타일 줄눈: 이웃 칸과 타일 번호가 다르면 줄눈이다 (원근에서도 1칸 두께). */
const tileIndex = (x, y, size) => {
  const X = floorX(x, y), Z = floorZ(y);
  return [Math.floor(X / size), Math.floor(Z / size)];
};
const grout = (x, y, size) => {
  const [a, b] = tileIndex(x, y, size);
  const [c] = tileIndex(x + 1, y, size), [, d] = tileIndex(x, y + 1, size);
  return a !== c || b !== d;
};
/** 대리석 결: 비스듬한 물결 두 겹. */
const vein = (X, Z) => {
  const t = X * 31 + Z * 47 + Math.sin(X * 53) * 1.8 + Math.sin(Z * 71 + X * 9) * 1.2;
  const t2 = X * -23 + Z * 61 + Math.sin(Z * 37) * 2.1;
  return Math.min(Math.abs(Math.sin(t)), Math.abs(Math.sin(t2)) * 1.4);
};
const FLOORS = {
  "tile-beige": (X, Z, x, y) => {
    if (grout(x, y, TILE)) return hex("#a8977c");
    const [a, b] = tileIndex(x, y, TILE);
    return (a + b) % 2 ? hex("#d8c7a9") : hex("#cfbd9d");
  },
  "tile-gray": (X, Z, x, y) => {
    if (grout(x, y, TILE)) return hex("#8b8a87");
    const [a, b] = tileIndex(x, y, TILE);
    return (a + b) % 2 ? hex("#b9b8b3") : hex("#afaea9");
  },
  "marble-white": (X, Z, x, y) => {
    if (grout(x, y, TILE * 2)) return hex("#c9c4bb");
    const v = vein(X, Z);
    return v < 0.05 ? hex("#a9a49c") : v < 0.12 ? hex("#d6d2ca") : hex("#eeebe5");
  },
  "marble-black": (X, Z, x, y) => {
    if (grout(x, y, TILE * 2)) return hex("#17171a");
    const v = vein(X, Z);
    return v < 0.05 ? hex("#8d8a92") : v < 0.12 ? hex("#45444b") : hex("#2c2b31");
  },
  parquet: (X, Z, x, y) => {
    // 바구니 짜기 파케이: 칸마다 판 세 장, 이웃 칸과 방향이 엇갈린다.
    const size = TILE * 1.5;
    const a = Math.floor(X / size), b = Math.floor(Z / size);
    if (grout(x, y, size)) return hex("#4e2f1c");
    const fx = X / size - a, fz = Z / size - b;
    const across = (a + b) % 2 === 0;
    const strip = Math.floor((across ? fz : fx) * 3);
    const line = Math.abs((across ? fz : fx) * 3 - Math.round((across ? fz : fx) * 3)) < (across ? 0.09 : 0.11);
    if (line) return hex("#5c3822");
    return [hex("#8a5a35"), hex("#7a4d2c"), hex("#94643c")][(strip + a * 2 + b) % 3];
  },
};

// ---- 재질 바꾸기 ----
/** 층에서 pick(c, x, y)인 칸만 to(c, x, y)로 바꾼 새 그림. */
const recolor = (im, pick, to) => {
  const out = { width: W, height: H, pixels: im.pixels.slice() };
  for (let k = 0; k < N; k++) {
    if (!im.pixels[k * 4 + 3]) continue;
    const [x, y] = xy(k), c = colorOf(im, k);
    if (!pick(c, x, y)) continue;
    const n = to(c, x, y);
    out.pixels.set([...hsvToRgb(n.h, n.s, n.v), 255], k * 4);
  }
  return out;
};
/** 덮개: 바탕(빈 방)에서 pick인 칸만 바꾼 그림 (바꾸지 않은 칸은 비운다). */
const cover = (pick, to) => {
  const out = blank();
  for (let k = 0; k < N; k++) {
    const [x, y] = xy(k), c = colorOf(E, k);
    if (!pick(c, x, y)) continue;
    const n = to(c, x, y);
    out.pixels.set([...hsvToRgb(n.h, n.s, n.v), 255], k * 4);
  }
  return out;
};
const wood = (c) => c.h >= 8 && c.h <= 48 && c.s >= 0.25 && c.v >= 0.15;
const WOOD = {
  walnut: (c) => ({ h: 18, s: c.s * 0.95, v: c.v * 0.66 }),
  white: (c) => ({ h: 35, s: c.s * 0.12, v: 0.6 + 0.4 * c.v }),
  black: (c) => ({ h: 230, s: 0.08, v: 0.09 + c.v * 0.3 }),
  antique: (c) => ({ h: 4, s: Math.min(0.85, c.s * 1.05 + 0.1), v: c.v * 0.58 }),
  gold: (c) => ({ h: 42, s: 0.55 + 0.2 * c.s, v: 0.3 + 0.62 * c.v }),
};
const items = {}; // 아이템 id → { 층 id: 방 전체 크기 그림 | null }
const set = (id, parts) => (items[id] = parts);
const defaults = {}; // 기본 아이템의 새로 그린 층

// 커튼 봉: 창 위 6~9줄, 양 끝에 둥근 꼭지, 커튼 고리. 색은 테마 나무색 [밝은, 가운데, 어두운, 외곽선].
const ROD = { x0: 84, x1: 179, y: 7 };
const RODS = {
  wood: ["#c08a5a", "#94643c", "#6e4529", "#3e2618"],
  walnut: ["#8a6040", "#64402a", "#48291a", "#26150c"],
  black: ["#5a5a62", "#3a3a40", "#26262b", "#141417"],
  gold: ["#f2d488", "#c9a25b", "#9a7638", "#5a4018"],
};
const drawRod = (ramp) => {
  const [l, m, d, o] = ramp.map(hex), out = blank();
  const put = (x, y, c) => out.pixels.set([...c, 255], (y * W + x) * 4);
  for (let x = ROD.x0 + 3; x <= ROD.x1 - 3; x++) { put(x, ROD.y - 1, o); put(x, ROD.y, l); put(x, ROD.y + 1, d); put(x, ROD.y + 2, o); }
  for (const cx of [ROD.x0 + 1, ROD.x1 - 1]) for (let y = ROD.y - 3; y <= ROD.y + 4; y++) for (let x = cx - 3; x <= cx + 3; x++) {
    const r = Math.hypot(x - cx, (y - ROD.y - 0.5) * 1.1);
    if (r > 3.4) continue;
    put(x, y, r > 2.5 ? o : x - cx + y - ROD.y < -1 ? l : x - cx + y - ROD.y > 1.5 ? d : m);
  }
  // 고리: 커튼 폭마다 4칸 간격
  for (const { x0, x1 } of CURTAIN_PANELS) for (let x = x0 + 1; x <= x1; x += 4) { put(x, ROD.y + 3, o); put(x, ROD.y + 4, m); }
  return out;
};
defaults["curtain-rod"] = drawRod(RODS.wood);

// 벽지 (기본: 빈 방의 분홍 점 벽지)
set("home-wall-stripe", { wall: drawWall(WALLS.stripe) });
set("home-wall-white", { wall: drawWall(WALLS.white) });
set("home-wall-charcoal", { wall: drawWall(WALLS.charcoal) });
set("home-wall-damask", { wall: drawWall(WALLS.damask) });
// 바닥 (기본: 원목 마루). 원목 셋은 빈 방 마루 판자의 색만 바꾼다.
const floorPick = (c, x, y) => isFloor(x, y);
set("home-floor-maple", { floor: cover(floorPick, (c) => ({ h: c.h + 6, s: c.s * 0.7, v: c.v * 1.18 })) });
set("home-floor-walnut", { floor: cover(floorPick, (c) => ({ h: 16, s: c.s * 0.95, v: c.v * 0.68 })) });
set("home-floor-gray", { floor: cover(floorPick, (c) => ({ h: 30, s: c.s * 0.18, v: c.v * 1.02 })) });
for (const name of Object.keys(FLOORS)) set(`home-floor-${name}`, { floor: drawFloor(FLOORS[name]) });
// 러그
defaults.rug = drawRug(RUGS.cream);
set("home-rug-camel", { rug: drawRug(RUGS.camel) });
set("home-rug-ivory", { rug: drawRug(RUGS.ivory) });
set("home-rug-charcoal", { rug: drawRug(RUGS.charcoal) });
set("home-rug-persian", { rug: drawRug(RUGS.persian) });
// 커튼: 천과 봉
defaults.curtains = drawCurtains(CURTAINS.ivory);
set("home-curtain-linen", { curtains: drawCurtains(CURTAINS.linen), "curtain-rod": drawRod(RODS.walnut) });
set("home-curtain-charcoal", { curtains: drawCurtains(CURTAINS.charcoal), "curtain-rod": drawRod(RODS.black) });
set("home-curtain-burgundy", { curtains: drawCurtains(CURTAINS.burgundy, hex("#c9a25b")), "curtain-rod": drawRod(RODS.gold) });
/** 투명 칸에서 n칸 안 (액자 테두리). */
const nearEdge = (im, n) => (c, x, y) => {
  for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !im.pixels[(ny * W + nx) * 4 + 3]) return true;
  }
  return false;
};
// 액자: 나무 테두리만 (그림은 그대로)
const frameWood = (c, x, y) => wood(c) && nearEdge(layers["frames-left"], 3)(c, x, y);
const frameItem = (to) => ({ "frames-left": recolor(layers["frames-left"], frameWood, to) });
set("home-frames-walnut", frameItem(WOOD.walnut));
set("home-frames-white", frameItem(WOOD.white));
set("home-frames-black", frameItem(WOOD.black));
set("home-frames-gold", frameItem(WOOD.gold));
// 선반: 판자 줄(나무 칸이 20칸 넘게 이어진 줄)만 (화분과 책은 그대로)
const boardRows = new Set();
for (let y = 0; y < H; y++) {
  let n = 0;
  for (let x = 0; x < W; x++) { const k = y * W + x; if (layers["wall-shelves"].pixels[k * 4 + 3] && wood(colorOf(layers["wall-shelves"], k))) n++; }
  if (n >= 20) { boardRows.add(y); boardRows.add(y + 1); boardRows.add(y + 2); }
}
const shelfWood = (c, x, y) => wood(c) && boardRows.has(y);
const shelfItem = (to) => ({ "wall-shelves": recolor(layers["wall-shelves"], shelfWood, to) });
set("home-shelves-walnut", shelfItem(WOOD.walnut));
set("home-shelves-white", shelfItem(WOOD.white));
set("home-shelves-black", shelfItem(WOOD.black));
// 나무 가구: 책장의 책(아주 진한 색)과 베개(밝은 크림)는 그대로
const deskWood = (c) => wood(c) && c.s <= 0.78;
const bedWood = (c) => wood(c) && c.v < 0.86;
for (const [theme, to] of [["walnut", WOOD.walnut], ["white", WOOD.white], ["black", WOOD.black], ["antique", WOOD.antique]]) {
  set(`home-desk-${theme}`, { desk: recolor(layers.desk, deskWood, to) });
  set(`home-nightstand-${theme}`, { nightstand: recolor(layers.nightstand, wood, to) });
  set(`home-bed-${theme}`, { bed: recolor(layers.bed, bedWood, to) });
}
// 스탠드: 갓(밝은 크림 노랑)과 받침(갈색)
const shadeCloth = (c) => c.h >= 28 && c.h <= 64 && c.s < 0.7 && c.v > 0.72;
const lampBase = (c) => !shadeCloth(c) && c.s >= 0.2 && c.v >= 0.18 && (c.h <= 45 || c.h >= 330);
const lampItem = (shadeTo, baseTo) =>
  Object.fromEntries(["desk-lamp", "lamp-right"].map((id) => {
    const im = recolor(layers[id], shadeCloth, shadeTo);
    return [id, baseTo ? recolor(im, lampBase, baseTo) : im];
  }));
set("home-lamps-white", lampItem((c) => ({ h: 40, s: 0.05, v: 0.84 + 0.16 * c.v }), (c) => ({ h: 35, s: 0.05, v: 0.55 + 0.45 * c.v })));
set("home-lamps-black", lampItem((c) => ({ h: 40, s: 0.08, v: 0.8 + 0.2 * c.v }), (c) => ({ h: 230, s: 0.08, v: 0.08 + 0.3 * c.v })));
set("home-lamps-brass", lampItem((c, x) => ({ h: 38, s: x % 2 ? 0.34 : 0.26, v: (x % 2 ? 0.86 : 0.94) * (0.85 + 0.15 * c.v) }), (c) => ({ h: 42, s: 0.68, v: 0.32 + 0.62 * c.v })));
// 안락의자: 크림 천, 분홍 쿠션, 나무 다리
const cushion = (c) => (c.h >= 320 || c.h <= 15) && c.s > 0.18 && c.v > 0.45;
const chairCloth = (c) => !cushion(c) && c.s < 0.32 && c.v > 0.62;
const legs = (c) => !cushion(c) && c.v < 0.55 && (c.h <= 30 || c.h >= 330) && c.s > 0.25;
/** 천, 쿠션, 다리를 원래 색으로 가른 뒤 한 번에 바꾼다 (바꾼 천이 다시 쿠션으로 잡히지 않게). */
const chairItem = (clothTo, cushionTo, legsTo) => ({
  armchair: recolor(
    layers.armchair,
    (c) => chairCloth(c) || (cushionTo && cushion(c)) || (legsTo && legs(c)),
    (c, x, y) => (cushion(c) ? cushionTo(c, x, y) : legs(c) ? legsTo(c, x, y) : clothTo(c, x, y)),
  ),
});
set("home-chair-sage", chairItem((c) => ({ h: 100, s: Math.max(0.18, c.s * 1.8), v: c.v * 0.94 })));
set("home-chair-mustard", chairItem((c) => ({ h: 42, s: Math.max(0.4, c.s * 2.8), v: c.v * 0.96 })));
set("home-chair-leather", chairItem((c) => ({ h: 24, s: 0.5 + 0.2 * (1 - c.v), v: c.v * 0.7 }), (c) => ({ h: 40, s: 0.18, v: Math.min(1, c.v * 1.08) }), WOOD.walnut));
set("home-chair-white", chairItem((c) => ({ h: 40, s: 0.03, v: 0.62 + 0.38 * c.v }), (c) => ({ h: 30, s: 0.28, v: c.v }), WOOD.white));
set("home-chair-charcoal", chairItem((c) => ({ h: 230, s: 0.06, v: 0.16 + 0.42 * c.v }), (c) => ({ h: 42, s: 0.6, v: c.v }), WOOD.black));
set("home-chair-velvet", chairItem((c) => ({ h: 350, s: 0.62, v: c.v * 0.66 }), (c) => ({ h: 43, s: 0.6, v: c.v }), WOOD.antique));
// 이불
const blanketItem = (to) => ({ "bed-blanket": recolor(layers["bed-blanket"], sage, to) });
set("home-blanket-yellow", blanketItem((c) => ({ h: 46, s: Math.max(0.32, c.s * 1.6), v: Math.min(1, c.v * 1.15) })));
set("home-blanket-camel", blanketItem((c) => ({ h: 28, s: Math.min(1, c.s * 1.4 + 0.1), v: c.v })));
set("home-blanket-white", blanketItem((c) => ({ h: 40, s: 0.04, v: 0.55 + 0.45 * c.v })));
set("home-blanket-charcoal", blanketItem((c) => ({ h: 230, s: 0.08, v: c.v * 0.55 })));
set("home-blanket-burgundy", blanketItem((c) => ({ h: 352, s: Math.min(1, c.s * 1.6 + 0.15), v: c.v * 0.78 })));
// 침대 인형
const fur = (c) => c.s < 0.2 && c.v > 0.6;
set("home-plush-cheese", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 32, s: 0.5, v: c.v })) });
set("home-plush-black", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 250, s: 0.12, v: c.v * 0.34 })) });
set("home-plush-gray", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 220, s: 0.06, v: c.v * 0.7 })) });
// 바닥 화분: 잎 색, 화분 색
const leaf = (c) => c.h >= 55 && c.h <= 170 && c.s > 0.18;
const potClay = (c) => c.h <= 35 && c.s > 0.3 && c.v > 0.3;
set("home-plant-maple", { "floor-plant": recolor(layers["floor-plant"], leaf, (c) => ({ h: 14 + (c.v - 0.4) * 30, s: Math.min(1, c.s * 1.25), v: c.v * 1.05 })) });
set("home-plant-whitepot", { "floor-plant": recolor(layers["floor-plant"], potClay, (c) => ({ h: c.h, s: c.s * 0.12, v: 0.55 + 0.45 * c.v })) });
// 책상 위, 협탁 위: 따로 만든 소품을 같은 자리에 (밑의 책상과 협탁은 온전한 그림이다)
set("home-desktop-book", { "desk-paper": onTop(SPRITES.book, deskTop.x0 + 14, deskTop.y) });
set("home-desktop-notebook", { "desk-paper": onTop(SPRITES.notebook, deskTop.x0 + 14, deskTop.y) });
set("home-nighttop-clock", { "nightstand-top": onTop(SPRITES.clock, standTop.x0 + 10, standTop.y) });
set("home-nighttop-vase", { "nightstand-top": onTop(SPRITES.vase, standTop.x0 + 10, standTop.y) });

// 판매를 멈춘 아이템 (2026-11-02: 테마와 어울리지 않는 파스텔). 이미 산 사람은 계속 쓰므로 그림은 만든다.
const tint = (h, sMul = 1, sMin = 0, vMul = 1) => (c) => ({ h, s: Math.max(sMin, c.s * sMul), v: c.v * vMul });
const wallPaper = (c, x, y) => isWall(x, y) && c.s < 0.45 && c.v > 0.45;
set("home-wall-mint", { wall: cover(wallPaper, tint(150, 0.9)) });
set("home-wall-sky", { wall: cover(wallPaper, tint(205, 0.9)) });
set("home-wall-lemon", { wall: cover(wallPaper, tint(50, 1.15)) });
set("home-curtain-pink", { curtains: drawCurtains(["#9a6a74", "#d4a4ae", "#e6bcc4", "#f4d8de"]) });
set("home-curtain-mint", { curtains: drawCurtains(["#5e8e80", "#a2ccbc", "#bcdccf", "#d8eee4"]) });
set("home-curtain-yellow", { curtains: drawCurtains(["#a08848", "#dcc272", "#ead48c", "#f6e6ae"]) });
set("home-lamps-mint", lampItem(tint(150, 1.1, 0.25)));
set("home-lamps-pink", lampItem(tint(345, 1.1, 0.25)));
set("home-chair-sky", chairItem(tint(205, 1.8, 0.18)));
set("home-blanket-pink", blanketItem(tint(345, 1.15)));
set("home-blanket-sky", blanketItem(tint(205, 1.1)));
const pastelRug = (fill, line, edge) => (u, v, e) => (e ? hex(edge) : band(u, v, 0.05) ? hex(line) : hex(fill));
set("home-rug-pink", { rug: drawRug(pastelRug("#efc9cf", "#dcaab2", "#b9868e")) });
set("home-rug-mint", { rug: drawRug(pastelRug("#cde8dc", "#a9d2c1", "#80ab9a")) });
set("home-rug-sky", { rug: drawRug(pastelRug("#cfe2f0", "#a9c8e0", "#7f9fba")) });

// ---- 쓰기 ----
const crop = (im) => {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < N; k++) if (im.pixels[k * 4 + 3]) { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = { width: w, height: h, pixels: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) out.pixels.set(im.pixels.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x1 + 1) * 4), y * w * 4);
  return { x: x0, y: y0, width: w, height: h, image: out };
};
mkdirSync(OUT, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });
// 지난번 결과를 지운다 (이름이 바뀐 층과 아이템이 남지 않게).
for (const dir of [OUT, PUBLIC]) for (const f of readdirSync(dir)) if (f.endsWith(".png") && !f.startsWith("preview-")) unlinkSync(join(dir, f));
const write = (name, image) => {
  const png = encodePng(image);
  writeFileSync(join(OUT, `${name}.png`), png);
  writeFileSync(join(PUBLIC, `${name}.png`), png);
  return `/assets/home/room/decor/${name}.png`;
};
const baseSrc = write("room-base", E);
// 그리는 순서: 벽지, 바닥 덮개, 불빛, 러그, 그림자, 그다음 물건 (뒤에서 앞으로).
const DRAW = [
  "wall", "floor", "rug", "shadow", "frames-left", "wall-shelves", "curtains", "curtain-rod",
  "desk", "desk-paper", "desk-lamp", "nightstand", "nightstand-top", "lamp-right", "bed", "bed-blanket", "bed-cat",
  "armchair", "floor-plant",
];
const BLEND = { shadow: "multiply" };
const SLOT_OF = {
  wall: "wallpaper", floor: "floor", rug: "rug", curtains: "curtains", "curtain-rod": "curtains", "frames-left": "frames",
  "wall-shelves": "shelves", desk: "desk", "desk-paper": "desk_top", "desk-lamp": "lamps", "lamp-right": "lamps",
  nightstand: "nightstands", "nightstand-top": "nightstand_top", bed: "bed", "bed-blanket": "blanket", "bed-cat": "plush",
  armchair: "armchair", "floor-plant": "floor_plant",
};
const boxes = {};
for (const id of DRAW) {
  const im = defaults[id] ?? layers[id];
  const c = im && crop(im);
  if (!c) continue;
  boxes[id] = { x: c.x, y: c.y, width: c.width, height: c.height, src: write(id, c.image), ...(BLEND[id] ? { blend: BLEND[id] } : {}) };
}
const art = {};
for (const [item, parts] of Object.entries(items)) {
  art[item] = {};
  for (const [id, im] of Object.entries(parts)) {
    if (im === null) { art[item][id] = null; continue; }
    const c = crop(im);
    art[item][id] = c ? { src: write(`${item}-${id}`, c.image), x: c.x, y: c.y, width: c.width, height: c.height } : null;
  }
}
const slots = {};
for (const id of DRAW) if (SLOT_OF[id]) (slots[SLOT_OF[id]] ??= []).push(id);
const data = {
  size: { width: W, height: H },
  scale: 3,
  base: baseSrc,
  draw: DRAW.filter((id) => id === "wall" || id === "floor" || boxes[id]),
  fixed: ["shadow"],
  layers: boxes,
  slots,
  items: art,
};
writeFileSync(LAYOUT, [
  "// tools/art/home-decor.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.",
  "/**",
  " * 로비 \"내 방\"을 꾸밈 자리별 층으로 나눈 그림 (꾸미기 슬롯 계획 3절). 바탕(빈 방) 위에 draw 순서로 층을 얹는다.",
  " * layers는 기본 아이템의 층(1배 좌표), slots는 자리마다 바뀌는 층, items는 판매 아이템이 층마다 쓰는 그림이다",
  " * (null이면 그 층을 감춘다). wall, floor 층은 기본 그림이 없고 판매 아이템만 바탕 위에 덮는다.",
  " * fixed 층(그림자)은 자리 없이 늘 그리고, blend로 아래 그림과 섞는다 (multiply).",
  " */",
  `export const HOME_DECOR = ${JSON.stringify(data, null, 2)} as const;`,
  "",
].join("\n"));

// ---- 미리보기 (2배) ----
const blendPx = (mode, a, b) => (mode === "multiply" ? (a * b) / 255 : mode === "screen" ? 255 - ((255 - a) * (255 - b)) / 255 : b);
const compose = (choice) => {
  const out = { width: W, height: H, pixels: E.pixels.slice() };
  for (const id of data.draw) {
    let img;
    if (id in choice) img = choice[id];
    else img = defaults[id] ?? (id === "wall" || id === "floor" ? null : layers[id]);
    if (!img) continue;
    for (let k = 0; k < N; k++) {
      if (!img.pixels[k * 4 + 3]) continue;
      for (let i = 0; i < 3; i++) out.pixels[k * 4 + i] = Math.round(blendPx(BLEND[id], out.pixels[k * 4 + i], img.pixels[k * 4 + i]));
    }
  }
  return out;
};
const sheet = (scenes, S = 2, G2 = 4) => {
  const w = W * S, h = H * S, out = { width: 3 * (w + G2) + G2, height: Math.ceil(scenes.length / 3) * (h + G2) + G2 };
  out.pixels = new Uint8Array(out.width * out.height * 4);
  scenes.forEach((sc, n) => {
    const ox = G2 + (n % 3) * (w + G2), oy = G2 + Math.floor(n / 3) * (h + G2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = Math.floor(y / S) * W + Math.floor(x / S);
      out.pixels.set(sc.pixels.subarray(k * 4, k * 4 + 4), ((oy + y) * out.width + ox + x) * 4);
    }
  });
  return out;
};
const mix = (...ids) => Object.assign({}, ...ids.map((id) => items[id] ?? {}));
const THEME_LOOKS = {
  brown: ["home-wall-stripe", "home-floor-walnut", "home-rug-camel", "home-curtain-linen", "home-frames-walnut", "home-shelves-walnut",
    "home-desk-walnut", "home-nightstand-walnut", "home-bed-walnut", "home-chair-leather", "home-blanket-camel"],
  white: ["home-wall-white", "home-floor-marble-white", "home-rug-ivory", "home-frames-white", "home-shelves-white", "home-desk-white",
    "home-nightstand-white", "home-bed-white", "home-chair-white", "home-blanket-white", "home-lamps-white"],
  black: ["home-wall-charcoal", "home-floor-marble-black", "home-rug-charcoal", "home-curtain-charcoal", "home-frames-black", "home-shelves-black",
    "home-desk-black", "home-nightstand-black", "home-bed-black", "home-chair-charcoal", "home-blanket-charcoal", "home-lamps-black"],
  antique: ["home-wall-damask", "home-floor-parquet", "home-rug-persian", "home-curtain-burgundy", "home-frames-gold", "home-desk-antique",
    "home-nightstand-antique", "home-bed-antique", "home-chair-velvet", "home-blanket-burgundy", "home-lamps-brass"],
};
const previews = {
  themes: [{}, ...Object.values(THEME_LOOKS).map((ids) => mix(...ids)), mix("home-floor-tile-beige", "home-desktop-book", "home-nighttop-clock")],
  check: [
    mix("home-desk-white", "home-desktop-notebook", "home-nightstand-black", "home-nighttop-vase"),
    mix("home-floor-tile-gray", "home-plant-maple", "home-plush-black", "home-frames-gold"),
    mix("home-floor-maple", "home-floor-gray", "home-chair-sage", "home-blanket-yellow"),
    mix("home-floor-gray", "home-chair-mustard", "home-plant-whitepot", "home-plush-cheese"),
    mix("home-wall-white", "home-desk-black", "home-bed-white", "home-nightstand-antique"),
    mix("home-wall-charcoal", "home-floor-tile-beige", "home-rug-persian", "home-desk-antique"),
  ],
};
for (const [name, list] of Object.entries(previews)) writeFileSync(join(OUT, `preview-${name}.png`), encodePng(sheet(list.map(compose))));
console.log(`물건 ${Object.keys(SPRITES).length}개, 판매 아이템 ${Object.keys(items).length}개, 층 ${Object.keys(boxes).length}개`);
