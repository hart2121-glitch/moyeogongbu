// 최종 1705×922 원본용 상대 좌표(발 기준). 고정 인물을 제거한 화면용 사본과 함께 사용합니다.
export const companyFinalLayout = {
  image: { width: 1705, height: 922 },
  // 화면에 보이는 범위(원본 px). 그림에 그려진 앱 제목줄과 오른쪽 가짜 UI 열(x 1360~)은 잘라 낸다.
  // 좌표는 계속 원본 전체 기준이고, 무대를 원본 크기 비율로 두고 바깥 창이 이 범위만 보여 준다.
  // Story 009: 이 범위를 정확히 절반으로 다시 그린 도트 방(672×432, tools/art/company-room.mjs)을 화면에 1배로 그린다.
  view: { x: 0, y: 58, width: 1344, height: 864 },
  // 캐릭터 칸 56×72를 방과 같은 1배로: 원본 px로는 2배(112×144)다.
  character: {
    width: 112 / 1705,
    height: 144 / 922,
  },
  seatedMode: "sprite",
  // 좌석 번호 동그라미는 그림에 비어 있고, 번호는 화면 글자로 올린다.
  seatMarkersBaked: true,
  // 그림 속 빈 표지판과 화이트보드에 올리는 글자 (가운데 좌표, 원본 기준 상대 좌표)
  signs: [
    { id: "lounge", text: "휴게실", x: 166 / 1705, y: 151 / 922 },
    { id: "restroom", text: "화장실", x: 129 / 1705, y: 537 / 922 },
    { id: "exit", text: "나가기", x: 884 / 1705, y: 743 / 922 },
    { id: "board", text: "오늘도\n수고했어요!", x: 1053 / 1705, y: 236 / 922 },
  ],
  nodes: {
    entrance: { x: 0.52, y: 0.95 },
    lowerDoor: { x: 0.52, y: 0.795 },
    lowerLeft: { x: 0.317, y: 0.795 },
    toiletOuter: { x: 0.317, y: 0.824 },
    toiletThreshold: { x: 0.272, y: 0.824 },
    toiletInside: { x: 0.24, y: 0.838 },
    toiletFloor: { x: 0.13, y: 0.838 },
    restroom: { x: 0.13, y: 0.9 },
    middleLeft: { x: 0.317, y: 0.612 },
    loungeOuter: { x: 0.317, y: 0.495 },
    loungeThreshold: { x: 0.278, y: 0.495 },
    loungeInner: { x: 0.225, y: 0.505 },
    loungeFloor: { x: 0.205, y: 0.505 },
    sofaApproach: { x: 0.225, y: 0.505 },
    sofa: { x: 0.21, y: 0.49 },
    upperApproach: { x: 0.348, y: 0.455 },
    upperTurn: { x: 0.317, y: 0.455 },
    upperLeft: { x: 0.348, y: 0.424 },
    upper1: { x: 0.405, y: 0.424 },
    upper2: { x: 0.534, y: 0.424 },
    upper3: { x: 0.668, y: 0.424 },
    middle1: { x: 0.403, y: 0.612 },
    middle2: { x: 0.534, y: 0.612 },
    middle3: { x: 0.67, y: 0.612 },
    seat1: { x: 0.405, y: 0.478 },
    seat2: { x: 0.534, y: 0.478 },
    seat3: { x: 0.668, y: 0.478 },
    seat4: { x: 0.403, y: 0.646 },
    seat5: { x: 0.534, y: 0.646 },
    seat6: { x: 0.67, y: 0.646 },
  },
  edges: [
    ["entrance", "lowerDoor"],
    ["lowerDoor", "lowerLeft"],
    ["lowerLeft", "middleLeft"],
    ["middleLeft", "loungeOuter"],
    ["loungeOuter", "upperTurn"],
    ["upperTurn", "upperApproach"],
    ["upperApproach", "upperLeft"],
    ["upperLeft", "upper1"],
    ["upper1", "upper2"],
    ["upper2", "upper3"],
    ["upper1", "seat1"],
    ["upper2", "seat2"],
    ["upper3", "seat3"],
    ["middleLeft", "middle1"],
    ["middle1", "middle2"],
    ["middle2", "middle3"],
    ["middle1", "seat4"],
    ["middle2", "seat5"],
    ["middle3", "seat6"],
    ["loungeOuter", "loungeThreshold"],
    ["loungeThreshold", "loungeInner"],
    ["loungeInner", "loungeFloor"],
    ["loungeInner", "sofaApproach"],
    ["sofaApproach", "sofa"],
    ["lowerLeft", "toiletOuter"],
    ["toiletOuter", "toiletThreshold"],
    ["toiletThreshold", "toiletInside"],
    ["toiletInside", "toiletFloor"],
    ["toiletFloor", "restroom"],
  ],
  portalEdges: [
    ["loungeOuter", "loungeThreshold"],
    ["loungeThreshold", "loungeInner"],
  ],
  seats: [
    { id: 1, node: "seat1", label: { x: 0.405, y: 0.574 } },
    { id: 2, node: "seat2", label: { x: 0.534, y: 0.574 } },
    { id: 3, node: "seat3", label: { x: 0.668, y: 0.574 } },
    { id: 4, node: "seat4", label: { x: 0.403, y: 0.747 } },
    { id: 5, node: "seat5", label: { x: 0.534, y: 0.747 } },
    { id: 6, node: "seat6", label: { x: 0.67, y: 0.747 } },
  ],
  areas: [
    {
      id: "lounge",
      node: "loungeFloor",
      activity: "lounge",
      label: "휴게실로 이동",
      marker: "휴게실",
      position: { x: 0.082, y: 0.51 },
    },
    {
      id: "sofa",
      node: "sofa",
      activity: "resting",
      label: "휴식하기",
      marker: "소파 휴식",
      position: { x: 0.2, y: 0.51 },
    },
    {
      id: "restroom",
      node: "restroom",
      activity: "restroom",
      label: "화장실 가기",
      marker: "화장실",
      position: { x: 0.13, y: 0.91 },
    },
  ],
  backgroundPeople: [],
  obstacles: [
    { name: "위쪽 책상", left: 0.35, right: 0.733, top: 0.48, bottom: 0.605 },
    {
      name: "아래쪽 책상",
      left: 0.343,
      right: 0.733,
      top: 0.65,
      bottom: 0.783,
    },
    { name: "냉장고", left: 0.307, right: 0.346, top: 0.275, bottom: 0.43 },
    {
      name: "화장실 개별 칸",
      left: 0.12,
      right: 0.246,
      top: 0.62,
      bottom: 0.817,
    },
    {
      name: "휴게실 테이블",
      left: 0.087,
      right: 0.181,
      top: 0.39,
      bottom: 0.485,
    },
  ],
};

