// 사용법: node tools/art/company-decor.mjs
// 회사 방 휴게실 공용 꾸밈 아이템을 그린다 (꾸미기 슬롯 계획 2절, 2026-11-01 사용자 결정: 방장이 고른다).
// 자리와 크기는 src/study/companyFinalLayout.js의 decorSlots다. 기본 아이템(고양이 쿠션, 다육 화분과 고양이 인형, 고양이 매트)도
// 여기서 따로 만든 그림으로 그린다 (2026-11-02 사용자 결정: 원래 그림에서 떼지 않는다).
// - 러그: 그림의 러그는 가구 밑에 깔려 있어 비우지 않는다. 러그 상자 안에서 가구(탁자, 다리, 오토만, 소파, 화분)를 색으로 빼고
//   남은 러그 칸에만 새 러그를 칠한 덮개 그림을 쓴다 (러그 칸만 있다). 2026-11-02 사용자 결정으로 테마(카멜, 아이보리, 차콜,
//   페르시안) 러그를 팔고, 원래 그림자는 밝기 비율로 곱해 그대로 남긴다.
// - 쿠션, 매트: 모양을 직접 그리고 외곽선과 빛, 그늘을 자동으로 넣는다 (쿠션은 위왼쪽 빛).
// 결과: art-src/rooms/lounge/<아이템>.png, public/assets/rooms/lounge/<아이템>.png, art-src/rooms/lounge/preview-decor.png
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { companyFinalLayout as layout } from "../../src/study/companyFinalLayout.js";
import { decodePng, encodePng } from "./pixelArt.mjs";
import { hsv } from "./rigImage.mjs";

const room = decodePng(readFileSync("art-src/rooms/company-room.png"));
const box = (id) => layout.decorSlots.find((s) => s.id === id).box;
const blank = (w, h) => ({ width: w, height: h, pixels: new Uint8Array(w * h * 4) });
const at = (im, x, y) => im.pixels.subarray((y * im.width + x) * 4, (y * im.width + x) * 4 + 4);
const items = {};

