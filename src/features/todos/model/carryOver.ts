/**
 * "어제 못 한 할 일 가져오기" 창을 하루에 한 번만 띄우기 위한 기록 (브라우저 저장소).
 * 저장소는 주입한다 (테스트에서는 Map 기반 가짜).
 */
export interface DayFlagStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const flagKey = (userId: string) => `moyeogongbu.carry-over.${userId}`;

/**
 * 오늘 이미 물어봤는지.
 * @example carryOverAsked(localStorage, userId, "2026-10-30")
 */
export function carryOverAsked(storage: DayFlagStorage | null, userId: string, today: string): boolean {
  try {
    return storage?.getItem(flagKey(userId)) === today;
  } catch {
    return false;
  }
}

/** 오늘 물어봤다고 적는다. 저장소를 못 쓰면 이번 방문 동안만 기억한다. */
export function markCarryOverAsked(storage: DayFlagStorage | null, userId: string, today: string): void {
  try {
    storage?.setItem(flagKey(userId), today);
  } catch {
    /* 저장소를 쓸 수 없는 브라우저 */
  }
}
