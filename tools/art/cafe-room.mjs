// 사용법: node tools/art/cafe-room.mjs [--debug]
// 공용 스터디카페 도트 그림(672×432, 화면 1배)을 만든다 (Story 011).
// 2026-11-02 사용자 결정대로 완성된 방 그림에서 물건을 떼지 않는다: 벽과 바닥은 여기서 칸마다 그리고,
// 물건은 PixelLab create_map_object로 따로 만든 그림(art-src/rooms/cafe/objects/src/, 목록은 그 폴더 README.md)을 정한 자리에 올린다.
// 탁자와 의자, 번호 판, 나무 표지판, 벽시계 판은 좌석과 책상 세트 칸(src/study/cafeLayout.js)에 정확히 맞도록 여기서 그린다.
// 결과: art-src/rooms/cafe-room.png(672×432), art-src/rooms/cafe/cafe-laptop.png(41×29)와 같은 파일을 public/assets/rooms/에.
// --debug: 걸을 수 있는 바닥, 막힌 곳, 지점을 겹친 확인용 그림(art-src/rooms/cafe/preview-debug.png)도 쓴다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";
import { CAFE_ART_SIZE, CAFE_SOFA, CAFE_TABLES, TABLE_SEAT, cafeLayout } from "../../src/study/cafeLayout.js";

const OBJ = "art-src/rooms/cafe/objects/src";
const W = CAFE_ART_SIZE.width, H = CAFE_ART_SIZE.height;
const FLOOR = 108; // 바닥이 시작하는 줄 (걸레받이 아래)

// ---- 그림 도구 ----
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const blank = (w, h) => ({ width: w, height: h, pixels: new Uint8Array(w * h * 4) });
const room = blank(W, H);
const set = (im, x, y, c, a = 255) => {
  if (x < 0 || y < 0 || x >= im.width || y >= im.height) return;
  const k = (y * im.width + x) * 4;
  im.pixels[k] = c[0];
  im.pixels[k + 1] = c[1];
  im.pixels[k + 2] = c[2];
  im.pixels[k + 3] = a;
};
const get = (im, x, y) => {
  const k = (y * im.width + x) * 4;
  return [im.pixels[k], im.pixels[k + 1], im.pixels[k + 2], im.pixels[k + 3]];
};
const rect = (im, x0, y0, x1, y1, c) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(im, x, y, c);
};
/** 결정적 잡음 0..1 (같은 칸은 늘 같은 값). */
const noise = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const shift = (c, d) => c.map((v) => Math.max(0, Math.min(255, Math.round(v + d))));
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
/** 곱하기 그림자: 칸 색에 f(0..1)를 곱한다. */
const darken = (x, y, f) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const c = get(room, x, y);
  set(room, x, y, [c[0] * f, c[1] * f, c[2] * f].map(Math.round));
};
const lighten = (x, y, d) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  set(room, x, y, shift(get(room, x, y), d));
};

/** 물건 그림: 투명 둘레를 자르고, 반투명은 반을 기준으로 켜거나 끈다 (안쪽 반투명 금지 규칙). */
function sprite(name) {
  const im = decodePng(readFileSync(join(OBJ, `${name}.png`)));
  let x0 = im.width, y0 = im.height, x1 = -1, y1 = -1;
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++)
      if (im.pixels[(y * im.width + x) * 4 + 3] >= 128) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  const out = blank(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const [r, g, b, a] = get(im, x, y);
      if (a >= 128) set(out, x - x0, y - y0, [r, g, b]);
    }
  return out;
}
/** 그림을 아래 가운데(발) 기준으로 올린다. */
function place(im, cx, bottom, target = room) {
  const x0 = Math.round(cx - im.width / 2), y0 = bottom - im.height + 1;
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++) {
      const [r, g, b, a] = get(im, x, y);
      if (a) set(target, x0 + x, y0 + y, [r, g, b]);
    }
  return { left: x0, top: y0, right: x0 + im.width, bottom: bottom + 1 };
}
/** 바닥에 닿는 물건 밑 납작한 타원 그림자. */
function floorShadow(cx, cy, rx, ry, f = 0.78) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) darken(x, y, d < 0.45 ? f : (1 + f) / 2);
    }
}

