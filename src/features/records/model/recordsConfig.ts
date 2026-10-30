/**
 * 공부 기록 화면 수치. 잔디 진하기 구간과 그래프 기간.
 * 잔디는 5단계: 0분, 1시간 미만, 1~3시간, 3~6시간, 6시간 이상.
 */
export const RECORDS_CONFIG = {
  /** 이 초보다 적으면 0단계 ("0분"으로 보이는 날). */
  minSecondsForLevel1: 60,
  /** 2, 3, 4단계가 시작하는 초 (1시간, 3시간, 6시간). */
  heatThresholdsSeconds: [3_600, 3 * 3_600, 6 * 3_600],
  /** 막대그래프 날 수 (오늘 포함). */
  chartDays: 7,
  /** 잔디 달력 날 수 (오늘 포함). */
  calendarDays: 365,
} as const;

export type RecordsConfig = typeof RECORDS_CONFIG;
