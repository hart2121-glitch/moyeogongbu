import type { SupabaseClient } from "@supabase/supabase-js";
import { socialRpc } from "../../friends/model/socialError";

/**
 * 알림 (Story 006): 친구가 같은 방에 들어옴(서버 enter_room이 남김), 뽀모도로 종료와 자리 비움 확인
 * (Story 002 세션 흐름이 push_notification으로 남김). 본인 알림만 읽는다.
 */

export type NotificationKind = "friend_entered" | "pomodoro_end" | "away_check";

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  actorName: string | null;
  roomName: string | null;
  createdAt: string;
  read: boolean;
}

export interface InboxCounts {
  mail: number;
  notifications: number;
}

/**
 * 알림 문구.
 * @example notificationText({ kind: "friend_entered", actorName: "하늘", roomName: "우리 회사" }) // "하늘님이 우리 회사에 들어왔어요"
 */
export function notificationText(n: Pick<AppNotification, "kind" | "actorName" | "roomName">): string {
  if (n.kind === "friend_entered") return `${n.actorName ?? "친구"}님이 ${n.roomName ?? "같은 방"}에 들어왔어요`;
  if (n.kind === "pomodoro_end") return "뽀모도로 공부 시간이 끝났어요";
  return "자리에 있는지 확인을 요청했어요";
}

/** @example notificationTime("2026-10-30T06:20:00Z") // "오후 03:20" */
export const notificationTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" });

/** 세션 알림 종류를 서버 종류로. */
export const promptNotificationKind = (kind: "pomodoroEnd" | "checkIn"): NotificationKind =>
  kind === "pomodoroEnd" ? "pomodoro_end" : "away_check";

interface Row {
  id: number;
  kind: NotificationKind;
  actor_name: string | null;
  room_name: string | null;
  created_at: string;
  read: boolean;
}

export const fetchNotifications = async (client: SupabaseClient): Promise<AppNotification[]> =>
  ((await socialRpc<Row[]>(client, "list_notifications")) ?? []).map((r) => ({
    id: Number(r.id),
    kind: r.kind,
    actorName: r.actor_name ?? null,
    roomName: r.room_name ?? null,
    createdAt: r.created_at,
    read: !!r.read,
  }));

export const markNotificationsRead = (client: SupabaseClient) => socialRpc<void>(client, "mark_notifications_read");

export const pushNotification = (client: SupabaseClient, kind: NotificationKind) =>
  socialRpc<void>(client, "push_notification", { p_kind: kind });

export const fetchInboxCounts = async (client: SupabaseClient): Promise<InboxCounts> => {
  const row = await socialRpc<{ mail: number; notifications: number }>(client, "inbox_counts");
  return { mail: Number(row?.mail) || 0, notifications: Number(row?.notifications) || 0 };
};
