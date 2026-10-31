// 사용법: node tools/art/home-room.mjs
// 로비 "내 방"(256×152, 화면 3배)을 갈아 끼울 수 있는 부품으로 나눈다 (2026-10-31 사용자 결정: 6번 시안 구성, 캐릭터 3배).
// 원재료: art-src/home/room/src/
//   generated.png  가구가 다 있는 방. PixelLab pixflux(시드 61)로 6번 시안(draft-cozy-6.png)을 줄인 그림을 출발점 삼아 256×152로 새로 그렸다.
//   empty.png      같은 방에서 가구를 모두 걷어 낸 빈 방. PixelLab edit_image(시드 5). 벽, 옆벽, 몰딩, 걸레받이, 마루, 창문이 남는다.
//   parts.json     부품별 영역. 앞에 있는 부품부터 빈 방과 색이 다른 칸을 떼어 낸다.
// 결과: art-src/home/room/<부품>.png와 room-base.png(빈 방), 같은 파일을 public/assets/home/room/에,
//   그리는 순서와 자리는 src/features/lobby/model/homeRoomLayers.ts에, 확인용 3배 그림은 art-src/home/room/preview-room.png에.
// 가려진 자리(이불 밑 매트리스, 화분 뒤 책상, 의자 밑 러그)는 아직 비어 있다. 다른 아이템으로 갈아 끼우기 전에 채운다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./pixelArt.mjs";

const SRC = "art-src/home/room/src";
const OUT = "art-src/home/room";
const PUBLIC = "public/assets/home/room";
const LAYOUT = "src/features/lobby/model/homeRoomLayers.ts";
/** 빈 방과 이만큼 넘게 다른 칸을 부품으로 본다 (RGB 거리). */
const DIFF = 22;
/** 화면 배율. 캐릭터 56×72도 같은 배율로 그린다. */
const SCALE = 3;
/** 뒤에서 앞으로 그리는 순서. 캐릭터는 이 모두의 앞이다. */
const DRAW_ORDER = [
  "rug", "frames-right", "frames-left", "wall-shelves", "curtains", "desk", "desk-paper", "desk-lamp",
  "nightstand-left", "nightstand-jar", "nightstand-plant", "bed", "bed-cat", "bed-blanket", "nightstand-right", "lamp-right",
  "armchair", "floor-plant",
];

const room = decodePng(readFileSync(join(SRC, "generated.png")));
const empty = decodePng(readFileSync(join(SRC, "empty.png")));
const { parts } = JSON.parse(readFileSync(join(SRC, "parts.json"), "utf8"));
const W = room.width, H = room.height;

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx / 255 };
};
const colorAt = (im, k) => hsv(im.pixels[k * 4], im.pixels[k * 4 + 1], im.pixels[k * 4 + 2]);
const differs = (k) => Math.hypot(...[0, 1, 2].map((q) => room.pixels[k * 4 + q] - empty.pixels[k * 4 + q])) > DIFF;
const neighbors4 = (k) => [k - 1, k + 1, k - W, k + W].filter((n) => n >= 0 && n < W * H && Math.abs((n % W) - (k % W)) <= 1);

