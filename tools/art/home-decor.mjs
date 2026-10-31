// 사용법: node tools/art/home-decor.mjs
// 로비 "내 방" 꾸밈 (꾸미기 슬롯 계획 3절, 2026-11-01 사용자 결정: 가구, 벽지, 바닥까지 바꾼다).
// tools/art/home-room.mjs가 떼어 낸 부품은 사각형 영역이라 이웃 물건이 섞여 있다 (책상 스탠드에 벽 불빛과 책상 윗면,
// 안락의자에 책상 모서리와 불빛과 러그, 오른쪽 스탠드와 협탁에 이불). 부품끼리 칸이 겹치지 않으므로 칸의 주인만 바꾸면
// 합친 모습은 그대로다. 그래서 먼저 방을 꾸밈 자리별 층으로 다시 나눈다.
// 1. 빈 방과 부품을 합쳐 칸마다 주인을 정한다.
// 2. 다시 나누기: 벽 불빛과 벽 조각은 바탕(벽지)으로, 바닥 쪽 크림색 칸은 러그로 (둘 다 바탕에서 같은 색을 따라 퍼지되
//    짙은 외곽선은 넘지 않는다), 다른 부품의 초록 칸은 이불로, 스탠드에 섞인 책상과 협탁 윗면은 각 가구로 보낸다.
// 3. 모양이 바뀌는 자리(책상 위, 협탁 위) 밑의 가구 윗면 구멍을 같은 줄의 가구 칸으로 메운다.
// 4. 자리마다 기본 층 그림과, 같은 층의 색을 바꾼 판매 아이템을 쓴다. 벽지와 바닥은 바탕에서 벽지 칸, 마루 칸만 고른 덮개다.
//    책상 위 아이템은 종이 모양 그대로 펼친 책과 공책을 그리고, 협탁 위 아이템은 PixelLab 시안을 정리해 놓는다.
// 결과: art-src/home/room/decor/<아이템>-<층>.png, room-base.png(벽 조각을 합친 바탕), 같은 파일을 public/assets/home/room/decor/에,
//   자리와 층 좌표, 아이템 그림 표는 src/features/lobby/model/homeDecorLayers.ts에, 미리보기는 art-src/home/room/decor/preview-*.png.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";
import { hsv } from "./rigImage.mjs";

const PARTS = "art-src/home/room";
const OUT = "art-src/home/room/decor";
const PUBLIC = "public/assets/home/room/decor";
const SRC = "art-src/home/room/decor/src";
const LAYOUT = "src/features/lobby/model/homeDecorLayers.ts";
const room = JSON.parse(readFileSync("src/features/lobby/model/homeRoomLayers.ts", "utf8").match(/HOME_ROOM = (\{[\s\S]*\}) as const/)[1]);
const read = (file) => decodePng(readFileSync(file));
const base = read(join(PARTS, "room-base.png"));
const W = base.width, H = base.height;
const px = (im, k) => im.pixels.subarray(k * 4, k * 4 + 4);
const colorOf = (im, k) => hsv(im.pixels[k * 4], im.pixels[k * 4 + 1], im.pixels[k * 4 + 2]);

// ---- 1. 합친 방과 칸 주인 ----
const comp = { width: W, height: H, pixels: base.pixels.slice() };
const owner = new Array(W * H).fill("base");
for (const layer of room.layers) {
  const im = read(join(PARTS, `${layer.id}.png`));
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const k = y * im.width + x;
    if (!im.pixels[k * 4 + 3]) continue;
    const K = (layer.y + y) * W + layer.x + x;
    owner[K] = layer.id;
    comp.pixels.set(px(im, k), K * 4);
  }
}

