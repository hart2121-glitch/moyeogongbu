// 사용법: node tools/art/company-room.mjs [--prep]
// 회사 스터디룸 도트 그림(672×432, 화면 1배)을 만든다 (Story 009 3단계).
// 기준: 회사 원본 화면용 사본(public/assets/company-study-room-final-display.png)의 방 영역 x 0~1343, y 58~921 (가로세로 정확히 2배).
//   그래서 그림 1칸 = 원본 2px이고, companyFinalLayout.js의 상대 좌표(좌석, 통로, 충돌)를 그대로 쓴다.
// --prep: 원본 방 영역에서 글자(휴게실, 화장실, 나가기 표지, 좌석 번호, 화이트보드 글)를 줄마다 양옆 색으로 이어 지우고,
//   PixelLab image_to_pixelart(faithful, 보존 200, 시드 91)에 넣을 왼쪽(원본 x 0~511), 오른쪽(x 480~1343) 조각을 art-src/rooms/src/에 쓴다.
//   변환은 PixelLab 한도(한 변 512) 때문에 두 조각으로 했고, 결과를 converted-left.png(256×432), converted-right.png(432×432)로 둔다.
// 기본: 두 조각을 겹치는 16칸(그림 x 240~255, 휴게실과 사무실 사이 벽) 안에서 줄마다 차이가 가장 적은 이음매로 잇고,
//   좌석 번호 동그라미를 좌우 대칭 12칸 원으로 다시 찍어 art-src/rooms/company-room.png와 public/assets/rooms/company-room.png에 쓴다.
//   글자는 그림에 넣지 않는다. 화면이 빈 표지판과 동그라미 위에 글자로 올린다 (companyFinalLayout.js의 signs, seats).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { companyFinalLayout as layout } from "../../src/study/companyFinalLayout.js";
import { decodePng, encodePng } from "./pixelArt.mjs";

const SRC = "art-src/rooms/src";
const VIEW = layout.view;
const W = VIEW.width / 2, H = VIEW.height / 2;
/** 원본 전체 기준 상대 좌표를 그림 칸 좌표로. */
const toArt = ({ x, y }) => ({ x: (x * layout.image.width - VIEW.x) / 2, y: (y * layout.image.height - VIEW.y) / 2 });
const at = (im, x, y) => im.pixels.subarray((y * im.width + x) * 4, (y * im.width + x) * 4 + 4);

if (process.argv.includes("--prep")) {
  const src = decodePng(readFileSync("public/assets/company-study-room-final-display.png"));
  const view = { width: VIEW.width, height: VIEW.height, pixels: new Uint8Array(VIEW.width * VIEW.height * 4) };
  for (let y = 0; y < VIEW.height; y++) view.pixels.set(src.pixels.subarray(((VIEW.y + y) * src.width + VIEW.x) * 4, ((VIEW.y + y) * src.width + VIEW.x + VIEW.width) * 4), y * VIEW.width * 4);
  // 글자 상자 (원본 전체 좌표, 양 끝 포함)
  const boxes = [
    [128, 135, 203, 165], // 휴게실 표지
    [90, 522, 170, 553], // 화장실 표지
    [850, 731, 918, 756], // 나가기 표지
    [1003, 210, 1102, 321], // 화이트보드 글 (고양이 낙서는 둔다)
    ...layout.seats.map(({ label }) => {
      const cx = Math.round(label.x * layout.image.width), cy = Math.round(label.y * layout.image.height);
      return [cx - 7, cy - 8, cx + 7, cy + 8];
    }),
  ];
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) {
    const a = at(view, x0 - 1 - VIEW.x, y - VIEW.y), b = at(view, x1 + 1 - VIEW.x, y - VIEW.y);
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0 + 1) / (x1 - x0 + 2);
      at(view, x - VIEW.x, y - VIEW.y).set([0, 1, 2].map((q) => Math.round(a[q] * (1 - t) + b[q] * t)));
    }
  }
  const cut = (x0, w, name) => {
    const out = { width: w, height: VIEW.height, pixels: new Uint8Array(w * VIEW.height * 4) };
    for (let y = 0; y < VIEW.height; y++) out.pixels.set(view.pixels.subarray((y * VIEW.width + x0) * 4, (y * VIEW.width + x0 + w) * 4), y * w * 4);
    writeFileSync(join(SRC, name), encodePng(out));
  };
  cut(0, 512, "ref-left.png");
  cut(480, 864, "ref-right.png");
  console.log("변환용 조각: ref-left.png 512×864, ref-right.png 864×864");
  process.exit(0);
}