// ---- 색 ----
const C = {
  ceiling: hex("#4d5a43"),
  crown: hex("#e9dcc0"),
  crownShade: hex("#b8a888"),
  wall: hex("#9fae88"),
  wallDark: hex("#8d9c77"),
  rail: hex("#ece0c4"),
  railLight: hex("#f7efdc"),
  railShade: hex("#b5a586"),
  panelFrame: hex("#8b5a36"),
  panel: hex("#a8714a"),
  panelLight: hex("#c08757"),
  panelShade: hex("#7a4c2d"),
  base: hex("#5f3b23"),
  baseLight: hex("#7a4e30"),
  planks: ["#c69160", "#c18c5b", "#c99564", "#be895a", "#c48f5e"].map(hex),
  seam: hex("#a26f46"),
  frame: hex("#f2ead6"),
  frameLight: hex("#fbf6ea"),
  frameShade: hex("#cfc2a4"),
  frameLine: hex("#6e5c47"),
  skyTop: hex("#8fcbe6"),
  skyLow: hex("#e2f3ef"),
  cloud: hex("#fbfdfb"),
  cloudShade: hex("#dcebee"),
  far: hex("#b7c9cf"),
  farDark: hex("#a3b7bf"),
  leaves: ["#5a8044", "#6f9a52", "#87b061", "#a3c873"].map(hex),
  trunk: hex("#6b5440"),
  oak: hex("#d6a873"),
  oakGrain: hex("#c69564"),
  oakEdge: hex("#e7bd8a"),
  oakBack: hex("#b7864f"),
  apron: hex("#a8713f"),
  apronLight: hex("#bd8550"),
  apronShade: hex("#875a32"),
  woodLine: hex("#5e3b24"),
  chair: hex("#7a4e30"),
  chairLight: hex("#9a6a42"),
  chairLine: hex("#4a2e1c"),
  plaque: hex("#f3e7cc"),
  plaqueShade: hex("#d9c7a2"),
  plaqueLine: hex("#6b4a2e"),
  rope: hex("#3f3328"),
  clockRim: hex("#5a3a24"),
  clockRimLight: hex("#7d5436"),
  clockFace: hex("#f6efdd"),
  tick: hex("#3a2f22"),
  rug: hex("#eadbbd"),
  rugBorder: hex("#b5684a"),
  rugDot: hex("#c98f5c"),
  mat: hex("#b8935a"),
  matBorder: hex("#7d5a32"),
  matPanel: hex("#d9be8a"),
};

// ---- 벽 ----
const WINDOWS = [244, 370, 496].map((x) => ({ x, y: 10, w: 96, h: 56 }));
function drawWall() {
  for (let y = 0; y < FLOOR; y++)
    for (let x = 0; x < W; x++) {
      let c;
      if (y < 3) c = C.ceiling;
      else if (y < 6) c = y === 5 ? C.crownShade : C.crown;
      else if (y < 66) {
        c = mix(C.wall, C.wallDark, Math.min(1, (y - 6) / 70));
        if (noise(x, y, 1) < 0.06) c = shift(c, -6);
        if (y < 9) c = shift(c, -10); // 몰딩 밑 그늘
      } else if (y < 70) c = y === 66 ? C.railLight : y === 69 ? C.railShade : C.rail;
      else if (y < 103) {
        // 판벽: 48칸마다 판 하나, 판 테두리 4칸
        const px = (x + 6) % 48;
        const frameX = px < 4, frameY = y < 73 || y > 99;
        if (frameX || frameY) c = y === 70 ? C.panelShade : C.panelFrame;
        else if (px === 4 || y === 73) c = C.panelShade;
        else if (px === 5 || y === 74) c = C.panelLight;
        else if (px === 47 || y === 99) c = C.panelLight;
        else c = noise(x >> 1, y, 2) < 0.08 ? shift(C.panel, -8) : C.panel;
      } else c = y === 103 ? C.baseLight : C.base;
      set(room, x, y, c);
    }
}

