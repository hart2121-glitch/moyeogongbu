// 실제 방향별/동작별 스프라이트가 준비되면 경로 또는 프레임 목록만 교체합니다.
// 현재는 모든 방향·동작에 같은 임시 정면 이미지 + CSS 애니메이션을 사용합니다.
const temporary = "/assets/characters/temporary-standing.png";
export const characterSprites = {
  idle: {
    down: [temporary],
    up: [temporary],
    left: [temporary],
    right: [temporary],
  },
  walking: {
    down: [temporary],
    up: [temporary],
    left: [temporary],
    right: [temporary],
  },
  resting: {
    down: [temporary],
    up: [temporary],
    left: [temporary],
    right: [temporary],
  },
  seated: {
    down: [temporary],
    up: [temporary],
    left: [temporary],
    right: [temporary],
  },
};
