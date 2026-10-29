import { useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../../account/viewmodel/useAccount";
import { ROUTES } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { findRoomByCode, findThemeRoom } from "../model/rooms";

/**
 * `/rooms/:code` 화면용 상태. 코드에 맞는 방이 없으면 room은 undefined.
 * @example const { room, nickname, exit } = useCompanyRoomRoute();
 */
export function useCompanyRoomRoute() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { rooms } = useAppState();
  const displayName = useProfile().data?.displayName ?? "";
  return {
    room: findRoomByCode(rooms.rooms, code),
    nickname: displayName,
    exit: () => navigate(ROUTES.lobby),
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
