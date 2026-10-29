import { supabase } from "../../../lib/supabase";
import {
  deleteAccount,
  fetchProfile,
  signInWithGoogle,
  signOut,
  updateDisplayName,
  watchSession,
} from "./account";

/**
 * 앱이 쓰는 계정 저장소. `account.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * ViewModel 훅은 클라이언트 대신 이 객체만 쓴다.
 * @example await accountStore.fetchProfile(session.user.id);
 */
export const accountStore = {
  signInWithGoogle: (redirectTo: string) => signInWithGoogle(supabase, redirectTo),
  signOut: () => signOut(supabase),
  watchSession: (onChange: Parameters<typeof watchSession>[1]) =>
    watchSession(supabase, onChange),
  fetchProfile: (userId: string) => fetchProfile(supabase, userId),
  updateDisplayName: (userId: string, displayName: string) =>
    updateDisplayName(supabase, userId, displayName),
  deleteAccount: () => deleteAccount(supabase),
};
