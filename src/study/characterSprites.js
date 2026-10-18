// 확정 원본의 연보라색 머리·보라색 리본 인물을 그대로 분리한 정면 프레임입니다.
// 방향/걷기/착석 에셋이 없으므로 임의로 새 외형이나 프레임을 생성하지 않습니다.
const approved = "/assets/characters/approved-front.png";
export const characterSprites = {
  idle: { down: [approved], up: [], left: [], right: [] },
  walking: { down: [], up: [], left: [], right: [] },
  seated: {
    down: [approved],
    up: [approved],
    left: [approved],
    right: [approved],
  },
  resting: {
    down: [approved],
    up: [approved],
    left: [approved],
    right: [approved],
  },
};
export function resolveSprite(activity, direction, sprites = characterSprites) {
  const frames = sprites[activity]?.[direction];
  if (frames?.length) return { frames, mirror: false };
  // 정면 그림을 좌우 반전해 실제 측면 프레임처럼 보이게 하지 않습니다.
  return { frames: sprites.idle.down, mirror: false };
}
