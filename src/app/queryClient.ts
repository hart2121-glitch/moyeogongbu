import { QueryClient } from "@tanstack/react-query";

/** 서버 요청 캐시의 기본값. 쿼리마다 따로 정하지 않고 여기서만 바꾼다. */
export const QUERY_DEFAULTS = {
  /** 받은 데이터를 새것으로 보는 시간(ms). */
  staleTime: 30_000,
  /** 실패한 요청을 다시 시도하는 횟수. */
  retry: 1,
  /** 창에 다시 돌아올 때 자동으로 새로 받지 않는다. */
  refetchOnWindowFocus: false,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: { queries: QUERY_DEFAULTS },
});
