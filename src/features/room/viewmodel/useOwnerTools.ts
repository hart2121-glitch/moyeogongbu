import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DecorSlot } from "../../../config/roomDecor";
import { roomStore } from "../model/roomStore";
import { useRoomActions } from "./useMyRooms";

/**
 * 방장 도구: 이름 변경, 초대 코드 재발급, 휴게실 꾸밈, 화이트보드 문구, 강퇴, 강퇴 풀기. 서버가 방장인지 다시 확인한다.
 * `onChanged`는 같은 방 사람들에게 다시 읽으라고 알릴 때 쓴다.
 * @example const tools = useOwnerTools(room.id, room.isOwner, live.notifyMembers);
 */
export function useOwnerTools(roomId: string, isOwner: boolean, onChanged: () => void) {
  const queryClient = useQueryClient();
  const { refresh } = useRoomActions();
  const bansKey = ["room-bans", roomId] as const;
  const bans = useQuery({ queryKey: bansKey, queryFn: () => roomStore.bans(roomId), enabled: isOwner });
  const after = async () => {
    await Promise.all([
      refresh(),
      queryClient.invalidateQueries({ queryKey: bansKey }),
      queryClient.invalidateQueries({ queryKey: ["room-members", roomId] }),
    ]);
    onChanged();
  };
  return {
    bans: bans.data ?? [],
    rename: async (name: string) => {
      await roomStore.rename(roomId, name);
      await after();
    },
    reissue: async () => {
      await roomStore.reissue(roomId);
      await after();
    },
    decorate: async (slot: DecorSlot, itemId: string) => {
      await roomStore.setDecor(roomId, slot, itemId);
      await after();
    },
    writeBoard: async (text: string) => {
      await roomStore.setBoard(roomId, text);
      await after();
    },
    kick: async (userId: string) => {
      await roomStore.kick(roomId, userId);
      await after();
    },
    unban: async (userId: string) => {
      await roomStore.unban(roomId, userId);
      await after();
    },
  };
}
