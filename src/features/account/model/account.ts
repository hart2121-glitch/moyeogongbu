import type { Session, SupabaseClient } from "@supabase/supabase-js";

/** 화면 이름 글자 수 범위 (앞뒤 공백 제외). DB의 check 제약과 같다. */
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_DISPLAY_NAME_LENGTH = 12;

/** 화면 이름 입력 규칙 안내 문구. */
export const DISPLAY_NAME_RULE = `앞뒤 공백을 뺀 ${MIN_DISPLAY_NAME_LENGTH}~${MAX_DISPLAY_NAME_LENGTH}자`;

/** 로그인한 계정의 프로필. 화면 이름은 첫 로그인 직후에 null이다. */
export interface Profile {
  /** Supabase 계정 UUID. 내부 식별에만 쓴다. */
  id: string;
  displayName: string | null;
  /** 가입 때 발급된 고정 8자 친구 코드. */
  friendCode: string;
}

/**
 * 화면 이름 입력을 정리한다. 앞뒤 공백을 빼고 1~12자가 아니면 null.
 * 글자 수는 DB의 char_length와 같게 코드 포인트로 센다.
 * @example normalizeDisplayName("  공부친구 ") // "공부친구"
 * @example normalizeDisplayName("   ") // null
 */
export function normalizeDisplayName(input: string): string | null {
  const name = input.trim();
  const length = [...name].length;
  return length >= MIN_DISPLAY_NAME_LENGTH && length <= MAX_DISPLAY_NAME_LENGTH
    ? name
    : null;
}

/**
 * Google 로그인 페이지로 이동한다. 로그인을 마치면 `redirectTo`로 돌아온다.
 * @example await signInWithGoogle(supabase, `${location.origin}/lobby`);
 */
export async function signInWithGoogle(
  client: SupabaseClient,
  redirectTo: string,
): Promise<void> {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/**
 * 로그아웃한다. 브라우저에 저장된 인증 정보도 지워진다.
 * @example await signOut(supabase);
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * 로그인 상태가 바뀔 때마다 현재 세션을 알린다. 구독 직후 저장된 세션으로 한 번 호출된다.
 * @returns 구독 해제 함수
 * @example const stop = watchSession(supabase, setSession);
 */
export function watchSession(
  client: SupabaseClient,
  onChange: (session: Session | null) => void,
): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) =>
    onChange(session),
  );
  return () => data.subscription.unsubscribe();
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  friend_code: string;
}

const PROFILE_COLUMNS = "id, display_name, friend_code";

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  displayName: row.display_name,
  friendCode: row.friend_code,
});

/**
 * 본인 프로필을 읽는다. 행 단위 보안 규칙상 본인 행만 보인다.
 * @example const profile = await fetchProfile(supabase, session.user.id);
 */
export async function fetchProfile(
  client: SupabaseClient,
  userId: string,
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}

/**
 * 화면 이름을 바꾼다. 이름은 `normalizeDisplayName`을 통과한 값이어야 한다.
 * @example await updateDisplayName(supabase, userId, "공부친구");
 */
export async function updateDisplayName(
  client: SupabaseClient,
  userId: string,
  displayName: string,
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}

/**
 * 계정을 영구 삭제하고 로그아웃한다. 프로필은 DB에서 연쇄 삭제된다.
 * @example await deleteAccount(supabase);
 */
export async function deleteAccount(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("delete_account");
  if (error) throw error;
  // 서버에서 계정이 지워져 세션 무효화 요청이 실패할 수 있으므로 이 브라우저의 세션만 지운다.
  await client.auth.signOut({ scope: "local" });
}
