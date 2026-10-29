import { useNavigate } from "react-router-dom";
import { roomPath, themeRoomPath } from "../../shell/model/paths";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { quickEnterRoom, type StudyRoom } from "../model/rooms";

/**
 * 스터디룸 입장 이동.
 * @example const { enterCompanyRoom } = useRoomNavigation(); enterCompanyRoom(room);
 */
export function useRoomNavigation() {
  const navigate = useNavigate();
  const { rooms } = useAppState().rooms;
  return {
    enterCompanyRoom: (room: StudyRoom) => navigate(roomPath(room.code)),
    /** 로비 빠른 입장: 내가 만든 첫 방 또는 기본 초대 방. */
    enterQuickCompanyRoom: () => navigate(roomPath(quickEnterRoom(rooms).code)),
    enterTheme: (name: string) => navigate(themeRoomPath(name)),
  };
}
