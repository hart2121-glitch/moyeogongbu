import { useState } from "react";

/**
 * 로비 응원 메시지 표시 여부. 한 번 닫으면 이번 방문 동안 다시 나오지 않는다.
 * @example const { tip, dismissTip } = useTip();
 */
export function useTip() {
  const [tip, setTip] = useState(true);
  return { tip, dismissTip: () => setTip(false) };
}
