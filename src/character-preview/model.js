// 게임 상태와 독립된 미리보기 전용 모델입니다.
export const CANVAS = { width: 87, height: 110 };
export const DIRECTIONS = {
  down: "정면",
  up: "후면",
  left: "왼쪽",
  right: "오른쪽",
};
// 뒤 → 앞. 같은 캔버스에서 (0,0)에 겹치고 부품별 발 보정은 하지 않습니다.
export const LAYERS = [
  { id: "hairBack", label: "뒷머리", order: 0 },
  { id: "body", label: "기본 몸", order: 10 },
  { id: "outfit", label: "의상", order: 20 },
  { id: "face", label: "얼굴", order: 30 },
  { id: "hairFront", label: "앞머리", order: 40 },
  { id: "accessory", label: "액세서리", order: 50 },
];
export const poseKey = ({ action, direction, frame }) =>
  `${action}.${direction}.${frame}`;
export const referenceSource = (direction) =>
  `/assets/characters/idle-${direction}.png.png`;
export function createPreview() {
  return {
    schemaVersion: 1,
    canvas: CANVAS,
    layers: Object.fromEntries(
      LAYERS.map((layer) => [
        layer.id,
        {
          enabled: true,
          itemId: null,
          paletteId: null,
          // 향후 동작·방향·프레임별 에셋을 같은 시간축으로 선택할 수 있습니다.
          frames: {},
        },
      ]),
    ),
  };
}
