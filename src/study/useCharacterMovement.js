import { useEffect, useRef, useState } from "react";
import { distance } from "./pathfinding";
import { planMovement, movementSegmentSafe } from "./movementPlan";
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
  const [movementError, setMovementError] = useState("");
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
  const validateMove = (destination, options = {}) =>
    planMovement(graph, current.current, destination, options);
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
    const { segments, target } = planMovement(graph, start, destination, {
      activity,
      seatId,
    });
    setMovementError("");
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
    if (!segments.length) {
      finish();
      return true;
    }
    const phase = () => segments[segment].activity;
    const stopAtCollision = () => {
      busy.current = false;
      setMovementError("이동 구간이 가구와 겹쳐 안전한 위치에서 멈췄어요.");
      publish({ ...current.current, activity: "idle", seatId: null });
    };
    publish({
      ...start,
      activity: phase(),
      seatId,
      edge: null,
      occlusionSeatId: segments[0].seatId,
    });
    const tick = (now) => {
      if (!mounted.current) return;
      const delta = last === null ? 0 : Math.max(0, now - last);
      last = now;
      let remaining = (delta / 1000) * 270;
      while (segment < segments.length) {
        // 매 프레임 소비하는 각 구간을 다시 검사합니다. 착석/일어서기도 예외가 아닙니다.
        if (!movementSegmentSafe(graph, segments[segment])) {
          stopAtCollision();
          return;
        }
        const length = distance(
          segments[segment].from,
          segments[segment].to,
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
      if (segment >= segments.length) {
        finish();
        return;
      }
      const a = segments[segment].from,
        b = segments[segment].to,
        ratio = progress / distance(a, b, graph.image),
        dx = (b.x - a.x) * graph.image.width,
        dy = (b.y - a.y) * graph.image.height;
      const direction =
        phase() === "sitting"
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
        occlusionSeatId: segments[segment].seatId,
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return true;
  };
  return { character, moveTo, validateMove, movementError };
}
