import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import { useRefreshCoins } from "../../coins/viewmodel/useCoins";
import { friendStore } from "../../friends/model/friendStore";
import { socialKeys, useSocialRefresh } from "../../friends/viewmodel/useFriends";
import { roomsKey } from "../../room/viewmodel/useMyRooms";
import { mailStore } from "../model/mailStore";

/**
 * 우편함 목록과 동작. 보상은 Story 003 원장으로 들어가므로 받으면 코인 숫자를 새로 고친다.
 * @example const { mail, claim, enterRoom } = useMailbox();
 */
export function useMailbox() {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const refresh = useSocialRefresh();
  const refreshCoins = useRefreshCoins();
  const query = useQuery({ queryKey: socialKeys.mail(userId), queryFn: mailStore.list, enabled: !!userId });
  return {
    mail: query.data ?? [],
    loading: query.isPending,
    failed: query.isError,
    claim: async (id: number) => {
      const amount = await mailStore.claim(id);
      await Promise.all([refresh(), refreshCoins()]);
      return amount;
    },
    /** 초대받은 방의 멤버가 되고 방 id를 돌려준다. */
    enterRoom: async (id: number) => {
      const roomId = await mailStore.acceptInvite(id);
      await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: roomsKey(userId) })]);
      return roomId;
    },
    remove: async (id: number) => {
      await mailStore.remove(id);
      await refresh();
    },
    respond: async (fromId: string, action: "accept" | "reject" | "block") => {
      await friendStore.respond(fromId, action);
      await refresh();
    },
  };
}

/**
 * 방 초대 보내기. 실패하면 SocialError(room_full 등)를 던진다.
 * @example await useRoomInvite().invite(room.id, friend.userId);
 */
export function useRoomInvite() {
  return { invite: (roomId: string, friendId: string) => mailStore.invite(roomId, friendId) };
}
