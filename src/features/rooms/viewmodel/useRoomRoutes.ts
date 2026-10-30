import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../account/viewmodel/SessionContext";
import { useProfile } from "../../account/viewmodel/useAccount";
import { useMyRooms } from "../../room/viewmodel/useMyRooms";
import { ROUTES } from "../../shell/model/paths";
import { findRoomById, findThemeRoom } from "../model/rooms";

/**
 * `/rooms/:roomId` 화면용 상태. 내 방 목록에 없으면 room은 undefined (loading이 끝난 뒤).
 * @example const { room, loading, nickname, userId, exit } = useCompanyRoomRoute();
 */
export function useCompanyRoomRoute() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const rooms = useMyRooms();
  const userId = useSession()?.user.id ?? "";
  const displayName = useProfile().data?.displayName ?? "";
  return {
    room: findRoomById(rooms.data ?? [], roomId),
    loading: rooms.isPending,
    nickname: displayName,
    userId,
    exit: () => navigate(ROUTES.lobby),
    toRooms: () => navigate(ROUTES.rooms),
  };
}

/**
 * `/themes/:theme` 화면용 상태. 알 수 없는 테마면 undefined.
 * @example const theme = useThemeRoomRoute();
 */
export function useThemeRoomRoute() {
  const { theme = "" } = useParams();
  return findThemeRoom(theme);
}
