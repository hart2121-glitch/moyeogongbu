import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import CompanyRoom from "../../../study/CompanyRoom";
import { todayCoins } from "../../coins/model/coinMath";
import type { CoinDaySummary } from "../../coins/model/coins";
import SettlementCard from "../../coins/view/SettlementCard";
import { useCoinSummary, useSettleStudy } from "../../coins/viewmodel/useCoins";
import type { Room } from "../../room/model/room";
import { reactionLabel } from "../../room/model/roomConfig";
import RoomInviteButton from "../../mailbox/view/RoomInviteButton";
import OwnerTools from "../../room/view/OwnerTools";
import RemoteCharacter from "../../room/view/RemoteCharacter";
import RoomLiveBar from "../../room/view/RoomLiveBar";
import { useRoomLive } from "../../room/viewmodel/useRoomLive";
import StudySessionBar from "../../session/view/StudySessionBar";
import { useStudySession } from "../../session/viewmodel/useStudySession";
import { ROUTES } from "../../shell/model/paths";
import { useCompanyRoomRoute } from "../viewmodel/useRoomRoutes";
import { useMyLook } from "../../character/viewmodel/useCharacter";

/**
 * `/rooms/:roomId`: 실시간 회사 스터디룸과 공부 세션. 내 방 목록에 없는 방이면 방 목록으로 돌아간다.
 * 퇴근하면 출입구에 도착한 뒤 "오늘의 정산" 카드를 한 번 보여 주고 로비로 간다 (Story 003).
 */
export default function CompanyRoomPage() {
  const route = useCompanyRoomRoute();
  // 방 안에서 강퇴되면 목록에서 방이 빠져도 마지막 방을 유지해 "멤버가 아니에요" 안내를 보여 준다.
  const last = useRef(route.room);
  if (route.room) last.current = route.room;
  const room = route.room ?? last.current;
  if (!room && (route.loading || !route.userId)) return <p className="movement-status">방 정보를 불러오는 중이에요.</p>;
  if (!room || !route.userId) return <Navigate to={ROUTES.rooms} replace />;
  return (
    <LiveCompanyRoom
      key={room.id}
      room={room}
      userId={route.userId}
      nickname={route.nickname}
      exit={route.exit}
      toRooms={route.toRooms}
    />
  );
}

interface LiveProps {
  room: Room;
  userId: string;
  nickname: string;
  exit: () => void;
  toRooms: () => void;
}

interface SettledCharacter {
  node: string;
  position: { x: number; y: number };
  activity: string;
  seatId: number | null;
  direction: string;
}

function LiveCompanyRoom({ room, userId, nickname, exit, toRooms }: LiveProps) {
  const myLook = useMyLook().data;
  const live = useRoomLive(room.id, userId, nickname);
  const session = useStudySession();
  const coins = useCoinSummary().data;
  const settle = useSettleStudy();
  const [card, setCard] = useState<CoinDaySummary | null>(null);
  const leaving = useRef(false);
  const activity = useRef("idle");
  const connectedRef = useRef(live.connected);
  connectedRef.current = live.connected;
  const { reportActivity } = session;

  // 연결이 끊기면 그 순간 공부 측정을 멈춘다 (서버 쪽 2분 유예는 Story 002). 다시 연결되면 지금 동작으로 되돌린다.
  const report = (value: string) => {
    activity.current = value;
    reportActivity(connectedRef.current ? value : "disconnected");
  };
  useEffect(() => {
    reportActivity(live.connected ? activity.current : "disconnected");
  }, [live.connected, reportActivity]);

  if (live.phase !== "ready") {
    const text =
      live.phase === "entering"
        ? "방에 들어가는 중이에요."
        : live.phase === "full"
          ? "방이 가득 찼어요"
          : live.phase === "gone"
            ? "이 방의 멤버가 아니에요. 강퇴됐거나 방에서 나갔어요."
            : "방에 연결하지 못했어요. 잠시 뒤 다시 들어와 주세요.";
    return (
      <div className="company-room">
        {live.phase === "entering" ? (
          <p className="movement-status">{text}</p>
        ) : (
          <div className="room-error" role="alert" data-testid="room-blocked">
            {text}
            <button onClick={toRooms}> 방 목록으로</button>
          </div>
        )}
      </div>
    );
  }

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
  const mine = live.reactions[userId];

  return (
    <>
      <CompanyRoom
        room={room}
        nickname={nickname}
        look={myLook ?? undefined}
        seatService={live.seatService}
        onExit={() => void onExit()}
        onActivityChange={report}
        onMove={live.sendMove}
        onSettle={(c: SettledCharacter) =>
          live.track({ node: c.node, x: c.position.x, y: c.position.y, activity: c.activity, seatId: c.seatId, direction: c.direction })
        }
        localReaction={
          mine && (
            <span className="character-reaction" data-testid="character-reaction">
              {reactionLabel(mine.key)}
            </span>
          )
        }
        overlay={live.others.map((meta) => (
          <RemoteCharacter
            key={meta.userId}
            meta={meta}
            status={live.statusOf(meta.userId)}
            reaction={live.reactions[meta.userId]}
            subscribeMoves={live.subscribeMoves}
          />
        ))}
        toolbarExtra={
          <>
            <RoomInviteButton room={room} />
            <RoomLiveBar connected={live.connected} sendReaction={live.sendReaction} onTaskSaved={live.notifyMembers} />
            {room.isOwner && <OwnerTools room={room} members={live.members} onChanged={live.notifyMembers} />}
          </>
        }
        renderSession={({ goLounge, canGoLounge }: { goLounge: () => void; canGoLounge: boolean }) => (
          <StudySessionBar session={session} onGoLounge={goLounge} canGoLounge={canGoLounge} todayCoins={coinsToday} />
        )}
      />
      {card && <SettlementCard title="오늘의 정산" summary={card} actionLabel="로비로 가기" onClose={exit} />}
    </>
  );
}
