// 공용 스터디카페 (Story 011). 그림(672×432, 화면 1배) 칸 좌표로 적고, 무대 좌표(0~1)로 바꿔 둔다.
// 그림은 tools/art/cafe-room.mjs가 빈 벽과 바닥 위에 따로 만든 물건을 이 파일의 자리에 놓아 만든다.
// 회사 방과 같은 이동, 좌석, 책상 세트 규칙을 쓰도록 모양을 맞췄다:
//   - 무대 좌표계의 원본 크기(image)는 그림의 2배(1344×864)라 캐릭터 칸(112×144)과 발 반경이 회사 방과 같다.
//   - 탁자 칸은 회사 책상과 같은 112×84이고, 앉는 자리, 책상 세트 자리, 노트북 자리가 회사 책상과 같은 칸에 있다.

/** 카페 그림 크기 (1배). */
export const CAFE_ART_SIZE = { width: 672, height: 432 };
/** 카페 방 그림과 탁자 위 노트북 그림 (tools/art/cafe-room.mjs). */
export const CAFE_ROOM_ART = "/assets/rooms/cafe-room.png";
export const CAFE_LAPTOP_ART = "/assets/rooms/cafe-laptop.png";

const W = CAFE_ART_SIZE.width;
const H = CAFE_ART_SIZE.height;
/** 그림 칸 점을 무대 좌표로. */
const at = (x, y) => ({ x: x / W, y: y / H });
/** 그림 칸 사각형(왼쪽, 위, 오른쪽, 아래)을 무대 좌표 사각형으로. */
const box = (name, left, top, right, bottom) => ({ name, left: left / W, right: right / W, top: top / H, bottom: bottom / H });

/** 탁자 칸 왼쪽 위 (그림 칸). 1~3번은 창가 줄, 4~6번은 가운데 줄. */
export const CAFE_TABLES = [
  { id: 1, x: 236, y: 148 },
  { id: 2, x: 362, y: 148 },
  { id: 3, x: 488, y: 148 },
  { id: 4, x: 236, y: 262 },
  { id: 5, x: 362, y: 262 },
  { id: 6, x: 488, y: 262 },
];
/** 탁자 칸 안 자리 (회사 책상과 같은 칸): 발 위치, 다가가는 지점, 번호 판, 탁자 앞면이 시작하는 줄. */
export const TABLE_SEAT = { x: 59, y: 37, approachY: -2, labelY: 68, topY: 26 };

/** 소파: 그림 칸 상자와 앉는 자리 (tools/art/cafe-room.mjs가 같은 상자에 소파를 놓는다). */
export const CAFE_SOFA = { left: 22, top: 302, right: 126, bottom: 352, seatX: 74, seatY: 340, approachY: 362 };

const rows = [
  { name: "창가 탁자", y: 148 },
  { name: "가운데 탁자", y: 262 },
];
const rowOf = (table) => rows.find((r) => r.y === table.y);

const nodes = {
  entrance: at(404, 424),
  counter: at(104, 198),
  sofaApproach: at(CAFE_SOFA.seatX, CAFE_SOFA.approachY),
  sofa: at(CAFE_SOFA.seatX, CAFE_SOFA.seatY),
  restroom: at(638, 116),
  restroomOut: at(638, 138),
};
for (const t of CAFE_TABLES) {
  nodes[`seat${t.id}`] = at(t.x + TABLE_SEAT.x, t.y + TABLE_SEAT.y);
  nodes[`approach${t.id}`] = at(t.x + TABLE_SEAT.x, t.y + TABLE_SEAT.approachY);
}

export const cafeLayout = {
  image: { width: W * 2, height: H * 2 },
  view: { x: 0, y: 0, width: W * 2, height: H * 2 },
  character: { width: 112 / (W * 2), height: 144 / (H * 2) },
  seatedMode: "sprite",
  seatMarkersBaked: true,
  // 그림 속 빈 나무 판에 올리는 글자 (가운데, 무대 좌표).
  signs: [
    { id: "counter", text: "카운터", ...at(104, 15) },
    { id: "restroom", text: "화장실", ...at(638, 24) },
    { id: "exit", text: "나가기", ...at(404, 421) },
  ],
  nodes,
  edges: [],
  seats: CAFE_TABLES.map((t) => ({
    id: t.id,
    node: `seat${t.id}`,
    approach: `approach${t.id}`,
    entryBlocker: rowOf(t).name,
    label: at(t.x + TABLE_SEAT.x, t.y + TABLE_SEAT.labelY),
    desk: { x: t.x, y: t.y },
    // 앉은 사람의 하체를 가리는 탁자 윗면과 앞면 (방 그림을 다시 그린다).
    foreground: box("", t.x + 2, t.y + TABLE_SEAT.topY, t.x + 110, t.y + 84),
  })),
  // 책상 세트와 노트북 자리: 회사 책상과 같은 칸 (companyFinalLayout.js의 deskSpots, deskMonitor).
  deskSpots: {
    left: { x: 11, y: 10, width: 32, height: 44 },
    right: { x: 75, y: 10, width: 32, height: 44 },
    front: { x: 14, y: 60, width: 32, height: 16 },
  },
  deskMonitor: { x: 39, y: 24, width: 41, height: 29 },
  // 칠판과 첫 창 사이 벽시계: 시계판은 그림, 바늘은 화면이 실제 시각으로 그린다 (그림 칸).
  wallClock: { center: { x: 218, y: 40 }, radius: 13, hourHand: 5, minuteHand: 9 },
  areas: [
    { id: "lounge", node: "counter", activity: "lounge", label: "카운터로 가기", marker: "카운터", position: at(104, 186) },
    {
      id: "sofa",
      node: "sofa",
      approach: "sofaApproach",
      entryBlocker: "소파",
      activity: "resting",
      label: "휴식하기",
      marker: "소파 휴식",
      position: at(CAFE_SOFA.seatX, 380),
    },
    { id: "restroom", node: "restroom", activity: "restroom", label: "화장실 가기", marker: "화장실", position: at(600, 128) },
  ],
  restroomExit: "restroomOut",
  navigation: {
    step: 2,
    radius: 1.5,
    footHalfWidth: 14,
    areas: [box("카페 바닥", 4, 110, 668, 428)],
    blockers: [
      box("카운터", 8, 104, 200, 178),
      ...rows.map((r) => box(r.name, 238, r.y + 23, 598, r.y + 84)),
      box("소파", CAFE_SOFA.left, CAFE_SOFA.top, CAFE_SOFA.right, CAFE_SOFA.bottom),
      box("소파 옆 탁자", 128, 324, 158, 352),
      box("책장", 614, 156, 668, 252),
      box("왼쪽 아래 화분", 4, 384, 46, 428),
      box("오른쪽 아래 화분", 634, 372, 668, 428),
    ],
  },
};
