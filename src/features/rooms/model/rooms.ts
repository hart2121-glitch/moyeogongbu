import type { Room } from "../../room/model/room";

/**
 * 로비 회사 빠른 입장 대상: 내가 만든 첫 방, 없으면 내 방 목록의 첫 방. 방이 없으면 undefined.
 * @example quickEnterRoom(rooms)?.id
 */
export function quickEnterRoom(rooms: readonly Room[]): Room | undefined {
  return rooms.find((r) => r.isOwner) || rooms[0];
}

/** 내 방 목록에서 id로 방을 찾는다. */
export const findRoomById = (rooms: readonly Room[], id: string) => rooms.find((r) => r.id === id);
