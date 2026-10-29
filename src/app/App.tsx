import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import SessionProvider from "../features/account/viewmodel/SessionProvider";
import { queryClient } from "./queryClient";
import { router } from "./router";

/**
 * 앱 최상위. 서버 요청 캐시(TanStack Query), 로그인 세션, 주소 라우터를 연결한다.
 * useQuery와 useMutation은 각 기능의 viewmodel 훅 안에서만 쓴다.
 * View는 요청을 직접 하지 않고 ViewModel 훅의 결과만 읽는다.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  );
}