// ---- 2. 다시 나누기 ----
// 부품 → 자리(slot). 부품 이름이 곧 층 이름이고, 바탕 칸은 "base"다. 자리 이름은 서버 slot(home_<자리>)과 같다.
const SLOT_OF = {
  base: "base", rug: "rug", curtains: "curtains", "frames-left": "frames", "frames-right": "frames", "wall-shelves": "shelves",
  desk: "desk", "desk-paper": "desk_top", "desk-lamp": "lamps", "lamp-right": "lamps", armchair: "armchair",
  "nightstand-left": "nightstands", "nightstand-right": "nightstands", "nightstand-jar": "nightstand_top", "nightstand-plant": "nightstand_top",
  bed: "bed", "bed-blanket": "blanket", "bed-cat": "plush", "floor-plant": "floor_plant",
};
const layerOf = owner.slice();
const xy = (k) => [k % W, Math.floor(k / W)];
// 벽과 바닥 경계: 뒷벽 아래 108줄, 왼쪽 옆벽은 (0, 138)~(36, 110), 오른쪽 옆벽은 (224, 110)~(256, 128).
const wallZone = (x, y) => (x < 36 ? y < 110 + ((36 - x) * 28) / 36 : x > 224 ? y < 110 + ((x - 224) * 18) / 32 : y < 108);
const wallLike = (c) => (c.h <= 50 || c.h >= 330) && c.s < 0.35 && c.v > 0.6;
const rugLike = (c) => (c.h <= 60 || c.h >= 290) && c.s < 0.36 && c.v > 0.55;
// 안락의자 왼쪽 윤곽선. 이보다 왼쪽의 크림색만 벽 불빛이다 (의자 몸통도 크림색이고 불빛과 외곽선 없이 맞닿는다).
const leftOfChair = (x, y) => x < 86 - (y - 76) * 0.37;
/** 의자 천은 122줄 위, 그 아래는 의자 밑 러그와 그림자다. */
const CHAIR_BOTTOM = 122;
/** seeds에서 시작해 can(k)인 칸으로 퍼지며 주인을 to로 바꾼다 (상하좌우). */
const spread = (seeds, can, to) => {
  const seen = new Uint8Array(W * H), stack = [...seeds];
  for (const k of seeds) seen[k] = 1;
  let moved = 0;
  while (stack.length) {
    const k = stack.pop(), [x, y] = xy(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[n] || !can(n)) continue;
      seen[n] = 1;
      stack.push(n);
      if (layerOf[n] !== to) { layerOf[n] = to; moved++; }
    }
  }
  return moved;
};
const WALL_FROM = new Set(["desk-lamp", "armchair", "lamp-right", "nightstand-right", "nightstand-left", "nightstand-plant", "nightstand-jar", "bed", "desk", "floor-plant"]);
const wallSeeds = [], rugSeeds = [];
for (let k = 0; k < W * H; k++) {
  const [x, y] = xy(k);
  if (owner[k] === "base" && wallZone(x, y) && wallLike(colorOf(comp, k))) wallSeeds.push(k);
  if (owner[k] === "rug") rugSeeds.push(k);
}
const movedWall = spread(wallSeeds, (n) => {
  const [x, y] = xy(n);
  if (layerOf[n] === "armchair" && !leftOfChair(x, y) && y >= 76) return false; // 의자 윗선(76줄) 위는 벽
  return wallZone(x, y) && (layerOf[n] === "base" || WALL_FROM.has(layerOf[n])) && wallLike(colorOf(comp, n));
}, "base");
const movedRug = spread(rugSeeds, (n) => {
  const [x, y] = xy(n);
  if (layerOf[n] === "armchair" && y < CHAIR_BOTTOM) return false;
  return y >= 112 && !wallZone(x, y) && rugLike(colorOf(comp, n)) && layerOf[n] !== "bed-blanket";
}, "rug");
// 마루: 바탕 마루에서 같은 나뭇결 색(밝은 칸)을 따라 바닥 화분, 침대, 협탁, 책상, 의자 부품 안으로 퍼진다. 화분은 마루와
// 색이 같아 화분 상자(x 4~28, y 127~150) 안으로는 들어가지 않는다. 가구는 짙은 외곽선(밝기 0.5 아래)이 막는다.
const potBox = (x, y) => x >= 4 && x <= 28 && y >= 127 && y <= 150;
const floorLike = (c) => c.v >= 0.5 && (c.h <= 40 || c.h >= 350) && c.s >= 0.3 && c.s <= 0.75;
const FLOOR_FROM = new Set(["floor-plant", "nightstand-right", "nightstand-left", "bed", "desk", "armchair"]);
const floorSeeds = [];
for (let k = 0; k < W * H; k++) { const [x, y] = xy(k); if (layerOf[k] === "base" && !wallZone(x, y) && floorLike(colorOf(comp, k))) floorSeeds.push(k); }
const movedFloor = spread(floorSeeds, (n) => {
  const [x, y] = xy(n);
  if (wallZone(x, y) || !(layerOf[n] === "base" || FLOOR_FROM.has(layerOf[n]))) return false;
  if (layerOf[n] === "floor-plant" && potBox(x, y)) return false;
  return floorLike(colorOf(comp, n));
}, "base");
let movedOther = 0;
for (let k = 0; k < W * H; k++) {
  const [x, y] = xy(k), c = colorOf(comp, k), was = layerOf[k];
  const woodish = c.h >= 12 && c.h <= 45 && c.s >= 0.3;
  if (["lamp-right", "nightstand-right", "bed"].includes(was) && c.h >= 50 && c.h <= 150 && c.s > 0.12) layerOf[k] = "bed-blanket";
  else if (was === "desk-lamp" && y >= 86) layerOf[k] = "desk";
  else if (was === "armchair" && x >= 86 && y <= 74) layerOf[k] = "curtains"; // 의자 뒤로 내려온 비치는 커튼 아랫단
  else if (was === "floor-plant" && x < 5 && !wallZone(x, y) && !(c.h >= 60 && c.h <= 160 && c.s > 0.2)) layerOf[k] = "base"; // 화분 왼쪽 마루 띠
  else if (was === "armchair" && x <= 73 && y <= 115 && woodish) layerOf[k] = "desk";
  else if (was === "lamp-right" && y >= 112 && woodish && c.s >= 0.45 && c.v >= 0.55) layerOf[k] = "nightstand-right";
  if (layerOf[k] !== was) movedOther++;
}

