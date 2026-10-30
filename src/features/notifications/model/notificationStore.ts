import { supabase } from "../../../lib/supabase";
import {
  fetchInboxCounts,
  fetchNotifications,
  markNotificationsRead,
  pushNotification,
  type NotificationKind,
} from "./notifications";

/**
 * 앱이 쓰는 알림 저장소. `notifications.ts`의 함수에 공유 Supabase 클라이언트를 묶어 둔다.
 * @example const list = await notificationStore.list();
 */
export const notificationStore = {
  list: () => fetchNotifications(supabase),
  markRead: () => markNotificationsRead(supabase),
  push: (kind: NotificationKind) => pushNotification(supabase, kind),
  counts: () => fetchInboxCounts(supabase),
};
