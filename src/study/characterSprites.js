// 캐릭터 레이어 시트 (Story 009). tools/art/build-character.mjs가 만든 56×72 칸 23개짜리 시트를 쓴다.
// 칸 순서: 서기(아래, 위, 왼, 오), 걷기 4프레임씩(아래, 위, 왼, 오), 의자 앉기(뒷모습), 의자 앉기(정면), 소파 휴식.
// 모든 레이어 시트가 같은 칸 구성이라, 같은 칸 번호로 겹치면 모든 동작에서 맞는다.

/** 시트 한 칸 크기와 칸 수. */
export const SHEET_FRAME = { width: 56, height: 72, count: 23 };
/** 걷기 프레임 수와 프레임 간격(ms). */
export const WALK_FRAMES = 4;
export const WALK_FRAME_MS = 140;

const DIRECTIONS = ["down", "up", "left", "right"];
const SIT_BACK = 20;
const SIT_FRONT = 21;
const REST = 22;

/** 몸 레이어 시트. 하위 호환용 경로 표(characterSprites.idle)도 이 시트를 가리킨다. */
export const BODY_SHEET = "/assets/characters/layers/body-basic.png";

// 발 기준점: 모든 칸에서 맨 아래 줄, 가로 가운데. 이름은 기존 호출부(로비)와 맞춰 유지한다.
export const spriteFootCenterX = { down: 27.5, up: 27.5, left: 27.5, right: 27.5 };
export const spriteFootPadding = { down: 0, up: 0, left: 0, right: 0 };

/**
 * 하위 호환: 예전에는 방향별 완성형 그림 경로였다. 지금은 레이어 시트를 쓰므로
 * 로비와 꾸미기 화면이 baseSrc로 넘기는 값은 몸 시트 경로이고, LayerStack은 칸 번호로 자른다.
 */
export const characterSprites = {
  idle: Object.fromEntries(DIRECTIONS.map((d) => [d, [BODY_SHEET]])),
};

/**
 * 동작과 방향, 프레임으로 시트 칸 번호를 고른다.
 * 의자 앉기는 지금 게임처럼 정면 칸을 쓰고, 소파 휴식은 휴식 칸을 쓴다.
 * @param {"idle"|"walk"|"sit"|"rest"} action
 * @param {"down"|"up"|"left"|"right"} direction
 * @example frameIndex("walk", "left", 2) // 14
 */
export function frameIndex(action, direction, frame = 0) {
  const dir = Math.max(0, DIRECTIONS.indexOf(direction));
  if (action === "walk") return 4 + dir * WALK_FRAMES + (frame % WALK_FRAMES);
  if (action === "sit") return direction === "up" ? SIT_BACK : SIT_FRONT;
  if (action === "rest") return REST;
  return dir;
}

/**
 * 캐릭터 활동을 시트 동작으로 바꾼다. 출구로 걸어 나가는 동안은 걷기다.
 * @returns {{ action: "idle"|"walk"|"sit"|"rest", frames: number }}
 */
export function resolvePose(activity) {
  if (activity === "walking" || activity === "exiting") return { action: "walk", frames: WALK_FRAMES };
  if (activity === "seated" || activity === "sitting") return { action: "sit", frames: 1 };
  if (activity === "resting") return { action: "rest", frames: 1 };
  return { action: "idle", frames: 1 };
}
