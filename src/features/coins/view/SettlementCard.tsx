import { Coin } from "@phosphor-icons/react";
import { COIN_KIND_LABEL, coinText, dayText, workTimeText } from "../model/coinConfig";
import type { CoinDaySummary } from "../model/coins";

interface Props {
  /** "오늘의 정산" 또는 "지난 정산". */
  title: string;
  summary: CoinDaySummary;
  actionLabel: string;
  onClose: () => void;
}

/**
 * 하루 정산 카드 (Story 003). 퇴근할 때 회사 방에서, 퇴근 없이 닫았으면 다음 방문 때 로비 위에 같은 모양으로 뜬다.
 * 기존 모달 패널 스타일을 그대로 쓴다.
 */
export default function SettlementCard({ title, summary, actionLabel, onClose }: Props) {
  const kinds = ["study", "pomodoro", "todo"] as const;
  return (
    <div className="modal-backdrop">
      <section
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="settlement-card"
      >
        <div className="panel-heading">
          <span>
            <Coin weight="duotone" />
            {title}
          </span>
        </div>
        <div className="panel-body">
          <p className="muted">{dayText(summary.day)}</p>
          <dl className="settlement-list">
            <div className="settlement-row">
              <dt>근무 시간</dt>
              <dd data-testid="settlement-time">{workTimeText(summary.studySeconds)}</dd>
            </div>
            {kinds.map((kind) => (
              <div key={kind} className="settlement-row">
                <dt>{COIN_KIND_LABEL[kind]}</dt>
                <dd>{coinText(summary.coins[kind])}</dd>
              </div>
            ))}
            <div className="settlement-row settlement-sum">
              <dt>받은 코인</dt>
              <dd data-testid="settlement-total">{coinText(summary.total)}</dd>
            </div>
            <div className="settlement-row">
              <dt>보유 코인</dt>
              <dd data-testid="settlement-balance">{coinText(summary.balance)}</dd>
            </div>
          </dl>
          <button className="primary" onClick={onClose} autoFocus>
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
