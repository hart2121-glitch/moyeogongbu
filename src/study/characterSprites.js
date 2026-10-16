// 방향별 팔다리 걷기 이미지를 순서대로 등록하면 실제 프레임 애니메이션으로 표시합니다.
// 예: walking.down: ['/assets/characters/walk-down-1.png', '/assets/characters/walk-down-2.png']
// 아직 걷기 원본이 없으므로 빈 배열을 유지하고 정면 임시 이미지로 대체합니다.
const temporary = "/assets/characters/temporary-standing.png";
const sitting = "/assets/characters/temporary-sitting.png";
export const characterSprites = {
  idle: { down: [temporary], up: [], left: [], right: [] },
  walking: { down: [], up: [], left: [], right: [] },
  resting: {
    down: [sitting],
    up: [sitting],
    left: [sitting],
    right: [sitting],
  },
  seated: { down: [], up: [], left: [], right: [] },
};
export function resolveSprite(activity, direction, sprites = characterSprites) {
  const directional = sprites[activity]?.[direction];
  if (directional?.length) return { frames: directional, mirror: false };
  return { frames: sprites.idle.down, mirror: direction === "left" };
}
