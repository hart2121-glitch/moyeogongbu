import type { ReactNode } from "react";
import type { DeskObject as DeskObjectKind } from "../model/lobbyScene";

/** 물건을 가리키면 그 물건 요소를, 벗어나면 null을 받는다. */
export type LookHandler = (target: HTMLElement | null) => void;

/**
 * 로비 장면 속 물건 하나 (모니터, 메모지, 코르크판, 휴대폰). 이름은 물건마다 제자리(창 제목줄, 상태바, 쪽지)에 늘 보이고,
 * 가리키거나 포커스가 들어오면 onLook으로 알려 캐릭터가 그쪽을 보게 한다.
 * action은 이름 옆(모니터 창 제목줄), footer는 물건 아래쪽(메모 마지막 줄, 마지막 쪽지, 홈 바 위)에 놓인다.
 * @example <DeskObject kind="memo" title="오늘의 할 일" onLook={look} footer={addButton}>...</DeskObject>
 */
export default function DeskObject({
  kind,
  title,
  action,
  footer,
  onLook,
  children,
}: {
  kind: DeskObjectKind;
  title: string;
  action?: ReactNode;
  footer?: ReactNode;
  onLook: LookHandler;
  children: ReactNode;
}) {
  return (
    <section
      className={`desk-object desk-${kind}`}
      aria-labelledby={`desk-${kind}-title`}
      onPointerEnter={(e) => onLook(e.currentTarget)}
      onPointerLeave={() => onLook(null)}
      onFocus={(e) => onLook(e.currentTarget)}
      onBlur={() => onLook(null)}
    >
      <header className="desk-object-head">
        <h2 id={`desk-${kind}-title`}>{title}</h2>
        {action}
      </header>
      <div className="desk-object-body">{children}</div>
      {footer && <footer className="desk-object-foot">{footer}</footer>}
    </section>
  );
}
