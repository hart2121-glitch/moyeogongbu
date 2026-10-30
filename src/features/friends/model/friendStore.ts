import { supabase } from "../../../lib/supabase";
import {
  blockUser,
  fetchBlocks,
  fetchFriends,
  respondFriendRequest,
  sendFriendRequest,
  sendFriendRequestTo,
  unblockUser,
  unfriend,
} from "./friends";

/**
 * 앱이 쓰는 친구 저장소. `friends.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const friends = await friendStore.list();
 */
export const friendStore = {
  list: () => fetchFriends(supabase),
  sendByCode: (code: string) => sendFriendRequest(supabase, code),
  sendTo: (userId: string) => sendFriendRequestTo(supabase, userId),
  respond: (fromId: string, action: "accept" | "reject" | "block") => respondFriendRequest(supabase, fromId, action),
  unfriend: (userId: string) => unfriend(supabase, userId),
  block: (userId: string) => blockUser(supabase, userId),
  unblock: (userId: string) => unblockUser(supabase, userId),
  blocks: () => fetchBlocks(supabase),
};
