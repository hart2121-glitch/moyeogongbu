import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoinRules, CoinsByKind, PomodoroClaim } from "./coinMath";

/**
 * 코인 서버 호출 (Story 003). 적립은 모두 서버 함수가 하고, 여기서는 읽기와 요청만 한다.
 * 함수는 Supabase 클라이언트를 인자로 받고, `coinStore.ts`가 공유 클라이언트를 묶는다.
 */

/** 하루 정산 내용. */
export interface CoinDaySummary {
  /** 공부 날짜 (YYYY-MM-DD, 오전 5시 경계). */
  day: string;
  studySeconds: number;
  coins: CoinsByKind;
  /** 그날 받은 코인 합계. */
  total: number;
  /** 지금 잔액. */
  balance: number;
}

/** 오늘 정산과 표시용 규칙. */
export interface CoinSummary extends CoinDaySummary {
  rules: CoinRules;
}

interface SummaryRow {
  day: string;
  study_seconds: number;
  coins: { study: number; pomodoro: number; todo: number };
  total: number;
  balance: number;
}

interface RulesRow {
  study_coins_per_minute: number;
  study_daily_coin_cap: number;
  pomodoro_bonus: number;
  pomodoro_min_study_minutes: number;
  pomodoro_max_study_minutes: number;
  pomodoro_daily_max: number;
  todo_coins: number;
  todo_daily_max: number;
}

const toDay = (row: SummaryRow): CoinDaySummary => ({
  day: row.day,
  studySeconds: Number(row.study_seconds) || 0,
  coins: {
    study: Number(row.coins?.study) || 0,
    pomodoro: Number(row.coins?.pomodoro) || 0,
    todo: Number(row.coins?.todo) || 0,
  },
  total: Number(row.total) || 0,
  balance: Number(row.balance) || 0,
});

const toRules = (row: RulesRow): CoinRules => ({
  studyCoinsPerMinute: row.study_coins_per_minute,
  studyDailyCoinCap: row.study_daily_coin_cap,
  pomodoroBonus: row.pomodoro_bonus,
  pomodoroMinStudyMinutes: row.pomodoro_min_study_minutes,
  pomodoroMaxStudyMinutes: row.pomodoro_max_study_minutes,
  pomodoroDailyMax: row.pomodoro_daily_max,
  todoCoins: row.todo_coins,
  todoDailyMax: row.todo_daily_max,
});

async function rpc<T>(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

/**
 * 오늘 코인, 잔액, 표시용 규칙. 서버가 공부 코인을 먼저 다시 계산한다.
 * @example const summary = await fetchCoinSummary(supabase);
 */
export async function fetchCoinSummary(client: SupabaseClient): Promise<CoinSummary> {
  const row = await rpc<SummaryRow & { rules: RulesRow }>(client, "get_coin_summary");
  return { ...toDay(row), rules: toRules(row.rules) };
}

/**
 * 퇴근 정산. 서버의 정산 표시를 비우고 그날 정산을 돌려준다.
 * @example const card = await settleStudy(supabase);
 */
export async function settleStudy(client: SupabaseClient): Promise<CoinDaySummary> {
  return toDay(await rpc<SummaryRow>(client, "settle_study"));
}

/**
 * 퇴근 없이 닫았던 가장 최근 하루의 정산. 없으면 null.
 * @example const last = await fetchPendingSettlement(supabase);
 */
export async function fetchPendingSettlement(client: SupabaseClient): Promise<CoinDaySummary | null> {
  const row = await rpc<SummaryRow | null>(client, "pending_settlement");
  return row ? toDay(row) : null;
}

/**
 * 지난 정산을 닫았다. 다시 뜨지 않는다.
 * @example await dismissSettlement(supabase, "2026-10-29");
 */
export async function dismissSettlement(client: SupabaseClient, day: string): Promise<void> {
  await rpc<null>(client, "dismiss_settlement", { p_day: day });
}

/**
 * 뽀모도로 완주 보너스 요청. 서버가 공부 구간, 중복, 하루 횟수를 검사해 줄지 정한다.
 * @returns 지급했으면 true
 * @example await claimPomodoroBonus(supabase, { cycleStartedAt, studyMinutes: 25 });
 */
export async function claimPomodoroBonus(client: SupabaseClient, claim: PomodoroClaim): Promise<boolean> {
  const result = await rpc<{ awarded: boolean }>(client, "claim_pomodoro_bonus", {
    p_cycle_started_at: new Date(claim.cycleStartedAt).toISOString(),
    p_study_minutes: claim.studyMinutes,
  });
  return !!result?.awarded;
}