// 층 그림 (방 전체 크기). 바탕은 벽 조각을 합친 빈 방이다.
const layers = {};
const layer = (id) => (layers[id] ??= { width: W, height: H, pixels: new Uint8Array(W * H * 4) });
const newBase = { width: W, height: H, pixels: base.pixels.slice() };
for (let k = 0; k < W * H; k++) {
  if (layerOf[k] === "base") newBase.pixels.set(px(comp, k), k * 4);
  else layer(layerOf[k]).pixels.set(px(comp, k), k * 4);
}

// ---- 3. 모양이 바뀌는 자리 밑 가구 윗면 메우기: 구멍 칸을 같은 줄의 가장 가까운 가구 칸 색으로 ----
const fillUnder = (holeLayers, furniture, rows) => {
  const f = layer(furniture);
  for (const [y0, y1] of rows) for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (!holeLayers.some((h) => layerOf[k] === h) || f.pixels[k * 4 + 3]) continue;
    for (let d = 1; d < 40; d++) {
      const l = x - d >= 0 ? y * W + x - d : -1, r = x + d < W ? y * W + x + d : -1;
      const pick = [l, r].find((n) => n >= 0 && layerOf[n] === furniture && f.pixels[n * 4 + 3]);
      if (pick !== undefined) { f.pixels.set(px(f, pick), k * 4); break; }
    }
  }
};
// 책상 윗면(종이 밑)과 협탁 윗면(병과 화분 밑). 그 위쪽은 벽이라 바탕이 이미 있다.
fillUnder(["desk-paper"], "desk", [[86, 99]]);
fillUnder(["nightstand-jar", "nightstand-plant"], "nightstand-left", [[93, 99]]);

// ---- 4. 아이템 ----
const hsvToRgb = (h, s, v) => {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255));
};
/** 층에서 pick(c, x, y)인 칸을 to(c)로 바꾼 새 그림. keepOnly면 바꾼 칸만 남긴다 (덮개). */
const recolor = (im, pick, to, keepOnly = false) => {
  const out = { width: im.width, height: im.height, pixels: keepOnly ? new Uint8Array(im.pixels.length) : im.pixels.slice() };
  for (let k = 0; k < im.width * im.height; k++) {
    const p = px(im, k);
    if (!p[3]) continue;
    const c = colorOf(im, k);
    if (!pick(c, k % im.width, Math.floor(k / im.width))) continue;
    const n = to(c);
    out.pixels.set([...hsvToRgb(((n.h % 360) + 360) % 360, Math.min(1, Math.max(0, n.s)), Math.min(1, Math.max(0, n.v))), p[3]], k * 4);
  }
  return out;
};
const tint = (h, sMul = 1, sMin = 0, vMul = 1) => (c) => ({ h, s: Math.max(sMin, c.s * sMul), v: c.v * vMul });
const items = {}; // 아이템 id → { 층 id: 방 전체 크기 그림 }
const set = (id, parts) => (items[id] = parts);

