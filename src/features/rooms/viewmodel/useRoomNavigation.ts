import { useNavigate } from "react-router-dom";
import type { Room } from "../../room/model/room";
import { useRoomActions } from "../../room/viewmodel/useMyRooms";
import { ROUTES, roomPath, themeRoomPath } from "../../shell/model/paths";
import { quickEnterRoom } from "../model/rooms";

/**
 * 스터디룸 입장 이동.
 * @example const { enterCompanyRoom } = useRoomNavigation(); enterCompanyRoom(room);
 */
export function useRoomNavigation() {
  const navigate = useNavigate();
  const { ensure } = useRoomActions();
  return {
    enterCompanyRoom: (room: Room) => navigate(roomPath(room.id)),
    /** 로비 빠른 입장: 내가 만든 첫 방, 없으면 내 방 목록의 첫 방, 방이 없으면 방 목록. */
    enterQuickCompanyRoom: async () => {
      const room = quickEnterRoom(await ensure().catch(() => []));
      navigate(room ? roomPath(room.id) : ROUTES.rooms);
    },
    enterTheme: (name: string) => navigate(themeRoomPath(name)),
  };
}
