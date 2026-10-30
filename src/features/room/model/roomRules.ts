/**
 * 방 화면의 순수 규칙 (서버나 Realtime 없이 시험할 수 있다).
 * 수치와 목록은 인자로 받는다 (`roomConfig.ts`의 ROOM_CONFIG, REACTION_KEYS를 넘긴다).
 */

/**
 * 사람별 반응 간격 검사기. 보내는 쪽(내 버튼)과 받는 쪽(다른 사람 반응) 모두 쓴다.
 * 목록 밖의 키이거나 같은 사람의 이전 반응에서 간격이 안 지났으면 false.
 * @example const gate = createReactionGate(REACTION_KEYS, ROOM_CONFIG.reactionIntervalMs); gate(userId, "fire", Date.now());
 */
export function createReactionGate(keys: readonly string[], intervalMs: number) {
  const allowed = new Set(keys);
  const last = new Map<string, number>();
  return (senderId: string, key: unknown, now: number): boolean => {
    if (!senderId || typeof key !== "string" || !allowed.has(key)) return false;
    const previous = last.get(senderId);
    if (previous !== undefined && now - previous < intervalMs) return false;
    last.set(senderId, now);
    return true;
  };
}

/** 다른 사람에게서 받은 이동 목적지. 좌석, 이름 있는 지점, 바닥 좌표 중 하나. */
export interface RoomMove {
  to: string | { x: number; y: number };
  activity: string;
  seatId: number | null;
}

const MOVE_ACTIVITIES = new Set(["seated", "idle", "resting", "restroom", "lounge", "exit"]);

/**
 * 받은 이동 메시지가 형식에 맞는지 (이름 있는 지점은 `nodes`에 있어야 한다). 맞지 않으면 null.
 * 경로는 받는 쪽이 같은 길찾기로 다시 계산하므로 목적지만 확인한다.
 */
export function parseMove(raw: unknown, nodes: Record<string, unknown>, seatCount: number): RoomMove | null {
  if (!raw || typeof raw !== "object") return null;
  const { to, activity, seatId } = raw as Record<string, unknown>;
  if (typeof activity !== "string" || !MOVE_ACTIVITIES.has(activity)) return null;
  const seat = seatId === null || seatId === undefined ? null : seatId;
  if (seat !== null && !(Number.isInteger(seat) && (seat as number) >= 1 && (seat as number) <= seatCount))
    return null;
  if (activity === "seated" && seat === null) return null;
  if (typeof to === "string") return Object.hasOwn(nodes, to) ? { to, activity, seatId: seat as number | null } : null;
  if (to && typeof to === "object") {
    const { x, y } = to as Record<string, unknown>;
    if (typeof x === "number" && typeof y === "number" && x >= 0 && x <= 1 && y >= 0 && y <= 1)
      return { to: { x, y }, activity, seatId: seat as number | null };
  }
  return null;
}

/** 서버 공부 상태와 캐릭터 동작에서 고른 마우스 올림 상태 문구. */
export function presenceLabel(activity: string | undefined, serverState: string | undefined): string {
  if (activity === "restroom") return "화장실";
  if (activity === "seated" || activity === "sitting") return serverState === "away" ? "휴식" : "공부 중";
  return "휴식";
}

/**
 * 공부 초를 "2시간 5분" 꼴로. 1분 미만은 "0분".
 * @example formatStudyTime(7500) // "2시간 5분"
 */
export function formatStudyTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}