// ---- 러그 ----
const RUG = box("rug");
const isRug = (p) => {
  const c = hsv(p[0], p[1], p[2]);
  if (c.v < 0.36) return false; // 외곽선, 다리, 소파
  if (c.h >= 45 && c.h <= 170 && c.s > 0.2) return false; // 화분
  if (c.h >= 180 && c.h <= 290) return false; // 오토만(윗면은 채도가 낮은 회보라), 소파. 러그는 파란 계열이 없다
  if (c.s >= 0.6 && c.h >= 10 && c.h <= 45) return false; // 탁자 윗면과 다리
  return true;
};
/** 칸 (x, y)의 가운데가 다각형 안이면 참 (꼭짓점은 칸 모서리 좌표). */
const inPoly = (poly, x, y) => {
  const px = x + 0.5, py = y + 0.5;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** 오토만 (윗면이 러그처럼 채도가 낮은 회보라라 색으로는 못 가른다). 방 그림 10배로 잰 윤곽, 다리 포함. */
const OTTOMAN = [[37, 174], [42, 170], [49, 166], [61, 166], [66, 170], [72, 174], [72, 192], [70, 195], [67, 195], [60, 197], [57, 200],
  [53, 200], [52, 197], [45, 195], [42, 197], [39, 197], [37, 193]];
const rugAt = (x, y) => isRug(at(room, RUG.x + x, RUG.y + y)) && !inPoly(OTTOMAN, RUG.x + x, RUG.y + y);
const hsvToRgb = (h, s, v) => {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((c) => Math.round(c * 255));
};
const lum = (p) => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
/** 그림 러그의 밝은 바탕 밝기 (그림자 비율의 기준): 러그 칸 밝기 위쪽 40%의 평균. */
const RUG_LIT = (() => {
  const list = [];
  for (let y = 0; y < RUG.height; y++) for (let x = 0; x < RUG.width; x++) {
    if (rugAt(x, y)) list.push(lum(at(room, RUG.x + x, RUG.y + y)));
  }
  list.sort((a, b) => b - a);
  const top = list.slice(0, Math.max(1, Math.floor(list.length * 0.4)));
  return top.reduce((a, b) => a + b, 0) / top.length;
})();
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** 러그 칸마다 paint(u, v, x, y)의 색에 원래 밝기 비율(그림자)을 곱한다. u는 왼→오, v는 뒤→앞 (0~1). */
const rugPaint = (paint) => {
  const im = blank(RUG.width, RUG.height);
  for (let y = 0; y < RUG.height; y++) for (let x = 0; x < RUG.width; x++) {
    if (!rugAt(x, y)) continue;
    const p = at(room, RUG.x + x, RUG.y + y);
    const shade = Math.min(1.06, lum(p) / RUG_LIT);
    const c = paint(x / (RUG.width - 1), y / (RUG.height - 1), x, y);
    at(im, x, y).set([...c.map((v) => Math.max(0, Math.min(255, Math.round(v * shade)))), 255]);
  }
  return im;
};
/** 러그 테두리 띠: 왼쪽, 오른쪽, 앞쪽 (뒤쪽은 소파 밑이다). */
const rim = (u, v, t) => u < t || u > 1 - t || v > 1 - t * 2.6;
const plainRug = (fill, line, edge) => rugPaint((u, v) => (rim(u, v, 0.012) ? hex(edge) : rim(u, v, 0.03) ? hex(line) : hex(fill)));
items["rug-camel"] = rugPaint((u, v) => (rim(u, v, 0.012) ? hex("#6e4a2c") : rim(u, v, 0.03) ? hex("#8f6239") : rim(u, v, 0.04) ? hex("#e2c9a0") : hex("#c08f5e")));
items["rug-ivory"] = plainRug("#f1ebdf", "#cfc8ba", "#a8a194");
items["rug-charcoal"] = rugPaint((u, v) => (rim(u, v, 0.012) ? hex("#26262b") : rim(u, v, 0.035) && !rim(u, v, 0.022) ? hex("#b2b2b6") : hex("#55555c")));
items["rug-persian"] = rugPaint((u, v, x, y) => {
  if (rim(u, v, 0.012)) return hex("#3a1418");
  if (rim(u, v, 0.04)) return (x + y) % 4 === 0 ? hex("#c9a25b") : hex("#2f3a5c");
  if (rim(u, v, 0.05)) return hex("#c9a25b");
  const du = Math.abs(u - 0.5) * 2, dv = Math.abs(v - 0.55) * 2;
  if (du * 1.6 + dv < 0.62) return du * 1.6 + dv < 0.3 ? hex("#2f3a5c") : hex("#c9a25b");
  if (Math.abs(du * 1.6 + dv - 0.9) < 0.06) return hex("#d8b46c");
  return (Math.floor(x / 4) + Math.floor(y / 3)) % 7 === 0 ? hex("#8f3a3a") : hex("#7a2b2f");
});
// 판매를 멈춘 파스텔 러그 (2026-11-02). 산 방장은 계속 쓰므로 같은 방식으로 그린다.
items["rug-pink"] = plainRug("#edc6cd", "#d9a7b0", "#b3808a");
items["rug-mint"] = plainRug("#cbe6da", "#a7d0bf", "#7fa898");
items["rug-sky"] = plainRug("#cde0ee", "#a7c6de", "#7d9cb7");

// ---- 모양 그리기 ----
// inside(u, v)는 모양 상자 안 위치(0~1)가 모양 안인지 정한다. 가장자리는 외곽선, 안쪽 위왼쪽 테두리는 빛, 아래오른쪽 테두리는 그늘.
// pattern(x, y)이 참인 안쪽 칸은 무늬색이다. shadow가 있으면 모양 아래오른쪽 한 칸에 소파 그림자를 깐다.
const stamp = (im, ox, oy, w, h, inside, pal, { pattern = () => false, shadow = null } = {}) => {
  const mask = (x, y) => x >= 0 && y >= 0 && x < w && y < h && inside((x + 0.5) / w, (y + 0.5) / h);
  const put = (x, y, c) => { if (ox + x >= 0 && oy + y >= 0 && ox + x < im.width && oy + y < im.height) at(im, ox + x, oy + y).set([...c, 255]); };
  if (shadow) for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) if (!mask(x, y) && mask(x - 1, y - 1)) put(x, y, shadow);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask(x, y)) continue;
    const edge = !mask(x - 1, y) || !mask(x + 1, y) || !mask(x, y - 1) || !mask(x, y + 1);
    const lit = !mask(x - 1, y - 1) || !mask(x, y - 2) || !mask(x - 2, y);
    const dim = !mask(x + 1, y + 1) || !mask(x, y + 2) || (pal.puffy && !mask(x, y + 3));
    // 볼록한 쿠션: 위왼쪽 사분면 가운데에 작은 빛 덩어리
    const glow = pal.puffy && Math.hypot((x + 0.5) / w - 0.36, (y + 0.5) / h - 0.34) < 0.12;
    put(x, y, edge ? pal.outline : pattern(x, y) ? pal.pattern : lit || glow ? pal.light : dim ? pal.shade : pal.fill);
  }
};
const heart = (u, v) => { const x = (u - 0.5) * 2.5, y = (0.45 - v) * 2.5; return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0; };
const star = (u, v) => {
  const x = u - 0.5, y = v - 0.53, a = Math.atan2(y, x) + Math.PI / 2, r = Math.hypot(x, y);
  const k = ((a % (2 * Math.PI / 5)) + 2 * Math.PI / 5) % (2 * Math.PI / 5) / (2 * Math.PI / 5);
  return r <= 0.5 * (0.5 + 0.5 * Math.abs(1 - 2 * k)) ** 1.15;
};
const roundSquare = (u, v) => { const x = Math.abs(u - 0.5) * 2, y = Math.abs(v - 0.5) * 2; return x ** 4 + y ** 4 <= 1; };
const SOFA_SHADOW = [26, 26, 38];

