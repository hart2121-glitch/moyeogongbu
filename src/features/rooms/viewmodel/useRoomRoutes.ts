import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../../account/viewmodel/SessionContext";
import { useProfile } from "../../account/viewmodel/useAccount";
import { roomStore } from "../../room/model/roomStore";
import { useMyRooms } from "../../room/viewmodel/useMyRooms";
import { CAFE_WITH_PARAM, ROUTES } from "../../shell/model/paths";
import { findRoomById } from "../model/rooms";

/**
 * `/rooms/:roomId` 화면용 상태. 내 방 목록에 없으면 room은 undefined (loading이 끝난 뒤).
 * @example const { room, loading, nickname, userId, exit } = useCompanyRoomRoute();
 */
export function useCompanyRoomRoute() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const rooms = useMyRooms();
  const userId = useSession()?.user.id ?? "";
  const displayName = useProfile().data?.displayName ?? "";
  return {
    room: findRoomById(rooms.data ?? [], roomId),
    loading: rooms.isPending,
    nickname: displayName,
    userId,
    exit: () => navigate(ROUTES.lobby),
    toRooms: () => navigate(ROUTES.rooms),
  };
}

/**
 * `/cafe` 화면용 상태 (Story 011): 공용 카페에 들어가(join_cafe) 그 카페를 돌려준다.
 * `?with=<카페 id>`면 그 카페(친구가 있는 곳)로 간다. 화면을 떠나면 들어간 기록을 버려, 다시 오면 새로 들어간다.
 * `attempt`는 다시 들어갈 때마다 바뀌어 실시간 방을 새로 연다.
 * @example const cafe = useCafeRoute(); cafe.room && <LiveStudyRoom key={cafe.attempt} room={cafe.room} ... />
 */
export function useCafeRoute() {
  const [params, setParams] = useSearchParams();
  const withRoom = params.get(CAFE_WITH_PARAM) || null;
  const navigate = useNavigate();
  const userId = useSession()?.user.id ?? "";
  const displayName = useProfile().data?.displayName ?? "";
  const join = useQuery({
    queryKey: ["cafe-join", userId, withRoom],
    queryFn: () => roomStore.joinCafe(withRoom),
    enabled: !!userId,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return {
    room: join.isError || join.isFetching ? undefined : join.data,
    attempt: join.dataUpdatedAt,
    error: join.isFetching ? null : join.error,
    withFriend: withRoom !== null,
    userId,
    nickname: displayName,
    rejoin: () => void join.refetch(),
    /** 친구가 있던 카페 말고 자리가 남은 아무 카페로. */
    anyCafe: () => setParams({}, { replace: true }),
    exit: () => navigate(ROUTES.lobby),
  };
}
