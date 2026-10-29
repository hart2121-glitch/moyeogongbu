import { useEffect, useState, type ReactNode } from "react";
import { accountStore } from "../model/accountStore";
import { SessionContext, type SessionState } from "./SessionContext";

/**
 * 로그인 상태를 구독해 하위 화면에 내려 준다. 세션은 브라우저 로컬 스토리지에 저장되므로
 * 새로고침해도 유지된다. 라우터 바깥, 앱 최상위에 한 번만 둔다.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(undefined);
  useEffect(() => accountStore.watchSession(setSession), []);
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}