function drawWindow({ x, y, w, h }) {
  const gx0 = x + 4, gy0 = y + 4, gx1 = x + w - 4, gy1 = y + h - 4;
  for (let yy = gy0; yy < gy1; yy++)
    for (let xx = gx0; xx < gx1; xx++) {
      const t = (yy - gy0) / (gy1 - gy0);
      let c = mix(C.skyTop, C.skyLow, Math.min(1, t * 1.3));
      // 먼 건물
      const bh = 14 + Math.floor(noise(xx >> 3, 0, 7) * 10);
      if (yy > gy1 - bh - 8 && (xx >> 3) % 3 !== 1) c = noise(xx >> 3, yy >> 2, 8) < 0.15 ? C.farDark : C.far;
      // 구름
      const cl = Math.sin(xx / 9 + (yy - gy0) / 3) + Math.sin(xx / 4.3) * 0.4;
      if (yy < gy0 + 14 && cl > 1.05) c = yy < gy0 + 9 ? C.cloud : C.cloudShade;
      // 나무 (아래 3분의 1)
      const top = gy1 - 14 - Math.round(4 * Math.sin(xx / 6.5) + 3 * Math.sin(xx / 2.7 + 1));
      if (yy >= top) {
        const v = noise(xx >> 1, yy >> 1, 9);
        c = C.leaves[yy < top + 2 ? 3 : v < 0.3 ? 0 : v < 0.7 ? 1 : 2];
        if (yy > gy1 - 4 && xx % 23 === 11) c = C.trunk;
      }
      set(room, xx, yy, c);
    }
  // 유리 반사 (사선 두 줄)
  for (let i = 0; i < 18; i++) {
    for (const off of [6, 9]) {
      const xx = gx0 + off + i, yy = gy0 + 16 - i;
      if (xx < gx1 && yy >= gy0) set(room, xx, yy, mix(get(room, xx, yy), [255, 255, 255], 0.45));
    }
  }
  // 틀: 바깥 테두리, 가운데 세로살, 가로살
  const frame = (x0, y0, x1, y1) => {
    for (let yy = y0; yy < y1; yy++)
      for (let xx = x0; xx < x1; xx++) {
        const c = yy === y0 || xx === x0 ? C.frameLight : yy === y1 - 1 || xx === x1 - 1 ? C.frameShade : C.frame;
        set(room, xx, yy, c);
      }
  };
  frame(x, y, x + w, y + 4);
  frame(x, y + h - 4, x + w, y + h);
  frame(x, y, x + 4, y + h);
  frame(x + w - 4, y, x + w, y + h);
  frame(x + w / 2 - 2, y, x + w / 2 + 1, y + h);
  frame(x, y + 20, x + w, y + 23);
  // 바깥 선
  for (let xx = x - 1; xx <= x + w; xx++) {
    set(room, xx, y - 1, C.frameLine);
    set(room, xx, y + h, C.frameLine);
  }
  for (let yy = y - 1; yy <= y + h; yy++) {
    set(room, x - 1, yy, C.frameLine);
    set(room, x + w, yy, C.frameLine);
  }
  // 창턱
  rect(room, x - 4, y + h, x + w + 4, y + h + 3, C.rail);
  for (let xx = x - 4; xx < x + w + 4; xx++) {
    set(room, xx, y + h + 3, C.railShade);
    set(room, xx, y + h, C.railLight);
  }
}

