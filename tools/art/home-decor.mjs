// 사용법: node tools/art/home-decor.mjs
// 로비 "내 방" 꾸밈 (꾸미기 슬롯 계획 3절). 2026-11-02 사용자 결정: 아이템 그림에는 그 물건 픽셀만 넣고(아래 가구, 벽, 바닥 금지),
// 판매 아이템은 브라운, 화이트, 블랙, 앤티크 테마로 묶어 서로 조합되게 하며, 바닥에 데코타일과 대리석을 더한다.
//
// 원재료: art-src/home/room/src/generated.png (가구가 다 있는 방), empty.png (같은 방의 빈 방: 벽, 몰딩, 걸레받이, 창문, 마루).
// 1. 바탕은 빈 방 그대로다.
// 2. 물건 떼기: 물건마다 픽셀 경계를 따라 그린 다각형 안에서, 빈 방과 다르고 벽의 그림자나 불빛이 아닌 칸만 그 물건으로 본다.
//    앞에 있는 물건부터 차지한다. 모양이 바뀌는 자리(책상 위, 협탁 위) 밑의 가구 윗면은 같은 줄의 가구 칸으로 메운다.
// 3. 어느 물건도 아닌 칸의 차이는 그림자(곱하기 층)와 불빛(스크린 층)으로 따로 둔다. 벽지, 바닥, 러그를 바꿔도 그대로 얹힌다.
// 4. 러그와 커튼 천은 새로 그린다 (원래 러그는 의자와 침대에 가려 조각나 있고, 커튼은 창과 벽이 비치는 망사라 물건만 뗄 수 없다).
// 5. 벽지와 바닥 아이템은 빈 방의 벽지 칸, 마루 칸만 덮는다. 데코타일, 대리석, 파케이는 마루와 같은 원근(소실점 126, 17)으로 그린다.
// 6. 가구 아이템은 같은 층에서 재질 칸만 테마 색으로 바꾼다 (모양이 같아 가려진 자리를 새로 그리지 않는다).
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
const G = read(join(SRC, "generated.png"));
const E = read(join(SRC, "empty.png"));
const W = G.width, H = G.height;
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

// ---- 다각형 ----
/** 칸 (x, y)의 가운데가 다각형 안이면 참. 꼭짓점은 칸 모서리 좌표다. */
const inPoly = (poly, x, y) => {
  const px = x + 0.5, py = y + 0.5;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** x0..x1, y0..y1 칸을 모두 담는 사각형. */
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1 + 1, y0], [x1 + 1, y1 + 1], [x0, y1 + 1]];

