import type { ReactNode } from "react";

interface Props {
  message: string;
  /** 단추들. 없으면 기다리는 중 표시 (role="status"). */
  actions?: ReactNode;
  testId?: string;
}

/**
 * 공부방에 들어가지 못했거나 들어가는 중일 때 방 자리 가운데에 띄우는 카드 (회사 방, 공용 카페).
 * @example <RoomNotice message="방이 가득 찼어요" actions={<button>방 목록으로</button>} />
 */
export default function RoomNotice({ message, actions, testId }: Props) {
  return (
    <div className="room-notice-area">
      <section className={`room-notice${actions ? "" : " is-quiet"}`} role={actions ? "alert" : "status"} data-testid={testId}>
        <p>{message}</p>
        {actions && <div className="room-notice-actions">{actions}</div>}
      </section>
    </div>
  );
}
