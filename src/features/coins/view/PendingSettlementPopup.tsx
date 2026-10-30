import { usePendingSettlement } from "../viewmodel/useCoins";
import SettlementCard from "./SettlementCard";

/**
 * 퇴근 없이 닫았던 가장 최근 하루의 "지난 정산" (Story 003). 로비 위에 한 번만 뜨고, 닫으면 서버에 기록해 다시 뜨지 않는다.
 * 로비 배치는 건드리지 않고 그 위에 겹친다.
 */
export default function PendingSettlementPopup() {
  const { summary, dismiss } = usePendingSettlement();
  if (!summary) return null;
  return (
    <SettlementCard
      title="지난 정산"
      summary={summary}
      actionLabel="닫기"
      onClose={() => dismiss(summary.day)}
    />
  );
}
