import { useEffect, useRef, useState } from "react";
import { createSeatService } from "./seatService";
export function useSeatOccupancy(roomId, nickname) {
  const owner = useRef(null);
  if (!owner.current)
    owner.current =
      crypto.randomUUID?.() || `player-${Date.now()}-${Math.random()}`;
  const service = useRef(null);
  const [seats, setSeats] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    const store = createSeatService(roomId, owner.current, nickname);
    service.current = store;
    const unsubscribe = store.subscribe((value) => {
      if (value === null)
        setError("좌석 저장소 연결이 끊겨 예약을 진행할 수 없어요.");
      else {
        setSeats(value);
        setError("");
      }
    });
    return () => {
      unsubscribe();
      store
        .release()
        .catch(() => {})
        .finally(() => store.close());
      if (service.current === store) service.current = null;
    };
  }, [roomId, nickname]);
  return {
    seats,
    error,
    ownerId: owner.current,
    reserve: (id) => service.current?.reserve(id) ?? Promise.resolve(false),
    occupy: (id) => service.current?.occupy(id) ?? Promise.resolve(false),
    release: () => service.current?.release() ?? Promise.resolve(),
  };
}
