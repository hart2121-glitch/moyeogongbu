import { Cat, X } from "@phosphor-icons/react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./controls.css";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 넓은 창 (방장 도구처럼 그림 선택지가 많은 창). */
  wide?: boolean;
  testId?: string;
  icon?: ReactNode;
}

/**
 * 화면 위에 뜨는 창. 전역 모달(ModalHost)과 같은 모양이고, 화면 안에서 연 창(방장 도구 등)에 쓴다.
 * 연 자리의 스타일(예: .room-social button)이 창 안 단추에 번지지 않도록 body 바로 아래에 그린다.
 * 바깥을 누르거나 Escape를 누르면 닫히고, 열 때 닫기 단추에, 닫으면 연 단추에 포커스를 둔다.
 * @example {open && <Dialog title="방장 도구" onClose={() => setOpen(false)}>...</Dialog>}
 */
export default function Dialog({ title, onClose, children, wide = false, testId, icon }: Props) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={`panel modal${wide ? " modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <span>
            {icon ?? <Cat />}
            {title}
          </span>
          <button aria-label="닫기" onClick={onClose} autoFocus>
            <X />
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
