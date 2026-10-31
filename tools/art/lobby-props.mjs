// 사용법: node tools/art/lobby-props.mjs
// 로비 "내 자리" 물건의 도트 틀을 픽셀 단위로 직접 찍는다 (2026-10-30 로비 재설계).
// 이미지 생성, 자동 변환, 안티에일리어싱, 반투명 없이 정해 둔 색과 그리기 루틴만 쓴다.
// 결과: art-src/lobby/*.png (원본), public/assets/lobby/*.png (화면용 같은 파일), art-src/lobby/preview-sheet.png (8배 확인용).
// 틀은 48×48 9조각(모서리 16px)이고 화면에서는 1배로만 쓴다. 빛은 위에서 온다: 윗변은 밝게, 아랫변은 어둡게.
import { canvas, hex, panel, writeProps } from "./propKit.mjs";

const OUT = "art-src/lobby";
const PUBLIC = "public/assets/lobby";
const props = {};

// 모니터 베젤: 회사 방 모니터의 검은 플라스틱 (#2b2b31 계열). 각진 모서리, 화면 홈, 오른쪽 아래 전원 LED.
{
  const m = panel({ outline: hex("#0c0a0e"), face: hex("#2b2830"), light: hex("#433e4a"), shade: hex("#1a171e"), lip: hex("#0f1316"), corner: 0 });
  m.rect(40, 42, 3, 2, hex("#8fd18a"));
  m.px(40, 42, hex("#c9f2c2"));
  props["monitor-frame"] = m;
}
// 모니터 받침대 64×32: 목(가운데 16px)과 계단 끝 받침.
{
  const s = canvas(64, 32);
  const [o, f, l, d] = ["#0c0a0e", "#2b2830", "#433e4a", "#1a171e"].map(hex);
  s.rect(23, 0, 18, 20, o);
  s.rect(24, 0, 16, 19, f);
  s.rect(24, 0, 3, 19, l);
  s.rect(37, 0, 3, 19, d);
  s.rect(24, 0, 16, 2, d); // 베젤 아래로 들어가는 그늘
  s.rect(6, 20, 52, 9, o);
  s.rect(4, 22, 56, 7, o);
  s.rect(7, 21, 50, 7, f);
  s.rect(5, 23, 54, 5, f);
  s.rect(7, 21, 50, 2, l);
  s.rect(5, 26, 54, 2, d);
  props["monitor-stand"] = s;
}
// 메모지: 노란 종이, 오른쪽 아래 접힌 모서리.
{
  const paper = hex("#f6e39c");
  const m = panel({ outline: hex("#a8873a"), face: paper, light: hex("#fcf2c6"), shade: hex("#e0c66f"), corner: 0 });
  // 접힌 모서리: 오른쪽 아래 9×9 칸을 대각선으로 나눠, 바깥 반은 잘라 내고 안쪽 반은 뒤로 접힌 날개로 칠한다.
  const [edge, flap, flapEdge] = ["#a8873a", "#d9bb5e", "#c4a24a"].map(hex);
  for (let y = 39; y < 48; y++)
    for (let x = 39; x < 48; x++) {
      const s = x - 39 + (y - 39);
      if (s > 8) m.px(x, y, null);
      else if (s === 8) m.px(x, y, edge);
      else m.px(x, y, x === 39 || y === 39 ? flapEdge : flap);
    }
  props["memo-frame"] = m;
}
// 마스킹테이프 48×16: 반쯤 비치는 느낌은 반투명 대신 밝은 크림과 결 무늬로 낸다. 양 끝은 톱니.
{
  const t = canvas(48, 16);
  const [face, edge, fiber] = ["#e9dcc0", "#cbbd9c", "#f4ead3"].map(hex);
  t.rect(2, 3, 44, 10, face);
  t.rect(2, 3, 44, 1, fiber);
  t.rect(2, 12, 44, 1, edge);
  for (let y = 3; y < 13; y++) {
    const bite = y % 2 === 0 ? 0 : 1;
    t.px(2 + bite - 1, y, bite ? null : face);
    t.px(1 + bite, y, bite ? null : face);
    t.px(46 - bite, y, bite ? null : face);
  }
  for (const x of [9, 17, 26, 34, 41]) t.rect(x, 5, 1, 6, fiber);
  props["memo-tape"] = t;
}
// 코르크판 나무 틀: 회사 방 책상 나무 (#684113 계열). 결 무늬는 반복되도록 16px 주기.
{
  const [o, wood, light, dark, grain] = ["#140e0c", "#7b5232", "#a3713f", "#4f321d", "#69442a"].map(hex);
  const f = canvas(48, 48);
  f.rect(0, 0, 48, 48, o);
  f.rect(1, 1, 46, 46, wood);
  f.rect(1, 1, 46, 2, light);
  f.rect(1, 3, 2, 42, light);
  f.rect(1, 45, 46, 2, dark);
  f.rect(45, 3, 2, 42, dark);
  // 가로 결 (위아래 띠), 세로 결 (좌우 띠): 16px마다 같은 무늬
  for (let x = 4; x < 44; x++) {
    if (x % 16 === 3 || x % 16 === 4 || x % 16 === 11) f.px(x, 6, grain);
    if (x % 16 === 7 || x % 16 === 8 || x % 16 === 14) f.px(x, 10, grain);
    if (x % 16 === 1 || x % 16 === 9 || x % 16 === 10) f.px(x, 40, grain);
  }
  for (let y = 4; y < 44; y++) {
    if (y % 16 === 2 || y % 16 === 3 || y % 16 === 12) f.px(6, y, grain);
    if (y % 16 === 6 || y % 16 === 13 || y % 16 === 14) f.px(41, y, grain);
  }
  // 안쪽: 코르크가 놓이는 홈 (16px 안쪽 경계)
  f.rect(12, 12, 24, 24, null);
  f.rect(12, 12, 24, 2, dark);
  f.rect(12, 14, 2, 22, dark);
  f.rect(14, 34, 22, 2, light);
  f.rect(34, 14, 2, 20, light);
  f.rect(14, 14, 20, 20, null);
  props["board-frame"] = f;
}
// 코르크 바탕 16×16 타일: 이웃 타일과 이어지도록 가장자리에 걸치지 않는 점무늬.
{
  const t = canvas(16, 16);
  t.rect(0, 0, 16, 16, hex("#b8875a"));
  const dots = [
    [2, 1, "#a0714a"], [7, 2, "#c99a6b"], [12, 1, "#8e6240"], [4, 5, "#c99a6b"], [10, 5, "#a0714a"], [14, 6, "#c99a6b"],
    [1, 8, "#8e6240"], [6, 9, "#a0714a"], [11, 9, "#c99a6b"], [3, 12, "#a0714a"], [8, 13, "#8e6240"], [13, 12, "#a0714a"],
    [5, 15, "#c99a6b"], [15, 14, "#8e6240"], [9, 7, "#8e6240"],
  ];
  for (const [x, y, c] of dots) t.px(x, y, hex(c));
  for (const [x, y] of [[7, 3], [4, 6], [11, 10], [13, 13]]) t.px(x, y, hex("#c99a6b"));
  props["board-cork"] = t;
}
// 압정 16×16: 빨간 머리와 아래로 떨어지는 그림자.
{
  const p = canvas(16, 16);
  const [o, red, hi, lo, sh] = ["#140e0c", "#c4574a", "#ec9483", "#8a3329", "#7e5434"].map(hex);
  p.rect(6, 4, 5, 1, o); p.rect(5, 5, 7, 5, o); p.rect(6, 10, 5, 1, o);
  p.rect(6, 5, 5, 5, red); p.rect(5, 6, 1, 3, red);
  p.rect(6, 5, 2, 1, hi); p.px(6, 6, hi);
  p.rect(7, 9, 4, 1, lo); p.px(10, 8, lo);
  p.rect(7, 11, 3, 2, sh); // 판에 드리운 그림자
  p.px(8, 5, hi);
  p.rect(5, 5, 1, 1, null); p.rect(11, 5, 1, 1, null); p.rect(5, 9, 1, 1, null); p.rect(11, 9, 1, 1, null);
  props["board-pin"] = p;
}
// 휴대폰 본체: 짙은 보라 회색, 두 칸 계단 모서리, 화면 홈.
{
  props["phone-frame"] = panel({ outline: hex("#0c0a0e"), face: hex("#2a2530"), light: hex("#433b4c"), shade: hex("#18141c"), lip: hex("#100d13"), corner: 3 });
}
// 명패: 크림 판, 어두운 외곽선, 네 모서리 나사.
{
  const n = panel({ outline: hex("#140e0c"), face: hex("#f3e5cc"), light: hex("#fff6e4"), shade: hex("#d9c3a0"), corner: 1 });
  for (const [x, y] of [[5, 5], [41, 5], [5, 41], [41, 41]]) {
    n.rect(x, y, 2, 2, hex("#9a8a74"));
    n.px(x, y, hex("#c9b89e"));
  }
  props["nameplate-frame"] = n;
}
// 말풍선: 크림 판, 두꺼운 외곽선, 한 칸 계단 모서리. 꼬리는 CSS 칸 두 개로 잇는다.
{
  const b = panel({ outline: hex("#140e0c"), face: hex("#f3e5cc"), light: hex("#fff6e4"), shade: hex("#d9c3a0"), corner: 2 });
  props["bubble-frame"] = b;
}

writeProps({
  out: OUT,
  publicDir: PUBLIC,
  props,
  origin: (name) =>
    `origin: hand-authored pixel art "${name}" drawn by tools/art/lobby-props.mjs from explicit integer pixel maps and colors sampled from the company room art; no image generation, no automatic conversion, alpha 0 or 255 only; approved by the user from art-src/lobby/preview-sheet.png on 2026-10-30.`,
  sheetOrigin:
    "origin: 8x nearest-neighbour review sheet of the lobby props, assembled by tools/art/lobby-props.mjs for the user to inspect; not served.",
});
console.log(`${Object.keys(props).length}개 물건을 ${OUT}와 ${PUBLIC}에 썼어요.`);
