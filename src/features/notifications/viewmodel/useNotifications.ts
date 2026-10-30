import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import { SOCIAL_CONFIG } from "../../friends/model/socialConfig";
import { socialKeys } from "../../friends/viewmodel/useFriends";
import { notificationStore } from "../model/notificationStore";
import type { NotificationKind } from "../model/notifications";

/**
 * 알림 목록. 열면 읽음으로 표시한다.
 * @example const { list } = useNotifications();
 */
export function useNotifications() {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: socialKeys.notifications(userId), queryFn: notificationStore.list, enabled: !!userId });
  const unread = (query.data ?? []).some((n) => !n.read);
  useEffect(() => {
    if (!unread) return;
    void notificationStore
      .markRead()
      .then(() => queryClient.invalidateQueries({ queryKey: socialKeys.inbox(userId) }))
      .catch(() => undefined);
  }, [unread, queryClient, userId]);
  return { list: query.data ?? [], loading: query.isPending, failed: query.isError };
}

/**
 * 상단 우편, 알림 아이콘의 숫자. 주기적으로 다시 읽는다.
 * @example const counts = useInboxCounts().data;
 */
export function useInboxCounts() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: socialKeys.inbox(userId),
    queryFn: notificationStore.counts,
    enabled: !!userId,
    refetchInterval: SOCIAL_CONFIG.inboxPollMs,
  });
}

/**
 * 세션 흐름이 띄운 알림을 종 목록에 남긴다. 실패해도 공부 흐름은 막지 않는다.
 * @example const push = usePushNotification(); push("pomodoro_end");
 */
export function usePushNotification() {
  const userId = useSession()?.user.id;
  const queryClient = useQueryClient();
  return (kind: NotificationKind) =>
    void notificationStore
      .push(kind)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: socialKeys.inbox(userId) }),
          queryClient.invalidateQueries({ queryKey: socialKeys.notifications(userId) }),
        ]),
      )
      .catch(() => undefined);
}