// 원본 픽셀 좌표를 상대 좌표로 변환한 파티션 발 충돌 영역입니다.
// 책상 표면뿐 아니라 위로 돌출된 파티션도 차단하여 위를 밟는 경로를 방지합니다.
const partitionColumns = [
  [571, 603],
  [781, 813],
  [1005, 1037],
  [1227, 1255],
];
companyFinalLayout.partitions = [
  [405, 558],
  [563, 724],
].flatMap(([top, bottom], row) =>
  partitionColumns.map(([left, right], column) => ({
    name: `${row + 1}행 ${column + 1}번 파티션`,
    left: left / 1705,
    right: right / 1705,
    top: top / 922,
    bottom: bottom / 922,
  })),
);
// 실제 바닥 범위와 벽·가구의 발 충돌 영역. 배경을 수정하지 않습니다.
companyFinalLayout.navigation = {
  step: 2,
  // 중앙 통로는 원본상 y=558~563px의 좁은 틈입니다.
  // 좁은 중앙 틈의 세로 여유는 유지하고, 확대된 양발 폭은 가로 14px로 검사합니다.
  radius: 1.5,
  footHalfWidth: 14,
  areas: [
    { left: 0.293, right: 0.783, top: 0.423, bottom: 0.978 }, // 업무실
    { left: 0.015, right: 0.26, top: 0.38, bottom: 0.518 }, // 휴게실 바닥
    { left: 0.225, right: 0.322, top: 0.485, bottom: 0.518 }, // 기존 휴게실 문 경계
    { left: 0.016, right: 0.259, top: 0.818, bottom: 0.928 }, // 화장실 공용 바닥
    { left: 0.24, right: 0.321, top: 0.817, bottom: 0.852 }, // 열린 화장실 문
    { left: 0.285, right: 0.322, top: 0.79, bottom: 0.948 }, // 문 밖 벽과 하단 수납장 사이 바닥
  ],
  blockers: [
    ...companyFinalLayout.obstacles,
    ...companyFinalLayout.partitions,
    {
      name: "왼쪽 하단 수납장",
      left: 0.307,
      right: 0.416,
      top: 0.814,
      bottom: 0.937,
    },
    {
      name: "오른쪽 하단 수납장",
      left: 0.598,
      right: 0.783,
      top: 0.818,
      bottom: 0.943,
    },
    {
      name: "휴게실 소파",
      left: 0.105,
      right: 0.232,
      top: 0.315,
      bottom: 0.451,
    },
  ],
};
// 위쪽 바닥 경계에서도 발 여유가 확보되도록 의자 뒤 진입선을 맞춥니다.
for (const key of ["upper1", "upper2", "upper3"])
  companyFinalLayout.nodes[key] = {
    ...companyFinalLayout.nodes[key],
    y: 394 / 922,
  };
// 위쪽 책상 앞과 아래쪽 파티션 뒤의 실제 바닥 틈으로 접근합니다.
for (const key of ["middleLeft", "middle1", "middle2", "middle3"])
  companyFinalLayout.nodes[key] = {
    ...companyFinalLayout.nodes[key],
    y: 560 / 922,
  };
companyFinalLayout.nodes.toiletOuter = { x: 0.297, y: 0.824 };
// 걷기는 의자 뒤 접근점까지, 착석은 전용 앵커로 전환합니다.
for (const seat of companyFinalLayout.seats) {
  seat.entryBlocker = seat.id <= 3 ? "위쪽 책상" : "아래쪽 책상";
  seat.approach = seat.id <= 3 ? `upper${seat.id}` : `middle${seat.id - 3}`;
  companyFinalLayout.nodes[seat.node] = {
    x: companyFinalLayout.nodes[seat.node].x,
    y: seat.id <= 3 ? 0.507 : 0.676,
  };
}
// 원본의 책상/모니터 픽셀만 위에 재표시하는 전경 사각형. 가구를 새로 그리지 않습니다.
companyFinalLayout.seats.forEach((seat, index) => {
  const column = index % 3;
  seat.foreground = {
    left: [0.343, 0.467, 0.592][column],
    right: [0.466, 0.591, 0.735][column],
    top: index < 3 ? 0.481 : 0.653,
    bottom: index < 3 ? 0.605 : 0.783,
  };
});
