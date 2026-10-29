import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { addDays, todayKey } from "../../todos/model/studyDay";
import { recordsKeyPrefix } from "../../todos/viewmodel/useDayTodos";
import { fillDays } from "../model/records";
import { RECORDS_CONFIG } from "../model/recordsConfig";
import { recordsStore } from "../model/recordsStore";

/**
 * 기록 화면 데이터: 오늘, 최근 7일, 1년 (본인만). 서버 집계를 한 번에 불러 날짜를 채운다.
 * @example const { today, week, year } = useRecords();
 */
export function useRecords() {
  const userId = useSession()?.user.id;
  const today = todayKey();
  const from = addDays(today, -(RECORDS_CONFIG.calendarDays - 1));
  const query = useQuery({
    queryKey: [...recordsKeyPrefix(userId), "range", from, today],
    queryFn: () => recordsStore.range(from, today),
    enabled: !!userId,
  });
  const year = fillDays(query.data ?? [], from, today);
  return {
    today: year[year.length - 1],
    week: year.slice(-RECORDS_CONFIG.chartDays),
    year,
    todayKey: today,
    loading: query.isPending,
    failed: query.isError,
  };
}

/**
 * 하루 상세 (본인).
 * @example const { data } = useRecordDay("2026-10-29");
 */
export function useRecordDay(day: string) {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: [...recordsKeyPrefix(userId), "day", day],
    queryFn: () => recordsStore.day(day),
    enabled: !!userId,
  });
}
