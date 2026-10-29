import MyRoomList from "../../room/view/MyRoomList";
import PageFrame from "../../shell/view/PageFrame";
import { useRoomNavigation } from "../viewmodel/useRoomNavigation";

/** `/rooms`: 방 만들기, 코드로 들어가기, 내 방 목록 (Story 004, 서버). */
export default function RoomListPage() {
  const { enterCompanyRoom } = useRoomNavigation();
  return (
    <PageFrame title="스터디룸">
      <MyRoomList onEnter={enterCompanyRoom} />
    </PageFrame>
  );
}
