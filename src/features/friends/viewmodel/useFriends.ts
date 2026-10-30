import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { friendStore } from "../model/friendStore";
import { SOCIAL_CONFIG } from "../model/socialConfig";

/** 친구, 우편, 알림 쿼리 키. 모두 계정별이다. */
export const socialKeys = {
  friends: (u: string | undefined) => ["friends", u] as const,
  blocks: (u: string | undefined) => ["blocks", u] as const,
  mail: (u: string | undefined) => ["mail", u] as const,
  notifications: (u: string | undefined) => ["notifications", u] as const,
  inbox: (u: string | undefined) => ["inbox", u] as const,
};

/**
 * 친구, 차단, 우편, 알림을 한꺼번에 새로 읽는다 (한쪽 동작이 다른 목록을 바꾸므로).
 * @example const refresh = useSocialRefresh(); await refresh();
 */
export function useSocialRefresh() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  return () =>
    Promise.all(
      Object.values(socialKeys).map((key) => queryClient.invalidateQueries({ queryKey: key(userId) })),
    ).then(() => undefined);
}

/**
 * 친구 목록과 상태 (서버). 주기적으로 다시 읽는다.
 * @example const friends = useFriends().data ?? [];
 */
export function useFriends() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: socialKeys.friends(userId),
    queryFn: friendStore.list,
    enabled: !!userId,
    refetchInterval: SOCIAL_CONFIG.friendPollMs,
  });
}

/** 내 차단 목록. @example const blocks = useBlocks().data ?? []; */
export function useBlocks() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: socialKeys.blocks(userId), queryFn: friendStore.blocks, enabled: !!userId });
}

/**
 * 친구 요청, 응답, 끊기, 차단, 해제. 끝나면 관련 목록을 새로 읽는다. 실패하면 SocialError를 던진다.
 * @example await useFriendActions().sendByCode("ABCD2345");
 */
export function useFriendActions() {
  const refresh = useSocialRefresh();
  const after = async <T,>(work: Promise<T>) => {
    const result = await work;
    await refresh();
    return result;
  };
  return {
    sendByCode: (code: string) => after(friendStore.sendByCode(code)),
    sendTo: (userId: string) => after(friendStore.sendTo(userId)),
    respond: (fromId: string, action: "accept" | "reject" | "block") => after(friendStore.respond(fromId, action)),
    unfriend: (userId: string) => after(friendStore.unfriend(userId)),
    block: (userId: string) => after(friendStore.block(userId)),
    unblock: (userId: string) => after(friendStore.unblock(userId)),
  };
}
