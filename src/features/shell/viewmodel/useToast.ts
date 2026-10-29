import { useRef, useState } from "react";
import { TOAST_DURATION_MS } from "../model/toast";

/**
 * 잠시 보였다 사라지는 안내 메시지.
 * @example const { toast, notify } = useToast(); notify("저장했어요");
 */
export function useToast() {
  const [toast, setToast] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const notify = (text: string) => {
    setToast(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), TOAST_DURATION_MS);
  };
  return { toast, notify };
}