// ---- 바닥 ----
function drawFloor() {
  const ROW = 6;
  for (let y = FLOOR; y < H; y++) {
    const row = Math.floor((y - FLOOR) / ROW), inRow = (y - FLOOR) % ROW;
    for (let x = 0; x < W; x++) {
      const offset = Math.floor(noise(row, 0, 3) * 60);
      const len = 52;
      const plank = Math.floor((x + offset) / len);
      const atSeam = (x + offset) % len === 0;
      let c = C.planks[Math.floor(noise(plank, row, 4) * C.planks.length)];
      if (inRow === 0) c = shift(c, 7);
      if (inRow === ROW - 1 || atSeam) c = C.seam;
      else if (noise(x >> 2, y, 5) < 0.05) c = shift(c, -10);
      set(room, x, y, c);
    }
  }
  // 벽 밑 그늘
  for (let y = FLOOR; y < FLOOR + 8; y++) for (let x = 0; x < W; x++) darken(x, y, 0.72 + (y - FLOOR) * 0.035);
  // 창으로 드는 햇빛 (창 아래 바닥, 오른쪽 아래로 기운다)
  for (const win of WINDOWS)
    for (let y = FLOOR + 2; y < FLOOR + 64; y++) {
      const s = Math.round((y - FLOOR) * 0.55);
      for (let x = win.x + 6 + s; x < win.x + win.w - 6 + s; x++) {
        const edge = x < win.x + 9 + s || x > win.x + win.w - 10 + s || y > FLOOR + 59;
        lighten(x, y, edge ? 8 : 16);
      }
    }
}

// ---- 탁자와 의자 (cafeLayout의 탁자 칸, 회사 책상과 같은 칸 구성) ----
function drawChair(tx, ty) {
  const cx = tx + TABLE_SEAT.x;
  // 등받이 위 가로대
  for (let x = cx - 19; x <= cx + 19; x++)
    for (let y = ty + 2; y < ty + 9; y++) {
      const edge = x === cx - 19 || x === cx + 19 || y === ty + 2 || y === ty + 8;
      set(room, x, y, edge ? C.chairLine : y === ty + 3 ? C.chairLight : C.chair);
    }
  // 기둥 둘과 살 셋
  for (const px of [cx - 18, cx + 16, cx - 7, cx, cx + 6])
    for (let y = ty + 9; y < ty + 30; y++) {
      const w = px === cx - 18 || px === cx + 16 ? 3 : 2;
      for (let i = 0; i < w; i++) set(room, px + i, y, i === 0 ? C.chairLine : i === w - 1 && w === 3 ? C.chairLine : C.chairLight);
    }
}
function drawTable(tx, ty) {
  const top = ty + TABLE_SEAT.topY, front = ty + 56, legs = ty + 76;
  floorShadow(tx + 56, ty + 84, 54, 4, 0.8);
  // 다리 넷
  for (const lx of [tx + 6, tx + 101])
    for (let y = front; y < ty + 84; y++) {
      set(room, lx, y, C.woodLine);
      set(room, lx + 1, y, C.apronShade);
      set(room, lx + 2, y, C.apronShade);
      set(room, lx + 3, y, C.woodLine);
    }
  // 윗면
  for (let y = top; y < front; y++)
    for (let x = tx + 2; x < tx + 110; x++) {
      let c = C.oak;
      if (y === top) c = C.woodLine;
      else if (y === top + 1) c = C.oakBack;
      else if (y >= front - 2) c = C.oakEdge;
      else if ((y - top) % 7 === 3 && noise(x >> 3, y, 6) < 0.55) c = C.oakGrain;
      if (x === tx + 2 || x === tx + 109) c = C.woodLine;
      set(room, x, y, c);
    }
  // 앞판 (번호 판과 앞면 소품 자리)
  for (let y = front; y < legs; y++)
    for (let x = tx + 3; x < tx + 109; x++) {
      let c = y === front ? C.woodLine : y === front + 1 ? C.apronLight : y === legs - 1 ? C.woodLine : C.apron;
      if (x === tx + 3 || x === tx + 108) c = C.woodLine;
      else if (y > front + 1 && y < legs - 1 && (x - tx) % 26 === 0) c = C.apronShade;
      set(room, x, y, c);
    }
  // 번호 판: 지름 12칸 원 (좌우 대칭), 번호 글자는 화면이 올린다
  const cx = tx + TABLE_SEAT.x, cy = ty + TABLE_SEAT.labelY;
  for (let y = -6; y <= 6; y++)
    for (let x = -6; x <= 5; x++) {
      const d = Math.hypot(x + 0.5, y);
      if (d <= 6.1) set(room, cx + x, cy + y, d > 5.1 ? C.plaqueLine : y > 2 ? C.plaqueShade : C.plaque);
    }
}

