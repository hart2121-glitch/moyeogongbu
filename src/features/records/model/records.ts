import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayDetail, DayRecord } from "./recordTypes";

export type { DayDetail, DayRecord } from "./recordTypes";
export { calendarWeeks, fillDays, formatDuration, heatLevel, weekdayIndex, weekdayLabel } from "./recordMath";

/**
 * 공부 기록 (Story 005). 서버 함수는 부른 사람 본인의 기록만 돌려준다.
 * 순수 함수는 `recordMath.ts`에 있다.
 */

interface RecordRow {
  day: string;
  seconds: number | string;
  coins: number | string;
  todos_done: number | string;
}

/**
 * 기간의 날짜별 기록 (기록이 있는 날만).
 * @example const rows = await fetchRecords(supabase, "2025-10-31", "2026-10-30");
 */
export async function fetchRecords(client: SupabaseClient, from: string, to: string): Promise<DayRecord[]> {
  const { data, error } = await client.rpc("get_study_records", { p_from: from, p_to: to });
  if (error) throw error;
  return ((data ?? []) as RecordRow[]).map((r) => ({
    day: r.day,
    seconds: Number(r.seconds) || 0,
    coins: Number(r.coins) || 0,
    todosDone: Number(r.todos_done) || 0,
  }));
}

/**
 * 하루 상세.
 * @example const detail = await fetchRecordDay(supabase, "2026-10-29");
 */
export async function fetchRecordDay(client: SupabaseClient, day: string): Promise<DayDetail> {
  const { data, error } = await client.rpc("get_record_day", { p_day: day });
  if (error) throw error;
  const row = data as {
    day: string;
    study_seconds: number;
    coins: { study: number; pomodoro: number; todo: number };
    total: number;
    todos_done: string[];
  };
  return {
    day: row.day,
    studySeconds: Number(row.study_seconds) || 0,
    coins: {
      study: Number(row.coins?.study) || 0,
      pomodoro: Number(row.coins?.pomodoro) || 0,
      todo: Number(row.coins?.todo) || 0,
    },
    total: Number(row.total) || 0,
    todosDone: row.todos_done ?? [],
  };
}