// ---- 물건 칸 판정 ----
const gap = (k) => { const a = rgb(G, k), b = rgb(E, k); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
/**
 * 벽지 위의 그림자나 불빛: 빈 방 색에 세 채널이 비슷한 비율로 어두워지거나(그림자) 흰색 쪽으로 비슷하게 밝아졌다(불빛).
 * 나무나 천은 채널마다 비율이 크게 달라 걸리지 않는다.
 */
const wallEffect = (k) => {
  const a = rgb(G, k), b = rgb(E, k);
  const dark = [0, 1, 2].map((i) => a[i] / Math.max(1, b[i]));
  const light = [0, 1, 2].map((i) => (255 - a[i]) / Math.max(1, 255 - b[i]));
  const spread = (r) => Math.max(...r) - Math.min(...r);
  return (Math.max(...dark) <= 1.02 && Math.min(...dark) >= 0.6 && spread(dark) < 0.2) ||
    (Math.max(...light) <= 1.02 && spread(light) < 0.3);
};
/** 기본 판정: 빈 방과 다르고, 벽지 칸이면 그림자나 불빛도 아니다. */
const differs = (k, x, y) => gap(k) > 18 && !(isWall(x, y) && wallEffect(k));
const solid = () => true;
const leafy = (c) => (c.h >= 55 && c.h <= 170 && c.s > 0.18) || (c.v < 0.3 && c.h >= 50 && c.h <= 180 && c.s > 0.2);
const sage = (c) => (c.h >= 45 && c.h <= 130 && c.s > 0.1) || (c.v < 0.45 && c.h >= 40 && c.h <= 180 && c.s > 0.08);

/**
 * 물건 (앞에 있는 것부터). id는 층 이름, slot은 꾸밈 자리. polys 안에서 test가 참인 칸이 그 물건이다.
 * 경계는 generated.png를 8~12배로 키워 잰 값이다.
 */
const OBJECTS = [
  {
    id: "bed-cat", slot: "plush", polys: [rect(187, 97, 205, 111)],
    test: (k, x, y, c) => (c.s < 0.32 && c.v > 0.55) || (c.h >= 60 && c.h <= 140 && c.s > 0.48) || (c.v < 0.36 && !sage(c)),
  },
  {
    id: "bed-blanket", slot: "blanket",
    polys: [[[164, 88], [241, 88], [241, 114], [226, 114], [226, 135], [186, 135], [181, 151], [171, 151], [163, 112]]],
    test: (k, x, y, c) => sage(c),
  },
  {
    id: "lamp-right", slot: "lamps",
    polys: [[[229, 85], [252, 85], [252, 100], [249, 100], [250, 118], [235, 118], [236, 100], [229, 100]]],
    test: (k, x, y, c) => differs(k, x, y) && !(y >= 112 && c.v > 0.66 && c.h < 40),
  },
  {
    id: "nightstand-right", slot: "nightstands",
    polys: [[[225, 110], [241, 110], [246, 104], [256, 104], [256, 152], [225, 152]]],
    test: (k, x, y, c) => (y >= 112 ? true : differs(k, x, y) && c.v < 0.8),
  },
  {
    id: "floor-plant", slot: "floor_plant",
    polys: [[[3, 120], [31, 120], [30, 128], [27, 142], [24, 151], [8, 151], [5, 142], [3, 128]], rect(0, 102, 38, 127)],
    test: (k, x, y, c) => inPoly([[3, 120], [31, 120], [30, 128], [27, 142], [24, 151], [8, 151], [5, 142], [3, 128]], x, y) || leafy(c),
  },
  {
    id: "armchair", slot: "armchair",
    polys: [
      [[86, 76], [88, 74], [109, 74], [113, 78], [113, 119], [73, 119], [73, 98], [79, 94], [86, 92]],
      rect(72, 117, 76, 130), rect(89, 117, 94, 136), rect(104, 117, 108, 129),
    ],
    test: (k, x, y, c) => y < 117 || c.v < 0.5,
  },
  {
    id: "desk-lamp", slot: "lamps",
    polys: [[[46, 56], [62, 56], [62, 75], [61, 75], [61, 86], [50, 86], [50, 75], [46, 75]]],
    test: differs,
  },
  {
    id: "desk-paper", slot: "desk_top",
    // 종이 윗변 88줄(x 44~58), 왼쪽 변은 한 줄에 한 칸씩 (38, 95)까지, 앞쪽 두께 96줄까지. 16배로 잰 값이다.
    polys: [[[45, 88], [59, 88], [60, 89], [60, 96], [58, 96], [58, 97], [37, 97], [37, 96], [38, 95]]],
    test: solid,
  },
  {
    id: "desk", slot: "desk",
    polys: [[
      [8, 62], [9, 58], [11, 55], [13, 52], [15, 50], [17, 49], [37, 49], [40, 50], [42, 53], [43, 56], [44, 60], [44, 82],
      [74, 81], [77, 84], [77, 92], [73, 96], [73, 128], [62, 129], [57, 131], [56, 144], [7, 144], [7, 104], [8, 96],
    ]],
    test: (k, x, y, c) => (y < 82 ? differs(k, x, y) : true),
  },
  { id: "nightstand-jar", slot: "nightstand_top", polys: [rect(141, 88, 147, 94)], test: solid },
  {
    id: "nightstand-plant", slot: "nightstand_top",
    // 화분: 테두리 x 149~161(86~89줄), 몸통 x 150~160(90~95줄). 그 위는 잎만.
    polys: [rect(143, 71, 167, 85), rect(149, 86, 161, 89), rect(150, 90, 160, 94), rect(150, 95, 159, 95)],
    test: (k, x, y, c) => (y >= 86 && x >= 149 && x <= 161 ? true : leafy(c)),
  },
  {
    id: "nightstand-mid", slot: "nightstands",
    polys: [[[138, 92], [166, 92], [167, 93], [167, 101], [165, 101], [165, 122], [139, 122], [139, 101], [138, 101]]],
    test: solid,
  },
  {
    id: "bed", slot: "bed",
    polys: [[
      [165, 62], [233, 62], [233, 112], [225, 112], [225, 138], [186, 138], [183, 152], [174, 152], [172, 144], [169, 136],
      [166, 128], [163, 120], [161, 112], [160, 104], [165, 99],
    ]],
    // 머리판 안쪽(베개)은 벽과 색이 비슷해 다각형 그대로, 나머지 벽 쪽은 벽과 다른 칸만.
    test: (k, x, y, c) => (x >= 173 && x <= 221 && y >= 74 && y <= 95) || !isWall(x, y) || differs(k, x, y),
  },
  { id: "frames-left", slot: "frames", polys: [rect(3, 18, 18, 49), rect(20, 17, 34, 47), rect(51, 21, 72, 43)], test: differs },
  { id: "frames-right", slot: "frames", polys: [rect(227, 16, 242, 69), rect(239, 25, 255, 73)], test: differs },
  { id: "wall-shelves", slot: "shelves", polys: [rect(180, 14, 219, 63)], test: differs },
  { id: "curtain-rod", slot: "curtains", polys: [rect(82, 4, 178, 13)], test: (k, x, y) => differs(k, x, y) && y <= 12 },
];

// ---- 칸 주인 ----
const owner = new Array(N).fill(null);
for (let k = 0; k < N; k++) {
  const [x, y] = xy(k), c = colorOf(G, k);
  for (const o of OBJECTS) {
    if (!o.polys.some((p) => inPoly(p, x, y))) continue;
    if (o.test(k, x, y, c)) { owner[k] = o.id; break; }
  }
}
// 외톨이 칸 걷기: 상하좌우에 같은 주인이 하나도 없는 칸은 물건이 아니다 (그림자 부스러기).
for (let pass = 0; pass < 2; pass++) for (let k = 0; k < N; k++) {
  if (!owner[k]) continue;
  const [x, y] = xy(k);
  const same = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < W && ny < H && owner[ny * W + nx] === owner[k];
  }).length;
  if (same === 0) owner[k] = null;
}

