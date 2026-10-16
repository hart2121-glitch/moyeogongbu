import { useState } from "react";
import { loadRooms, makeRoom, STORAGE_KEY } from "./rooms";
export function useRooms() {
  const [rooms, setRooms] = useState(() => {
    try {
      return loadRooms(window.localStorage);
    } catch {
      return loadRooms({ getItem: () => null });
    }
  });
  const [storageWarning, setStorageWarning] = useState("");
  const createRoom = (name) => {
    const room = makeRoom(name, rooms);
    const next = [...rooms, room];
    setRooms(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setStorageWarning(
        "브라우저 저장 공간을 사용할 수 없어 이번 방문 중에만 방이 유지됩니다.",
      );
    }
    return room;
  };
  return { rooms, createRoom, storageWarning };
}
