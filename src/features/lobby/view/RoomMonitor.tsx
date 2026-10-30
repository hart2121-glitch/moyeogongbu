import { BookOpen, CaretRight, Coffee, DoorOpen, Plus } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useMyRooms } from "../../room/viewmodel/useMyRooms";
import { useRoomNavigation } from "../../rooms/viewmodel/useRoomNavigation";
import { ROUTES } from "../../shell/model/paths";
import DeskObject, { type LookHandler } from "./DeskObject";

/**
 * 모니터: 오늘 갈 곳을 고른다. 로비의 주요 행동. 집(로비)에서 회사 방으로 출근하거나 스터디카페로 가고, 학교는 준비 중이다.
 * 출근이라는 말은 회사 방에만 쓴다.
 */
export default function RoomMonitor({ onLook }: { onLook: LookHandler }) {
  const query = useMyRooms();
  const rooms = query.data ?? [];
  const { enterCompanyRoom } = useRoomNavigation();
  const navigate = useNavigate();
  return (
    <DeskObject
      kind="monitor"
      title="오늘 어디로 갈까"
      onLook={onLook}
      action={
        <Link className="desk-more" to={ROUTES.rooms}>
          회사 방 목록 <CaretRight />
        </Link>
      }
    >
      <h3 className="monitor-group">회사</h3>
      {query.isPending && <p className="desk-empty">방 목록을 불러오는 중이에요.</p>}
      {query.isError && <p className="desk-empty">방 목록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>}
      {query.isSuccess && rooms.length === 0 && (
        <div className="desk-empty">
          <p>아직 출근할 회사 방이 없어요.</p>
          <Link className="monitor-create" to={ROUTES.rooms}>
            <Plus /> 방 만들거나 초대 코드로 들어가기
          </Link>
        </div>
      )}
      {rooms.length > 0 && (
        <ul className="monitor-rooms">
          {rooms.map((room) => (
            <li key={room.id}>
              <button aria-label={`${room.name} 방으로 출근`} onClick={() => enterCompanyRoom(room)}>
                <DoorOpen weight="duotone" />
                <strong>{room.name}</strong>
                <span>
                  {room.onlineCount > 0 ? `${room.onlineCount}명 출근 중` : "아직 아무도 없어요"}
                  {room.isOwner && <em>내가 만든 방</em>}
                </span>
                <span className="monitor-go">출근</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ul className="monitor-places" aria-label="다른 곳">
        <li>
          <button onClick={() => navigate(ROUTES.cafe)}>
            <Coffee weight="duotone" /> 스터디카페
          </button>
        </li>
        <li>
          <button disabled aria-describedby="monitor-school-note">
            <BookOpen weight="duotone" /> 학교
          </button>
          <span id="monitor-school-note">준비 중</span>
        </li>
      </ul>
    </DeskObject>
  );
}
