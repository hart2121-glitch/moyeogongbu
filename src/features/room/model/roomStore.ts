import { supabase } from "../../../lib/supabase";
import {
  claimSeat,
  createRoom,
  enterRoom,
  exitRoom,
  fetchCurrentTask,
  fetchMemberStatus,
  heartbeatRoom,
  joinByCode,
  kickMember,
  leaveRoom,
  listBans,
  listMyRooms,
  reissueCode,
  releaseSeat,
  renameRoom,
  saveCurrentTask,
  unbanMember,
} from "./room";
import { openRoomChannel, type RoomChannelHandlers } from "./roomRealtime";

/**
 * 앱이 쓰는 방 저장소. `room.ts`와 `roomRealtime.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * ViewModel 훅은 클라이언트 대신 이 객체만 쓴다.
 * @example const rooms = await roomStore.list();
 */
export const roomStore = {
  list: () => listMyRooms(supabase),
  create: (name: string) => createRoom(supabase, name),
  join: (code: string) => joinByCode(supabase, code),
  leave: (roomId: string) => leaveRoom(supabase, roomId),
  rename: (roomId: string, name: string) => renameRoom(supabase, roomId, name),
  reissue: (roomId: string) => reissueCode(supabase, roomId),
  kick: (roomId: string, userId: string) => kickMember(supabase, roomId, userId),
  unban: (roomId: string, userId: string) => unbanMember(supabase, roomId, userId),
  bans: (roomId: string) => listBans(supabase, roomId),
  enter: (roomId: string, tabId: string) => enterRoom(supabase, roomId, tabId),
  heartbeat: (roomId: string, tabId: string) => heartbeatRoom(supabase, roomId, tabId),
  exit: (roomId: string, tabId: string) => exitRoom(supabase, roomId, tabId),
  claimSeat: (roomId: string, seatNo: number) => claimSeat(supabase, roomId, seatNo),
  releaseSeat: (roomId: string) => releaseSeat(supabase, roomId),
  memberStatus: (roomId: string) => fetchMemberStatus(supabase, roomId),
  currentTask: () => fetchCurrentTask(supabase),
  saveCurrentTask: (task: string, shared: boolean) => saveCurrentTask(supabase, task, shared),
  openChannel: (roomId: string, userId: string, handlers: RoomChannelHandlers) =>
    openRoomChannel(supabase, roomId, userId, handlers),
};

export type RoomStore = typeof roomStore;
