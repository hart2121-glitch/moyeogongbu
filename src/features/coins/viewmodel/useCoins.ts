import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import type { CoinDaySummary } from "../model/coins";
import { coinStore } from "../model/coinStore";

/** 오늘 코인과 잔액 쿼리 키. 무효화하면 상단 지갑과 로비 숫자가 함께 새로 고쳐진다. */
export const coinKey = (userId: string | undefined) => ["coins", userId] as const;
const pendingKey = (userId: string | undefined) => ["settlement", "pending", userId] as const;

/**
 * 오늘 코인, 잔액, 표시용 규칙 (서버 값).
 * @example const balance = useCoinSummary().data?.balance ?? 0;
 */
export function useCoinSummary() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: coinKey(userId),
    queryFn: coinStore.summary,
    enabled: !!userId,
  });
}

/**
 * 코인 값이 바뀌었을 수 있을 때 부른다 (공부 상태 전송, 할 일 완료 등).
 * @example const refreshCoins = useRefreshCoins(); refreshCoins();
 */
export function useRefreshCoins() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  return () => void queryClient.invalidateQueries({ queryKey: coinKey(userId) });
}

/**
 * 퇴근 없이 닫았던 날의 "지난 정산". 페이지를 처음 열 때 한 번만 묻는다.
 * @example const { summary, dismiss } = usePendingSettlement();
 */
export function usePendingSettlement() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const query = useQuery({
    queryKey: pendingKey(userId),
    queryFn: coinStore.pending,
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const dismiss = useMutation({
    mutationFn: (day: string) => coinStore.dismiss(day),
    onMutate: () => queryClient.setQueryData(pendingKey(userId), null),
  });
  return {
    summary: query.data ?? null,
    dismiss: (day: string) => dismiss.mutate(day),
  };
}

/**
 * 퇴근 정산. 정산 내용을 돌려주고, 이번 방문에서는 지난 정산 팝업을 다시 띄우지 않는다.
 * @example const card = await settle();
 */
export function useSettleStudy() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  return async (): Promise<CoinDaySummary> => {
    const summary = await coinStore.settle();
    queryClient.setQueryData(pendingKey(userId), null);
    void queryClient.invalidateQueries({ queryKey: coinKey(userId) });
    return summary;
  };
}