// ---- 소파 쿠션: 왼쪽 두 개와 오른쪽 작은 것, 큰 것 (기본 고양이 쿠션과 같은 자리) ----
const CUSHION = box("cushions");
const cushionSet = (shape, pal, pattern) => {
  const im = blank(CUSHION.width, CUSHION.height), opt = { shadow: SOFA_SHADOW, pattern };
  pal = { ...pal, puffy: true };
  stamp(im, 15, 1, 15, 15, shape, pal, opt);
  stamp(im, 0, 3, 17, 16, shape, pal, opt);
  stamp(im, 54, 5, 14, 14, shape, pal, opt);
  stamp(im, 62, 0, 28, 26, shape, pal, opt);
  return im;
};
items["cushions-heart"] = cushionSet(heart, { outline: [118, 46, 70], shade: [212, 106, 136], fill: [240, 146, 172], light: [255, 204, 214], pattern: [212, 106, 136] });
items["cushions-star"] = cushionSet(star, { outline: [126, 80, 28], shade: [220, 166, 58], fill: [246, 204, 92], light: [255, 236, 158], pattern: [220, 166, 58] });
items["cushions-check"] = cushionSet(
  roundSquare,
  { outline: [56, 80, 62], shade: [132, 160, 124], fill: [176, 202, 166], light: [214, 228, 202], pattern: [124, 152, 118] },
  (x, y) => x % 6 === 3 || y % 6 === 3,
);

// ---- 출입구 매트: 비운 자리의 밝은 깔개 위, 안쪽(상자 안 x 2~83, y 2~38)에 깐다 ----
const MAT = box("mat"), MAT_IN = { x: 2, y: 2, w: 82, h: 37 };
const matBase = (pal, pattern) => {
  const im = blank(MAT.width, MAT.height);
  const rounded = (u, v) => { const x = Math.abs(u - 0.5) * 2, y = Math.abs(v - 0.5) * 2; return x ** 12 + y ** 12 <= 1; };
  stamp(im, MAT_IN.x, MAT_IN.y, MAT_IN.w, MAT_IN.h, rounded, { ...pal, light: pal.fill, shade: pal.fill }, { pattern, shadow: pal.shadow });
  return im;
};
const MAT_SHADOW = [150, 96, 78];
items["mat-stripe"] = matBase(
  { outline: [70, 54, 74], fill: [236, 206, 170], pattern: [96, 112, 150], shadow: MAT_SHADOW },
  (x, y) => y > 2 && y < MAT_IN.h - 3 && Math.floor((y - 3) / 4) % 2 === 0,
);
const paws = (x, y) => {
  // 발바닥: 가운데 패드(4×3)와 발가락 셋. 엇갈린 줄로 놓는다.
  for (const [cx, cy] of [[14, 13], [41, 24], [68, 13]]) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx / 10 + dy * dy / 5 <= 1) return true;
    if ([[-4, -5], [0, -7], [4, -5]].some(([tx, ty]) => (dx - tx) ** 2 + (dy - ty) ** 2 <= 2)) return true;
  }
  return false;
};
items["mat-paw"] = matBase({ outline: [84, 56, 44], fill: [176, 124, 94], pattern: [246, 222, 192], shadow: MAT_SHADOW }, paws);
items["mat-heart"] = matBase(
  { outline: [118, 46, 70], fill: [238, 170, 178], pattern: [214, 92, 120], shadow: MAT_SHADOW },
  (x, y) => heart((x - 25) / 32, (y - 3) / 31) && x >= 25 && x < 57,
);

