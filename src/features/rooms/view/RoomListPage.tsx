import RoomList from "../../../study/RoomList";
import PageFrame from "../../shell/view/PageFrame";
import { useAppState } from "../../shell/viewmodel/AppStateContext";
import { useRoomNavigation } from "../viewmodel/useRoomNavigation";

/** `/rooms`: 만든 방과 초대받은 방 목록. */
export default function RoomListPage() {
  const { rooms, createRoom, storageWarning } = useAppState().rooms;
  const { enterCompanyRoom } = useRoomNavigation();
  return (
    <PageFrame title="스터디룸">
      <RoomList
        rooms={rooms}
        createRoom={createRoom}
        storageWarning={storageWarning}
        onEnter={enterCompanyRoom}
      />
    </PageFrame>
  );
}