// 벽지와 바닥: 바탕 덮개
const WINDOW = { x0: 99, x1: 163, y0: 12, y1: 79 };
const inWindow = (x, y) => x >= WINDOW.x0 && x <= WINDOW.x1 && y >= WINDOW.y0 && y <= WINDOW.y1;
const isFloor = (c, x, y) => !wallZone(x, y) && !inWindow(x, y) && c.s >= 0.3 && (c.h <= 45 || c.h >= 345);
const isWall = (c, x, y) => y >= 3 && !inWindow(x, y) && wallZone(x, y) && c.s < 0.45 && c.v > 0.45;
set("home-wall-mint", { wall: recolor(newBase, isWall, tint(150, 0.9), true) });
set("home-wall-sky", { wall: recolor(newBase, isWall, tint(205, 0.9), true) });
set("home-wall-lemon", { wall: recolor(newBase, isWall, tint(50, 1.15), true) });
set("home-floor-maple", { floor: recolor(newBase, isFloor, (c) => ({ h: c.h + 6, s: c.s * 0.7, v: c.v * 1.18 }), true) });
set("home-floor-walnut", { floor: recolor(newBase, isFloor, (c) => ({ h: 16, s: c.s * 0.95, v: c.v * 0.68 }), true) });
set("home-floor-gray", { floor: recolor(newBase, isFloor, (c) => ({ h: 30, s: c.s * 0.18, v: c.v * 1.02 }), true) });

// 천과 털
const sheer = (c) => c.s < 0.25 && c.v > 0.6;
set("home-curtain-pink", { curtains: recolor(layer("curtains"), sheer, tint(345, 1.6, 0.16)) });
set("home-curtain-mint", { curtains: recolor(layer("curtains"), sheer, tint(150, 1.6, 0.14)) });
set("home-curtain-yellow", { curtains: recolor(layer("curtains"), sheer, tint(48, 1.8, 0.2)) });
const green = (c) => c.h >= 50 && c.h <= 150;
set("home-blanket-pink", { "bed-blanket": recolor(layer("bed-blanket"), green, tint(345, 1.15)) });
set("home-blanket-sky", { "bed-blanket": recolor(layer("bed-blanket"), green, tint(205, 1.1)) });
set("home-blanket-yellow", { "bed-blanket": recolor(layer("bed-blanket"), green, tint(46, 1.7, 0.3, 1.2)) });
const cream = (c) => c.s < 0.4 && c.v > 0.45;
set("home-rug-pink", { rug: recolor(layer("rug"), cream, tint(345, 1.4, 0.14)) });
set("home-rug-mint", { rug: recolor(layer("rug"), cream, tint(150, 1.3, 0.12)) });
set("home-rug-sky", { rug: recolor(layer("rug"), cream, tint(205, 1.3, 0.12)) });
const chairCloth = (c, x, y) => y < CHAIR_BOTTOM && c.s < 0.3 && c.v > 0.5;
set("home-chair-sage", { armchair: recolor(layer("armchair"), chairCloth, tint(100, 1.7, 0.16, 0.96)) });
set("home-chair-sky", { armchair: recolor(layer("armchair"), chairCloth, tint(205, 1.7, 0.16)) });
set("home-chair-mustard", { armchair: recolor(layer("armchair"), chairCloth, tint(42, 2.6, 0.34, 0.97)) });
const shade = (c) => c.h >= 30 && c.h <= 60 && c.s < 0.6 && c.v > 0.75;
const lampSet = (h) => ({ "desk-lamp": recolor(layer("desk-lamp"), shade, tint(h, 1.1, 0.25)), "lamp-right": recolor(layer("lamp-right"), shade, tint(h, 1.1, 0.25)) });
set("home-lamps-mint", lampSet(150));
set("home-lamps-pink", lampSet(345));
const fur = (c) => c.s < 0.2 && c.v > 0.6;
set("home-plush-cheese", { "bed-cat": recolor(layer("bed-cat"), fur, (c) => ({ h: 32, s: 0.5, v: c.v })) });
set("home-plush-black", { "bed-cat": recolor(layer("bed-cat"), fur, (c) => ({ h: 250, s: 0.12, v: c.v * 0.34 })) });
set("home-plush-gray", { "bed-cat": recolor(layer("bed-cat"), fur, (c) => ({ h: 220, s: 0.06, v: c.v * 0.7 })) });
// 바닥 화분: 모양은 그대로 잎과 화분 색만 (뒤의 책상은 그려져 있지 않다)
const leaf = (c) => c.h >= 60 && c.h <= 160 && c.s > 0.2;
const pot = (c, x, y) => potBox(x, y) && c.h <= 30 && c.s > 0.3;
set("home-plant-maple", { "floor-plant": recolor(layer("floor-plant"), leaf, (c) => ({ h: 14 + (c.v - 0.4) * 30, s: Math.min(1, c.s * 1.25), v: c.v * 1.05 })) });
set("home-plant-whitepot", { "floor-plant": recolor(layer("floor-plant"), pot, (c) => ({ h: c.h, s: c.s * 0.12, v: 0.55 + 0.45 * c.v })) });