// ---- 탁자 위: PixelLab create_image_pixen(64×48, 시드 7) 시안을 탁자 위에 놓는다. 찻잔 세트는 시안에 붙어 나온 나무 탁자를
// edit_image_pixen(시드 5)으로 걷어 냈다 (art-src/rooms/lounge/src). 한두 칸짜리 떠 있는 조각은 지우고, 내용 상자로 잘라
// 바닥 가운데를 탁자 윗면 앞쪽(상자 안 x 32, y 54, 원래 잡지 아랫단 높이)에 맞춘다. 키 큰 꽃병은 원래 화분처럼 소파 앞으로 올라온다.
const TABLE = box("table");
const onTable = (file, bottom = 54) => {
  const src = decodePng(readFileSync(`art-src/rooms/lounge/src/${file}.png`));
  const keep = new Uint8Array(src.width * src.height), seen = new Uint8Array(src.width * src.height);
  for (let k = 0; k < keep.length; k++) {
    if (seen[k] || !src.pixels[k * 4 + 3]) continue;
    const stack = [k], comp = [];
    seen[k] = 1;
    while (stack.length) {
      const q = stack.pop(), qx = q % src.width, qy = Math.floor(q / src.width);
      comp.push(q);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = qx + dx, ny = qy + dy, n = ny * src.width + nx;
        if (nx >= 0 && ny >= 0 && nx < src.width && ny < src.height && !seen[n] && src.pixels[n * 4 + 3]) { seen[n] = 1; stack.push(n); }
      }
    }
    if (comp.length > 2) for (const q of comp) keep[q] = 1;
  }
  let x0 = src.width, x1 = -1, y0 = src.height, y1 = -1;
  for (let k = 0; k < keep.length; k++) if (keep[k]) { const x = k % src.width, y = Math.floor(k / src.width); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const im = blank(TABLE.width, TABLE.height), ox = 32 - Math.round((x0 + x1) / 2), oy = bottom - y1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * src.width + x, tx = ox + x, ty = oy + y;
    if (keep[k] && tx >= 0 && ty >= 0 && tx < im.width && ty < im.height) at(im, tx, ty).set([...src.pixels.subarray(k * 4, k * 4 + 3), 255]);
  }
  return im;
};
items["table-tea"] = onTable("gen-tea-notable", 54);
items["table-cake"] = onTable("gen-cake-small", 54);
items["table-flower"] = onTable("gen-flower", 53);

