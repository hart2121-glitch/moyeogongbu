/**
 * 공부 날짜 계산 (가져오는 모듈 없는 순수 함수, Node 테스트가 직접 불러온다).
 * 공부 날짜는 한국 시간 기준 경계 시각(오전 5시)에 바뀐다. 서버 `study_day_of`와 같다.
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const KST_OFFSET_HOURS = 9;

/**
 * 시각(ms)의 공부 날짜 (YYYY-MM-DD).
 * @example studyDayOf(Date.parse("2026-10-29T19:30:00Z"), 5) // "2026-10-29" (한국 04:30)
 */
export const studyDayOf = (now: number, boundaryHourKst: number) =>
  new Date(now + (KST_OFFSET_HOURS - boundaryHourKst) * HOUR_MS).toISOString().slice(0, 10);

/**
 * 날짜에 n일을 더한다.
 * @example addDays("2026-10-30", -1) // "2026-10-29"
 */
export const addDays = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/**
 * 화면용 날짜. 가운뎃점 없이 "10월 30일".
 * @example dayLabel("2026-10-30") // "10월 30일"
 */
export function dayLabel(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${m}월 ${d}일`;
}
