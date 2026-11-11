import { useEffect, type RefObject } from "react";

/**
 * 단추 아래 작은 창: 열려 있는 동안 창 바깥을 누르거나 Esc를 누르면 닫는다.
 * @example useDismiss(boxRef, open, () => setOpen(false));
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [ref, open, close]);
}