// 나무 가구
const wood = (c) => c.h >= 12 && c.h <= 45 && c.s >= 0.3 && c.v >= 0.2;
const white = (c) => ({ h: c.h, s: c.s * 0.14, v: 0.6 + 0.4 * c.v });
const walnut = (c) => ({ h: 18, s: c.s * 0.95, v: c.v * 0.68 });
const woodSet = (ids, to) => Object.fromEntries(ids.map((id) => [id, recolor(layer(id), wood, to)]));
set("home-desk-white", woodSet(["desk"], white));
set("home-desk-walnut", woodSet(["desk"], walnut));
set("home-bed-white", woodSet(["bed"], white));
set("home-bed-walnut", woodSet(["bed"], walnut));
set("home-nightstand-white", woodSet(["nightstand-left", "nightstand-right"], white));
set("home-nightstand-walnut", woodSet(["nightstand-left", "nightstand-right"], walnut));
set("home-frames-white", woodSet(["frames-left", "frames-right"], white));
set("home-frames-black", woodSet(["frames-left", "frames-right"], (c) => ({ h: 20, s: c.s * 0.3, v: 0.12 + c.v * 0.28 })));
set("home-shelves-white", woodSet(["wall-shelves"], white));

// 책상 위: 종이와 같은 칸에 펼친 책과 하늘 공책
const paper = layer("desk-paper");
const paperBox = (() => {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < W * H; k++) if (paper.pixels[k * 4 + 3]) { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
})();
const onPaper = (draw) => {
  const out = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
  for (let k = 0; k < W * H; k++) {
    if (!paper.pixels[k * 4 + 3]) continue;
    const [x, y] = xy(k), c = colorOf(paper, k);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !paper.pixels[((y + dy) * W + x + dx) * 4 + 3]);
    out.pixels.set([...draw(x - paperBox.x0, y - paperBox.y0, c, edge), 255], k * 4);
  }
  return out;
};
const pw = paperBox.x1 - paperBox.x0 + 1, ph = paperBox.y1 - paperBox.y0 + 1;
set("home-desktop-book", {
  "desk-paper": onPaper((x, y, c, edge) => {
    const mid = Math.round(pw / 2 - (y - ph / 2) * 0.35);
    if (edge) return y >= ph - 2 ? [150, 52, 50] : [120, 84, 64];
    if (x === mid) return [176, 150, 124];
    if (y % 3 === 1 && Math.abs(x - mid) > 2 && x > 2 && x < pw - 3) return [198, 186, 170];
    return x < mid ? [244, 236, 220] : [236, 226, 208];
  }),
});
set("home-desktop-notebook", {
  "desk-paper": onPaper((x, y, c, edge) => {
    if (edge) return [62, 88, 120];
    if (x <= 3 && y % 2 === 0) return [210, 214, 222];
    if (y >= 3 && y <= 5 && x >= pw / 2 - 5 && x <= pw / 2 + 5) return [246, 242, 232];
    return c.v > 0.85 ? [150, 192, 226] : [124, 166, 204];
  }),
});

