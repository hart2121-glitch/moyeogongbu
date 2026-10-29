import { useEffect, useState } from "react";
import type { ModalState } from "../model/modal";

/**
 * 모달 열림 상태와 키보드 처리(Escape 닫기, Tab 포커스 순환, 닫힐 때 포커스 복원).
 * @example const { modal, openModal, closeModal } = useModal();
 */
export function useModal() {
  const [modal, setModal] = useState<ModalState>(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button:not(:disabled),[role="dialog"] input',
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [modal]);
  return {
    modal,
    openModal: (next: NonNullable<ModalState>) => setModal(next),
    closeModal: () => setModal(null),
  };
}
