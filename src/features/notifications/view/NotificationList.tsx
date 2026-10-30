import { Bell } from "@phosphor-icons/react";
import { notificationText, notificationTime } from "../model/notifications";
import { useNotifications } from "../viewmodel/useNotifications";

/** 알림 모달 내용: 친구 입장, 뽀모도로 종료, 자리 비움 확인. */
export default function NotificationList() {
  const { list, loading, failed } = useNotifications();
  if (loading) return <p className="muted">알림을 불러오는 중이에요.</p>;
  if (failed) return <p role="alert">알림을 불러오지 못했어요.</p>;
  if (list.length === 0)
    return (
      <div className="empty-state">
        <Bell />
        <h2>새로운 알림이 없어요</h2>
        <p>오늘도 나만의 속도로 공부해 보세요.</p>
      </div>
    );
  return (
    <ul className="notification-list" data-testid="notification-list">
      {list.map((n) => (
        <li key={n.id} className={`notification-item kind-${n.kind} ${n.read ? "" : "unread"}`}>
          <span>{notificationText(n)}</span>
          <time className="muted" dateTime={n.createdAt}>
            {notificationTime(n.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
