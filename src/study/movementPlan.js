import { navigateFloor, segmentWalkable } from "./navigation.js";
import { distance } from "./pathfinding.js";

// 착석 예외는 자기 의자 중심의 세로 진입선에만 허용합니다.
// 책상 아래로 들어가는 연출만 허용하고 파티션/벽/다른 가구는 계속 차단합니다.
// 소파처럼 가구 위에 앉는 구역(areas의 approach, entryBlocker)도 같은 세로 진입선 예외를 씁니다.
export function movementSegmentSafe(layout, segment) {
  const { from, to, seatId, areaId } = segment;
  if (!seatId && !areaId) return segmentWalkable(layout, from, to);
  const seat = seatId
    ? layout.seats.find((s) => s.id === seatId)
    : layout.areas.find((a) => a.id === areaId);
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
  // 가구 위에 앉는 구역 (소파): 다가가는 바닥 지점까지 걷고 마지막 한 걸음에 앉는다.
  const seatArea =
    typeof destination === "string"
      ? layout.areas?.find((a) => a.node === destination && a.approach)
      : null;
  // 소파에 앉아 있었으면 다가가는 지점으로 일어선 뒤 걷는다.
  const oldArea =
    !oldSeat && start.activity === "resting"
      ? layout.areas?.find((a) => a.approach && a.node === start.node)
      : null;
  const from = oldSeat
    ? layout.nodes[oldSeat.approach]
    : oldArea
      ? layout.nodes[oldArea.approach]
      : start.position;
  const walkEnd = newSeat
    ? layout.nodes[newSeat.approach]
    : seatArea
      ? layout.nodes[seatArea.approach]
      : target;
  const path = navigateFloor(layout, from, walkEnd),
    segments = [];
  const add = (from, to, activity, seatId = null, areaId = null) => {
    if (distance(from, to, layout.image) > 0.01)
      segments.push({ from, to, activity, seatId, ...(areaId ? { areaId } : {}) });
  };
  if (oldSeat) add(start.position, from, "standing", oldSeat.id);
  if (oldArea) add(start.position, from, "standing", null, oldArea.id);
  for (let i = 1; i < path.length; i++)
    add(path[i - 1], path[i], activity === "exit" ? "exiting" : "walking");
  if (newSeat) add(walkEnd, target, "sitting", newSeat.id);
  if (seatArea) add(walkEnd, target, "sitting", null, seatArea.id);
  if (segments.some((s) => !movementSegmentSafe(layout, s)))
    throw new Error("좌석 진입 경로가 가구와 겹쳐 이동을 중단했어요.");
  return { segments, target };
}
