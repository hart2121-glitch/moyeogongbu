import { useEffect, useRef, useState } from "react";
import { distance, findPath } from "./pathfinding";
export function useCharacterMovement(graph, initialNode, onExit) {
  const [character, setCharacter] = useState({
    node: initialNode,
    position: graph.nodes[initialNode],
    activity: "idle",
    direction: "down",
    seatId: null,
    edge: null,
  });
  const frame = useRef(null);
  const busy = useRef(false);
  const node = useRef(initialNode);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);
  const moveTo = (destination, { activity = "seated", seatId = null } = {}) => {
    if (busy.current) return false;
    const route = findPath(graph, node.current, destination);
    busy.current = true;
    let segment = 0,
      progress = 0,
      last = null;
    setCharacter((c) => ({
      ...c,
      activity: activity === "exit" ? "exiting" : "walking",
      seatId,
      edge: route.length > 1 ? [route[0], route[1]] : null,
    }));
    const complete = () => {
      if (!mounted.current) return;
      busy.current = false;
      node.current = destination;
      setCharacter((c) => ({
        ...c,
        node: destination,
        position: graph.nodes[destination],
        activity: activity === "exit" ? "idle" : activity,
        seatId,
        edge: null,
      }));
      if (activity === "exit") onExit();
    };
    if (route.length === 1) {
      complete();
      return true;
    }
    const tick = (now) => {
      if (!mounted.current) return;
      const delta = last === null ? 0 : Math.min(now - last, 100);
      last = now;
      let remaining = (delta / 1000) * 270;
      while (segment < route.length - 1) {
        const a = graph.nodes[route[segment]],
          b = graph.nodes[route[segment + 1]];
        const length = distance(a, b);
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
        complete();
        return;
      }
      const a = graph.nodes[route[segment]],
        b = graph.nodes[route[segment + 1]],
        ratio = progress / distance(a, b);
      const dx = (b.x - a.x) * 1536,
        dy = (b.y - a.y) * 1024;
      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
      setCharacter((c) => ({
        ...c,
        position: {
          x: a.x + (b.x - a.x) * ratio,
          y: a.y + (b.y - a.y) * ratio,
        },
        direction,
        edge: [route[segment], route[segment + 1]],
      }));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return true;
  };
  return { character, moveTo };
}
