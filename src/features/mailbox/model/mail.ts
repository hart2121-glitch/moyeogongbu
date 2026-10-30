import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "../../friends/model/socialError";

/**
 * 우편함 (Story 006): 친구 요청, 방 초대, 시스템 보상. 30일 뒤 서버가 지운다.
 * 서버 함수는 받는 사람 본인의 우편만 다룬다.
 */

export type MailKind = "friend_request" | "room_invite" | "reward";

export interface Mail {
  id: number;
  kind: MailKind;
  senderId: string | null;
  senderName: string | null;
  roomId: string | null;
  roomName: string | null;
  /** 보상 코인 (reward만). */
  coins: number;
  /** 보상 종류 (reward만): attendance | welcome. */
  reward: string | null;
  /** 남은 보관 일수 (올림). */
  daysLeft: number;
  claimed: boolean;
  createdAt: string;
}

interface MailRow {
  id: number;
  kind: MailKind;
  sender_id: string | null;
  sender_name: string | null;
  room_id: string | null;
  room_name: string | null;
  payload: { coins?: number; reward?: string } | null;
  days_left: number;
  claimed: boolean;
  created_at: string;
}

const toMail = (r: MailRow): Mail => ({
  id: Number(r.id),
  kind: r.kind,
  senderId: r.sender_id ?? null,
  senderName: r.sender_name ?? null,
  roomId: r.room_id ?? null,
  roomName: r.room_name ?? null,
  coins: Number(r.payload?.coins) || 0,
  reward: r.payload?.reward ?? null,
  daysLeft: Number(r.days_left) || 0,
  claimed: !!r.claimed,
  createdAt: r.created_at,
});

/**
 * 우편 제목 문구.
 * @example mailTitle({ kind: "reward", coins: 10 } as Mail) // "출석 보상 10코인"
 */
export function mailTitle(mail: Pick<Mail, "kind" | "senderName" | "roomName" | "coins"> & { reward?: string | null }): string {
  const who = mail.senderName ?? "누군가";
  if (mail.kind === "friend_request") return `${who}님의 친구 요청`;
  if (mail.kind === "room_invite") return `${who}님이 ${mail.roomName ?? "스터디룸"}에 초대했어요`;
  if (mail.reward === "welcome") return `환영 선물 ${mail.coins}코인`;
  return `출석 보상 ${mail.coins}코인`;
}

/** @example remainingText(3) // "남은 기한 3일" */
export const remainingText = (days: number) => (days <= 1 ? "오늘까지 받을 수 있어요" : `남은 기한 ${days}일`);

/** 우편함 목록 (기한 지난 우편은 서버가 먼저 지운다). */
export const fetchMail = async (client: SupabaseClient): Promise<Mail[]> =>
  ((await socialRpc<MailRow[]>(client, "list_mail")) ?? []).map(toMail);

/** 보상 받기. 이미 받았으면 0을 돌려준다. */
export const claimMail = async (client: SupabaseClient, id: number): Promise<number> =>
  Number((await socialRpc<{ amount: number }>(client, "claim_mail", { p_id: id })).amount) || 0;

/** 방 초대 받기. 멤버가 되고 방 id를 돌려준다. */
export const acceptRoomInvite = async (client: SupabaseClient, id: number): Promise<string> =>
  (await socialRpc<{ id: string }>(client, "accept_room_invite", { p_id: id })).id;

/** 우편 지우기 (초대 거절, 받은 보상 정리). */
export const deleteMail = (client: SupabaseClient, id: number) => socialRpc<void>(client, "delete_mail", { p_id: id });

/** 친구에게 방 초대 보내기. */
export const inviteToRoom = (client: SupabaseClient, roomId: string, friendId: string) =>
  socialRpc<unknown>(client, "invite_to_room", { p_room: roomId, p_friend: friendId });
