import { toLook, type Look } from "../../character/model/layers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ROOM_CONFIG } from "./roomConfig";

/**
 * 방 서버 호출 (Story 004). 모든 쓰기와 판정(방 수, 멤버 수, 동시 인원, 좌석, 강퇴)은 서버 RPC가 한다.
 * 함수는 Supabase 클라이언트를 인자로 받고, `roomStore.ts`가 공유 클라이언트를 묶는다.
 */

/** 내 방 목록의 방 하나. */
export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  isOwner: boolean;
  memberCount: number;
  onlineCount: number;
}

/** 좌석 하나. userId가 null이면 빈자리 (유예가 지난 자리도 서버가 비워서 준다). */
export interface SeatRow {
  seatNo: number;
  userId: string | null;
}

/** 입장과 연결 확인 때 받는 방 상태. */
export interface RoomState {
  serverNow: number;
  seats: SeatRow[];
  online: string[];
}

/** 같은 방 멤버 한 명의 공개 상태. */
export interface MemberStatus {
  userId: string;
  displayName: string;
  isOwner: boolean;
  /** studying, break, away, left (Story 002 세션 상태). */
  state: string;
  todaySeconds: number;
  /** 공개한 경우만. */
  currentTask: string | null;
  /** 저장한 꾸밈 (Story 007). 처음 꾸미기 전이면 null. */
  look: Look | null;
}

export interface BannedMember {
  userId: string;
  displayName: string;
}

export interface CurrentTask {
  task: string | null;
  shared: boolean;
}

/** 서버가 거절한 이유. message는 화면 문구다. */
export class RoomError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RoomError";
  }
}

const MESSAGES: Record<string, string> = {
  room_limit: `방은 한 사람당 ${ROOM_CONFIG.maxOwnedRooms}개까지 만들 수 있어요.`,
  invalid_name: `방 이름을 1~${ROOM_CONFIG.nameMaxLength}자로 입력해 주세요.`,
  invalid_code: "초대 코드에 맞는 방이 없어요. 코드를 다시 확인해 주세요.",
  banned: "이 방에는 들어갈 수 없어요. 방장이 풀어 주면 다시 들어올 수 있어요.",
  members_full: "방이 가득 찼어요",
  room_full: "방이 가득 찼어요",
  not_member: "이 방의 멤버가 아니에요.",
  not_owner: "방장만 할 수 있어요.",
  not_in_room: "방에 다시 연결하는 중이에요. 잠시 뒤 다시 눌러 주세요.",
  invalid_seat: "올바른 좌석을 선택해 주세요.",
  invalid_task: `지금 하는 일은 ${ROOM_CONFIG.taskMaxLength}자까지 쓸 수 있어요.`,
  invalid_member: "그 사람에게는 할 수 없어요.",
};

