import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "./socialError";

/**
 * 친구 (Story 006). 서버 함수는 부른 사람과 관련된 줄만 다룬다.
 * 상태는 Story 002 공부 세션, 있는 방은 Story 004 접속 정보에서 서버가 계산한다.
 */

import type { FriendIcon, FriendState } from "./friendText";

export type { FriendIcon, FriendState } from "./friendText";

export interface Friend {
  userId: string;
  name: string;
  state: FriendState;
  /** 지금 스터디룸 안에 있는지. */
  inRoom: boolean;
  /** 내가 그 방 멤버일 때만 채워진다. */
  roomId: string | null;
  roomName: string | null;
}

export interface BlockedUser {
  userId: string;
  name: string;
}

export type RequestResult = "sent" | "accepted" | "already_friends";

export { friendIcon, friendPlace, friendStatusLabel, normalizeFriendCode } from "./friendText";

interface FriendRow {
  user_id: string;
  display_name: string | null;
  state: FriendState;
  in_room: boolean;
  room_id: string | null;
  room_name: string | null;
}

const toFriend = (row: FriendRow): Friend => ({
  userId: row.user_id,
  name: row.display_name ?? "이름 없음",
  state: row.state ?? "offline",
  inRoom: !!row.in_room,
  roomId: row.room_id ?? null,
  roomName: row.room_name ?? null,
});

/** 친구 목록과 상태. @example const friends = await fetchFriends(supabase); */
export const fetchFriends = async (client: SupabaseClient): Promise<Friend[]> =>
  ((await socialRpc<FriendRow[]>(client, "list_friends")) ?? []).map(toFriend);

/** 8자 친구 코드로 요청. @example await sendFriendRequest(supabase, "ABCD2345") */
export const sendFriendRequest = async (client: SupabaseClient, code: string): Promise<RequestResult> =>
  (await socialRpc<{ status: RequestResult }>(client, "send_friend_request", { p_code: code })).status;

/** 같은 방 캐릭터에게 요청. @example await sendFriendRequestTo(supabase, userId) */
export const sendFriendRequestTo = async (client: SupabaseClient, userId: string): Promise<RequestResult> =>
  (await socialRpc<{ status: RequestResult }>(client, "send_friend_request_to", { p_user: userId })).status;

/** 받은 요청에 답한다. @example await respondFriendRequest(supabase, fromId, "accept") */
export const respondFriendRequest = (client: SupabaseClient, fromId: string, action: "accept" | "reject" | "block") =>
  socialRpc<unknown>(client, "respond_friend_request", { p_from: fromId, p_action: action });

/** 친구 끊기 (상대에게 알리지 않는다). */
export const unfriend = (client: SupabaseClient, userId: string) => socialRpc<void>(client, "unfriend", { p_user: userId });

/** 차단. 친구 관계와 오가는 요청도 지워진다. */
export const blockUser = (client: SupabaseClient, userId: string) => socialRpc<void>(client, "block_user", { p_user: userId });

/** 차단 해제. */
export const unblockUser = (client: SupabaseClient, userId: string) => socialRpc<void>(client, "unblock_user", { p_user: userId });

/** 내 차단 목록. */
export const fetchBlocks = async (client: SupabaseClient): Promise<BlockedUser[]> =>
  ((await socialRpc<{ user_id: string; display_name: string | null }[]>(client, "list_blocks")) ?? []).map((r) => ({
    userId: r.user_id,
    name: r.display_name ?? "이름 없음",
  }));
