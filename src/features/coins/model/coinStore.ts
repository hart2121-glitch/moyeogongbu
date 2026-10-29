import { supabase } from "../../../lib/supabase";
import type { PomodoroClaim } from "./coinMath";
import {
  claimPomodoroBonus,
  dismissSettlement,
  fetchCoinSummary,
  fetchPendingSettlement,
  settleStudy,
} from "./coins";

/**
 * 앱이 쓰는 코인 저장소. `coins.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const summary = await coinStore.summary();
 */
export const coinStore = {
  summary: () => fetchCoinSummary(supabase),
  settle: () => settleStudy(supabase),
  pending: () => fetchPendingSettlement(supabase),
  dismiss: (day: string) => dismissSettlement(supabase, day),
  claimPomodoro: (claim: PomodoroClaim) => claimPomodoroBonus(supabase, claim),
};

export type CoinStore = typeof coinStore;