// ---- 카운터: 대리석 윗면과 칠한 나무 앞판 (그림 칸 8~200, 112~177, cafeLayout의 "카운터" 막힌 곳과 같다) ----
const K = {
  marble: hex("#eee8dd"),
  marbleShade: hex("#ddd5c8"),
  vein: hex("#c7bdae"),
  lip: hex("#d6cdbd"),
  lipShade: hex("#b9ae9c"),
  line: hex("#4a3b2c"),
  paint: hex("#5d7a68"),
  paintLight: hex("#759480"),
  paintShade: hex("#46604f"),
  paintDark: hex("#36493d"),
  kick: hex("#3b2a1d"),
  brass: hex("#c9a05a"),
};
function drawCounter() {
  const x0 = 8, x1 = 200, back = 112, lip = 130, front = 134, kick = 172, bottom = 178;
  floorShadow((x0 + x1) / 2, bottom, (x1 - x0) / 2, 4, 0.78);
  for (let y = back; y < bottom; y++)
    for (let x = x0; x < x1; x++) {
      let c;
      const side = x === x0 || x === x1 - 1;
      if (y === back || side) c = K.line;
      else if (y < lip) {
        // 윗면: 뒤쪽은 조금 어둡고, 사선 결이 드문드문
        c = y < back + 3 ? K.marbleShade : K.marble;
        const v = (x * 2 + y * 3) % 37;
        if ((v === 0 || v === 1) && noise(x >> 2, y >> 2, 11) < 0.6) c = K.vein;
      } else if (y < front) c = y === front - 1 ? K.lipShade : y === lip ? shift(K.marble, 6) : K.lip;
      else if (y === front) c = K.line;
      else if (y < kick) {
        // 앞판: 32칸마다 판 하나 (테두리, 밝은 위, 어두운 아래)
        const px = (x - x0 - 1) % 32, py = y - front - 1;
        const inset = px >= 4 && px <= 27 && py >= 4 && py <= kick - front - 6;
        if (!inset) c = py === 0 ? K.paintLight : K.paint;
        else if (px === 4 || py === 4) c = K.paintDark;
        else if (px === 27 || py === kick - front - 6) c = K.paintLight;
        else c = K.paintShade;
      } else if (y === kick) c = K.line;
      else c = y === kick + 1 ? shift(K.kick, 18) : K.kick;
      set(room, x, y, c);
    }
  // 윗면 앞 놋쇠 띠
  for (let x = x0 + 1; x < x1 - 1; x++) set(room, x, front + 2, x % 2 ? K.brass : shift(K.brass, -16));
}