// 물건 안에 갇힌 빈 칸(액자 그림, 손잡이 빛, 베개 무늬가 벽처럼 보여 빠진 칸)은 그 물건으로 채운다:
// 물건 상자 테두리에서 그 물건이 아닌 칸을 따라 퍼져 닿지 않는 칸이 갇힌 칸이다.
for (const o of OBJECTS) {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < N; k++) if (owner[k] === o.id) { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) continue;
  const reach = new Uint8Array(N), stack = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * W + x;
    if ((x === x0 || x === x1 || y === y0 || y === y1) && owner[k] !== o.id) { reach[k] = 1; stack.push(k); }
  }
  while (stack.length) {
    const [x, y] = xy(stack.pop());
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || reach[n] || owner[n] === o.id) continue;
      reach[n] = 1;
      stack.push(n);
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * W + x;
    if (!reach[k] && !owner[k] && o.polys.some((p) => inPoly(p, x, y))) owner[k] = o.id;
  }
}

const layers = {};
for (const o of OBJECTS) layers[o.id] = blank();
for (let k = 0; k < N; k++) if (owner[k]) layers[owner[k]].pixels.set([...rgb(G, k), 255], k * 4);

/**
 * 모양이 바뀌는 자리 밑 가구 윗면: 가린 물건 칸을 같은 줄 가구 윗면의 바탕색(그 줄 가구 칸에서 가장 흔한 밝은 색)으로 메운다.
 * 이웃 칸을 그대로 옮기면 물건 그림자나 테두리 색까지 옮겨 와 물건을 바꿨을 때 자국이 남는다.
 */
const fillUnder = (covers, furniture, y0, y1) => {
  const f = layers[furniture];
  for (let y = y0; y <= y1; y++) {
    const hidden = [];
    for (let x = 0; x < W; x++) if (covers.includes(owner[y * W + x])) hidden.push(x);
    if (!hidden.length) continue;
    const from = Math.min(...hidden) - 12, to = Math.max(...hidden) + 12;
    const count = new Map();
    for (let x = Math.max(0, from); x <= Math.min(W - 1, to); x++) {
      const k = y * W + x;
      if (owner[k] !== furniture || colorOf(G, k).v < 0.4) continue;
      const key = rgb(G, k).join(",");
      count.set(key, (count.get(key) ?? 0) + 1);
    }
    if (!count.size) continue;
    const fill = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
    for (const x of hidden) f.pixels.set([...fill, 255], (y * W + x) * 4);
  }
};
fillUnder(["desk-paper"], "desk", 82, 97);
fillUnder(["nightstand-jar", "nightstand-plant"], "nightstand-mid", 92, 100);

