// 사용법: node tools/art/home-props.mjs
// 집 세계(로비 "내 방", 공통 페이지의 책상 위 노트, 환영 화면 문패)의 도트 타일과 틀을 픽셀 단위로 직접 찍는다 (2026-10-31).
// 이미지 생성, 자동 변환, 안티에일리어싱, 반투명 없이 정해 둔 색과 그리기 루틴만 쓴다.
// 결과: art-src/home/*.png (원본), public/assets/home/*.png (화면용 같은 파일), art-src/home/preview-sheet.png (8배 확인용).
// 타일(벽지 16×16, 바닥과 책상 48×16)은 이어 붙여도 이음새가 없어야 하고, 문패는 48×48 9조각(모서리 16px)이다. 화면에서는 1배로만 쓴다.
import { canvas, hex, panel, writeProps } from "./propKit.mjs";

const OUT = "art-src/home";
const PUBLIC = "public/assets/home";
const props = {};

// 벽지 16×16: 따뜻한 크림 바탕에 작은 꽃무늬를 엇갈려 둔다. 글자 뒤에 깔려도 시끄럽지 않게 대비를 낮춘다.
{
  const w = canvas(16, 16);
  const [base, petal, heart, dot] = ["#f1e2c8", "#e9cfbf", "#d9a6a0", "#e6d3b4"].map(hex);
  w.rect(0, 0, 16, 16, base);
  for (const [cx, cy] of [[3, 3], [11, 11]]) {
    w.px(cx, cy, heart);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) w.px(cx + dx, cy + dy, petal);
  }
  for (const [x, y] of [[11, 3], [3, 11]]) w.px(x, y, dot);
  props["wallpaper"] = w;
}
// 나무 바닥 48×16: 가로 널판 두 줄(8px씩). 널판이 48px로 길어야 벽돌이 아니라 마루로 읽힌다.
// 각 널판 윗줄은 밝고 아랫줄은 이음새, 세로 이음매는 두 줄이 엇갈린다(위 x 34, 아래 x 10).
{
  const f = canvas(48, 16);
  const [base, light, seam, grain] = ["#a26b3f", "#b47849", "#7a4d2b", "#946038"].map(hex);
  f.rect(0, 0, 48, 16, base);
  for (const top of [0, 8]) {
    f.rect(0, top, 48, 1, light);
    f.rect(0, top + 7, 48, 1, seam);
  }
  for (const [x, top] of [[34, 0], [10, 8]]) {
    f.rect(x, top, 1, 7, seam);
    f.rect(x + 1, top + 1, 1, 6, light);
  }
  // 결: 널판 안에서 길이와 위치가 다른 가로줄
  for (const [x0, x1, y] of [[2, 13, 3], [18, 30, 5], [37, 46, 3], [0, 7, 12], [13, 27, 11], [31, 44, 13]]) f.rect(x0, y, x1 - x0 + 1, 1, grain);
  props["floor"] = f;
}
// 책상 상판 48×16: 바닥보다 밝은 나무, 이음새 없이 가로 결만 흐른다. 48px 안에서 결을 불규칙하게 두어 반복 줄무늬를 줄인다.
{
  const d = canvas(48, 16);
  const [base, grain, light] = ["#c8925a", "#b8834e", "#d6a46b"].map(hex);
  d.rect(0, 0, 48, 16, base);
  for (const [x0, x1, y] of [[0, 21, 2], [30, 47, 3], [6, 17, 7], [24, 40, 8], [0, 9, 12], [15, 33, 13], [39, 47, 12]])
    d.rect(x0, y, x1 - x0 + 1, 1, grain);
  for (const [x, y] of [[11, 5], [36, 6], [3, 10], [27, 11], [44, 15]]) d.px(x, y, light);
  props["desk"] = d;
}
// 스프링 고리 16×16: 노트 위 가장자리에 걸치는 철사 고리 하나. 아래 반은 종이 위, 위 반은 책상 위에 놓인다.
{
  const r = canvas(16, 16);
  const [wire, hi, lo, hole] = ["#9a98a3", "#e2e0ea", "#5d5b66", "#3b2c22"].map(hex);
  r.rect(6, 12, 4, 2, hole); // 종이에 뚫린 구멍
  r.px(7, 1, wire); r.px(8, 1, wire);
  r.px(6, 2, wire); r.px(9, 2, lo);
  r.rect(5, 3, 1, 8, hi); // 왼쪽 철사: 빛을 받는 면
  r.rect(6, 3, 1, 8, wire);
  r.rect(9, 3, 1, 8, wire);
  r.rect(10, 3, 1, 8, lo); // 오른쪽 철사: 그늘 면
  r.px(6, 11, wire); r.px(9, 11, lo);
  r.px(7, 12, wire); r.px(8, 12, lo); // 구멍으로 들어가는 끝
  props["spiral-ring"] = r;
}
// 방문 문패 48×48 9조각: 밝은 나무 판(진한 글씨가 잘 읽히게), 두 칸 계단 모서리, 위 두 모서리에 놋쇠 못.
{
  const n = panel({ outline: hex("#3b2416"), face: hex("#d0a067"), light: hex("#e2b47c"), shade: hex("#a87543"), corner: 2 });
  for (const x of [7, 39]) {
    n.rect(x, 6, 2, 2, hex("#8a7a5a"));
    n.px(x, 6, hex("#e8d49a"));
  }
  props["nameplate"] = n;
}

writeProps({
  out: OUT,
  publicDir: PUBLIC,
  props,
  origin: (name) =>
    `origin: hand-authored pixel art "${name}" drawn by tools/art/home-props.mjs from explicit integer pixel maps; no image generation, no automatic conversion, alpha 0 or 255 only; for the home world (lobby room, desk notebook pages, door nameplate); approved by the user from art-src/home/preview-sheet.png on 2026-10-31.`,
  sheetOrigin:
    "origin: 8x nearest-neighbour review sheet of the home props, assembled by tools/art/home-props.mjs for the user to inspect; not served.",
  sheetGround: "#7a6a5a",
});
console.log(`${Object.keys(props).length}개 그림을 ${OUT}와 ${PUBLIC}에 썼어요.`);
