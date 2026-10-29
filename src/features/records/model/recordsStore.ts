import { supabase } from "../../../lib/supabase";
import { fetchRecordDay, fetchRecords } from "./records";

/**
 * 앱이 쓰는 기록 저장소. `records.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const rows = await recordsStore.range(from, to);
 */
export const recordsStore = {
  range: (from: string, to: string) => fetchRecords(supabase, from, to),
  day: (day: string) => fetchRecordDay(supabase, day),
};
