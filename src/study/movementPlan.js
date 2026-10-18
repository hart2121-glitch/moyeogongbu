import { navigateFloor, segmentWalkable } from "./navigation.js";
import { distance } from "./pathfinding.js";

// 착석 예외는 자기 의자 중심의 세로 진입선에만 허용합니다.
// 책상 아래로 들어가는 연출만 허용하고 파티션/벽/다른 가구는 계속 차단합니다.
export function movementSegmentSafe(layout, segment) {
  const { from, to, seatId } = segment;
  if (!seatId) return segmentWalkable(layout, from, to);
  const seat = layout.seats.find((s) => s.id === seatId);
  if (!seat) return false;
  const entry = layout.nodes[seat.approach],
    anchor = layout.nodes[seat.node];
  if (
    [from, to].some(
      (p) =>
        Math.abs(p.x - anchor.x) > 1e-9 ||
        p.y < Math.min(entry.y, anchor.y) - 1e-9 ||
        p.y > Math.max(entry.y, anchor.y) + 1e-9,
    )
  )
    return false;
  const entryLayout = {
    ...layout,
    navigation: {
      ...layout.navigation,
      blockers: layout.navigation.blockers.filter(
        (r) => r.name !== seat.entryBlocker,
      ),
    },
  };
  return segmentWalkable(entryLayout, from, to);
}
export function planMovement(
  layout,
  start,
  destination,
  { activity = "seated", seatId = null } = {},
) {
  const target =
    typeof destination === "string" ? layout.nodes[destination] : destination;
  if (!target) throw new Error("이동 목적지를 찾을 수 없어요.");
  const oldSeat =
    start.activity === "seated"
      ? layout.seats.find((s) => s.id === start.seatId)
      : null;
  const newSeat =
    activity === "seated" ? layout.seats.find((s) => s.id === seatId) : null;
  if (activity === "seated" && !newSeat)
    throw new Error("올바른 좌석을 선택해 주세요.");
  const from = oldSeat ? layout.nodes[oldSeat.approach] : start.position;
  const walkEnd = newSeat ? layout.nodes[newSeat.approach] : target;
  const path = navigateFloor(layout, from, walkEnd),
    segments = [];
  const add = (from, to, activity, seatId = null) => {
    if (distance(from, to, layout.image) > 0.01)
      segments.push({ from, to, activity, seatId });
  };
  if (oldSeat) add(start.position, from, "standing", oldSeat.id);
  for (let i = 1; i < path.length; i++)
    add(path[i - 1], path[i], activity === "exit" ? "exiting" : "walking");
  if (newSeat) add(walkEnd, target, "sitting", newSeat.id);
  if (segments.some((s) => !movementSegmentSafe(layout, s)))
    throw new Error("좌석 진입 경로가 가구와 겹쳐 이동을 중단했어요.");
  return { segments, target };
}