// ---- 기본 아이템 (2026-11-02 사용자 결정: 원래 그림에서 떼지 않고 따로 만든 그림을 올린다) ----
// 고양이 쿠션과 탁자 위 다육 화분, 고양이 인형은 내 방 물건과 같은 PixelLab 그림(art-src/home/room/objects/src)이다.
const OBJ = "art-src/home/room/objects/src";
const trimmed = (name, mirror = false) => {
  const im = decodePng(readFileSync(`${OBJ}/${name}.png`));
  let x0 = im.width, x1 = -1, y0 = im.height, y1 = -1;
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++)
    if (at(im, x, y)[3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const out = blank(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const p = at(im, mirror ? x1 - x : x0 + x, y0 + y);
    if (p[3]) at(out, x, y).set([p[0], p[1], p[2], 255]);
  }
  return out;
};
/** 그림 spr를 im의 왼쪽 x, 바닥 줄 bottom에 놓는다. */
const putSprite = (im, spr, x, bottom) => {
  for (let y = 0; y < spr.height; y++) for (let sx = 0; sx < spr.width; sx++) {
    const p = at(spr, sx, y), X = x + sx, Y = bottom - spr.height + 1 + y;
    if (p[3] && X >= 0 && Y >= 0 && X < im.width && Y < im.height) at(im, X, Y).set(p);
  }
  return im;
};
// 소파 쿠션: 왼쪽 두 개(작은 것이 바깥)와 오른쪽 두 개(큰 것이 바깥). 원래 고양이 쿠션 자리와 같은 높이.
{
  const pair = trimmed("cushions"), mirrored = trimmed("cushions", true);
  const im = blank(CUSHION.width, CUSHION.height);
  putSprite(im, mirrored, 0, 21);
  putSprite(im, pair, CUSHION.width - pair.width - 2, 27);
  items["cushions-cat"] = im;
}
// 탁자 위: 다육 화분과 고양이 인형 (다른 탁자 아이템처럼 탁자 윗면 앞쪽 54줄에 바닥을 둔다)
{
  const im = blank(TABLE.width, TABLE.height), plant = trimmed("succulent"), cat = trimmed("cat");
  putSprite(im, plant, 20 - Math.round(plant.width / 2), 53);
  putSprite(im, cat, 42 - Math.round(cat.width / 2), 54);
  items["table-cat"] = im;
}
// 출입구 매트: 다른 매트와 같은 틀에 고양이 얼굴 무늬 (얼굴 테, 귀, 눈, 코)
{
  const cx = 41, cy = 20;
  const catFace = (x, y) => {
    const d = Math.hypot((x - cx) / 13, (y - cy) / 9);
    if (Math.abs(d - 1) < 0.11) return true;
    const ear = (ex, dir) => y >= cy - 15 && y <= cy - 7 && Math.abs(x - ex) <= (y - (cy - 15)) * 0.5 && (dir < 0 ? x <= ex + 1 : x >= ex - 1);
    if (ear(cx - 8, -1) || ear(cx + 8, 1)) return !(y > cy - 9 && Math.abs(x - cx) < 6);
    if ((y === cy - 1 || y === cy) && (x === cx - 5 || x === cx + 5)) return true;
    if (y === cy + 2 && Math.abs(x - cx) <= 1) return true;
    if ((y === cy + 1 || y === cy + 3) && (Math.abs(x - cx) >= 15 && Math.abs(x - cx) <= 19)) return true;
    return false;
  };
  items["mat-cat"] = matBase({ outline: [84, 56, 44], fill: [176, 128, 96], pattern: [240, 214, 178], shadow: MAT_SHADOW }, catFace);
}

mkdirSync("art-src/rooms/lounge", { recursive: true });
mkdirSync("public/assets/rooms/lounge", { recursive: true });
for (const [name, im] of Object.entries(items)) {
  writeFileSync(`art-src/rooms/lounge/${name}.png`, encodePng(im));
  writeFileSync(`public/assets/rooms/lounge/${name}.png`, encodePng(im));
}

// 미리보기: 휴게실(위 네 줄)과 매트 자리(아래 네 줄)에 아이템을 얹은 그림을 2배로 세로로 붙인다.
const S = 2, G = 4, LOUNGE_VIEW = { x: 20, y: 110, width: 190, height: 105 }, MAT_VIEW = { x: 375, y: 350, width: 135, height: 70 };
const scene = (list) => {
  const out = { ...room, pixels: room.pixels.slice() };
  for (const [id, im] of list) {
    const b = box(id);
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) { const p = at(im, x, y); if (p[3]) at(out, b.x + x, b.y + y).set(p); }
  }
  return out;
};
const def = (name) => decodePng(readFileSync(`art-src/rooms/lounge/${name}.png`));
const rows = [
  [LOUNGE_VIEW, [["cushions", def("cushions-cat")], ["table", def("table-cat")]]],
  [LOUNGE_VIEW, [["rug", items["rug-camel"]], ["cushions", items["cushions-heart"]]]],
  [LOUNGE_VIEW, [["rug", items["rug-ivory"]], ["cushions", items["cushions-star"]]]],
  [LOUNGE_VIEW, [["rug", items["rug-charcoal"]], ["cushions", items["cushions-check"]]]],
  [LOUNGE_VIEW, [["rug", items["rug-persian"]], ["cushions", def("cushions-cat")], ["table", def("table-cat")]]],
  [LOUNGE_VIEW, [["cushions", def("cushions-cat")], ["table", items["table-tea"]]]],
  [LOUNGE_VIEW, [["cushions", def("cushions-cat")], ["table", items["table-cake"]]]],
  [LOUNGE_VIEW, [["cushions", def("cushions-cat")], ["table", items["table-flower"]]]],
  [MAT_VIEW, [["mat", def("mat-cat")]]],
  [MAT_VIEW, [["mat", items["mat-stripe"]]]],
  [MAT_VIEW, [["mat", items["mat-paw"]]]],
  [MAT_VIEW, [["mat", items["mat-heart"]]]],
];
const sheet = blank(LOUNGE_VIEW.width * S + G * 2, rows.reduce((h, [v]) => h + v.height * S + G, G));
let top = G;
for (const [view, list] of rows) {
  const sc = scene(list);
  for (let y = 0; y < view.height * S; y++) for (let x = 0; x < view.width * S; x++)
    at(sheet, G + x, top + y).set(at(sc, view.x + Math.floor(x / S), view.y + Math.floor(y / S)));
  top += view.height * S + G;
}
writeFileSync("art-src/rooms/lounge/preview-decor.png", encodePng(sheet));
console.log(`휴게실 아이템 ${Object.keys(items).length}개`);
