import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServerState } from "./sessionMachine";

/**
 * 공부 세션 서버 호출 (Story 002). 모든 시각 계산은 서버 RPC가 now()로 한다.
 * 함수는 Supabase 클라이언트를 인자로 받고, `sessionStore.ts`가 공유 클라이언트를 묶는다.
 */

/** 서버가 RPC마다 돌려주는 현재 상태. 시각은 밀리초. */
export interface SessionSnapshot {
  serverNow: number;
  /** 오늘 공부 날짜 (YYYY-MM-DD, 오전 5시 경계). */
  day: string;
  /** 오늘 닫힌 구간의 공부 초. */
  closedSeconds: number;
  /** 지금 열려 있는 공부 구간의 시작. 공부 중이 아니면 null. */
  openSince: number | null;
  state: ServerState | null;
  tabId: string | null;
}

/** 다른 탭이나 기기가 세션을 넘겨받아 이 탭의 요청이 거절됐다. */
export class SessionTakenError extends Error {
  constructor() {
    super("다른 곳에서 접속했어요");
    this.name = "SessionTakenError";
  }
}

interface SnapshotRow {
  server_now: string;
  day: string;
  closed_seconds: number;
  open_since: string | null;
  state: ServerState | null;
  tab_id: string | null;
}

const toSnapshot = (row: SnapshotRow): SessionSnapshot => ({
  serverNow: Date.parse(row.server_now),
  day: row.day,
  closedSeconds: Number(row.closed_seconds) || 0,
  openSince: row.open_since ? Date.parse(row.open_since) : null,
  state: row.state,
  tabId: row.tab_id,
});

async function call(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<SessionSnapshot> {
  const { data, error } = await client.rpc(fn, args);
  if (error) {
    if (error.message?.includes("session_taken")) throw new SessionTakenError();
    throw error;
  }
  return toSnapshot(data as SnapshotRow);
}

/**
 * 이 탭이 세션을 가진다. 이전 탭은 실시간 변경으로 넘겨받았음을 알게 된다.
 * @example const snap = await claimSession(supabase, tabId);
 */
export const claimSession = (client: SupabaseClient, tabId: string) =>
  call(client, "claim_study_session", { p_tab_id: tabId });

/**
 * 상태를 바꾼다. studying이면 서버가 공부 구간을 열고, 나머지는 닫는다.
 * @example await setSessionState(supabase, tabId, "break");
 */
export const setSessionState = (
  client: SupabaseClient,
  tabId: string,
  state: Exclude<ServerState, "away">,
) => call(client, "set_study_state", { p_tab_id: tabId, p_state: state });

/**
 * 연결 확인. 2분 넘게 끊겼다 돌아왔으면 서버가 끊긴 시간을 뺀다.
 * @example await heartbeat(supabase, tabId);
 */
export const heartbeat = (client: SupabaseClient, tabId: string) =>
  call(client, "heartbeat_study_session", { p_tab_id: tabId });

/**
 * 자리 비움. 확인 문구를 띄운 서버 시각 `at`에 공부 구간을 닫는다.
 * @example await markAway(supabase, tabId, prompt.shownAt);
 */
export const markAway = (client: SupabaseClient, tabId: string, at: number) =>
  call(client, "mark_study_away", { p_tab_id: tabId, p_at: new Date(at).toISOString() });

/**
 * 내 세션 행의 탭 식별자가 바뀔 때마다 알린다 (다른 탭이 넘겨받았는지 판단용).
 * 실시간 연결이 안 되면 조용히 알림만 오지 않고, 다음 RPC의 session_taken 오류가 대신한다.
 * @returns 구독 해제 함수
 * @example const stop = watchSessionOwner(supabase, userId, (tab) => ...);
 */
export function watchSessionOwner(
  client: SupabaseClient,
  userId: string,
  onTabChange: (tabId: string) => void,
): () => void {
  const channel = client
    .channel(`study-session-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "study_sessions", filter: `user_id=eq.${userId}` },
      (payload) => {
        const tab = (payload.new as { tab_id?: string } | null)?.tab_id;
        if (tab) onTabChange(tab);
      },
    )
    .subscribe();
  return () => void client.removeChannel(channel);
}