// ---- 노트북: 앉은 사람 쪽을 보는 뚜껑 뒷면 (책상 세트의 모니터 칸 41×29, 소품 위에 화면이 다시 그린다) ----
function drawLaptop(w, h) {
  const im = blank(w, h);
  const L = { line: hex("#34363d"), top: hex("#f1f5f2"), left: hex("#e3eae5"), light: hex("#dbe3dd"), body: hex("#c8d2cb"), shade: hex("#a9b4ad") };
  const x0 = 5, x1 = 35, y0 = 5, y1 = 25;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const corner = (x === x0 || x === x1) && (y === y0 || y === y1);
      if (corner) continue;
      let c;
      if (x === x0 || x === x1 || y === y0 || y === y1) c = L.line;
      else if (y === y0 + 1) c = L.top;
      else if (x === x0 + 1) c = L.left;
      else if (x === x1 - 1 || y === y1 - 1) c = L.shade;
      else c = x - x0 + (y - y0) * 1.6 < 22 ? L.light : L.body;
      set(im, x, y, c);
    }
  // 받침 발
  for (const fx of [8, 29]) for (let i = 0; i < 4; i++) set(im, fx + i, y1 + 1, L.line);
  // 스티커: 하트, 동그라미, 잎
  const heart = [".X.X.", "XXXXX", ".XXX.", "..X.."];
  heart.forEach((row, dy) => [...row].forEach((ch, dx) => ch === "X" && set(im, 10 + dx, 17 + dy, dx === 0 || dy === 0 ? hex("#f2a7b4") : hex("#e07d90"))));
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) set(im, 27 + dx, 9 + dy, dx === 1 && dy === 1 ? hex("#f7d27f") : hex("#e9a849"));
  for (let dx = 0; dx < 4; dx++) { set(im, 23 + dx, 19, hex("#86b67f")); set(im, 23 + dx, 20, hex("#5f9160")); }
  return im;
}

// ---- 표지판, 벽시계, 러그, 매트 ----
function plaque(cx, cy, w, h, hang = false) {
  const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  if (hang)
    for (let y = 0; y < y0; y++) {
      set(room, x0 + 5, y, C.rope);
      set(room, x0 + w - 6, y, C.rope);
    }
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const edge = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1;
      const corner = (x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + h - 1);
      if (corner) continue;
      set(room, x, y, edge ? C.plaqueLine : y === y0 + h - 2 ? C.plaqueShade : y === y0 + 1 ? shift(C.plaque, 8) : C.plaque);
    }
}
function clockFace({ center: { x: cx, y: cy }, radius: r }) {
  for (let y = -r - 1; y <= r + 1; y++)
    for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      if (d > r + 0.5) continue;
      set(room, cx + x, cy + y, d > r - 0.6 ? C.woodLine : d > r - 2.2 ? (y < 0 ? C.clockRimLight : C.clockRim) : C.clockFace);
    }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6, long = i % 3 === 0;
    for (let t = r - 4; t <= r - 2.4; t += 0.5) {
      set(room, Math.round(cx + Math.sin(a) * t), Math.round(cy - Math.cos(a) * t), C.tick);
      if (!long) break;
    }
  }
  floorShadowWall(cx + 2, cy + r + 2, r - 2);
}
function floorShadowWall(cx, cy, rx) {
  for (let x = cx - rx; x <= cx + rx; x++) darken(x, cy, 0.85);
}
function rug(cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1) continue;
      const ring = d > 0.78 && d < 0.9;
      const dot = d < 0.62 && (x + y * 3) % 9 === 0 && y % 3 === 0;
      set(room, x, y, d > 0.93 ? C.rugBorder : ring ? C.rugBorder : dot ? C.rugDot : C.rug);
    }
}
function doormat(x0, y0, x1, y1) {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const border = x < x0 + 2 || x >= x1 - 2 || y < y0 + 2 || y >= y1 - 2;
      const panel = x >= x0 + 6 && x < x1 - 6 && y >= y0 + 4 && y < y1 - 3;
      let c = border ? C.matBorder : panel ? C.matPanel : (x + y) % 2 ? C.mat : shift(C.mat, -10);
      set(room, x, y, c);
    }
}

// ---- 조립 ----
drawWall();
for (const w of WINDOWS) drawWindow(w);
drawFloor();
const objects = {};
const put = (name, cx, bottom, shadow) => {
  const s = sprite(name);
  if (shadow) floorShadow(cx, bottom - 1, Math.round(s.width / 2) - 2, shadow);
  objects[name] = place(s, cx, bottom);
  return objects[name];
};

