import { spriteFootCenterX, spriteFootPadding } from "../../../study/characterSprites";
import { CANVAS } from "../../character/model/layers";
import { HOME_ROOM } from "./homeRoomLayers";

/**
 * 로비 "내 방" 장면 설정 (로비는 집이다, 2026-10-31). 256×152 도트 방(homeRoomLayers)과 캐릭터를
 * 같은 정수 배율로 키워 그린다 (사용자 결정: 6번 시안 구성, 캐릭터 3배).
 */
export const LOBBY_SCENE = {
  /** 방 그림과 캐릭터를 키우는 정수 배율. */
  scale: HOME_ROOM.scale,
  /** 장면 액자 안쪽 크기 (화면 px): 방 그림 × 배율. */
  size: { width: HOME_ROOM.size.width * HOME_ROOM.scale, height: HOME_ROOM.size.height * HOME_ROOM.scale },
  /** 캐릭터 발 중심 (방 그림 안 1배 px). 러그 가운데. */
  feet: { x: 128, y: 147 },
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
 * 방향마다 발이 같은 자리에 오도록 한 캐릭터 캔버스의 왼쪽 위 좌표 (장면 안 화면 px).
 * 도트가 반 칸에 걸려 흐려지지 않도록 1배 좌표에서 정수로 내린 뒤 배율을 곱한다 (발 중심 27.5 → 27).
 * @example characterOffset("down") // { left: 300, top: 225 }
 */
export function characterOffset(facing: Facing, feet: { x: number; y: number } = LOBBY_SCENE.feet, scale: number = LOBBY_SCENE.scale) {
  const footX = (spriteFootCenterX as Record<Facing, number>)[facing];
  const pad = (spriteFootPadding as Record<Facing, number>)[facing];
  return { left: Math.floor(feet.x - footX) * scale, top: Math.floor(feet.y - (CANVAS.height - pad)) * scale };
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 공부 날짜(YYYY-MM-DD)의 요일 이름.
 * @example weekdayOf("2026-10-30") // "금"
 */
export const weekdayOf = (day: string) => WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