// 협탁 위: 작은 소품이라 직접 찍는다 (PixelLab 32×32 시안은 시계가 초록 덩어리, 꽃병에 상자가 붙어 나와 쓰지 않았다).
// 그림 바닥 가운데를 협탁 윗면 가운데(x 151, 96줄)에 놓는다. 원래 화분과 병 층은 감춘다 (그 밑 협탁 윗면은 3단계에서 메웠다).
const DOT = {
  o: [62, 42, 40], r: [204, 82, 76], R: [150, 54, 52], b: [92, 132, 188], B: [62, 94, 146], p: [244, 234, 214],
  m: [132, 206, 186], M: [78, 150, 138], w: [252, 250, 242], k: [56, 44, 44], g: [232, 192, 96],
  P: [228, 112, 146], q: [252, 182, 202], s: [96, 156, 84], L: [150, 200, 222], l: [204, 232, 242],
};
const CLOCK = [
  "...gg......gg....",
  "..goo......oog...",
  "....ooooooooo....",
  "...oMmmmmmmmMo...",
  "..oMmwwwwwwwmMo..",
  "..oMwwwwkwwwwMo..",
  "..oMwwwwkwwwwMo..",
  "..oMwwwwkkkwwMo..",
  "..oMmwwwwwwwmMo..",
  "...oMMmmmmmMMo...",
  "..ooooooooooooo..",
  ".obbbbbbbbbbbbBo.",
  ".oppppppppppppBo.",
  ".oooooooooooooo..",
  ".orrrrrrrrrrrrRo.",
  ".oppppppppppppRo.",
  ".oRRRRRRRRRRRRRo.",
  "..ooooooooooooo..",
];
const VASE = [
  "..ooo.....ooo..",
  ".oPqPo...oPqPo.",
  ".oPPPo.o.oPPPo.",
  ".oPPPooPooPPPo.",
  "..ooooPqPooooo.",
  "...s.oPPPo.s...",
  "...s..ooo..s...",
  "....s..s..s....",
  ".....s.s.s.....",
  "....ooooooo....",
  "...oLlwllLLo...",
  "..oLlwlllllLo..",
  "..oLlwsssllLo..",
  "..oLllssslLLo..",
  "..oLLlllllLLo..",
  "...oLLLLLLLo...",
  "....ooooooo....",
];
const dots = (rows) => {
  const out = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
  const ox = 151 - Math.floor(rows[0].length / 2), oy = 97 - rows.length + 1;
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (DOT[ch]) out.pixels.set([...DOT[ch], 255], ((oy + y) * W + ox + x) * 4); }));
  return out;
};
set("home-nighttop-clock", { "nightstand-plant": dots(CLOCK), "nightstand-jar": null });
set("home-nighttop-vase", { "nightstand-plant": dots(VASE), "nightstand-jar": null });