// 벽 물건: 카운터 쪽 선반과 칠판, 가운데 걸린 "카운터" 판, 창 사이 걸이 화분, 화장실 문과 판
const sign = (id) => cafeLayout.signs.find((s) => s.id === id);
const signAt = (id) => ({ x: Math.round(sign(id).x * W), y: Math.round(sign(id).y * H) });
put("shelf", 46, 58);
put("chalkboard", 166, 64);
clockFace(cafeLayout.wallClock);
plaque(signAt("counter").x, signAt("counter").y, 46, 14, true);
put("hangplant", 355, 55);
put("hangplant", 481, 55);
put("door", signAt("restroom").x, FLOOR - 1);
plaque(signAt("restroom").x, signAt("restroom").y, 42, 14);
// 펜던트 조명 (창가 탁자 열 위)
for (const t of CAFE_TABLES.slice(0, 3)) put("pendant", t.x + TABLE_SEAT.x, 44);

// 카운터와 위 소품
drawCounter();
put("espresso", 40, 124);
put("grinder", 98, 125);
put("pastry", 160, 127);

// 탁자 여섯 (뒷줄부터)
for (const t of CAFE_TABLES) drawChair(t.x, t.y);
for (const t of CAFE_TABLES) drawTable(t.x, t.y);

// 노트북 (회사 책상의 모니터 자리 41×29, 아래 가운데에 붙인다)
const box = cafeLayout.deskMonitor;
const laptop = drawLaptop(box.width, box.height);
for (const t of CAFE_TABLES) place(laptop, t.x + box.x + box.width / 2, t.y + box.y + box.height - 1);

// 소파 자리 (스탠드는 소파 뒤)
rug(CAFE_SOFA.seatX + 4, CAFE_SOFA.bottom + 6, 70, 16);
put("floorlamp", 14, CAFE_SOFA.bottom - 18, 3);
put("sofa", CAFE_SOFA.seatX, CAFE_SOFA.bottom, 4);
put("sidetable", 142, CAFE_SOFA.bottom, 3);
// 책장과 화분
put("bookshelf", 642, 250, 4);
put("monstera", 24, 430, 4);
put("fig", 652, 428, 4);
// 출입구 매트: 가운데 밝은 판에 "나가기" 글자가 올라간다
const exit = signAt("exit");
doormat(exit.x - 36, exit.y - 11, exit.x + 36, exit.y + 10);

const out = encodePng(room);
mkdirSync("art-src/rooms", { recursive: true });
mkdirSync("public/assets/rooms", { recursive: true });
writeFileSync("art-src/rooms/cafe-room.png", out);
writeFileSync("public/assets/rooms/cafe-room.png", out);
writeFileSync("art-src/rooms/cafe/cafe-laptop.png", encodePng(laptop));
writeFileSync("public/assets/rooms/cafe-laptop.png", encodePng(laptop));
console.log("물건 자리 (그림 칸):");
for (const [name, b] of Object.entries(objects)) console.log(`  ${name}: x ${b.left}..${b.right}, y ${b.top}..${b.bottom}`);

if (process.argv.includes("--debug")) {
  const { isWalkable } = await import("../../src/study/navigation.js");
  const dbg = { width: W, height: H, pixels: room.pixels.slice() };
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const ok = isWalkable(cafeLayout, { x: x / W, y: y / H });
      const k = (y * W + x) * 4;
      const tint = ok ? [80, 220, 120] : [230, 70, 70];
      for (let q = 0; q < 3; q++) dbg.pixels[k + q] = Math.round(dbg.pixels[k + q] * 0.4 + tint[q] * 0.6);
    }
  for (const [, p] of Object.entries(cafeLayout.nodes)) {
    const x = Math.round(p.x * W), y = Math.round(p.y * H);
    for (let d = -2; d <= 2; d++) {
      set(dbg, x + d, y, [30, 60, 255]);
      set(dbg, x, y + d, [30, 60, 255]);
    }
  }
  mkdirSync("art-src/rooms/cafe", { recursive: true });
  writeFileSync("art-src/rooms/cafe/preview-debug.png", encodePng(dbg));
}