/** 부품 하나를 떼어 낸다. taken은 앞 부품이 이미 가져간 칸이다. */
function extract(part, taken) {
  const inside = new Uint8Array(W * H);
  for (const [x0, y0, x1, y1] of part.rects) for (let y = y0; y < Math.min(y1, H); y++) for (let x = x0; x < Math.min(x1, W); x++) inside[y * W + x] = 1;
  const free = (k) => inside[k] && !taken[k];
  const mask = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) if (free(k) && differs(k)) mask[k] = 1;
  if (part.hue) {
    // 이불처럼 색으로 가르는 부품: 그 색상 범위와, 거기에 맞닿은 짙은 외곽선만 남긴다.
    const [h0, h1] = part.hue;
    const tone = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) if (free(k)) { const c = colorAt(room, k); if (c.h >= h0 && c.h <= h1 && c.s > 0.12) tone[k] = 1; }
    for (let k = 0; k < W * H; k++) {
      if (!mask[k] || tone[k]) continue;
      const nearTone = colorAt(room, k).v < 0.4 && [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1].some((d) => tone[k + d]);
      if (!nearTone) mask[k] = 0;
    }
    for (let k = 0; k < W * H; k++) if (tone[k]) mask[k] = 1;
  } else {
    // 구멍 메우기: 영역 테두리에서 부품이 아닌 칸으로 닿지 않는 칸은 부품 안쪽이다 (벽과 색이 비슷한 의자 크림색 등).
    const reach = new Uint8Array(W * H), stack = [];
    for (let k = 0; k < W * H; k++) {
      if (!free(k) || mask[k]) continue;
      const x = k % W, y = (k / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || !inside[k - 1] || !inside[k + 1] || !inside[k - W] || !inside[k + W]) { reach[k] = 1; stack.push(k); }
    }
    while (stack.length) for (const n of neighbors4(stack.pop())) if (free(n) && !mask[n] && !reach[n]) { reach[n] = 1; stack.push(n); }
    for (let k = 0; k < W * H; k++) if (free(k) && !reach[k]) mask[k] = 1;
  }
  // 이웃 없는 외톨이 칸(빈 방과 조금 어긋난 마루 줄 등)은 버린다.
  for (let k = 0; k < W * H; k++) if (mask[k] && !neighbors4(k).some((n) => mask[n])) mask[k] = 0;
  const image = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
  for (let k = 0; k < W * H; k++) if (mask[k]) { image.pixels.set(room.pixels.subarray(k * 4, k * 4 + 3), k * 4); image.pixels[k * 4 + 3] = 255; taken[k] = 1; }
  return image;
}

const taken = new Uint8Array(W * H);
const layers = Object.fromEntries(parts.map((p) => [p.id, extract(p, taken)]));

// 손 보정 1: 베개 무늬(빨강, 분홍, 노랑, 주황, 파랑회색, 보라회색)를 베개 바탕 크림색으로 (사용자 요청). 가장자리 그늘과 외곽선은 둔다.
{
  const bed = layers.bed, CREAM = [224, 205, 166, 255];
  const PATTERN = new Set(["201,106,99", "184,140,124", "247,213,136", "210,157,98", "137,145,143", "118,111,131", "246,235,199", "215,196,166", "199,162,139", "196,177,152", "111,110,85"]);
  for (let y = 80; y <= 89; y++) for (const [x0, x1] of [[179, 196], [201, 215]]) for (let x = x0; x <= x1; x++) {
    const i = (y * W + x) * 4;
    if (bed.pixels[i + 3] && PATTERN.has(`${bed.pixels[i]},${bed.pixels[i + 1]},${bed.pixels[i + 2]}`)) bed.pixels.set(CREAM, i);
  }
}
// 손 보정 2: 이불 위 흰 덩어리 고양이는 빼고, 그 자리를 둘레에서 가장 많이 쓴 이불 색으로 고르게 채운다.
{
  const blanket = layers["bed-blanket"], box = { x0: 183, x1: 206, y0: 92, y1: 111 };
  const filled = (x, y) => blanket.pixels[(y * W + x) * 4 + 3] > 0;
  const count = new Map();
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    if (!filled(x, y) || ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !filled(x + dx, y + dy))) continue;
    const key = Array.from(blanket.pixels.subarray((y * W + x) * 4, (y * W + x) * 4 + 4)).join(",");
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const fill = [...count].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    if (filled(x, y)) continue;
    let left = false, right = false;
    for (let xx = x - 1; xx >= 160 && !left; xx--) left = filled(xx, y);
    for (let xx = x + 1; xx < 240 && !right; xx++) right = filled(xx, y);
    if (left && right) blanket.pixels.set(fill, (y * W + x) * 4);
  }
}
// 손 보정 3: 베개 사이에서 이불 밖으로 얼굴을 내민 고양이 (15×9, 6번 시안처럼). 아래 줄은 이불이 덮는다.
{
  const cat = { width: W, height: H, pixels: new Uint8Array(W * H * 4) };
  const C = { o: [92, 58, 46], P: [236, 170, 160], O: [226, 152, 88], F: [250, 238, 216], S: [232, 214, 190], e: [92, 58, 46], n: [222, 128, 128], c: [244, 184, 172] };
  const art = [
    ".o...........o.",
    "oPo.........oPo",
    "oOOoooooooooFFo",
    "oOOOFFFFFFFFFFo",
    "oOOFFFFFFFFFFSo",
    "oFFeeFFFFFeeFSo",
    "ocFFFFFnFFFFcSo",
    "oFFFFFFFFFFFFSo",
    "oFFFFFFFFFFFFSo",
  ];
  art.forEach((row, dy) => [...row].forEach((ch, dx) => { if (C[ch]) cat.pixels.set([...C[ch], 255], ((79 + dy) * W + 191 + dx) * 4); }));
  layers["bed-cat"] = cat;
}