const L = decodePng(readFileSync(join(SRC, "converted-left.png")));
const R = decodePng(readFileSync(join(SRC, "converted-right.png")));
const RX = W - R.width; // 오른쪽 조각이 놓이는 그림 x (240)
const X0 = RX, X1 = L.width - 1;

// 이음매: 겹치는 칸에서 왼쪽과 오른쪽 색 차이를 줄마다 더하되, 이웃 줄과 한 칸 넘게 어긋나지 않는 가장 싼 길 (동적 계획법)
const cost = (x, y) => { const a = at(L, x, y), b = at(R, x - RX, y); return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); };
const N = X1 - X0 + 1, acc = [], step = [];
for (let y = 0; y < H; y++) {
  acc.push(new Float64Array(N));
  step.push(new Int8Array(N));
  for (let i = 0; i < N; i++) {
    let best = 0, move = 0;
    if (y) {
      best = Infinity;
      for (const d of [-1, 0, 1]) if (i + d >= 0 && i + d < N && acc[y - 1][i + d] < best) { best = acc[y - 1][i + d]; move = d; }
    }
    acc[y][i] = best + cost(X0 + i, y);
    step[y][i] = move;
  }
}
const seam = new Array(H);
for (let y = H - 1, i = acc[H - 1].indexOf(Math.min(...acc[H - 1])); y >= 0; y--) { seam[y] = X0 + i; i += step[y][i]; }
const room = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) room.pixels.set(x < seam[y] ? at(L, x, y) : at(R, x - RX, y), (y * W + x) * 4);

// 손 보정: 좌석 번호 동그라미. 변환으로 찌그러진 원을 칸막이 판 색으로 덮고 같은 자리에 대칭 원을 찍는다.
const CIRCLE = [
  "....oooo....",
  "..oorrrroo..",
  ".orrffffrro.",
  ".orffffffro.",
  "orffffffffro",
  "orfffffffhro",
  "orffffffhhro",
  "orfffffffhro",
  ".orffffffro.",
  ".orrffffrro.",
  "..oorrrroo..",
  "....oooo....",
];
const PEN = { o: [84, 62, 54], r: [222, 160, 116], f: [246, 228, 204], h: [234, 204, 176] };
const luma = (p) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
for (const seat of layout.seats) {
  const c = toArt(seat.label), cx = Math.round(c.x), cy = Math.round(c.y);
  // 지금 원의 밝은 칸 상자로 가운데를 다시 잡는다
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = cy - 9; y <= cy + 9; y++) for (let x = cx - 9; x <= cx + 9; x++) if (luma(at(room, x, y)) > 170) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const left = Math.round((x0 + x1 + 1) / 2) - 6, top = Math.round((y0 + y1 + 1) / 2) - 6;
  // 판 색: 원 둘레 바깥 고리에서 가장 흔한 색
  const count = new Map();
  for (let y = top - 3; y < top + 15; y++) for (let x = left - 3; x < left + 15; x++) {
    if (x >= left - 1 && x <= left + 12 && y >= top - 1 && y <= top + 12) continue;
    const key = Array.from(at(room, x, y)).join(",");
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const panel = [...count].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
  for (let y = top - 1; y <= top + 12; y++) for (let x = left - 1; x <= left + 12; x++) if (Math.hypot(x - left - 5.5, y - top - 5.5) <= 7.2) at(room, x, y).set(panel);
  CIRCLE.forEach((row, dy) => [...row].forEach((ch, dx) => { if (PEN[ch]) at(room, left + dx, top + dy).set([...PEN[ch], 255]); }));
}

mkdirSync("public/assets/rooms", { recursive: true });
const png = encodePng(room);
writeFileSync("art-src/rooms/company-room.png", png);
writeFileSync("public/assets/rooms/company-room.png", png);
console.log(`회사 방 ${W}×${H}, 이음매 x ${Math.min(...seam)}~${Math.max(...seam)}`);