// ---- 그림자와 불빛 ----
// 커튼 자리(망사 너머로 창과 벽이 비친다)는 커튼을 새로 그리므로 차이를 쓰지 않는다.
const inCurtains = (x, y) => x >= 82 && x <= 180 && y >= 4 && y <= 104;
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
const rugLit = (() => {
  const list = [];
  for (let k = 0; k < N; k++) { const [x, y] = xy(k); if (!owner[k] && inRug(x, y)) list.push(rgb(G, k)); }
  list.sort((a, b) => lum(b) - lum(a));
  const top = list.slice(0, Math.max(1, Math.floor(list.length * 0.4)));
  return [0, 1, 2].map((i) => top.reduce((s, c) => s + c[i], 0) / top.length);
})();
const shadow = blank(), glow = blank();
const quant = (v) => Math.round(v / 8) * 8;
for (let k = 0; k < N; k++) {
  const [x, y] = xy(k);
  if (owner[k] || inCurtains(x, y) || inWindow(x, y)) continue;
  const g = rgb(G, k), base = inRug(x, y) ? rugLit : rgb(E, k);
  const ratio = lum(g) / Math.max(1, lum(base));
  if (ratio < 0.92) {
    const m = quant(ratio * 255);
    shadow.pixels.set([m, Math.max(0, m - 4), Math.max(0, m - 8), 255], k * 4);
  } else if (ratio > 1.06 && !inRug(x, y) && !isFloor(x, y)) {
    const c = [0, 1, 2].map((i) => (base[i] >= 255 ? 0 : Math.max(0, 1 - (255 - g[i]) / (255 - base[i]))));
    glow.pixels.set([...c.map((v) => quant(v * 255)), 255], k * 4);
  }
}
// 판자 선과 벽지 무늬가 한 칸 어긋나 생긴 가는 줄과 점은 지운다: 여덟 이웃 가운데 넷 미만이 효과 칸이면 지우고,
// 그래도 남은 8칸 미만 덩어리도 지운다. 그림자와 불빛은 넓은 면만 남는다.
for (const im of [shadow, glow]) {
  for (let pass = 0; pass < 2; pass++) {
    const keep = new Uint8Array(N);
    for (let k = 0; k < N; k++) {
      if (!im.pixels[k * 4 + 3]) continue;
      const [x, y] = xy(k);
      let near = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H && im.pixels[(ny * W + nx) * 4 + 3]) near++;
      }
      keep[k] = near >= 4 ? 1 : 0;
    }
    for (let k = 0; k < N; k++) if (!keep[k]) im.pixels.fill(0, k * 4, k * 4 + 4);
  }
  const seen = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    if (seen[k] || !im.pixels[k * 4 + 3]) continue;
    const group = [k], stack = [k];
    seen[k] = 1;
    while (stack.length) {
      const [x, y] = xy(stack.pop());
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[n] || !im.pixels[n * 4 + 3]) continue;
        seen[n] = 1;
        stack.push(n);
        group.push(n);
      }
    }
    if (group.length < 8) for (const n of group) im.pixels.fill(0, n * 4, n * 4 + 4);
  }
}
layers.shadow = shadow;
layers.glow = glow;

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
const woodItem = (ids, to) => Object.fromEntries(ids.map((id) => [id, recolor(layers[id], wood, to)]));

