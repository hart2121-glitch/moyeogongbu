import { CaretRight, Coffee, DoorOpen, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useCafeCount, useMyRooms } from "../../room/viewmodel/useMyRooms";
import { useRoomNavigation } from "../../rooms/viewmodel/useRoomNavigation";
import { ROUTES } from "../../shell/model/paths";
import DeskObject, { type LookHandler } from "./DeskObject";

/**
 * 모니터: 오늘 갈 곳을 고른다. 로비의 주요 행동. 집(로비)에서 회사 방으로 출근하거나 공용 스터디카페로 간다.
 * 학교 테마는 첫 출시 뒤에 연다 (design/game-brief.md 범위 밖).
 * 출근이라는 말은 회사 방에만 쓴다.
 */
export default function RoomMonitor({ onLook }: { onLook: LookHandler }) {
  const query = useMyRooms();
  const rooms = query.data ?? [];
  const cafeCount = useCafeCount().data ?? 0;
  const { enterCompanyRoom, enterCafe } = useRoomNavigation();
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
      <h3 className="monitor-group is-next">카페</h3>
      <ul className="monitor-rooms">
        <li>
          <button aria-label="공용 스터디카페로 가기" onClick={() => enterCafe()} data-testid="monitor-cafe">
            <Coffee weight="duotone" />
            <strong>공용 스터디카페</strong>
            <span>{cafeCount > 0 ? `${cafeCount}명 공부 중` : "아직 아무도 없어요"}</span>
            <span className="monitor-go">가기</span>
          </button>
        </li>
      </ul>
    </DeskObject>
  );
}
