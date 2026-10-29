import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import CompanyRoom from "../../../study/CompanyRoom";
import { todayCoins } from "../../coins/model/coinMath";
import type { CoinDaySummary } from "../../coins/model/coins";
import SettlementCard from "../../coins/view/SettlementCard";
import { useCoinSummary, useSettleStudy } from "../../coins/viewmodel/useCoins";
import StudySessionBar from "../../session/view/StudySessionBar";
import { useStudySession } from "../../session/viewmodel/useStudySession";
import { ROUTES } from "../../shell/model/paths";
import { useCompanyRoomRoute } from "../viewmodel/useRoomRoutes";

/**
 * `/rooms/:code`: 회사 스터디룸과 공부 세션. 코드에 맞는 방이 없으면 방 목록으로 돌아간다.
 * 퇴근하면 출입구에 도착한 뒤 "오늘의 정산" 카드를 한 번 보여 주고 로비로 간다 (Story 003).
 */
export default function CompanyRoomPage() {
  const { room, nickname, exit } = useCompanyRoomRoute();
  const session = useStudySession();
  const coins = useCoinSummary().data;
  const settle = useSettleStudy();
  const [card, setCard] = useState<CoinDaySummary | null>(null);
  const leaving = useRef(false);
  if (!room) return <Navigate to={ROUTES.rooms} replace />;

  const onExit = async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      await session.flush();
      setCard(await settle());
    } catch {
      // 정산을 받지 못하면 다음 방문 때 지난 정산으로 보여 준다.
      exit();
    }
  };
  const coinsToday = coins ? todayCoins(coins.coins, session.todaySeconds, coins.rules) : null;

  return (
    <>
      <CompanyRoom
        key={room.id}
        room={room}
        nickname={nickname}
        onExit={() => void onExit()}
        onActivityChange={session.reportActivity}
        renderSession={({ goLounge, canGoLounge }: { goLounge: () => void; canGoLounge: boolean }) => (
          <StudySessionBar
            session={session}
            onGoLounge={goLounge}
            canGoLounge={canGoLounge}
            todayCoins={coinsToday}
          />
        )}
      />
      {card && <SettlementCard title="오늘의 정산" summary={card} actionLabel="로비로 가기" onClose={exit} />}
    </>
  );
}
