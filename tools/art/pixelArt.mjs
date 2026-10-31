// 도트 스프라이트 규칙 검사 (Story 009, AGENTS.md). 의존성 없이 Node 기본 zlib만 쓴다.
// 규칙: 정해진 크기, 반투명 픽셀은 실루엣 가장자리에만, 발 기준점 고정. 색 수 제한은 없다.
import { inflateSync, deflateSync } from "node:zlib";

/** 캐릭터 레이어 시트: 56×72 프레임 23칸을 가로로 이은 한 장. */
export const FRAME = { width: 56, height: 72, count: 23 };
export const SHEET = { width: FRAME.width * FRAME.count, height: FRAME.height };
/** 방 원본 크기. */
export const ROOM = { width: 672, height: 432 };
/** 서기와 걷기 프레임(1~20칸)은 발바닥 줄이 같아야 한다. 가로 가운데는 서기(1~4칸)만 본다
 *  (걷기는 발이 앞뒤로 움직인다). 허용 오차(픽셀). */
export const FOOT_FRAMES = 20;
export const STAND_FRAMES = 4;
export const FOOT_TOLERANCE = 1;

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * PNG를 RGBA 픽셀로 읽는다. 8비트, 비인터레이스, 색 형식 2(RGB), 3(팔레트), 6(RGBA)만 지원한다.
 * @returns {{width:number,height:number,pixels:Uint8Array}} pixels는 RGBA 순서
 */
export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("PNG 파일이 아니에요");
  let width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  let plte = null, trns = null;
  const idat = [];
  for (let at = 8; at < buffer.length; ) {
    const length = buffer.readUInt32BE(at);
    const kind = buffer.toString("latin1", at + 4, at + 8);
    const data = buffer.subarray(at + 8, at + 8 + length);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      interlace = data[12];
    } else if (kind === "PLTE") plte = data;
    else if (kind === "tRNS") trns = data;
    else if (kind === "IDAT") idat.push(data);
    else if (kind === "IEND") break;
    at += 12 + length;
  }
  if (depth !== 8 || interlace !== 0 || ![2, 3, 6].includes(type))
    throw new Error(`지원하지 않는 PNG 형식 (비트 ${depth}, 색 형식 ${type}, 인터레이스 ${interlace})`);
  const channels = { 2: 3, 3: 1, 6: 4 }[type];
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? rows[y * stride + x - channels] : 0;
      const b = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? rows[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      rows[y * stride + x] = (line[x] + predictor) & 255;
    }
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (type === 3) {
      const index = rows[i];
      pixels.set([plte[index * 3], plte[index * 3 + 1], plte[index * 3 + 2], trns && index < trns.length ? trns[index] : 255], i * 4);
    } else {
      pixels.set([rows[i * channels], rows[i * channels + 1], rows[i * channels + 2], type === 6 ? rows[i * 4 + 3] : 255], i * 4);
    }
  }
  return { width, height, pixels };
}

/** RGBA 픽셀을 PNG로 쓴다 (테스트 고정 데이터와 도구 출력용). */
export function encodePng({ width, height, pixels }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  const chunk = (kind, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(kind, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([SIGNATURE, chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** 상하좌우 이웃 중 완전 투명 픽셀이 있거나 그림 밖이면 실루엣 가장자리다. */
function isEdge(image, x, y) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= image.width || ny >= image.height) return true;
    return image.pixels[(ny * image.width + nx) * 4 + 3] === 0;
  });
}

/**
 * 그림 하나를 검사한다.
 * @param image decodePng 결과
 * @param size 기대 크기 {width,height}
 * @param checkFeet 발 기준점 검사 여부 (몸 레이어 시트)
 * @returns 규칙 위반 문구 목록 (비어 있으면 통과)
 */
export function checkImage(image, { size, checkFeet = false }) {
  const problems = [];
  if (image.width !== size.width || image.height !== size.height)
    problems.push(`크기 ${image.width}×${image.height}, 기대값 ${size.width}×${size.height}`);
  let inner = 0;
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3];
      if (alpha !== 0 && alpha !== 255 && !isEdge(image, x, y)) inner++;
    }
  if (inner) problems.push(`가장자리가 아닌 곳의 반투명 픽셀 ${inner}개`);
  if (checkFeet && !problems.length) problems.push(...checkFeetAnchor(image));
  return problems;
}

/** 서기와 걷기 프레임의 발바닥 줄, 서기 프레임의 발 가운데가 1번과 같은지 본다. */
function checkFeetAnchor(image) {
  const anchors = [];
  for (let frame = 0; frame < FOOT_FRAMES; frame++) {
    let bottom = -1, left = Infinity, right = -Infinity;
    for (let y = FRAME.height - 1; y >= 0 && bottom < 0; y--)
      for (let x = 0; x < FRAME.width; x++)
        if (image.pixels[(y * image.width + frame * FRAME.width + x) * 4 + 3] === 255) {
          bottom = y;
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    if (bottom >= 0) anchors.push({ frame: frame + 1, bottom, center: (left + right) / 2 });
  }
  if (!anchors.length) return [];
  const [first] = anchors;
  return anchors
    .filter((a) => Math.abs(a.bottom - first.bottom) > FOOT_TOLERANCE ||
      (a.frame <= STAND_FRAMES && Math.abs(a.center - first.center) > FOOT_TOLERANCE))
    .map((a) => `${a.frame}번 프레임 발 위치가 1번과 달라요 (아래 ${a.bottom}/${first.bottom}, 가운데 ${a.center}/${first.center})`);
}
