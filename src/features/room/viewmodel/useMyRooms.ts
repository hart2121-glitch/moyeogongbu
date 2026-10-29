import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../account/viewmodel/SessionContext";
import type { Room } from "../model/room";
import { roomStore } from "../model/roomStore";

/** 내 방 목록 쿼리 키. */
export const roomsKey = (userId: string | undefined) => ["rooms", userId] as const;

/**
 * 내 방 목록 (서버). 코드로 들어온 방도 남는다.
 * @example const rooms = useMyRooms().data ?? [];
 */
export function useMyRooms() {
  const userId = useSession()?.user.id;
  return useQuery({ queryKey: roomsKey(userId), queryFn: roomStore.list, enabled: !!userId });
}

/**
 * 방 만들기, 코드로 들어가기, 나가기. 끝나면 내 방 목록을 새로 읽는다. 실패하면 RoomError를 던진다.
 * @example const room = await useRoomActions().create("밍구의 회사");
 */
export function useRoomActions() {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const refresh = () => queryClient.invalidateQueries({ queryKey: roomsKey(userId) });
  return {
    create: async (name: string): Promise<Room> => {
      const room = await roomStore.create(name);
      await refresh();
      return room;
    },
    join: async (code: string): Promise<Room> => {
      const room = await roomStore.join(code);
      await refresh();
      return room;
    },
    leave: async (roomId: string) => {
      await roomStore.leave(roomId);
      await refresh();
    },
    refresh,
    /** 목록이 아직 없으면 받아 온다 (로비 빠른 입장). */
    ensure: () => queryClient.ensureQueryData({ queryKey: roomsKey(userId), queryFn: roomStore.list }),
  };
}