const items = {}; // 아이템 id → { 층 id: 방 전체 크기 그림 | null }
const set = (id, parts) => (items[id] = parts);
const defaults = {}; // 기본 아이템의 새로 그린 층

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
set("home-curtain-linen", { curtains: drawCurtains(CURTAINS.linen), "curtain-rod": recolor(layers["curtain-rod"], wood, WOOD.walnut) });
set("home-curtain-charcoal", { curtains: drawCurtains(CURTAINS.charcoal), "curtain-rod": recolor(layers["curtain-rod"], wood, WOOD.black) });
set("home-curtain-burgundy", {
  curtains: drawCurtains(CURTAINS.burgundy, hex("#c9a25b")),
  "curtain-rod": recolor(layers["curtain-rod"], wood, WOOD.gold),
});
// 액자, 선반
set("home-frames-walnut", woodItem(["frames-left", "frames-right"], WOOD.walnut));
set("home-frames-white", woodItem(["frames-left", "frames-right"], WOOD.white));
set("home-frames-black", woodItem(["frames-left", "frames-right"], WOOD.black));
set("home-frames-gold", woodItem(["frames-left", "frames-right"], WOOD.gold));
set("home-shelves-walnut", woodItem(["wall-shelves"], WOOD.walnut));
set("home-shelves-white", woodItem(["wall-shelves"], WOOD.white));
set("home-shelves-black", woodItem(["wall-shelves"], WOOD.black));
// 나무 가구
for (const [theme, to] of [["walnut", WOOD.walnut], ["white", WOOD.white], ["black", WOOD.black], ["antique", WOOD.antique]]) {
  set(`home-desk-${theme}`, woodItem(["desk"], to));
  set(`home-nightstand-${theme}`, woodItem(["nightstand-mid", "nightstand-right"], to));
  set(`home-bed-${theme}`, woodItem(["bed"], to));
}
// 스탠드: 갓(밝은 노랑 크림)과 받침
const shadeCloth = (c) => c.h >= 28 && c.h <= 64 && c.s < 0.7 && c.v > 0.7;
const lampBase = (c) => !shadeCloth(c) && c.s >= 0.2 && c.v >= 0.18 && (c.h <= 45 || c.h >= 330);
const lampItem = (shadeTo, baseTo) =>
  Object.fromEntries(["desk-lamp", "lamp-right"].map((id) => {
    const im = recolor(layers[id], shadeCloth, shadeTo);
    return [id, baseTo ? recolor(im, lampBase, baseTo) : im];
  }));
