import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { COMPANY_SCENE } from "../../../study/roomScene";
import { ROUTES } from "../../shell/model/paths";
import { useCompanyRoomRoute } from "../viewmodel/useRoomRoutes";
import LiveStudyRoom from "./LiveStudyRoom";
import RoomNotice from "./RoomNotice";

/**
 * `/rooms/:roomId`: 실시간 회사 스터디룸과 공부 세션. 내 방 목록에 없는 방이면 방 목록으로 돌아간다.
 * 퇴근하면 출입구에 도착한 뒤 "오늘의 정산" 카드를 한 번 보여 주고 로비로 간다 (Story 003).
 */
export default function CompanyRoomPage() {
  const route = useCompanyRoomRoute();
  // 방 안에서 강퇴되면 목록에서 방이 빠져도 마지막 방을 유지해 "멤버가 아니에요" 안내를 보여 준다.
  const last = useRef(route.room);
  if (route.room) last.current = route.room;
  const room = route.room ?? last.current;
  if (!room && (route.loading || !route.userId)) return <RoomNotice message="방 정보를 불러오는 중이에요." />;
  if (!room || !route.userId) return <Navigate to={ROUTES.rooms} replace />;
  return (
    <LiveStudyRoom
      key={room.id}
      room={room}
      userId={route.userId}
      nickname={route.nickname}
      scene={COMPANY_SCENE}
      exit={route.exit}
      blocked={{ label: "방 목록으로", action: route.toRooms }}
    />
  );
}
