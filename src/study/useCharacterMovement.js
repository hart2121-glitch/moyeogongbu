import { useEffect, useRef, useState } from "react";
import { distance } from "./pathfinding";
import { navigateFloor } from "./navigation";
export function useCharacterMovement(graph, initialNode, onExit) {
  const initial = {
    node: initialNode,
    position: graph.nodes[initialNode],
    activity: "idle",
    direction: "down",
    seatId: null,
    edge: null,
  };
  const [character, setCharacter] = useState(initial);
  const current = useRef(initial),
    frame = useRef(null),
    busy = useRef(false),
    mounted = useRef(true);
  const publish = (value) => {
    current.current = value;
    if (mounted.current) setCharacter(value);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);
  const validateMove = (
    destination,
    { activity = "seated", seatId = null } = {},
  ) => {
    const start = current.current;
    const oldSeat =
      start.activity === "seated"
        ? graph.seats.find((s) => s.id === start.seatId)
        : null;
    const newSeat =
      activity === "seated" ? graph.seats.find((s) => s.id === seatId) : null;
    const from = oldSeat ? graph.nodes[oldSeat.approach] : start.position;
    const target =
      typeof destination === "string" ? graph.nodes[destination] : destination;
    if (!target) throw new Error("이동 목적지를 찾을 수 없어요.");
    return navigateFloor(
      graph,
      from,
      newSeat ? graph.nodes[newSeat.approach] : target,
    );
  };
  const moveTo = (
    destination,
    { activity = "seated", seatId = null, allowInterrupt = false } = {},
  ) => {
    if (
      busy.current &&
      (!allowInterrupt ||
        !["walking", "exiting"].includes(current.current.activity))
    )
      return false;
    const start = current.current;
    const oldSeat =
      start.activity === "seated"
        ? graph.seats.find((s) => s.id === start.seatId)
        : null;
    const newSeat =
      activity === "seated" ? graph.seats.find((s) => s.id === seatId) : null;
    const from = oldSeat ? graph.nodes[oldSeat.approach] : start.position;
    const target =
      typeof destination === "string" ? graph.nodes[destination] : destination;
    if (!target) throw new Error("이동 목적지를 찾지 못했어요.");
    const walkEnd = newSeat ? graph.nodes[newSeat.approach] : target;
    const path = navigateFloor(graph, from, walkEnd);
    if (oldSeat) path.unshift(start.position);
    if (newSeat) path.push(target);
    const route = path.filter(
      (p, i) => !i || distance(path[i - 1], p, graph.image) > 0.01,
    );
    // 중복 끝점 제거 후 실제 마지막 구간이 착석 전환입니다.
    const lastSitting = newSeat ? route.length - 2 : -1;
    cancelAnimationFrame(frame.current);
    busy.current = true;
    let segment = 0,
      progress = 0,
      last = null;
    const finish = () => {
      busy.current = false;
      publish({
        ...current.current,
        node: typeof destination === "string" ? destination : "floor",
        position: target,
        activity: activity === "exit" ? "idle" : activity,
        direction: ["seated", "resting"].includes(activity)
          ? "down"
          : current.current.direction,
        seatId,
        edge: null,
        occlusionSeatId: activity === "seated" ? seatId : null,
      });
      if (activity === "exit") onExit();
    };
    if (route.length < 2) {
      finish();
      return true;
    }
    const phase = () =>
      oldSeat && segment === 0
        ? "standing"
        : segment === lastSitting
          ? "sitting"
          : activity === "exit"
            ? "exiting"
            : "walking";
    publish({
      ...start,
      activity: phase(),
      seatId,
      edge: null,
      occlusionSeatId: oldSeat?.id || null,
    });
    const tick = (now) => {
      if (!mounted.current) return;
      const delta = last === null ? 0 : Math.max(0, now - last);
      last = now;
      let remaining = (delta / 1000) * 270;
      while (segment < route.length - 1) {
        const length = distance(
          route[segment],
          route[segment + 1],
          graph.image,
        );
        if (remaining >= length - progress) {
          remaining -= length - progress;
          segment++;
          progress = 0;
        } else {
          progress += remaining;
          break;
        }
      }
      if (segment >= route.length - 1) {
        finish();
        return;
      }
      const a = route[segment],
        b = route[segment + 1],
        ratio = progress / distance(a, b, graph.image),
        dx = (b.x - a.x) * graph.image.width,
        dy = (b.y - a.y) * graph.image.height;
      const direction =
        segment === lastSitting
          ? "down"
          : Math.abs(dx) > Math.abs(dy)
            ? dx < 0
              ? "left"
              : "right"
            : dy < 0
              ? "up"
              : "down";
      publish({
        ...current.current,
        position: {
          x: a.x + (b.x - a.x) * ratio,
          y: a.y + (b.y - a.y) * ratio,
        },
        direction,
        activity: phase(),
        occlusionSeatId:
          phase() === "standing"
            ? oldSeat?.id
            : phase() === "sitting"
              ? newSeat?.id
              : null,
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return true;
  };
  return { character, moveTo, validateMove };
}
