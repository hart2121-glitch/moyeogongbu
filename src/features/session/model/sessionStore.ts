import { supabase } from "../../../lib/supabase";
import {
  claimSession,
  heartbeat,
  markAway,
  setSessionState,
  watchSessionOwner,
} from "./session";

/**
 * 앱이 쓰는 공부 세션 저장소. `session.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * ViewModel 훅은 클라이언트 대신 이 객체만 쓴다.
 * @example const snap = await sessionStore.claim(tabId);
 */
export const sessionStore = {
  claim: (tabId: string) => claimSession(supabase, tabId),
  setState: (tabId: string, state: Parameters<typeof setSessionState>[2]) =>
    setSessionState(supabase, tabId, state),
  heartbeat: (tabId: string) => heartbeat(supabase, tabId),
  markAway: (tabId: string, at: number) => markAway(supabase, tabId, at),
  watchOwner: (userId: string, onTabChange: (tabId: string) => void) =>
    watchSessionOwner(supabase, userId, onTabChange),
};

export type SessionStore = typeof sessionStore;
