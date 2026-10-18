// 업로드 원본의 실제 파일명(.png.png)을 유지합니다.
export const approvedBackup = "/assets/characters/approved-front.png";
const idle = Object.fromEntries(
  ["down", "up", "left", "right"].map((direction) => [
    direction,
    [`/assets/characters/idle-${direction}.png.png`],
  ]),
);
// 알파 50% 이상인 그림의 발끝 아래 여백(px). 원본을 편집하지 않고 발 기준점만 맞춥니다.
// 발끝 4개 행(알파 50% 이상)의 양발 중심 x. 캔버스 중앙과 다른 측면도 같은 발 좌표에 정렬합니다.
export const spriteFootCenterX = { down: 43, up: 44, left: 37.5, right: 49 };
export const spriteFootPadding = { down: 10, up: 6, left: 5, right: 6 };
export const characterSprites = {
  idle,
  walking: { down: [], up: [], left: [], right: [] },
  seated: { down: idle.down },
  resting: { down: idle.down },
};
export function resolveSprite(activity, direction, sprites = characterSprites) {
  // 의자 착석과 소파 휴식은 출입구를 바라보는 정면입니다.
  const facing = ["seated", "sitting", "resting"].includes(activity)
    ? "down"
    : direction;
  const frames = sprites[activity]?.[facing];
  if (frames?.length) return { frames, mirror: false };
  // 걷기 프레임이 준비되기 전에는 같은 방향의 서 있는 이미지를 유지합니다.
  return {
    frames: sprites.idle[facing]?.length
      ? sprites.idle[facing]
      : sprites.idle.down,
    mirror: false,
  };
}
