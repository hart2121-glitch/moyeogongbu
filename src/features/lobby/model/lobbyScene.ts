import { spriteFootCenterX, spriteFootPadding } from "../../../study/characterSprites";
import { CANVAS } from "../../character/model/layers";

/**
 * 로비 "내 방" 장면 설정 (로비는 집이다, 2026-10-31). 캐릭터 도트 세션이 그릴 내 방 그림이 나오기 전까지
 * 벽지와 나무 마루 도트 타일(public/assets/home)을 1배로 깔아 임시 방을 만든다.
 */
export const LOBBY_SCENE = {
  /** 장면 액자 안쪽 크기 (px, 1배). */
  size: { width: 770, height: 455 },
  /** 벽과 마루의 경계 (위에서부터 px). 위는 벽지, 아래는 마루. */
  floorTop: 320,
  /** 캐릭터 발 중심 (장면 안 px). 마루 가운데. */
  feet: { x: 385, y: 420 },
} as const;

export type Facing = "down" | "up" | "left" | "right";

/** 장면 속 물건. 각각 로비 기능 하나로 이어진다. */
export type DeskObject = "monitor" | "memo" | "board" | "phone";

/**
 * 캐릭터(from)가 물건(to)을 볼 때의 방향. 화면 배치가 바뀌어도 실제 위치로 정한다. 가로 차이가 크면 좌우, 아니면 위아래.
 * @example facingToward({ x: 900, y: 400 }, { x: 400, y: 640 }) // "left"
 */
export function facingToward(from: { x: number; y: number }, to: { x: number; y: number }): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

/**
 * 방향마다 발이 같은 자리에 오도록 한 캐릭터 캔버스의 왼쪽 위 좌표 (구역 안 px).
 * 1배 도트가 반 픽셀에 걸려 흐려지지 않도록 정수 픽셀로 내린다 (발 중심 27.5 → 27).
 * @example characterOffset("down") // { left: 684, top: 358 }
 */
export function characterOffset(facing: Facing, feet = LOBBY_SCENE.feet) {
  const footX = (spriteFootCenterX as Record<Facing, number>)[facing];
  const pad = (spriteFootPadding as Record<Facing, number>)[facing];
  return { left: Math.floor(feet.x - footX), top: Math.floor(feet.y - (CANVAS.height - pad)) };
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 공부 날짜(YYYY-MM-DD)의 요일 이름.
 * @example weekdayOf("2026-10-30") // "금"
 */
export const weekdayOf = (day: string) => WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
