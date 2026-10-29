import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

/** 로그인 세션. 저장된 세션을 아직 확인하지 못했으면 undefined, 로그아웃 상태면 null. */
export type SessionState = Session | null | undefined;

export const SessionContext = createContext<SessionState>(undefined);

/**
 * 현재 로그인 세션을 읽는다. `SessionProvider` 안에서만 의미가 있다.
 * @example const session = useSession(); if (session === null) ...
 */
export const useSession = (): SessionState => useContext(SessionContext);