// ---- 쓰기 ----
const crop = (im) => {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < W * H; k++) if (im.pixels[k * 4 + 3]) { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = { width: w, height: h, pixels: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) out.pixels.set(im.pixels.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x1 + 1) * 4), y * w * 4);
  return { x: x0, y: y0, width: w, height: h, image: out };
};
mkdirSync(OUT, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });
const write = (name, image) => {
  const png = encodePng(image);
  writeFileSync(join(OUT, `${name}.png`), png);
  writeFileSync(join(PUBLIC, `${name}.png`), png);
  return `/assets/home/room/decor/${name}.png`;
};
const baseSrc = write("room-base", newBase);
// 그리는 순서: 바탕 덮개(벽지, 바닥), 그다음 부품 (가구 위 물건은 가구 뒤에).
const DRAW = ["wall", "floor", ...room.layers.map((l) => l.id)];
const boxes = {}, defaults = {};
for (const id of DRAW.slice(2)) {
  const c = layers[id] && crop(layers[id]);
  if (!c) continue;
  boxes[id] = { x: c.x, y: c.y, width: c.width, height: c.height };
  defaults[id] = write(`default-${id}`, c.image);
}
// 아이템 그림은 그 층의 기본 상자보다 클 수 있다 (협탁 위). 상자는 아이템마다 따로 적는다.
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
for (const [id, slot] of Object.entries(SLOT_OF)) if (slot !== "base" && boxes[id]) (slots[slot] ??= []).push(id);
const data = {
  size: room.size,
  scale: room.scale,
  base: baseSrc,
  draw: DRAW.filter((id) => id === "wall" || id === "floor" || boxes[id]),
  layers: Object.fromEntries(Object.entries(boxes).map(([id, b]) => [id, { ...b, src: defaults[id] }])),
  slots: { wallpaper: ["wall"], floor: ["floor"], ...slots },
  items: art,
};
writeFileSync(LAYOUT, [
  "// tools/art/home-decor.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.",
  "/**",
  " * 로비 \"내 방\"을 꾸밈 자리별 층으로 다시 나눈 그림 (꾸미기 슬롯 계획 3절). 바탕 위에 draw 순서로 층을 얹는다.",
  " * layers는 기본 아이템의 층(1배 좌표), slots는 자리마다 바뀌는 층, items는 판매 아이템이 층마다 쓰는 그림이다",
  " * (null이면 그 층을 감춘다). wall, floor 층은 기본 그림이 없고 판매 아이템만 바탕 위에 덮는다.",
  " */",
  `export const HOME_DECOR = ${JSON.stringify(data, null, 2)} as const;`,
  "",
].join("\n"));

// ---- 미리보기 (2배): 기본, 그리고 아이템 묶음마다 한 장 ----
const compose = (choice) => {
  const out = { width: W, height: H, pixels: newBase.pixels.slice() };
  for (const id of data.draw) {
    const a = choice[id];
    if (a === null) continue;
    const img = a ?? (layers[id] && id !== "wall" && id !== "floor" ? layers[id] : null);
    if (!img) continue;
    for (let k = 0; k < W * H; k++) if (img.pixels[k * 4 + 3]) out.pixels.set(px(img, k), k * 4);
  }
  return out;
};
const sheet = (scenes, S = 2, G = 4) => {
  const w = W * S, h = H * S, out = { width: 3 * (w + G) + G, height: Math.ceil(scenes.length / 3) * (h + G) + G };
  out.pixels = new Uint8Array(out.width * out.height * 4);
  scenes.forEach((sc, n) => {
    const ox = G + (n % 3) * (w + G), oy = G + Math.floor(n / 3) * (h + G);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.pixels.set(px(sc, Math.floor(y / S) * W + Math.floor(x / S)), ((oy + y) * out.width + ox + x) * 4);
  });
  return out;
};
const mix = (...ids) => Object.assign({}, ...ids.map((id) => items[id] ?? {}));
const previews = {
  check: [{}, mix("home-wall-mint", "home-chair-sage"), mix("home-wall-sky", "home-rug-pink", "home-blanket-yellow"),
    mix("home-wall-lemon", "home-floor-walnut", "home-lamps-mint"), mix("home-floor-gray", "home-desk-white", "home-desktop-book"),
    mix("home-bed-white", "home-nightstand-white", "home-blanket-pink", "home-plush-black")],
  more: [mix("home-curtain-pink", "home-frames-white", "home-shelves-white"), mix("home-chair-mustard", "home-rug-sky", "home-desktop-notebook"),
    mix("home-plant-maple", "home-desk-walnut", "home-bed-walnut"), mix("home-plant-whitepot", "home-frames-black", "home-plush-cheese"),
    mix("home-nighttop-clock", "home-curtain-mint", "home-lamps-pink"), mix("home-nighttop-vase", "home-curtain-yellow", "home-nightstand-walnut")],
};
for (const [name, list] of Object.entries(previews)) writeFileSync(join(OUT, `preview-${name}.png`), encodePng(sheet(list.map(compose))));
console.log(`내 방 다시 나누기: 벽 ${movedWall}칸, 러그 ${movedRug}칸, 마루 ${movedFloor}칸, 그 밖 ${movedOther}칸. 판매 아이템 ${Object.keys(items).length}개`);
