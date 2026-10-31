// 손으로 찍는 도트 소품의 공통 도구 (로비 물건, 집 타일). 정수 픽셀만 다루고, 투명은 0, 불투명은 255만 쓴다.
// 쓰는 곳: tools/art/lobby-props.mjs, tools/art/home-props.mjs
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32 } from "node:zlib";
import { encodePng } from "./pixelArt.mjs";

/** "#rrggbb" → [r,g,b,255]. */
export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

/** 투명한 캔버스와 정수 픽셀 그리기 루틴. 색 자리에 null을 주면 그 칸을 투명으로 비운다. */
export function canvas(width, height) {
  const pixels = new Uint8Array(width * height * 4);
  const px = (x, y, c) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (c === null) pixels.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 4);
    else pixels.set(c, (y * width + x) * 4);
  };
  const rect = (x, y, w, h, c) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
  };
  return { width, height, pixels, px, rect };
}

/**
 * 9조각 판. 바깥 1px 외곽선, 위쪽 밝은 띠, 아래쪽 어두운 띠, 안쪽 테두리(lip)를 차례로 칠한다.
 * corner: 모서리 계단 수 (0이면 각진 모서리). 계단 칸은 투명으로 비운다.
 */
export function panel({ size = 48, outline, face, light, shade, lip, lipWidth = 2, band = 16, corner = 1 }) {
  const c = canvas(size, size);
  c.rect(0, 0, size, size, outline);
  c.rect(1, 1, size - 2, size - 2, face);
  c.rect(1, 1, size - 2, 2, light); // 윗변 빛
  c.rect(1, 3, 2, size - 6, light); // 왼변 빛 (위에서 비스듬히)
  c.rect(1, size - 3, size - 2, 2, shade); // 아랫변 그늘
  c.rect(size - 3, 3, 2, size - 6, shade); // 오른변 그늘
  if (lip) {
    // 9조각 안쪽 경계(band) 바로 안쪽에 내용 칸을 감싸는 홈
    c.rect(band - lipWidth, band - lipWidth, size - 2 * (band - lipWidth), lipWidth, lip);
    c.rect(band - lipWidth, size - band, size - 2 * (band - lipWidth), lipWidth, light);
    c.rect(band - lipWidth, band - lipWidth, lipWidth, size - 2 * (band - lipWidth), lip);
    c.rect(size - band, band - lipWidth, lipWidth, size - 2 * (band - lipWidth), light);
  }
  // 계단형 모서리: 바깥쪽 칸을 비우고 그 안쪽에 외곽선을 다시 긋는다
  for (let s = 0; s < corner; s++) {
    const steps = corner - s; // 위쪽 줄일수록 더 많이 비운다
    for (const [cx, cy, dx, dy] of [[0, 0, 1, 1], [size - 1, 0, -1, 1], [0, size - 1, 1, -1], [size - 1, size - 1, -1, -1]]) {
      for (let k = 0; k < steps; k++) c.px(cx + dx * k, cy + dy * s, null);
      c.px(cx + dx * steps, cy + dy * s, outline);
    }
  }
  return c;
}

/**
 * PNG 끝(IEND 앞)에 출처 tEXt 덩어리를 넣는다. 키워드는 Impeccable 출처 검사(embed-prompt --scan)가 읽는 "impeccable:prompt".
 * tEXt는 Latin-1만 받으므로 출처 문장은 영어로 적는다.
 */
export function withOrigin(png, text) {
  const data = Buffer.from(`impeccable:prompt\0${text}`, "latin1");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write("tEXt", 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  const iend = png.length - 12;
  return Buffer.concat([png.subarray(0, iend), chunk, png.subarray(iend)]);
}

/**
 * 소품을 원본 폴더에 쓰고 화면용 폴더에 같은 파일을 복사한 뒤, 8배 확인 시트를 원본 폴더에 남긴다.
 * @param props 이름 → 캔버스
 * @param origin 이름 → 출처 문장 (영어)
 * @param sheetOrigin 확인 시트의 출처 문장 (영어)
 */
export function writeProps({ out, publicDir, props, origin, sheetOrigin, sheetGround = "#2b201c" }) {
  mkdirSync(out, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  for (const [name, image] of Object.entries(props)) {
    const file = join(out, `${name}.png`);
    writeFileSync(file, withOrigin(encodePng(image), origin(name)));
    copyFileSync(file, join(publicDir, `${name}.png`));
  }
  // 확인용 시트: 각 그림을 8배로 키워 가로로 늘어놓는다 (검사 대상 아님, 이름이 preview로 시작).
  const SCALE = 8;
  const GAP = 8 * SCALE;
  const list = Object.values(props);
  const width = list.reduce((w, p) => w + p.width * SCALE + GAP, GAP);
  const height = Math.max(...list.map((p) => p.height)) * SCALE + 2 * GAP;
  const sheet = canvas(width, height);
  sheet.rect(0, 0, width, height, hex(sheetGround));
  let at = GAP;
  for (const p of list) {
    for (let y = 0; y < p.height; y++)
      for (let x = 0; x < p.width; x++) {
        const i = (y * p.width + x) * 4;
        if (p.pixels[i + 3] === 0) continue;
        sheet.rect(at + x * SCALE, GAP + y * SCALE, SCALE, SCALE, [...p.pixels.subarray(i, i + 4)]);
      }
    at += p.width * SCALE + GAP;
  }
  writeFileSync(join(out, "preview-sheet.png"), withOrigin(encodePng(sheet), sheetOrigin));
}
