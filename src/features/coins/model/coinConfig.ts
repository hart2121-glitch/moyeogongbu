/**
 * 코인 화면 표시 형식 (Story 003). 보상 수치는 여기 두지 않는다: 서버 `coin_rules` 한 줄이 유일한 출처다.
 * 노드 테스트가 바로 불러오므로 실행 시점 import는 두지 않는다.
 */

/** 정산 카드의 종류별 이름. */
export const COIN_KIND_LABEL = {
  study: "공부 코인",
  pomodoro: "뽀모도로 보너스",
  todo: "할 일 완료",
} as const;

/**
 * 근무 시간 글자. 1시간 미만이면 분만.
 * @example workTimeText(3 * 3600 + 12 * 60 + 5) // "3시간 12분"
 */
export function workTimeText(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/**
 * 공부 날짜 글자 (YYYY-MM-DD).
 * @example dayText("2026-10-30") // "10월 30일"
 */
export function dayText(day: string): string {
  const [, month, date] = day.split("-").map(Number);
  return `${month}월 ${date}일`;
}

/** 코인 숫자 글자. */
export const coinText = (coins: number) => coins.toLocaleString("ko-KR");
