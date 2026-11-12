// 캐릭터 레이어 시트 (Story 009). tools/art/build-character.mjs가 만든 56×72 칸 33개짜리 시트를 쓴다.
// 칸 순서: 서기(아래, 위, 왼, 오), 걷기 4프레임씩(아래, 위, 왼, 오), 의자 앉기(뒷모습), 의자 앉기(정면), 소파 휴식,
// 의자에 앉는 사이 칸 2개, 소파에 앉는 사이 칸 2개, 서서 숨쉬기(아래, 위, 왼, 오), 책상 앞 숨쉬기, 책상 앞 끄덕임.
// 모든 레이어 시트가 같은 칸 구성이라, 같은 칸 번호로 겹치면 모든 동작에서 맞는다.

/** 시트 한 칸 크기와 칸 수. */
export const SHEET_FRAME = { width: 56, height: 72, count: 33 };
/** 걷기 프레임 수와 프레임 간격(ms). */
export const WALK_FRAMES = 4;
export const WALK_FRAME_MS = 140;
/** 앉는 사이 칸 하나를 보여 주는 시간(ms). */
export const SETTLE_FRAME_MS = 110;
/** 서서 숨쉬기와 책상 앞 동작에서 한 칸을 보여 주는 시간(ms). */
export const IDLE_FRAME_MS = 700;

const DIRECTIONS = ["down", "up", "left", "right"];
const SIT_BACK = 20;
const SIT_FRONT = 21;
const REST = 22;
/** 서서 숨쉬기 칸: 방향마다 윗몸이 1픽셀 올라간 칸 (27~30). */
const BREATHE = 27;
const DESK_BREATHE = 31;
const DESK_NOD = 32;

/** 서 있을 때: 서기 칸과 숨쉬기 칸을 오간다. */
export const BREATHE_FRAMES = 2;
/** 책상 앞에 앉아 있을 때: 두 번 숨쉬고 한 번 고개를 끄덕인다. */
export const DESK_LOOP = [SIT_FRONT, DESK_BREATHE, SIT_FRONT, DESK_BREATHE, SIT_FRONT, DESK_NOD];

/**
 * 앉을 때 한 번 지나가는 사이 칸. 의자는 윗몸이 내려가고, 소파는 무릎을 굽히며 앉는다.
 * 그 뒤에는 앉은 칸(frameIndex)에 머문다.
 */
export const SETTLE_FRAMES = { sit: [23, 24], rest: [25, 26] };

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
 * 서기는 홀수 프레임에 숨쉬기 칸, 정면 의자 앉기는 DESK_LOOP를 돈다. 뒷모습 앉기와 소파 휴식은 한 칸이다.
 * @param {"idle"|"walk"|"sit"|"rest"} action
 * @param {"down"|"up"|"left"|"right"} direction
 * @example frameIndex("walk", "left", 2) // 14
 * @example frameIndex("idle", "up", 1) // 28
 */
export function frameIndex(action, direction, frame = 0) {
  const dir = Math.max(0, DIRECTIONS.indexOf(direction));
  if (action === "walk") return 4 + dir * WALK_FRAMES + (frame % WALK_FRAMES);
  if (action === "sit") return direction === "up" ? SIT_BACK : DESK_LOOP[frame % DESK_LOOP.length];
  if (action === "rest") return REST;
  return frame % BREATHE_FRAMES ? BREATHE + dir : dir;
}

/**
 * 캐릭터 활동을 시트 동작으로 바꾼다. 출구로 걸어 나가는 동안은 걷기다.
 * 앉으러 들어가는 마지막 한 걸음("sitting")은 좌석이면 의자 앉기, 소파 같은 구역(intoArea)이면 소파 휴식이다.
 * frames는 frameIndex에 넘길 프레임이 도는 수다.
 * @param {string} activity
 * @param {{ intoArea?: boolean }} [options]
 * @returns {{ action: "idle"|"walk"|"sit"|"rest", frames: number }}
 */
export function resolvePose(activity, { intoArea = false } = {}) {
  if (activity === "walking" || activity === "exiting") return { action: "walk", frames: WALK_FRAMES };
  if (activity === "sitting" && intoArea) return { action: "rest", frames: 1 };
  if (activity === "seated" || activity === "sitting") return { action: "sit", frames: DESK_LOOP.length };
  if (activity === "resting") return { action: "rest", frames: 1 };
  return { action: "idle", frames: BREATHE_FRAMES };
}

/** 동작마다 한 프레임을 보여 주는 시간(ms). 걷기만 빠르다. */
export function poseFrameMs(action) {
  return action === "walk" ? WALK_FRAME_MS : IDLE_FRAME_MS;
}

/** 움직임 줄이기 설정. 켜져 있으면 제자리 동작(숨쉬기, 책상 앞 동작)을 돌리지 않는다. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