/** 서버 오류를 RoomError로. 알려진 코드가 아니면 일반 문구. */
export function toRoomError(error: { message?: string } | null | undefined): RoomError {
  const message = error?.message ?? "";
  const code = Object.keys(MESSAGES).find((key) => message.includes(key));
  return code
    ? new RoomError(code, MESSAGES[code])
    : new RoomError("unknown", "서버와 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
}

async function rpc<T>(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw toRoomError(error);
  return data as T;
}

interface RoomRow {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  is_owner: boolean;
  member_count: number;
  online_count: number;
}

const toRoom = (row: RoomRow): Room => ({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  ownerId: row.owner_id,
  isOwner: !!row.is_owner,
  memberCount: Number(row.member_count) || 0,
  onlineCount: Number(row.online_count) || 0,
});

interface StateRow {
  server_now: string;
  seats: { seat_no: number; user_id: string | null }[];
  online: string[];
}

const toState = (row: StateRow): RoomState => ({
  serverNow: Date.parse(row.server_now),
  seats: (row.seats ?? []).map((s) => ({ seatNo: Number(s.seat_no), userId: s.user_id ?? null })),
  online: row.online ?? [],
});

/** 내 방 목록 (멤버인 방, 들어온 순서). @example const rooms = await listMyRooms(supabase); */
export const listMyRooms = async (client: SupabaseClient): Promise<Room[]> =>
  (await rpc<RoomRow[]>(client, "list_my_rooms")).map(toRoom);

/** 방 만들기 (한 사람당 3개). @example const room = await createRoom(supabase, "밍구의 회사"); */
export const createRoom = async (client: SupabaseClient, name: string) =>
  toRoom(await rpc<RoomRow>(client, "create_room", { p_name: name }));

/** 초대 코드로 들어가기. 이미 멤버면 그 방. @example await joinByCode(supabase, "ABC234"); */
export const joinByCode = async (client: SupabaseClient, code: string) =>
  toRoom(await rpc<RoomRow>(client, "join_by_code", { p_code: code }));

/** 방 나가기 (내 방 목록에서 빠진다). */
export const leaveRoom = (client: SupabaseClient, roomId: string) =>
  rpc<null>(client, "leave_room", { p_room: roomId }).then(() => undefined);

/** 방장: 이름 바꾸기. */
export const renameRoom = async (client: SupabaseClient, roomId: string, name: string) =>
  toRoom(await rpc<RoomRow>(client, "rename_room", { p_room: roomId, p_name: name }));

/** 방장: 초대 코드 재발급. */
export const reissueCode = async (client: SupabaseClient, roomId: string) =>
  toRoom(await rpc<RoomRow>(client, "reissue_code", { p_room: roomId }));

/** 방장: 강퇴 (멤버에서 빼고 강퇴 목록에 넣는다). */
export const kickMember = (client: SupabaseClient, roomId: string, userId: string) =>
  rpc<null>(client, "kick_member", { p_room: roomId, p_user: userId }).then(() => undefined);

/** 방장: 강퇴 풀기. */
export const unbanMember = (client: SupabaseClient, roomId: string, userId: string) =>
  rpc<null>(client, "unban_member", { p_room: roomId, p_user: userId }).then(() => undefined);

/** 방장: 강퇴 목록. */
export const listBans = async (client: SupabaseClient, roomId: string): Promise<BannedMember[]> =>
  (await rpc<{ user_id: string; display_name: string | null }[]>(client, "list_room_bans", { p_room: roomId })).map(
    (b) => ({ userId: b.user_id, displayName: b.display_name ?? "이름 없음" }),
  );

/** 방에 들어간다. 동시 인원이 차 있으면 RoomError("room_full"). */
export const enterRoom = async (client: SupabaseClient, roomId: string, tabId: string) =>
  toState(await rpc<StateRow>(client, "enter_room", { p_room: roomId, p_tab_id: tabId }));

/** 연결 확인. 2분 넘게 끊겼으면 내 좌석이 빠진 상태가 온다. */
export const heartbeatRoom = async (client: SupabaseClient, roomId: string, tabId: string) =>
  toState(await rpc<StateRow>(client, "heartbeat_room", { p_room: roomId, p_tab_id: tabId }));

/** 방에서 나온다 (다른 탭이 없으면 좌석도 풀린다). */
export const exitRoom = (client: SupabaseClient, roomId: string, tabId: string) =>
  rpc<null>(client, "exit_room", { p_room: roomId, p_tab_id: tabId }).then(() => undefined);

/** 좌석 잡기. 다른 사람이 먼저 잡았으면 false. */
export const claimSeat = (client: SupabaseClient, roomId: string, seatNo: number) =>
  rpc<boolean>(client, "claim_seat", { p_room: roomId, p_seat: seatNo }).then(Boolean);

/** 내 좌석 풀기. */
export const releaseSeat = (client: SupabaseClient, roomId: string) =>
  rpc<null>(client, "release_seat", { p_room: roomId }).then(() => undefined);

/** 같은 방 멤버의 이름, 상태, 오늘 공부 시간, 공개한 지금 하는 일. */
export async function fetchMemberStatus(client: SupabaseClient, roomId: string): Promise<MemberStatus[]> {
  const rows = await rpc<
    {
      user_id: string;
      display_name: string | null;
      is_owner: boolean;
      state: string;
      today_seconds: number;
      current_task: string | null;
      look?: unknown;
    }[]
  >(client, "room_member_status", { p_room: roomId });
  return rows.map((r) => ({
    userId: r.user_id,
    displayName: r.display_name ?? "이름 없음",
    isOwner: !!r.is_owner,
    state: r.state,
    todaySeconds: Number(r.today_seconds) || 0,
    currentTask: r.current_task ?? null,
    look: toLook(r.look),
  }));
}

/** 내 지금 하는 일. */
export const fetchCurrentTask = (client: SupabaseClient) => rpc<CurrentTask>(client, "my_current_task");

/** 지금 하는 일 저장. 빈 글자는 지운다. */
export const saveCurrentTask = (client: SupabaseClient, task: string, shared: boolean) =>
  rpc<CurrentTask>(client, "set_current_task", { p_task: task, p_shared: shared });
