import { useEffect, useState } from "react";

/**
 * 좌석 저장소(`seatService.js`)를 구독한다. 저장소는 방 화면의 ViewModel이 만들어 넘긴다.
 * @param {ReturnType<typeof import("./seatService").createSeatService>} service
 */
export function useSeatOccupancy(service) {
  const [seats, setSeats] = useState({});
  const [error, setError] = useState("");
  useEffect(
    () =>
      service.subscribe((value) => {
        if (value === null) setError("좌석 정보를 받지 못했어요. 다시 연결하는 중이에요.");
        else {
          setSeats(value);
          setError("");
        }
      }),
    [service],
  );
  return {
    seats,
    error,
    ownerId: service.ownerId,
    reserve: (id) => service.reserve(id),
    occupy: (id) => service.occupy(id),
    release: () => service.release(),
  };
}