set("home-lamps-white", lampItem((c) => ({ h: 40, s: 0.05, v: 0.84 + 0.16 * c.v }), (c) => ({ h: 35, s: 0.05, v: 0.55 + 0.45 * c.v })));
set("home-lamps-black", lampItem((c) => ({ h: 40, s: 0.08, v: 0.8 + 0.2 * c.v }), (c) => ({ h: 230, s: 0.08, v: 0.08 + 0.3 * c.v })));
set("home-lamps-brass", lampItem((c, x) => ({ h: 38, s: x % 2 ? 0.34 : 0.26, v: (x % 2 ? 0.86 : 0.94) * (0.85 + 0.15 * c.v) }), (c) => ({ h: 42, s: 0.68, v: 0.32 + 0.62 * c.v })));
// 안락의자: 천, 쿠션, 다리
const CHAIR_BOTTOM = 117;
const cushion = (c, x, y) => y < 112 && (c.h >= 330 || c.h <= 18) && c.s > 0.3 && c.v > 0.4;
const chairCloth = (c, x, y) => y < CHAIR_BOTTOM && !cushion(c, x, y) && c.s < 0.36 && c.v > 0.42;
const legs = (c, x, y) => y >= CHAIR_BOTTOM && wood(c);
const chairItem = (clothTo, cushionTo, legsTo) => {
  let im = recolor(layers.armchair, chairCloth, clothTo);
  if (cushionTo) im = recolor(im, cushion, cushionTo);
  if (legsTo) im = recolor(im, legs, legsTo);
  return { armchair: im };
};
set("home-chair-sage", chairItem((c) => ({ h: 100, s: Math.max(0.16, c.s * 1.7), v: c.v * 0.96 })));
set("home-chair-mustard", chairItem((c) => ({ h: 42, s: Math.max(0.34, c.s * 2.6), v: c.v * 0.97 })));
set("home-chair-leather", chairItem((c) => ({ h: 24, s: 0.5 + 0.2 * (1 - c.v), v: c.v * 0.7 }), (c) => ({ h: 40, s: 0.18, v: Math.min(1, c.v * 1.08) }), WOOD.walnut));
set("home-chair-white", chairItem((c) => ({ h: 40, s: 0.03, v: 0.6 + 0.4 * c.v }), (c) => ({ h: 30, s: 0.28, v: c.v }), WOOD.white));
set("home-chair-charcoal", chairItem((c) => ({ h: 230, s: 0.06, v: 0.16 + 0.42 * c.v }), (c) => ({ h: 42, s: 0.6, v: c.v }), WOOD.black));
set("home-chair-velvet", chairItem((c) => ({ h: 350, s: 0.62, v: c.v * 0.66 }), (c) => ({ h: 43, s: 0.6, v: c.v }), WOOD.antique));
// 이불
const blanketItem = (to) => ({ "bed-blanket": recolor(layers["bed-blanket"], sage, to) });
set("home-blanket-yellow", blanketItem((c) => ({ h: 46, s: Math.max(0.3, c.s * 1.7), v: c.v * 1.2 })));
set("home-blanket-camel", blanketItem((c) => ({ h: 28, s: Math.min(1, c.s * 1.5 + 0.1), v: c.v })));
set("home-blanket-white", blanketItem((c) => ({ h: 40, s: 0.04, v: 0.5 + 0.5 * c.v })));
set("home-blanket-charcoal", blanketItem((c) => ({ h: 230, s: 0.08, v: c.v * 0.55 })));
set("home-blanket-burgundy", blanketItem((c) => ({ h: 352, s: Math.min(1, c.s * 1.6 + 0.15), v: c.v * 0.78 })));
// 침대 인형
const fur = (c) => c.s < 0.2 && c.v > 0.6;
set("home-plush-cheese", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 32, s: 0.5, v: c.v })) });
set("home-plush-black", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 250, s: 0.12, v: c.v * 0.34 })) });
set("home-plush-gray", { "bed-cat": recolor(layers["bed-cat"], fur, (c) => ({ h: 220, s: 0.06, v: c.v * 0.7 })) });
// 바닥 화분
const POT = [[3, 120], [31, 120], [30, 128], [27, 142], [24, 151], [8, 151], [5, 142], [3, 128]];
const leaf = (c, x, y) => !inPoly(POT, x, y) && c.h >= 55 && c.h <= 170 && c.s > 0.18;
const potClay = (c, x, y) => inPoly(POT, x, y) && c.h <= 35 && c.s > 0.3 && c.v > 0.3;
set("home-plant-maple", { "floor-plant": recolor(layers["floor-plant"], leaf, (c) => ({ h: 14 + (c.v - 0.4) * 30, s: Math.min(1, c.s * 1.25), v: c.v * 1.05 })) });
set("home-plant-whitepot", { "floor-plant": recolor(layers["floor-plant"], potClay, (c) => ({ h: c.h, s: c.s * 0.12, v: 0.55 + 0.45 * c.v })) });

// 책상 위: 종이 자리에 놓는 펼친 책과 공책 (책상 윗면 원근을 따른 평행사변형, 물건 칸만)
const paperBox = (() => {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let k = 0; k < N; k++) if (owner[k] === "desk-paper") { const [x, y] = xy(k); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
})();
/** 종이와 같은 평행사변형 (윗변이 오른쪽으로 밀린 모양) 안을 칠한다. */
const onDesk = (draw, inset = 0) => {
  const out = blank();
  const { x0, x1, y0, y1 } = paperBox, h = y1 - y0;
  for (let y = y0 + inset; y <= y1; y++) {
    const shift = Math.round(((y1 - y) / h) * 5);
    const left = x0 + shift + inset, right = x1 - 5 + shift - inset;
    for (let x = left; x <= right; x++) {
      const edge = x === left || x === right || y === y0 + inset || y === y1;
      out.pixels.set([...draw(x - left, y - y0 - inset, right - left, y1 - y0 - inset, edge), 255], (y * W + x) * 4);
    }
  }
  return out;
};
set("home-desktop-book", {
  "desk-paper": onDesk((x, y, w, h, edge) => {
    const mid = Math.round(w / 2);
    if (edge) return y === h ? hex("#7a3b32") : hex("#6b4a36");
    if (x === mid) return hex("#b39a7c");
    if (y % 3 === 1 && Math.abs(x - mid) > 2 && x > 2 && x < w - 2) return hex("#c9bba6");
    return x < mid ? hex("#f4ecdc") : hex("#ebe1cd");
  }),
});
set("home-desktop-notebook", {
  "desk-paper": onDesk((x, y, w, h, edge) => {
    if (edge) return hex("#2f3d52");
    if (x <= 2 && y % 2 === 0) return hex("#c9c9c4");
    if (y >= 3 && y <= 5 && x >= w / 2 - 4 && x <= w / 2 + 4) return hex("#efe9dc");
    return hex("#4a5d78");
  }, 1),
});