/** 불투명 칸을 감싸는 상자로 자른다. */
function crop(image) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (image.pixels[(y * W + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = { width: w, height: h, pixels: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) out.pixels.set(image.pixels.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x1 + 1) * 4), y * w * 4);
  return { x: x0, y: y0, image: out };
}

mkdirSync(PUBLIC, { recursive: true });
const write = (name, image) => {
  const png = encodePng(image);
  writeFileSync(join(OUT, `${name}.png`), png);
  writeFileSync(join(PUBLIC, `${name}.png`), png);
};
write("room-base", empty);
const names = Object.fromEntries(parts.map((p) => [p.id, p.name]));
const placed = DRAW_ORDER.map((id) => {
  const { x, y, image } = crop(layers[id]);
  write(id, image);
  return { id, name: names[id], x, y, width: image.width, height: image.height, src: `/assets/home/room/${id}.png` };
});
const layoutData = { size: { width: W, height: H }, scale: SCALE, base: "/assets/home/room/room-base.png", layers: placed };
writeFileSync(LAYOUT, [
  "// tools/art/home-room.mjs가 만든 파일이다. 손으로 고치지 말고 도구를 다시 돌린다.",
  "/**",
  ' * 로비 "내 방" 그림 (256×152, 화면 배율 scale). 빈 방(base) 위에 부품(layers)을 배열 순서대로 얹는다.',
  " * 부품 자리 x, y와 크기는 1배 도트 px이고, 부품마다 나중에 다른 아이템으로 갈아 끼우는 자리다.",
  " */",
  `export const HOME_ROOM = ${JSON.stringify(layoutData, null, 2)} as const;`,
  "",
].join("\n"));

// 확인용: 빈 방에 부품을 순서대로 얹고 3배로 키운 그림
{
  const comp = { width: W, height: H, pixels: empty.pixels.slice() };
  for (const p of placed) {
    const im = decodePng(readFileSync(join(OUT, `${p.id}.png`)));
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
      const i = (y * im.width + x) * 4;
      if (im.pixels[i + 3]) comp.pixels.set(im.pixels.subarray(i, i + 4), ((p.y + y) * W + p.x + x) * 4);
    }
  }
  const big = { width: W * SCALE, height: H * SCALE, pixels: new Uint8Array(W * H * SCALE * SCALE * 4) };
  for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) {
    const i = (Math.floor(y / SCALE) * W + Math.floor(x / SCALE)) * 4;
    big.pixels.set(comp.pixels.subarray(i, i + 4), (y * big.width + x) * 4);
  }
  writeFileSync(join(OUT, "preview-room.png"), encodePng(big));
}
console.log(`부품 ${placed.length}개: ${placed.map((p) => p.id).join(", ")}`);
