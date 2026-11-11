import { CAFE_SCENE } from "../../../study/roomScene";
import { RoomError } from "../../room/model/room";
import { useCafeRoute } from "../viewmodel/useRoomRoutes";
import LiveStudyRoom from "./LiveStudyRoom";
import RoomNotice from "./RoomNotice";

/**
 * `/cafe`: 공용 스터디카페 (Story 011). 초대 코드 없이 들어가 회사 방과 같은 실시간 공부방을 쓴다.
 * 한 카페에 여섯 명까지 앉고, 다 차면 서버가 옆 카페를 연다.
 */
export default function CafePage() {
  const cafe = useCafeRoute();
  if (cafe.error) {
    const message = cafe.error instanceof RoomError ? cafe.error.message : "카페에 들어가지 못했어요. 잠시 뒤 다시 시도해 주세요.";
    return (
      <RoomNotice
        testId="cafe-error"
        message={message}
        actions={
          <>
            {cafe.withFriend ? (
              <button className="primary" onClick={cafe.anyCafe}>
                다른 카페로 가기
              </button>
            ) : (
              <button className="primary" onClick={cafe.rejoin}>
                다시 들어가기
              </button>
            )}
            <button className="secondary-button" onClick={cafe.exit}>
              내 방으로
            </button>
          </>
        }
      />
    );
  }
  if (!cafe.room || !cafe.userId) return <RoomNotice message="카페에 들어가는 중이에요." />;
  return (
    <LiveStudyRoom
      key={`${cafe.room.id}:${cafe.attempt}`}
      room={cafe.room}
      userId={cafe.userId}
      nickname={cafe.nickname}
      scene={CAFE_SCENE}
      exit={cafe.exit}
      blocked={{ label: "다시 들어가기", action: cafe.rejoin }}
    />
  );
}