// 협탁 위: 직접 찍은 소품. 그림 바닥 가운데를 협탁 윗면 가운데(x 151, 96줄)에 놓고 원래 화분과 병은 감춘다.
const DOT = {
  o: "#3e2a28", r: "#a8443e", R: "#7a2e2c", b: "#5b7aa6", B: "#3e5a86", p: "#f4ead6", m: "#e8dcc0", M: "#b8a582",
  w: "#fcfaf2", k: "#382c2c", g: "#d8b460", P: "#e47092", q: "#fcb6ca", s: "#609c54", L: "#c8dce6", l: "#e6f0f4",
};
const CLOCK = [
  "...gg......gg....", "..goo......oog...", "....ooooooooo....", "...oMmmmmmmmMo...", "..oMmwwwwwwwmMo..", "..oMwwwwkwwwwMo..",
  "..oMwwwwkwwwwMo..", "..oMwwwwkkkwwMo..", "..oMmwwwwwwwmMo..", "...oMMmmmmmMMo...", "..ooooooooooooo..", ".obbbbbbbbbbbbBo.",
  ".oppppppppppppBo.", ".oooooooooooooo..", ".orrrrrrrrrrrrRo.", ".oppppppppppppRo.", ".oRRRRRRRRRRRRRo.", "..ooooooooooooo..",
];
const VASE = [
  "..ooo.....ooo..", ".oPqPo...oPqPo.", ".oPPPo.o.oPPPo.", ".oPPPooPooPPPo.", "..ooooPqPooooo.", "...s.oPPPo.s...", "...s..ooo..s...",
  "....s..s..s....", ".....s.s.s.....", "....ooooooo....", "...oLlwllLLo...", "..oLlwlllllLo..", "..oLlwsssllLo..", "..oLllssslLLo..",
  "..oLLlllllLLo..", "...oLLLLLLLo...", "....ooooooo....",
];
const dots = (rows) => {
  const out = blank();
  const ox = 151 - Math.floor(rows[0].length / 2), oy = 97 - rows.length + 1;
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (DOT[ch]) out.pixels.set([...hex(DOT[ch]), 255], ((oy + y) * W + ox + x) * 4); }));
  return out;
};
set("home-nighttop-clock", { "nightstand-plant": dots(CLOCK), "nightstand-jar": null });
set("home-nighttop-vase", { "nightstand-plant": dots(VASE), "nightstand-jar": null });

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
set("home-chair-sky", chairItem(tint(205, 1.7, 0.16)));
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
  "wall", "floor", "glow", "rug", "shadow", "frames-right", "frames-left", "wall-shelves", "curtains", "curtain-rod",
  "desk", "desk-paper", "desk-lamp", "nightstand-mid", "nightstand-jar", "nightstand-plant", "bed", "bed-cat", "bed-blanket",
  "nightstand-right", "lamp-right", "armchair", "floor-plant",
];
const BLEND = { glow: "screen", shadow: "multiply" };
const SLOT_OF = Object.fromEntries([...OBJECTS.map((o) => [o.id, o.slot]), ["rug", "rug"], ["curtains", "curtains"], ["wall", "wallpaper"], ["floor", "floor"]]);
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
  fixed: ["glow", "shadow"],
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
  " * fixed 층(불빛, 그림자)은 자리 없이 늘 그리고, blend로 아래 그림과 섞는다 (불빛은 screen, 그림자는 multiply).",
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
const count = {};
for (const o of OBJECTS) count[o.id] = 0;
for (let k = 0; k < N; k++) if (owner[k]) count[owner[k]]++;
console.log("물건 칸:", Object.entries(count).map(([id, n]) => `${id} ${n}`).join(", "));
console.log(`판매 아이템 ${Object.keys(items).length}개, 층 ${Object.keys(boxes).length}개`);
