import { Navigate } from "react-router-dom";
import CompanyRoom from "../../../study/CompanyRoom";
import { ROUTES } from "../../shell/model/paths";
import { useCompanyRoomRoute } from "../viewmodel/useRoomRoutes";

/** `/rooms/:code`: 회사 스터디룸. 코드에 맞는 방이 없으면 방 목록으로 돌아간다. */
export default function CompanyRoomPage() {
  const { room, nickname, exit } = useCompanyRoomRoute();
  if (!room) return <Navigate to={ROUTES.rooms} replace />;
  return (
    <CompanyRoom key={room.id} room={room} nickname={nickname} onExit={exit} />
  );
}
