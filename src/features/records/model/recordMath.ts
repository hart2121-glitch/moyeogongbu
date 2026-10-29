import type { DayRecord } from "./recordTypes";

/**
 * 공부 기록 순수 함수 (가져오는 모듈 없음, Node 테스트가 직접 불러온다).
 */

const DAY_MS = 86_400_000;
const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);

/** 잔디 구간 설정 (recordsConfig.ts의 RECORDS_CONFIG). */
export interface HeatConfig {
  minSecondsForLevel1: number;
  heatThresholdsSeconds: readonly number[];
}

/**
 * from부터 to까지 하루도 빠짐없는 기록. 서버에 없는 날은 0으로 채운다.
 * @example fillDays([], "2026-10-29", "2026-10-30").length // 2
 */
export function fillDays(rows: readonly DayRecord[], from: string, to: string): DayRecord[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: DayRecord[] = [];
  for (let day = from; day <= to; day = nextDay(day))
    out.push(byDay.get(day) ?? { day, seconds: 0, coins: 0, todosDone: 0 });
  return out;
}

/**
 * 잔디 진하기 0~4.
 * @example heatLevel(2 * 3600, RECORDS_CONFIG) // 2
 */
export function heatLevel(seconds: number, config: HeatConfig): number {
  if (seconds < config.minSecondsForLevel1) return 0;
  return 1 + config.heatThresholdsSeconds.filter((t) => seconds >= t).length;
}

/** 0=월 ... 6=일. */
export const weekdayIndex = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
/** @example weekdayLabel("2026-10-30") // "금" */
export const weekdayLabel = (day: string) => WEEKDAYS[weekdayIndex(day)];

/**
 * 잔디 달력의 주 열 (월요일 시작). 첫 주 앞과 마지막 주 뒤의 빈칸은 null.
 * @example calendarWeeks("2026-10-26", "2026-11-01") // [["2026-10-26", ..., "2026-11-01"]]
 */
export function calendarWeeks(from: string, to: string): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = Array(weekdayIndex(from)).fill(null);
  for (let day = from; day <= to; day = nextDay(day)) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks;
}

/**
 * 공부 시간 문구. 가운뎃점 없이.
 * @example formatDuration(3 * 3600 + 5 * 60) // "3시간 5분"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
