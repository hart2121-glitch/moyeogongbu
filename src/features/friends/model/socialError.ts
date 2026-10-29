import type { SupabaseClient } from "@supabase/supabase-js";
import { SOCIAL_CONFIG } from "./socialConfig";

/** 친구, 우편, 알림 서버 함수가 거절한 이유. message는 화면 문구다. */
export class SocialError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SocialError";
  }
}

const MESSAGES: Record<string, string> = {
  invalid_code: "그 친구 코드를 가진 사람이 없어요. 코드를 다시 확인해 주세요.",
  self: "내 친구 코드예요.",
  friend_cap_other: "상대의 친구 목록이 가득 찼어요.",
  friend_cap: `친구는 최대 ${SOCIAL_CONFIG.friendCap}명까지 둘 수 있어요.`,
  you_blocked: "차단한 사람이에요. 설정에서 차단을 풀면 요청할 수 있어요.",
  not_same_room: "같은 방 멤버에게만 요청할 수 있어요.",
  no_request: "이미 처리된 요청이에요.",
  invalid_user: "그 사람에게는 할 수 없어요.",
  not_friend: "친구에게만 초대를 보낼 수 있어요.",
  room_full: "방이 6명으로 가득 차서 초대할 수 없어요.",
  already_member: "이미 이 방의 멤버예요.",
  not_member: "이 방의 멤버가 아니에요.",
  mail_expired: "보관 기한이 지난 우편이에요.",
  no_mail: "우편을 찾지 못했어요.",
  banned: "이 방에는 들어갈 수 없어요. 방장이 풀어 주면 다시 들어올 수 있어요.",
  members_full: "방이 가득 찼어요",
};

/**
 * 서버 오류를 SocialError로. 알려진 코드가 아니면 일반 문구.
 * @example toSocialError({ message: "friend_cap" }).message
 */
export function toSocialError(error: { message?: string } | null | undefined): SocialError {
  const message = error?.message ?? "";
  // friend_cap_other가 friend_cap보다 먼저 맞아야 하므로 MESSAGES 순서를 지킨다.
  const code = Object.keys(MESSAGES).find((key) => message.includes(key));
  return code
    ? new SocialError(code, MESSAGES[code])
    : new SocialError("unknown", "서버와 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
}

/** 서버 함수 호출. 실패하면 SocialError를 던진다. */
export async function socialRpc<T>(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw toSocialError(error);
  return data as T;
}
