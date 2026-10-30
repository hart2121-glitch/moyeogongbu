import { CaretRight } from "@phosphor-icons/react";
import PageFrame from "../../shell/view/PageFrame";
import { CAFE_ROOM_NAMES } from "../model/rooms";
import { useRoomNavigation } from "../viewmodel/useRoomNavigation";

/** `/cafe`: 공용 스터디카페 자리 고르기. */
export default function CafePage() {
  const { enterTheme } = useRoomNavigation();
  return (
    <PageFrame title="공용 스터디카페">
      <div className="page-intro">
        <h1>함께라서, 조금 더 집중되는 곳</h1>
        <p>오늘의 마음에 맞는 자리를 골라 보세요.</p>
      </div>
      <div className="cafe-rooms">
        {CAFE_ROOM_NAMES.map((name, i) => (
          <button
            className="cafe-room"
            key={name}
            onClick={() => enterTheme(name)}
          >
            <div className={`room-thumbnail room-${i}`} />
            <h2>{name}</h2>
            <p>자유 공부, 테마 미리보기</p>
            <span>
              자리 둘러보기 <CaretRight />
            </span>
          </button>
        ))}
      </div>
      <p className="muted">실시간 접속 인원과 채팅은 아직 연결되지 않았어요.</p>
    </PageFrame>
  );
}
